import { useState } from "react";
import { Link } from "react-router";
import { useSession } from "../lib/auth-client";
import { useGetUsersQuery, useSetUserRoleMutation } from "../store/api";
import { useCatalogParams } from "../hooks/useCatalogParams";
import { getErrorMessage } from "../lib/api";
import type { ManagedUser } from "../types/user";
import type { UserRole } from "../types/auth";
import { Feedback } from "../components/Feedback";
import { Pagination } from "../components/Pagination";
import { CatalogSearch } from "../components/CatalogSearch";
import { UserRoleRow } from "../components/admin/UserRoleRow";

export function Users() {
  const { data: session } = useSession();
  const { search, page, setSearch, setPage } = useCatalogParams();
  const {
    currentData: result,
    error,
    isFetching,
    refetch,
  } = useGetUsersQuery(
    {
      adminId: session?.user.id ?? "",
      search,
      page,
    },
    { skip: !session, refetchOnMountOrArgChange: true },
  );
  const [setRole, { isLoading: saving }] = useSetUserRoleMutation();
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");

  async function save(user: ManagedUser, role: UserRole) {
    const description =
      role === "admin"
        ? "administrador: podrá modificar el catálogo y los roles de otras cuentas"
        : "usuario: podrá consultar el catálogo y gestionar su lista privada";
    if (!window.confirm(`¿Cambiar el rol de ${user.email} a ${description}?`)) return;
    setNotice("");
    setSaveError("");
    try {
      await setRole({ userId: user.id, role }).unwrap();
      setNotice(
        `El rol de ${user.name} ahora es ${role === "admin" ? "administrador" : "usuario"}.`,
      );
    } catch (failure) {
      setSaveError(getErrorMessage(failure));
    }
  }

  return (
    <>
      <Link className="back-link" to="/admin">
        Volver a administrar catálogo
      </Link>
      <div className="page-heading">
        <div>
          <h1>Usuarios y roles</h1>
          <p className="muted">
            Decidí quién administra el catálogo. Las listas y notas personales siguen siendo
            privadas.
          </p>
        </div>
      </div>
      <div className="list-toolbar">
        <CatalogSearch
          key={search}
          initialSearch={search}
          onSearch={setSearch}
          label="Buscar por email"
          placeholder="Email de la cuenta"
        />
        {result && (
          <p className="muted">
            {result.total} {result.total === 1 ? "cuenta" : "cuentas"}
          </p>
        )}
      </div>
      <p className="notice" role="status">
        {notice}
      </p>
      {saveError && (
        <p className="field-error" role="alert">
          {saveError}
        </p>
      )}
      {isFetching && !result && <Feedback title="Cargando cuentas…" />}
      {error && (
        <Feedback title="No pudimos cargar las cuentas" error>
          <p>{String(error)}</p>
          <button className="button secondary" onClick={() => refetch()}>
            Reintentar
          </button>
        </Feedback>
      )}
      {!error && result && (
        <>
          {result.users.length ? (
            <ul className="user-role-list" aria-busy={isFetching || saving}>
              {result.users.map((user) => (
                <UserRoleRow
                  key={`${user.id}-${user.role}`}
                  user={user}
                  currentUserId={session?.user.id ?? ""}
                  busy={saving || isFetching}
                  onSave={save}
                />
              ))}
            </ul>
          ) : (
            <Feedback title="No encontramos cuentas en esta página">
              <p>Probá con otro email o volvé a la primera página.</p>
              <button className="button secondary" onClick={() => setSearch("")}>
                Ver todas las cuentas
              </button>
            </Feedback>
          )}
          <Pagination
            page={page}
            totalPages={Math.ceil(result.total / 10)}
            onChange={setPage}
            disabled={isFetching || saving}
          />
        </>
      )}
    </>
  );
}
