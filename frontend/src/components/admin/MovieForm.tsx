import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { movieSchema, MOVIE_GENRES, type MovieFormValues } from "../../schemas/movie.schema";
import type { Movie } from "../../types/movie";
import { getErrorMessage } from "../../lib/api";
import { FormField } from "../FormField";
import { PosterInput } from "./PosterInput";

interface MovieFormProps {
  movie: Movie | null;
  onSave: (values: MovieFormValues) => Promise<void>;
  onCancel: () => void;
}

export function MovieForm({ movie, onSave, onCancel }: MovieFormProps) {
  const [processingPoster, setProcessingPoster] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: movie?.title ?? "",
      synopsis: movie?.synopsis ?? "",
      genre: movie?.genre as MovieFormValues["genre"] | undefined,
      durationMinutes: movie?.durationMinutes,
      releaseDate: movie?.releaseDate.slice(0, 10) ?? "",
      available: movie?.available ?? true,
      posterUrl: movie?.posterUrl ?? "",
    },
  });
  const [title, genre, posterUrl] = useWatch({ control, name: ["title", "genre", "posterUrl"] });

  async function submit(values: MovieFormValues) {
    if (processingPoster) return;
    try {
      await onSave(values);
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  }

  return (
    <section className="form-panel" aria-labelledby="movie-form-title">
      <h2 id="movie-form-title">{movie ? `Editar ${movie.title}` : "Agregar película"}</h2>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <fieldset disabled={isSubmitting} className="form-fields">
          <PosterInput
            value={posterUrl ?? ""}
            title={title ?? ""}
            genre={genre ?? ""}
            error={errors.posterUrl?.message}
            onBusyChange={setProcessingPoster}
            onChange={(value) =>
              setValue("posterUrl", value, { shouldDirty: true, shouldValidate: true })
            }
          />
          <FormField label="Título" name="title" error={errors.title?.message}>
            <input
              id="title"
              {...register("title")}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
          </FormField>
          <FormField label="Sinopsis" name="synopsis" error={errors.synopsis?.message}>
            <textarea
              id="synopsis"
              rows={5}
              {...register("synopsis")}
              aria-invalid={!!errors.synopsis}
              aria-describedby={errors.synopsis ? "synopsis-error" : undefined}
            />
          </FormField>
          <div className="form-row">
            <FormField label="Género" name="genre" error={errors.genre?.message}>
              <select
                id="genre"
                {...register("genre")}
                aria-invalid={!!errors.genre}
                aria-describedby={errors.genre ? "genre-error" : undefined}
              >
                <option value="">Elegí un género</option>
                {MOVIE_GENRES.map((genre) => (
                  <option key={genre}>{genre}</option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Duración (minutos)"
              name="durationMinutes"
              error={errors.durationMinutes?.message}
            >
              <input
                id="durationMinutes"
                type="number"
                min={1}
                max={600}
                {...register("durationMinutes", { valueAsNumber: true })}
                aria-invalid={!!errors.durationMinutes}
                aria-describedby={errors.durationMinutes ? "durationMinutes-error" : undefined}
              />
            </FormField>
          </div>
          <FormField
            label="Fecha de estreno"
            name="releaseDate"
            error={errors.releaseDate?.message}
          >
            <input
              id="releaseDate"
              type="date"
              {...register("releaseDate")}
              aria-invalid={!!errors.releaseDate}
              aria-describedby={errors.releaseDate ? "releaseDate-error" : undefined}
            />
          </FormField>
          <label className="checkbox-field">
            <input type="checkbox" {...register("available")} /> Disponible
          </label>
          {errors.root && (
            <p className="field-error" role="alert">
              {errors.root.message}
            </p>
          )}
          <div className="button-row">
            <button className="button" type="submit" disabled={processingPoster}>
              {processingPoster
                ? "Preparando imagen…"
                : isSubmitting
                  ? "Guardando…"
                  : "Guardar película"}
            </button>
            <button className="button secondary" type="button" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
