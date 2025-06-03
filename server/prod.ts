import express from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { log } from "./vite";

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Serve static files in production
  const clientPath = path.resolve(process.cwd(), "client");
  app.use(express.static(clientPath));

  // Serve index.html for all routes (SPA fallback)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
      return next();
    }
    res.sendFile(path.join(clientPath, "index.html"));
  });

  const server = await registerRoutes(app);

  const PORT = parseInt(process.env.PORT || "5000");
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
}

startServer().catch(console.error);