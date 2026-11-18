import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
    process.env.BETTER_AUTH_SECRET =
      "integration-test-only-secret-at-least-32-characters";
    process.env.GITHUB_CLIENT_ID = "test-client";
    process.env.GITHUB_CLIENT_SECRET = "test-secret";
    process.env.GOOGLE_CLIENT_ID = "google-test-client";
    process.env.GOOGLE_CLIENT_SECRET = "google-test-secret";
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
    const path =
      method === "post"
        ? "/api/movies"
        : "/api/movies/507f1f77bcf86cd799439011";
    const anonymous = await request(app)[method](path).send(movie);
    assert.equal(anonymous.status, 401);
    const regular = await request(app)
      [method](path)
      .set("Cookie", userCookie)
      .send(movie);
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

  const session = await request(app)
    .get("/api/auth/get-session")
    .set("Cookie", userCookie);
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

  const created = await request(app)
    .post("/api/movies")
    .set("Cookie", adminCookie)
    .send(movie);
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
    assert.equal(
      response.status,
      400,
      JSON.stringify({ changes, body: response.body }),
    );
  }

  const updated = await request(app)
    .patch(`/api/movies/${id}`)
    .set("Cookie", adminCookie)
    .send({ title: "Título nuevo" });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.title, "Título nuevo");
  assert.equal(updated.body.synopsis, movie.synopsis);

  const deleted = await request(app)
    .delete(`/api/movies/${id}`)
    .set("Cookie", adminCookie);
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
    Array.from({ length: 13 }, (_, index) => ({
      ...movie,
      title: `Película ${index}`,
    })),
  );
  const first = await request(app).get("/api/movies?page=1");
  const second = await request(app).get("/api/movies?page=2");
  assert.equal(first.body.data.length, 12);
  assert.equal(second.body.data.length, 1);
  assert.equal(first.body.meta.totalPages, 2);
  assert.ok(
    !first.body.data.some(
      (item: { _id: string }) => item._id === second.body.data[0]._id,
    ),
  );
  assert.equal(
    (await request(app).get("/api/movies?search=pel%C3%ADcula%2012")).body.meta
      .total,
    1,
  );
  assert.equal(
    (await request(app).get("/api/movies?search=%2E%2A")).body.meta.total,
    0,
  );
  for (const query of ["page=0", "limit=101", "page=abc", "search[x]=y"]) {
    assert.equal((await request(app).get(`/api/movies?${query}`)).status, 400);
  }
});

test("login con email y logout revocan la sesión", async () => {
  const signedIn = await request(app)
    .post("/api/auth/sign-in/email")
    .set("Origin", "http://localhost:5173")
    .send({
      email: "user@example.test",
      password: "Temporary-Test-Password-2026",
    });
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
  const session = await request(app)
    .get("/api/auth/get-session")
    .set("Cookie", cookie);
  assert.equal(session.body, null);
});

