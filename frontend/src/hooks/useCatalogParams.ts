import { useSearchParams } from "react-router";

// La URL conserva la búsqueda y la página al recargar o compartir el catálogo.
export function useCatalogParams() {
  const [params, setParams] = useSearchParams();
  const search = (params.get("search") ?? "").slice(0, 120);
  const rawPage = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  function setSearch(value: string) {
    setParams(value.trim() ? { search: value.trim() } : {});
  }

  function setPage(value: number) {
    setParams({ ...(search ? { search } : {}), page: String(value) });
  }

  return { search, page, setSearch, setPage };
}
