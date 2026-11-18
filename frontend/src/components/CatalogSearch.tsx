import { useState, type SubmitEvent } from "react";

interface CatalogSearchProps {
  initialSearch: string;
  onSearch: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function CatalogSearch({
  initialSearch,
  onSearch,
  label = "Buscar por título",
  placeholder = "¿Qué película tenés en mente?",
}: CatalogSearchProps) {
  const [value, setValue] = useState(initialSearch);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(value);
  }

  return (
    <form className="catalog-search" role="search" onSubmit={handleSubmit}>
      <label htmlFor="catalog-search">{label}</label>
      <div className="search-controls">
        <input
          id="catalog-search"
          type="search"
          maxLength={120}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
        />
        <button className="button" type="submit">
          Buscar
        </button>
      </div>
    </form>
  );
}