test("cada cuenta consulta y modifica solo sus registros de Mi lista", async () => {
  const Movie = (await import("../src/models/Movie.js")).default;
  const WatchlistItem = (await import("../src/models/WatchlistItem.js"))
    .default;
  await WatchlistItem.init();
  const sample = await Movie.create(movie);
  const movieId = String(sample._id);
  for (const method of ["get", "post", "patch", "delete"] as const) {
    const path = ["patch", "delete"].includes(method)
      ? "/api/watchlist/507f1f77bcf86cd799439011"
      : "/api/watchlist";
    assert.equal(
      (await request(app)[method](path).send({ movieId })).status,
      401,
    );
  }
  const created = await request(app)
    .post("/api/watchlist")
    .set("Cookie", userCookie)
    .send({ movieId });
  assert.equal(created.status, 201);
  const id = created.body._id;
  assert.equal(created.body.movie._id, movieId);
  assert.equal(created.body.userId, undefined);
  assert.equal(
    (
      await request(app)
        .post("/api/watchlist")
        .set("Cookie", userCookie)
        .send({ movieId })
    ).status,
    409,
  );
  // Ni siquiera otro administrador puede leer o editar los registros privados ajenos.
  assert.equal(
    (await request(app).get("/api/watchlist").set("Cookie", adminCookie)).body
      .meta.total,
    0,
  );
  for (const method of ["patch", "delete"] as const) {
    const response = await request(app)
      [method](`/api/watchlist/${id}`)
      .set("Cookie", adminCookie)
      .send({ note: "Intrusión" });
    assert.equal(response.status, 404);
  }
  const separate = await request(app)
    .post("/api/watchlist")
    .set("Cookie", adminCookie)
    .send({ movieId });
  assert.equal(separate.status, 201);
  assert.notEqual(separate.body._id, id);
  for (const body of [
    { userId: "otra-cuenta", movieId },
    { movieId, watched: true },
  ]) {
    assert.equal(
      (
        await request(app)
          .post("/api/watchlist")
          .set("Cookie", userCookie)
          .send(body)
      ).status,
      400,
    );
  }
  for (const body of [
    {},
    { userId: "otra-cuenta" },
    { movieId },
    { note: "x".repeat(501) },
    { watched: "yes" },
  ]) {
    assert.equal(
      (
        await request(app)
          .patch(`/api/watchlist/${id}`)
          .set("Cookie", userCookie)
          .send(body)
      ).status,
      400,
    );
  }
  const updated = await request(app)
    .patch(`/api/watchlist/${id}`)
    .set("Cookie", userCookie)
    .send({ watched: true, note: "  Mi nota privada  " });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.note, "Mi nota privada");
  assert.equal(updated.body.watched, true);
  const filtered = await request(app)
    .get(`/api/watchlist?movieId=${movieId}&status=watched&limit=1`)
    .set("Cookie", userCookie);
  assert.equal(filtered.body.meta.total, 1);
  assert.equal(filtered.body.data[0]._id, id);
  assert.equal(
    (
      await request(app)
        .get("/api/watchlist?status=pending")
        .set("Cookie", userCookie)
    ).body.meta.total,
    0,
  );
  for (const query of [
    "status=nope",
    "page=0",
    "movieId=invalid",
    "userId=someone",
  ]) {
    assert.equal(
      (
        await request(app)
          .get(`/api/watchlist?${query}`)
          .set("Cookie", userCookie)
      ).status,
      400,
    );
  }
  await Movie.findByIdAndDelete(movieId);
  const orphan = await request(app)
    .get("/api/watchlist")
    .set("Cookie", userCookie);
  assert.equal(orphan.body.data[0].movie, null);
  assert.equal(
    (
      await request(app)
        .post("/api/watchlist")
        .set("Cookie", userCookie)
        .send({ movieId })
    ).status,
    404,
  );
  assert.equal(
    (
      await request(app)
        .delete(`/api/watchlist/${id}`)
        .set("Cookie", userCookie)
    ).status,
    204,
  );
});

test("solo admin lista usuarios y cambia roles; no puede quitarse su acceso", async () => {
  const target = await register("roles@example.test");
  const targetId = target.body.user.id;
  const targetCookie = (target.headers["set-cookie"] as unknown as string[])
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.equal(
    (await request(app).get("/api/auth/admin/list-users")).status,
    401,
  );
  assert.equal(
    (
      await request(app)
        .get("/api/auth/admin/list-users")
        .set("Cookie", userCookie)
    ).status,
    403,
  );
  const attempt = await request(app)
    .post("/api/auth/admin/set-role")
    .set("Origin", "http://localhost:5173")
    .set("Cookie", userCookie)
    .send({ userId: targetId, role: "admin" });
  assert.equal(attempt.status, 403);
  const adminSession = await request(app)
    .get("/api/auth/get-session")
    .set("Cookie", adminCookie);
  for (const body of [
    { userId: adminSession.body.user.id, role: "user" },
    { userId: targetId, role: "superadmin" },
    { userId: targetId, role: ["admin", "user"] },
  ]) {
    assert.equal(
      (
        await request(app)
          .post("/api/auth/admin/set-role")
          .set("Origin", "http://localhost:5173")
          .set("Cookie", adminCookie)
          .send(body)
      ).status,
      400,
    );
  }
  const list = await request(app)
    .get("/api/auth/admin/list-users?limit=2&offset=0")
    .set("Cookie", adminCookie);
  assert.equal(list.status, 200);
  assert.equal(list.body.users.length, 2);
  for (const role of ["admin", "user"]) {
    const changed = await request(app)
      .post("/api/auth/admin/set-role")
      .set("Origin", "http://localhost:5173")
      .set("Cookie", adminCookie)
      .send({ userId: targetId, role });
    assert.equal(changed.status, 200);
    const session = await request(app)
      .get("/api/auth/get-session")
      .set("Cookie", targetCookie);
    assert.equal(session.body.user.role, role);
  }
  const denied = await request(app)
    .post("/api/movies")
    .set("Cookie", targetCookie)
    .send(movie);
  assert.equal(denied.status, 403);
});

