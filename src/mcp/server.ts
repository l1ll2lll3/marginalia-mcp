import type { McpToolDefinition, McpToolResult } from "./types.js";
import { errorResult } from "./types.js";
import { StdioTransport } from "./transport.js";

interface RegisteredTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  callback: (args: Record<string, unknown>) => Promise<McpToolResult>;
}

export class McpServer {
  private tools = new Map<string, RegisteredTool>();
  private transport: StdioTransport | null = null;
  private info: { name: string; version: string };

  constructor(info: { name: string; version: string }) {
    this.info = info;
  }

  tool(
    name: string,
    description: string,
    inputSchema: Record<string, unknown>,
    callback: (args: Record<string, unknown>) => Promise<McpToolResult>
  ) {
    this.tools.set(name, { name, description, inputSchema, callback });
  }

  async connect(transport: StdioTransport) {
    this.transport = transport;

    transport.onMessage(async (raw: unknown) => {
      const msg = raw as { jsonrpc?: string; id?: number; method?: string; params?: unknown };
      if (!msg.jsonrpc || msg.jsonrpc !== "2.0") return;

      try {
        if (msg.method === "initialize") {
          this.send(msg.id!, {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: this.info,
          });
        } else if (msg.method === "notifications/initialized") {
          // no response needed
        } else if (msg.method === "tools/list") {
          const tools: McpToolDefinition[] = [];
          for (const t of this.tools.values()) {
            tools.push({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema,
            });
          }
          this.send(msg.id!, { tools });
        } else if (msg.method === "tools/call") {
          const params = msg.params as { name: string; arguments?: Record<string, unknown> };
          const tool = this.tools.get(params.name);
          if (!tool) {
            this.send(msg.id!, errorResult(`Unknown tool: ${params.name}`));
          } else {
            const result = await tool.callback(params.arguments || {});
            this.send(msg.id!, result);
          }
        } else {
          // unknown method
          this.sendError(msg.id!, -32601, `Method not found: ${msg.method}`);
        }
      } catch (err) {
        this.sendError(msg.id!, -32603, String(err));
      }
    });

    transport.start();

    // Keep alive
    await new Promise(() => {});
  }

  private send(id: number, result: unknown) {
    this.transport?.send({ jsonrpc: "2.0", id, result });
  }

  private sendError(id: number | undefined, code: number, message: string) {
    if (id !== undefined) {
      this.transport?.send({ jsonrpc: "2.0", id, error: { code, message } });
    }
  }
}
