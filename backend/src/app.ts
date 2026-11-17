import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import moviesRouter from "./routes/movies.routes.js";
import { errorHandler } from "./middlewares/error-handler.js";

export const app = express();

// El handler de Better Auth necesita el cuerpo original, antes de express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json({ limit: "100kb" }));
app.use("/api/movies", moviesRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptimeSeconds: process.uptime() });
});

app.use((_req, res) => {
  res.status(404).json({ error: { message: "Ruta inexistente" } });
});

app.use(errorHandler);
