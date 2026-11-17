import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "../layouts/Layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { Home } from "../pages/Home";
import { MovieDetail } from "../pages/MovieDetail";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Admin } from "../pages/Admin";
import { Feedback } from "../components/Feedback";
import { Link } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "home", element: <Navigate to="/" replace /> },
      { path: "movies/:id", element: <MovieDetail /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      {
        element: <ProtectedRoute roles={["admin"]} redirectTo="/sin-permisos" />,
        children: [{ path: "admin", element: <Admin /> }],
      },
      {
        path: "sin-permisos",
        element: (
          <Feedback title="Sin permisos">
            <p>Solo los administradores pueden modificar el catálogo.</p>
            <Link className="button secondary" to="/">
              Volver al catálogo
            </Link>
          </Feedback>
        ),
      },
      {
        path: "*",
        element: (
          <Feedback title="Esta página no existe">
            <Link className="button secondary" to="/">
              Volver al catálogo
            </Link>
          </Feedback>
        ),
      },
    ],
  },
]);
