import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateMovieId as validateId } from "../middlewares/validate-movie-id.js";
import { validateBody } from "../middlewares/validate.js";
import {
  createWatchlistSchema,
  updateWatchlistSchema,
} from "../schemas/watchlist.schema.js";
import * as controller from "../controllers/watchlist.controller.js";

const router = Router();
router.use(authMiddleware);
router.get("/", controller.listWatchlist);
router.post(
  "/",
  validateBody(createWatchlistSchema),
  controller.createWatchlistItem,
);
router.patch(
  "/:id",
  validateId,
  validateBody(updateWatchlistSchema),
  controller.updateWatchlistItem,
);
router.delete("/:id", validateId, controller.deleteWatchlistItem);

export default router;
