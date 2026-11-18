import { lazy } from "react";

export const Watchlist = lazy(() =>
  import("./Watchlist").then((module) => ({ default: module.Watchlist })),
);
export const Users = lazy(() => import("./Users").then((module) => ({ default: module.Users })));
