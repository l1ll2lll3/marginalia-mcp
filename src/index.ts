import { McpServer } from "./mcp/server.js";
import { StdioTransport } from "./mcp/transport.js";
import { registerTools } from "./tools.js";

async function main() {
  const server = new McpServer({
    name: "marginalia-mcp",
    version: "0.1.0",
  });

  registerTools(server);

  const transport = new StdioTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Failed to start Marginalia MCP server:", err);
  process.exit(1);
});
