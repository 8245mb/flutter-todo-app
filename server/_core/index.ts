import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // File upload endpoint
  const multer = (await import("multer")).default;
  const upload = multer({ storage: multer.memoryStorage() });
  
  // Upload endpoint with base64 support
  app.post("/api/upload", express.json({ limit: '50mb' }), upload.single("file"), async (req, res) => {
    try {
      let buffer: Buffer;
      let filename: string;
      let mimeType: string;

      // Check if it's base64 upload
      if (req.body && req.body.file && typeof req.body.file === 'string') {
        console.log('[Upload] Base64 upload detected');
        buffer = Buffer.from(req.body.file, 'base64');
        filename = req.body.filename || 'audio.m4a';
        mimeType = req.body.mimeType || 'audio/m4a';
      } else if (req.file) {
        console.log('[Upload] Multipart upload detected');
        buffer = req.file.buffer;
        filename = req.file.originalname || 'audio.m4a';
        mimeType = req.file.mimetype || 'audio/mp4';
      } else {
        console.error('[Upload] No file uploaded');
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log('[Upload] File size:', buffer.length, 'bytes');
      console.log('[Upload] Filename:', filename);
      console.log('[Upload] MIME type:', mimeType);

      const { storagePut } = await import("../storage");
      const timestamp = Date.now();
      const key = `uploads/${timestamp}-${filename}`;
      
      console.log('[Upload] Uploading to S3 with key:', key);
      const result = await storagePut(key, buffer, mimeType);
      console.log('[Upload] Upload successful, URL:', result.url);

      res.json({ url: result.url, key: result.key });
    } catch (error) {
      console.error("[Upload] Upload error:", error);
      res.status(500).json({ error: "Upload failed", details: String(error) });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
