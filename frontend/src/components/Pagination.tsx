interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, totalPages, onChange, disabled }: PaginationProps) {
  if (totalPages <= 1 && page === 1) return null;

  return (
    <nav className="pagination" aria-label="Páginas del catálogo">
      <button
        className="button secondary"
        disabled={disabled || page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </button>
      <span>
        Página {page} de {Math.max(totalPages, page)}
      </span>
      <button
        className="button secondary"
        disabled={disabled || page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
