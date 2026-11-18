import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { WatchlistItem } from "../types/watchlist";
import { watchlistSchema, type WatchlistFormValues } from "../schemas/watchlist.schema";
import { useRemoveFromWatchlistMutation, useUpdateWatchlistMutation } from "../store/api";
import { getErrorMessage } from "../lib/api";
import { FormField } from "./FormField";
import { MoviePoster } from "./MoviePoster";

interface WatchlistRowProps {
  item: WatchlistItem;
  onRemoved: () => void;
  onNotice: (message: string) => void;
}

export function WatchlistRow({ item, onRemoved, onNotice }: WatchlistRowProps) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [update, { isLoading: saving }] = useUpdateWatchlistMutation();
  const [remove, { isLoading: removing }] = useRemoveFromWatchlistMutation();
  const title = item.movie?.title ?? "Película retirada del catálogo";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WatchlistFormValues>({
    resolver: zodResolver(watchlistSchema),
    defaultValues: { watched: item.watched, note: item.note },
  });

  async function save(values: WatchlistFormValues) {
    setError("");
    try {
      await update({ id: item._id, values }).unwrap();
      setEditing(false);
      onNotice(`Guardaste los cambios de “${title}”.`);
    } catch (failure) {
      setError(getErrorMessage(failure));
    }
  }

  async function discard() {
    if (!window.confirm(`¿Quitar “${title}” de tu lista? También se borrará tu nota.`)) return;
    setError("");
    try {
      await remove(item._id).unwrap();
      onNotice(`Quitaste “${title}” de tu lista.`);
      onRemoved();
    } catch (failure) {
      setError(getErrorMessage(failure));
    }
  }

  return (
    <article className="watchlist-row" aria-label={title} aria-busy={saving || removing}>
      <div className="watchlist-poster">
        <MoviePoster
          title={title}
          genre={item.movie?.genre ?? "Sin ficha"}
          url={item.movie?.posterUrl}
        />
      </div>
      <div className="watchlist-copy">
        <div className="watchlist-title">
          <h2>{item.movie ? <Link to={`/movies/${item.movie._id}`}>{title}</Link> : title}</h2>
          <span className="status-badge">{item.watched ? "Vista" : "Por ver"}</span>
        </div>
        {item.movie && (
          <p className="muted">
            {item.movie.genre} · {item.movie.durationMinutes} min
          </p>
        )}
        {editing ? (
          <form onSubmit={handleSubmit(save)} noValidate className="watchlist-editor">
            <fieldset disabled={saving || removing} className="form-fields">
              <label className="checkbox-field">
                <input type="checkbox" {...register("watched")} /> Ya la vi
              </label>
              <FormField
                label="Mi nota"
                name={`note-${item._id}`}
                error={errors.note?.message}
                hint="Solo vos podés verla. Hasta 500 caracteres."
              >
                <textarea
                  id={`note-${item._id}`}
                  rows={3}
                  {...register("note")}
                  aria-invalid={Boolean(errors.note)}
                  aria-describedby={errors.note ? `note-${item._id}-error` : undefined}
                />
              </FormField>
              <div className="button-row">
                <button type="submit" className="button small">
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            </fieldset>
          </form>
        ) : (
          <>
            <p className={item.note ? "watchlist-note" : "watchlist-note muted"}>
              {item.note || "Todavía no agregaste una nota."}
            </p>
            <div className="button-row">
              <button
                className="button secondary small"
                onClick={() => {
                  reset({ watched: item.watched, note: item.note });
                  setEditing(true);
                  setError("");
                }}
                disabled={removing}
              >
                Editar mi registro
              </button>
              <button className="button danger small" onClick={discard} disabled={removing}>
                {removing ? "Quitando…" : "Quitar de mi lista"}
              </button>
            </div>
          </>
        )}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
