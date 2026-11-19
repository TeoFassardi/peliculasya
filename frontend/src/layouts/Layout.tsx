import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { signOut, useSession } from "../lib/auth-client";

export function Layout() {
  const { data: session, isPending } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function logout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      const { error } = await signOut();
      if (error) {
        setLogoutError("No pudimos cerrar la sesión. Volvé a intentar.");
        return;
      }
      for (const key of Object.keys(sessionStorage)) if (key.startsWith("peliculasya-chat:")) sessionStorage.removeItem(key);
      window.location.replace("/");
    } catch {
      setLogoutError("No pudimos conectar. Volvé a intentar.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="PeliculasYa, inicio">
            Peliculas<span>Ya</span>
            <span className="brand-dot" aria-hidden="true" />
          </Link>
          <nav aria-label="Navegación principal">
            <NavLink to="/" end>
              Catálogo
            </NavLink>
            {session && <NavLink to="/mi-lista">Mi lista</NavLink>}
            {session && <NavLink to="/chat">Asistente</NavLink>}
            {session?.user.role === "admin" && <NavLink to="/admin">Administrar</NavLink>}
            {!isPending &&
              (session ? (
                <button className="nav-button" onClick={logout} disabled={loggingOut}>
                  {loggingOut ? "Saliendo…" : `Salir (${session.user.name})`}
                </button>
              ) : (
                <NavLink to="/login">Ingresar</NavLink>
              ))}
          </nav>
        </div>
      </header>
      <main id="main-content" className="main-content">
        {logoutError && (
          <p className="field-error" role="alert">
            {logoutError}
          </p>
        )}
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>PeliculasYa</span>
        <p>Historias para descubrir.</p>
      </footer>
    </div>
  );
}
