import { chatRouter } from "./routes/chat.routes.js";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import moviesRouter from "./routes/movies.routes.js";
import { errorHandler } from "./middlewares/error-handler.js";
import watchlistRouter from "./routes/watchlist.routes.js";
import { publicConfig } from "./config/social-providers.js";

export const app = express();

// El handler de Better Auth necesita el cuerpo original, antes de express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));
// Admite el afiche JPEG optimizado; cada imagen se limita además en su schema.
app.use(express.json({ limit: "1mb" }));
app.use("/api/chat", chatRouter);
app.use("/api/movies", moviesRouter);
app.use("/api/watchlist", watchlistRouter);
app.get("/api/config", (_req, res) => {
  res.json(publicConfig);
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptimeSeconds: process.uptime() });
});

app.use((_req, res) => {
  res.status(404).json({ error: { message: "Ruta inexistente" } });
});

app.use(errorHandler);
