import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { promises as fs } from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Ensure temp directory exists
fs.mkdir('temp', { recursive: true }).catch(() => {});

async function startServer() {
  try {
    await registerRoutes(app);

    // Setup Vite/static serving after API routes
    if (process.env.NODE_ENV !== "production") {
      const { createServer } = await import("vite");
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      
      app.use((req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        vite.middlewares(req, res, next);
      });
    } else {
      serveStatic(app);
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error('Express error:', err);
    });

    const port = process.env.PORT || 5000;
    const server = app.listen(port, "0.0.0.0", () => {
      log(`Video-to-LoFi server running on http://0.0.0.0:${port}`);
      
      // Test server connectivity after startup
      setTimeout(() => {
        const http = require('http');
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/api/health',
          method: 'GET'
        };
        
        const req = http.request(options, (res) => {
          console.log(`Server self-test: ${res.statusCode}`);
        });
        
        req.on('error', (err) => {
          console.log('Server self-test failed:', err.message);
        });
        
        req.end();
      }, 1000);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
