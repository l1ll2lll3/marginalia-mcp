import { createInterface } from "readline";

export class StdioTransport {
  private _onMessage: ((msg: unknown) => void) | null = null;

  onMessage(handler: (msg: unknown) => void) {
    this._onMessage = handler;
  }

  start() {
    const rl = createInterface({ input: process.stdin });
    let buffer = "";

    process.stdin.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && this._onMessage) {
          try {
            this._onMessage(JSON.parse(trimmed));
          } catch {
            // ignore malformed
          }
        }
      }
    });
  }

  send(msg: unknown) {
    process.stdout.write(JSON.stringify(msg) + "\n");
  }
}
