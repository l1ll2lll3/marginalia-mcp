export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export function textResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}

export function errorResult(msg: string): McpToolResult {
  return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
}
