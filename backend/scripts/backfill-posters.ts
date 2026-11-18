import "dotenv/config";
import { connectMongoDB, disconnectMongoDB } from "../src/config/db.js";
import Movie from "../src/models/Movie.js";
import { demoMovies } from "../src/data/demo-movies.js";

// Completa solo afiches faltantes de las seis películas de muestra.
// No reemplaza imágenes elegidas por el administrador ni modifica otros campos.
try {
  await connectMongoDB();
  let updated = 0;
  for (const movie of demoMovies) {
    const result = await Movie.updateMany(
      {
        title: movie.title,
        $or: [
          { posterUrl: "" },
          { posterUrl: null },
          { posterUrl: { $exists: false } },
        ],
      },
      { $set: { posterUrl: movie.posterUrl } },
      { runValidators: true },
    );
    updated += result.modifiedCount;
  }
  console.log(
    `[posters] ${updated} afiches completados. Se conservaron las imágenes existentes.`,
  );
} catch {
  console.error(
    "No se pudieron completar los afiches. Revisá la conexión a MongoDB.",
  );
  process.exitCode = 1;
} finally {
  await disconnectMongoDB();
}
