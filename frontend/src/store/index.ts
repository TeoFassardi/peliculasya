import { configureStore } from "@reduxjs/toolkit";
import { moviesApi } from "./api";

// Better Auth administra la sesión; Redux conserva los datos del catálogo.
export const store = configureStore({
  reducer: { [moviesApi.reducerPath]: moviesApi.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(moviesApi.middleware),
});
