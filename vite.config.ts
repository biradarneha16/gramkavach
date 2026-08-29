import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function localAlertApi() {
  return {
    name: "gramkavach-local-alert-api",
    configureServer(server: { middlewares: { use: (handler: (request: any, response: any, next: () => void) => void) => void } }) {
      server.middlewares.use(async (request, response, next) => {
        if (request.method !== "POST" || !["/api/send-alert", "/api/escalate"].includes(request.url ?? "")) {
          next();
          return;
        }

        let body = "";
        for await (const chunk of request) {
          body += chunk;
        }

        try {
          const payload = JSON.parse(body) as { phone?: string; message?: string };
          if (!payload.phone || !payload.message) {
            response.statusCode = 400;
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({ note: "Both phone and message are required." }));
            return;
          }

          response.statusCode = 200;
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({
            note: request.url === "/api/escalate"
              ? "Local development mode: cyber crime SMS queued for provider delivery."
              : "Local development mode: registered-user SMS queued for provider delivery."
          }));
        } catch {
          response.statusCode = 400;
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ note: "Request body must be valid JSON." }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localAlertApi()],
  server: {
    port: 5173
  }
});
