import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { AxiosRequestConfig } from "axios";
import { api as http, getErrorMessage } from "../lib/api";
import type { MovieFormValues } from "../schemas/movie.schema";
import type { Movie, MoviePage } from "../types/movie";
import type { WatchlistItem, WatchlistPage, WatchlistStatus } from "../types/watchlist";
import type { ManagedUser } from "../types/user";
import type { WatchlistFormValues } from "../schemas/watchlist.schema";
import type { UserRole } from "../types/auth";
import { authClient } from "../lib/auth-client";

const axiosBaseQuery: BaseQueryFn<AxiosRequestConfig, unknown, string> = async (config) => {
  try {
    const { data } = await http.request(config);
    return { data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
};

export const moviesApi = createApi({
  reducerPath: "moviesApi",
  baseQuery: axiosBaseQuery,
  tagTypes: ["Movies", "Watchlist", "Users"],
  endpoints: (build) => ({
    getPublicConfig: build.query<{ googleEnabled: boolean }, void>({
      query: () => ({ url: "/config" }),
    }),
    getMovies: build.query<MoviePage, { search?: string; page?: number }>({
      query: (params) => ({ url: "/movies", params }),
      providesTags: ["Movies"],
    }),
    getMovie: build.query<Movie, string>({
      query: (id) => ({ url: `/movies/${id}` }),
      providesTags: ["Movies"],
    }),
    createMovie: build.mutation<Movie, MovieFormValues>({
      query: (data) => ({ url: "/movies", method: "POST", data }),
      invalidatesTags: ["Movies"],
    }),
    updateMovie: build.mutation<Movie, { id: string; values: MovieFormValues }>({
      query: ({ id, values }) => ({ url: `/movies/${id}`, method: "PATCH", data: values }),
      invalidatesTags: ["Movies", "Watchlist"],
    }),
    deleteMovie: build.mutation<void, string>({
      query: (id) => ({ url: `/movies/${id}`, method: "DELETE" }),
      invalidatesTags: ["Movies", "Watchlist"],
    }),
    getWatchlist: build.query<
      WatchlistPage,
      {
        userId: string;
        page?: number;
        status?: WatchlistStatus;
        movieId?: string;
      }
    >({
      // userId separa la caché entre cuentas; el servidor toma el dueño de la sesión.
      query: ({ page = 1, status = "all", movieId }) => ({
        url: "/watchlist",
        params: { page, status, ...(movieId ? { movieId } : {}) },
      }),
      providesTags: ["Watchlist"],
    }),
    addToWatchlist: build.mutation<WatchlistItem, string>({
      query: (movieId) => ({ url: "/watchlist", method: "POST", data: { movieId } }),
      invalidatesTags: ["Watchlist"],
    }),
    updateWatchlist: build.mutation<WatchlistItem, { id: string; values: WatchlistFormValues }>({
      query: ({ id, values }) => ({ url: `/watchlist/${id}`, method: "PATCH", data: values }),
      invalidatesTags: ["Watchlist"],
    }),
    removeFromWatchlist: build.mutation<void, string>({
      query: (id) => ({ url: `/watchlist/${id}`, method: "DELETE" }),
      invalidatesTags: ["Watchlist"],
    }),
    getUsers: build.query<
      { users: ManagedUser[]; total: number },
      { adminId: string; search: string; page: number }
    >({
      async queryFn({ search, page }) {
        try {
          const { data, error } = await authClient.admin.listUsers({
            query: {
              limit: 10,
              offset: (page - 1) * 10,
              sortBy: "createdAt",
              sortDirection: "desc",
              ...(search
                ? { searchValue: search, searchField: "email", searchOperator: "contains" }
                : {}),
            },
          });
          if (error || !data) return { error: error?.message ?? "No pudimos cargar las cuentas." };
          // Better Auth devuelve fechas como Date; guardamos solo los campos de la pantalla.
          const users = data.users.map(({ id, name, email, role }) => ({ id, name, email, role }));
          return { data: { users, total: data.total } };
        } catch (error) {
          return { error: getErrorMessage(error) };
        }
      },
      providesTags: ["Users"],
    }),
    setUserRole: build.mutation<null, { userId: string; role: UserRole }>({
      async queryFn(values) {
        try {
          const { error } = await authClient.admin.setRole(values);
          if (error) return { error: error.message ?? "No pudimos cambiar el rol." };
          return { data: null };
        } catch (error) {
          return { error: getErrorMessage(error) };
        }
      },
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetMoviesQuery,
  useGetMovieQuery,
  useCreateMovieMutation,
  useUpdateMovieMutation,
  useDeleteMovieMutation,
  useGetPublicConfigQuery,
  useGetWatchlistQuery,
  useAddToWatchlistMutation,
  useUpdateWatchlistMutation,
  useRemoveFromWatchlistMutation,
  useGetUsersQuery,
  useSetUserRoleMutation,
} = moviesApi;
