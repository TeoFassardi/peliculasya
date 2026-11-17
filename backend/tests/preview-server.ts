// Servidor aislado para pruebas de navegador. Nunca usa la base del .env.
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
process.env.MONGODB_URI = mongo.getUri("peliculasya-browser-test");
process.env.BETTER_AUTH_URL = "http://localhost:5173";
process.env.BETTER_AUTH_SECRET = "browser-tests-only-secret-of-at-least-32-characters";
process.env.GITHUB_CLIENT_ID = "browser-test";
process.env.GITHUB_CLIENT_SECRET = "browser-test";
process.env.NODE_ENV = "test";

const { app } = await import("../src/app.js");
const { auth, authMongoClient } = await import("../src/lib/auth.js");
const { default: Movie } = await import("../src/models/Movie.js");
const { demoMovies } = await import("../src/data/demo-movies.js");
await mongoose.connect(process.env.MONGODB_URI);

for (const role of ["admin", "user"]) {
  const email = `${role}@peliculasya.test`;
  await auth.api.signUpEmail({
    body: { name: role, email, password: "Browser-Test-Password-2026!" },
  });
  await authMongoClient.db().collection("user").updateOne({ email }, { $set: { role } });
}
await Movie.insertMany(demoMovies.map((movie) => ({ ...movie, available: true })));

const server = app.listen(3000, "127.0.0.1", () => console.log("Preview de prueba en puerto 3000"));

async function close() {
  server.close();
  await mongoose.disconnect();
  await authMongoClient.close();
  await mongo.stop();
  process.exit(0);
}

process.on("SIGTERM", close);
process.on("SIGINT", close);
