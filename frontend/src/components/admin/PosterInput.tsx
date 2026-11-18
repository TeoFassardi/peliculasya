import { useRef, useState } from "react";
import { MoviePoster } from "../MoviePoster";
import { preparePoster } from "../../lib/poster";

interface PosterInputProps {
  value: string;
  title: string;
  genre: string;
  error?: string;
  onChange: (value: string) => void;
  onBusyChange: (busy: boolean) => void;
}

export function PosterInput({
  value,
  title,
  genre,
  error,
  onChange,
  onBusyChange,
}: PosterInputProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadVersion = useRef(0);
  const [uploadError, setUploadError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const storedImage = value.startsWith("data:") || value.startsWith("/posters/");

  function change(value: string) {
    // Un enlace nuevo o quitar la imagen cancela cualquier preparación anterior.
    uploadVersion.current += 1;
    setProcessing(false);
    onBusyChange(false);
    if (fileInput.current) fileInput.current.value = "";
    setImageFailed(false);
    setUploadError("");
    onChange(value);
  }

  async function upload(file?: File) {
    if (!file) return;
    const version = ++uploadVersion.current;
    setUploadError("");
    setProcessing(true);
    onBusyChange(true);
    try {
      const poster = await preparePoster(file);
      if (version !== uploadVersion.current) return;
      setImageFailed(false);
      onChange(poster);
    } catch (failure) {
      if (version === uploadVersion.current)
        setUploadError(
          failure instanceof Error ? failure.message : "No pudimos preparar la imagen.",
        );
    } finally {
      if (version === uploadVersion.current) {
        setProcessing(false);
        onBusyChange(false);
      }
    }
  }

  return (
    <section className="poster-input" aria-labelledby="poster-label" aria-busy={processing}>
      <div className="poster-preview">
        <MoviePoster
          key={value}
          title={title || "Tu película"}
          genre={genre || "Vista previa"}
          url={value}
          onImageError={() => setImageFailed(true)}
        />
      </div>
      <div className="poster-controls">
        <h3 id="poster-label">Afiche de la película</h3>
        <p className="field-hint">
          Subí una imagen o pegá su enlace. La vista previa muestra cómo se verá en el catálogo.
        </p>
        <div className="form-field">
          <label htmlFor="posterFile">Subir desde tu equipo</label>
          <input
            ref={fileInput}
            id="posterFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              void upload(event.target.files?.[0]);
            }}
            aria-describedby="poster-file-hint"
          />
          <p className="field-hint" id="poster-file-hint">
            JPG, PNG o WebP, hasta 8 MB. Se optimiza antes de guardar.
          </p>
        </div>
        <div className="form-field">
          <label htmlFor="posterUrl">URL del afiche (opcional)</label>
          <input
            id="posterUrl"
            type="url"
            value={storedImage ? "" : value}
            maxLength={2048}
            onChange={(event) => change(event.target.value.trim())}
            placeholder="https://…"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "posterUrl-error" : "poster-url-hint"}
          />
          <p className="field-hint" id="poster-url-hint">
            {storedImage
              ? "La vista previa conserva la imagen actual. Un enlace nuevo la reemplaza."
              : "Usá el enlace directo HTTPS de una imagen."}
          </p>
        </div>
        {processing && <p role="status">Preparando imagen…</p>}
        {error && (
          <p id="posterUrl-error" className="field-error" role="alert">
            {error}
          </p>
        )}
        {uploadError && (
          <p className="field-error" role="alert">
            {uploadError}
          </p>
        )}
        {imageFailed && (
          <p className="field-error" role="status">
            No se pudo cargar el afiche. Revisá el enlace o subí una imagen.
          </p>
        )}
        {value && (
          <button type="button" className="button secondary small" onClick={() => change("")}>
            Quitar imagen
          </button>
        )}
        {!value && <p className="field-hint">Sin afiche, mostramos una portada de respaldo.</p>}
      </div>
    </section>
  );
}
