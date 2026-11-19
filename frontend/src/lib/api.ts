import axios from "axios";

// Ruta relativa: mismo origen que el front, el navegador manda la cookie de sesion solo.
// En local la resuelve el proxy de Vite; en Render, el rewrite /api/* del Static Site.
export const api = axios.create({
  baseURL: "/api",
});

// Los errores del backend vienen como { error: "..." } o { error: { message } }.
// Los de RTK Query (unwrap) ya llegan como string: ver axiosBaseQuery en store/api.ts.
export const getErrorMessage = (err: unknown): string => {
  if (typeof err === "string") return err;
  if (axios.isAxiosError(err)) {
    if (!err.response)
      return "No pudimos conectar con el servidor. Revisá tu conexión y volvé a intentar.";
    const error = err.response?.data?.error;
    return typeof error === "string" ? error : (error?.message ?? err.message);
  }
  if (err instanceof Error) return err.message;
  return "No pudimos completar la operación. Volvé a intentar.";
};
