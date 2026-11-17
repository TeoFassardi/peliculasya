import { useState } from "react";

interface MoviePosterProps {
  title: string;
  genre: string;
  url?: string;
}

export function MoviePoster({ title, genre, url }: MoviePosterProps) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const showImage = url?.startsWith("https://") && failedUrl !== url;

  return (
    <div className="movie-poster">
      {showImage ? (
        <img
          src={url}
          alt={`Afiche de ${title}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <div className="poster-fallback" aria-label={`Sin afiche para ${title}`}>
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="8" y="6" width="32" height="36" rx="3" stroke="currentColor" strokeWidth="2" />
            <path
              d="M16 6v36M32 6v36M8 15h8M8 24h8M8 33h8M32 15h8M32 24h8M32 33h8"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span>{genre}</span>
          <strong>{title}</strong>
        </div>
      )}
    </div>
  );
}