test("Google inicia OAuth con callback correcto sin exponer sus credenciales", async () => {
  const config = await request(app).get("/api/config");
  assert.deepEqual(config.body, { googleEnabled: true });
  const response = await request(app)
    .post("/api/auth/sign-in/social")
    .set("Origin", "http://localhost:5173")
    .send({ provider: "google", callbackURL: "/", errorCallbackURL: "/login" });
  assert.equal(response.status, 200);
  const authorization = new URL(response.body.url);
  assert.equal(authorization.hostname, "accounts.google.com");
  assert.equal(
    authorization.searchParams.get("redirect_uri"),
    "http://localhost:5173/api/auth/callback/google",
  );
  assert.ok(!JSON.stringify(config.body).includes("secret"));
});

test("los afiches se guardan al crear y editar, con límites y formatos seguros", async () => {
  const jpeg = readFileSync(
    new URL("../../frontend/public/posters/interestelar.jpg", import.meta.url),
  );
  const image = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  const created = await request(app)
    .post("/api/movies")
    .set("Cookie", adminCookie)
    .send({ ...movie, posterUrl: image });
  assert.equal(created.status, 201);
  assert.equal(created.body.posterUrl, image);
  const id = created.body._id;
  const edited = await request(app)
    .patch(`/api/movies/${id}`)
    .set("Cookie", adminCookie)
    .send({ title: "Con afiche conservado" });
  assert.equal(edited.body.posterUrl, image);
  for (const posterUrl of [
    "https://example.com/poster.jpg",
    "/posters/interestelar.jpg",
    "",
  ]) {
    const response = await request(app)
      .patch(`/api/movies/${id}`)
      .set("Cookie", adminCookie)
      .send({ posterUrl });
    assert.equal(response.status, 200);
    assert.equal(response.body.posterUrl, posterUrl);
  }
  const tooLarge = Buffer.concat([
    jpeg.subarray(0, -2),
    Buffer.alloc(260_000),
    jpeg.subarray(-2),
  ]);
  for (const posterUrl of [
    "http://example.com/poster.jpg",
    "javascript:alert(1)",
    "//example.com/a.jpg",
    "/posters/../secret.jpg",
    "data:image/svg+xml;base64,PHN2Zy8+",
    "data:image/jpeg;base64,aW52YWxpZA==",
    "data:image/jpeg;base64,@@@=",
    `data:image/jpeg;base64,${tooLarge.toString("base64")}`,
  ]) {
    const response = await request(app)
      .patch(`/api/movies/${id}`)
      .set("Cookie", adminCookie)
      .send({ posterUrl });
    assert.equal(response.status, 400);
  }
  const oversized = await request(app)
    .post("/api/movies")
    .set("Cookie", adminCookie)
    .send({ ...movie, posterUrl: "x".repeat(1_100_000) });
  assert.equal(oversized.status, 413);
  assert.equal(
    (await request(app).delete(`/api/movies/${id}`).set("Cookie", adminCookie))
      .status,
    204,
  );
});
