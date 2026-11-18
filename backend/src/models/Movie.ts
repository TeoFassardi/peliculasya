import { Schema, model } from "mongoose";
import { MOVIE_GENRES } from "../schemas/movie.schema.js";

const movieSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    synopsis: { type: String, required: true, trim: true, maxlength: 3000 },
    genre: { type: String, required: true, enum: MOVIE_GENRES },
    durationMinutes: { type: Number, required: true, min: 1, max: 600 },
    releaseDate: { type: Date, required: true },
    available: { type: Boolean, default: true },
    posterUrl: { type: String, default: "", maxlength: 350_000 },
  },
  { timestamps: true },
);

export default model("Movie", movieSchema);
