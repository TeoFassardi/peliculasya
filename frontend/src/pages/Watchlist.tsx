import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useSession } from "../lib/auth-client";
import { useGetWatchlistQuery } from "../store/api";
import type { WatchlistStatus } from "../types/watchlist";
import { Feedback } from "../components/Feedback";
import { Pagination } from "../components/Pagination";
import { WatchlistRow } from "../components/WatchlistRow";

export function Watchlist() {
  const { data: session } = useSession();
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawStatus = params.get("status");
  const status: WatchlistStatus =
    rawStatus === "watched" || rawStatus === "pending" ? rawStatus : "all";
  const [notice, setNotice] = useState("");
  const {
    currentData: result,
    isFetching,
    error,
    refetch,
  } = useGetWatchlistQuery(
    {
      userId: session?.user.id ?? "",
      page,
      status,
    },
    { skip: !session, refetchOnMountOrArgChange: true },
  );

  function setPage(value: number) {
    setParams({ status, page: String(value) });
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Mi lista</h1>
          <p className="muted">Películas por ver, historias que ya viste y notas solo para vos.</p>
        </div>
        <Link className="button secondary" to="/">
          Explorar catálogo
        </Link>
      </div>
      <div className="list-toolbar">
        <div className="list-filter">
          <label htmlFor="watchlist-status">Mostrar</label>
          <select
            id="watchlist-status"
            value={status}
            onChange={(event) => {
              setParams({ status: event.target.value });
              setNotice("");
            }}
          >
            <option value="all">Todas mis películas</option>
            <option value="pending">Por ver</option>
            <option value="watched">Vistas</option>
          </select>
        </div>
        {result && (
          <p className="muted">
            {result.meta.total} {result.meta.total === 1 ? "película" : "películas"}
          </p>
        )}
      </div>
      <p className="notice" role="status">
        {notice}
      </p>
      {isFetching && !result && <Feedback title="Cargando tu lista…" />}
      {error && (
        <Feedback title="No pudimos cargar tu lista" error>
          <p>{String(error)}</p>
          <button className="button secondary" onClick={() => refetch()}>
            Reintentar
          </button>
        </Feedback>
      )}
      {!error && result && (
        <>
          {result.data.length ? (
            <div className="watchlist-items" aria-busy={isFetching}>
              {result.data.map((item) => (
                <WatchlistRow
                  key={item._id}
                  item={item}
                  onNotice={setNotice}
                  onRemoved={() => {
                    if (result.data.length === 1 && page > 1) setPage(page - 1);
                  }}
                />
              ))}
            </div>
          ) : (
            <Feedback
              title={
                status === "all"
                  ? "Tu próxima película puede empezar acá"
                  : "No hay películas con este estado"
              }
            >
              <p>
                {status === "all"
                  ? "Abrí una película del catálogo y elegí “Guardar en mi lista”. Después podés marcarla como vista y escribir tu nota privada."
                  : "Cambiá el filtro o actualizá el estado de una película de tu lista."}
              </p>
              {status !== "all" ? (
                <button className="button secondary" onClick={() => setParams({})}>
                  Ver toda mi lista
                </button>
              ) : (
                <Link className="button" to="/">
                  Elegir una película
                </Link>
              )}
            </Feedback>
          )}
          <Pagination
            page={page}
            totalPages={result.meta.totalPages}
            onChange={setPage}
            disabled={isFetching}
          />
        </>
      )}
    </>
  );
}
