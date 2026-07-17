import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Key from environment. Do not hardcode provider secrets in source.
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // AI Proxy Endpoints
  app.post("/api/ai/generate", async (req, res) => {
    try {
      if (!ai) return res.status(503).json({ error: "GEMINI_API_KEY is not configured." });
      const { model, contents, config } = req.body;
      const response = await ai.models.generateContent({ model, contents, config });
      res.json(response);
    } catch (error: any) {
      console.error("AI Generate Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generateVideos", async (req, res) => {
    try {
      if (!ai) return res.status(503).json({ error: "GEMINI_API_KEY is not configured." });
      const { model, prompt, config } = req.body;
      const operation = await ai.models.generateVideos({ model, prompt, config });
      res.json(operation);
    } catch (error: any) {
      console.error("AI Generate Video Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/videoOperation", async (req, res) => {
    try {
      if (!ai) return res.status(503).json({ error: "GEMINI_API_KEY is not configured." });
      const { operation } = req.body;
      const result = await ai.operations.getVideosOperation({ operation });
      res.json(result);
    } catch (error: any) {
      console.error("AI Get Video Operation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
