import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import type { Express } from "express";
import type { MongoClient } from "mongodb";

let mongo: MongoMemoryReplSet;
let app: Express;
let authClient: MongoClient;
let adminCookie: string;
let userCookie: string;

const movie = {
  title: "Película de prueba",
  synopsis: "Una historia para verificar la API.",
  genre: "Drama",
  durationMinutes: 100,
  releaseDate: "2020-06-15",
  available: true,
  posterUrl: "",
};

async function register(email: string) {
  const response = await request(app)
    .post("/api/auth/sign-up/email")
    .set("Origin", "http://localhost:5173")
    .send({ name: "Prueba", email, password: "Temporary-Test-Password-2026" });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response;
}

before(
  async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGODB_URI = mongo.getUri("peliculasya-test");
    process.env.BETTER_AUTH_URL = "http://localhost:5173";
    process.env.BETTER_AUTH_SECRET = "integration-test-only-secret-at-least-32-characters";
    process.env.GITHUB_CLIENT_ID = "test-client";
    process.env.GITHUB_CLIENT_SECRET = "test-secret";
    process.env.NODE_ENV = "test";

    ({ app } = await import("../src/app.js"));
    ({ authMongoClient: authClient } = await import("../src/lib/auth.js"));
    await mongoose.connect(process.env.MONGODB_URI);

    const admin = await register("admin@example.test");
    const user = await register("user@example.test");
    await authClient
      .db()
      .collection("user")
      .updateOne({ email: "admin@example.test" }, { $set: { role: "admin" } });
    adminCookie = (admin.headers["set-cookie"] as unknown as string[])
      .map((value) => value.split(";")[0])
      .join("; ");
    userCookie = (user.headers["set-cookie"] as unknown as string[])
      .map((value) => value.split(";")[0])
      .join("; ");
  },
  { timeout: 180_000 },
);

after(async () => {
  await mongoose.disconnect();
  if (authClient) await authClient.close();
  if (mongo) await mongo.stop();
});

test("lectura pública y listado paginado", async () => {
  const response = await request(app).get("/api/movies");
  assert.equal(response.status, 200);
  assert.equal(response.body.meta.limit, 12);
  assert.ok(Array.isArray(response.body.data));
});

test("las tres escrituras exigen sesión y rol admin", async () => {
  for (const method of ["post", "patch", "delete"] as const) {
    const path = method === "post" ? "/api/movies" : "/api/movies/507f1f77bcf86cd799439011";
    const anonymous = await request(app)[method](path).send(movie);
    assert.equal(anonymous.status, 401);
    const regular = await request(app)[method](path).set("Cookie", userCookie).send(movie);
    assert.equal(regular.status, 403);
  }
});

test("registro rechaza un rol enviado y conserva sesión por cookie", async () => {
  const response = await request(app)
    .post("/api/auth/sign-up/email")
    .set("Origin", "http://localhost:5173")
    .send({
      name: "Intento de admin",
      email: "new@example.test",
      password: "Temporary-Test-Password-2026",
      role: "admin",
    });
  assert.equal(response.status, 400);
  const registered = await register("normal@example.test");
  assert.equal(registered.body.user.role, "user");

  const session = await request(app).get("/api/auth/get-session").set("Cookie", userCookie);
  assert.equal(session.status, 200);
  assert.equal(session.body.user.email, "user@example.test");
});

test("CRUD admin, validaciones y errores JSON", async () => {
  const invalid = await request(app)
    .post("/api/movies")
    .set("Cookie", adminCookie)
    .send({ ...movie, durationMinutes: 0 });
  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.error.details.durationMinutes);

  const created = await request(app).post("/api/movies").set("Cookie", adminCookie).send(movie);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const id = created.body._id;
  assert.equal((await request(app).get(`/api/movies/${id}`)).status, 200);

  for (const changes of [
    {},
    { releaseDate: "2024-02-30" },
    { posterUrl: "javascript:alert(1)" },
    { role: "admin" },
  ]) {
    const response = await request(app)
      .patch(`/api/movies/${id}`)
      .set("Cookie", adminCookie)
      .send(changes);
    assert.equal(response.status, 400, JSON.stringify({ changes, body: response.body }));
  }

  const updated = await request(app)
    .patch(`/api/movies/${id}`)
    .set("Cookie", adminCookie)
    .send({ title: "Título nuevo" });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.title, "Título nuevo");
  assert.equal(updated.body.synopsis, movie.synopsis);

  const deleted = await request(app).delete(`/api/movies/${id}`).set("Cookie", adminCookie);
  assert.equal(deleted.status, 204);
  for (const method of ["get", "patch", "delete"] as const) {
    const response = await request(app)
      [method](`/api/movies/${id}`)
      .set("Cookie", adminCookie)
      .send({ title: "Ausente" });
    assert.equal(response.status, 404);
  }
  assert.equal((await request(app).get("/api/movies/no-es-un-id")).status, 400);
  const malformed = await request(app)
    .post("/api/movies")
    .set("Cookie", adminCookie)
    .set("Content-Type", "application/json")
    .send("{");
  assert.equal(malformed.status, 400);
});

test("búsqueda literal y paginación sin duplicados", async () => {
  const Movie = (await import("../src/models/Movie.js")).default;
  await Movie.deleteMany({});
  await Movie.insertMany(
    Array.from({ length: 13 }, (_, index) => ({ ...movie, title: `Película ${index}` })),
  );
  const first = await request(app).get("/api/movies?page=1");
  const second = await request(app).get("/api/movies?page=2");
  assert.equal(first.body.data.length, 12);
  assert.equal(second.body.data.length, 1);
  assert.equal(first.body.meta.totalPages, 2);
  assert.ok(!first.body.data.some((item: { _id: string }) => item._id === second.body.data[0]._id));
  assert.equal(
    (await request(app).get("/api/movies?search=pel%C3%ADcula%2012")).body.meta.total,
    1,
  );
  assert.equal((await request(app).get("/api/movies?search=%2E%2A")).body.meta.total, 0);
  for (const query of ["page=0", "limit=101", "page=abc", "search[x]=y"]) {
    assert.equal((await request(app).get(`/api/movies?${query}`)).status, 400);
  }
});

test("login con email y logout revocan la sesión", async () => {
  const signedIn = await request(app)
    .post("/api/auth/sign-in/email")
    .set("Origin", "http://localhost:5173")
    .send({ email: "user@example.test", password: "Temporary-Test-Password-2026" });
  assert.equal(signedIn.status, 200);
  const cookie = (signedIn.headers["set-cookie"] as unknown as string[])
    .map((value) => value.split(";")[0])
    .join("; ");
  const signedOut = await request(app)
    .post("/api/auth/sign-out")
    .set("Origin", "http://localhost:5173")
    .set("Cookie", cookie)
    .send({});
  assert.equal(signedOut.status, 200);
  const session = await request(app).get("/api/auth/get-session").set("Cookie", cookie);
  assert.equal(session.body, null);
});
