import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ error: { message: "El cuerpo debe ser un JSON válido" } });
    return;
  }

  if (error?.type === "entity.too.large") {
    res.status(413).json({ error: { message: "El cuerpo de la solicitud es demasiado grande" } });
    return;
  }

  // No enviar trazas ni detalles de conexión al navegador.
  console.error("[api] No se pudo completar la solicitud:", error?.name ?? "Error");
  res
    .status(500)
    .json({ error: { message: "No pudimos completar la solicitud. Intentá nuevamente." } });
};
