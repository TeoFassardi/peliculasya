import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { AxiosRequestConfig } from "axios";
import { api as http, getErrorMessage } from "../lib/api";
import type { MovieFormValues } from "../schemas/movie.schema";
import type { Movie, MoviePage } from "../types/movie";

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
  tagTypes: ["Movies"],
  endpoints: (build) => ({
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
      invalidatesTags: ["Movies"],
    }),
    deleteMovie: build.mutation<void, string>({
      query: (id) => ({ url: `/movies/${id}`, method: "DELETE" }),
      invalidatesTags: ["Movies"],
    }),
  }),
});

export const {
  useGetMoviesQuery,
  useGetMovieQuery,
  useCreateMovieMutation,
  useUpdateMovieMutation,
  useDeleteMovieMutation,
} = moviesApi;
