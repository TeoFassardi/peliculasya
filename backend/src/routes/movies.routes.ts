import { Router } from "express";
import {
  listMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../controllers/movies.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.js";
import { validateMovieId } from "../middlewares/validate-movie-id.js";
import { createMovieSchema, updateMovieSchema } from "../schemas/movie.schema.js";

const router = Router();
const onlyAdmin = [authMiddleware, requireRole("admin")];

// Las rutas conectan cada método HTTP con su controlador.
router.get("/", listMovies);
router.get("/:id", validateMovieId, getMovieById);
router.post("/", onlyAdmin, validateBody(createMovieSchema), createMovie);
router.patch("/:id", onlyAdmin, validateMovieId, validateBody(updateMovieSchema), updateMovie);
router.delete("/:id", onlyAdmin, validateMovieId, deleteMovie);

export default router;
