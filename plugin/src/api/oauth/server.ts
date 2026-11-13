import http from "node:http";
import { URL } from "node:url";

const OAUTH_TIMEOUT_MS = 120_000; // 2 minutes timeout
const DEFAULT_PORT = 42_813;
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;

export class OAuthLoopbackServer {
  private server: http.Server | null = null;

  public async startAndListen(port = DEFAULT_PORT): Promise<{ code: string; redirectUri: string }> {
    return new Promise<{ code: string; redirectUri: string }>((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;

      this.server = http.createServer((req, res) => {
        try {
          const reqUrl = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
          const code = reqUrl.searchParams.get("code");
          const error = reqUrl.searchParams.get("error");

          if (error) {
            res.writeHead(HTTP_OK, { "Content-Type": "text/html; charset=utf-8" });
            res.end(`
              <!DOCTYPE html>
              <html>
                <head><title>Authorization Failed</title></head>
                <body style="font-family: sans-serif; text-align: center; padding: 40px;">
                  <h2 style="color: #e53e3e;">Authorization Failed</h2>
                  <p>Google returned an error: <code>${error}</code></p>
                  <p>You can close this tab and try again in Obsidian.</p>
                </body>
              </html>
            `);
            cleanup();
            reject(new Error(`OAuth Error from Google: ${error}`));
            return;
          }

          if (code) {
            res.writeHead(HTTP_OK, { "Content-Type": "text/html; charset=utf-8" });
            res.end(`
              <!DOCTYPE html>
              <html>
                <head><title>Authorization Successful</title></head>
                <body style="font-family: sans-serif; text-align: center; padding: 40px;">
                  <h2 style="color: #38a169;">Authorization Successful!</h2>
                  <p>Google Tasks has been linked to Obsidian.</p>
                  <p>You can now close this tab and return to Obsidian.</p>
                </body>
              </html>
            `);
            const redirectUri = `http://127.0.0.1:${port}`;
            cleanup();
            resolve({ code, redirectUri });
            return;
          }

          res.writeHead(HTTP_BAD_REQUEST, { "Content-Type": "text/plain" });
          res.end("Missing authorization code.");
        } catch (err) {
          cleanup();
          reject(err);
        }
      });

      const cleanup = () => {
        clearTimeout(timeoutId);
        if (this.server) {
          this.server.close();
          this.server = null;
        }
      };

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("OAuth authorization timed out. Please try again."));
      }, OAUTH_TIMEOUT_MS);

      this.server.on("error", (err) => {
        cleanup();
        reject(err);
      });

      this.server.listen(port, "127.0.0.1");
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
