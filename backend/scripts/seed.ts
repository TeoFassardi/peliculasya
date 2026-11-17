import "dotenv/config";
import mongoose from "mongoose";
import { auth, authMongoClient } from "../src/lib/auth.js";
import { connectMongoDB } from "../src/config/db.js";
import Movie from "../src/models/Movie.js";
import { demoMovies } from "../src/data/demo-movies.js";
import { createMovieSchema } from "../src/schemas/movie.schema.js";
import { z } from "zod";

const seedEnvironment = z
  .object({
    SEED_ADMIN_EMAIL: z.email(),
    SEED_ADMIN_PASSWORD: z.string().min(8).max(128),
    SEED_USER_EMAIL: z.email(),
    SEED_USER_PASSWORD: z.string().min(8).max(128),
  })
  .refine(
    (values) => values.SEED_ADMIN_EMAIL.toLowerCase() !== values.SEED_USER_EMAIL.toLowerCase(),
    {
      message: "Las cuentas admin y user deben tener emails diferentes",
    },
  );

async function ensureUser(name: string, email: string, password: string, role: "admin" | "user") {
  const normalizedEmail = email.trim().toLowerCase();
  const users = authMongoClient.db().collection("user");
  const existing = await users.findOne({ email: normalizedEmail });

  // Nunca promover una cuenta existente: podría pertenecer a otra persona.
  if (existing) {
    if (existing.role !== role) {
      throw new Error(`La cuenta de prueba ${role} ya existe con otro rol. Usá un email nuevo.`);
    }
    console.log(`[seed] Cuenta ${role} conservada; no se cambia su contraseña.`);
    return;
  }

  await auth.api.signUpEmail({ body: { name, email: normalizedEmail, password } });
  await users.updateOne({ email: normalizedEmail }, { $set: { role } });
  console.log(`[seed] Cuenta ${role} creada.`);
}

async function seed() {
  const result = seedEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      "Completá las cuatro variables SEED_ del .env con dos emails distintos y contraseñas de 8 a 128 caracteres.",
    );
  }

  await connectMongoDB();
  const config = result.data;
  await ensureUser("Admin de prueba", config.SEED_ADMIN_EMAIL, config.SEED_ADMIN_PASSWORD, "admin");
  await ensureUser("Usuario de prueba", config.SEED_USER_EMAIL, config.SEED_USER_PASSWORD, "user");

  for (const sample of demoMovies) {
    const movie = createMovieSchema.parse({ ...sample, available: true, posterUrl: "" });
    await Movie.updateOne(
      { title: movie.title },
      { $setOnInsert: movie },
      { upsert: true, runValidators: true },
    );
  }

  console.log("[seed] Catálogo preparado sin modificar películas existentes.");
}

try {
  await seed();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "No se pudieron cargar los datos de prueba.",
  );
  process.exitCode = 1;
} finally {
  await Promise.all([mongoose.disconnect(), authMongoClient.close()]);
}
