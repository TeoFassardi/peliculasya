import "dotenv/config";
import { app } from "./app.js";
import { connectMongoDB } from "./config/db.js";

const port = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
  await connectMongoDB();
  app.listen(port, "0.0.0.0", () => {
    console.log(`PeliculasYa API escuchando en el puerto ${port}`);
  });
}

startServer().catch(() => {
  console.error("[server] No se pudo iniciar. Revisá la conexión y las variables de entorno.");
  process.exitCode = 1;
});
