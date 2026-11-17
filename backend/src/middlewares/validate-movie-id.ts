import type { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";

export function validateMovieId(req: Request, res: Response, next: NextFunction): void {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ error: { message: "Identificador inválido" } });
    return;
  }

  next();
}
