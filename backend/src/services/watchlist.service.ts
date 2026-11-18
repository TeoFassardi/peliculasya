import WatchlistItem from "../models/WatchlistItem.js";
import type {
  ListWatchlistInput,
  UpdateWatchlistInput,
} from "../schemas/watchlist.schema.js";

// El propietario viene de la sesión. Nunca se acepta del cuerpo o de la URL.
export async function listWatchlist(
  userId: string,
  { page, limit, status, movieId }: ListWatchlistInput,
) {
  const filter = {
    userId,
    ...(status === "all" ? {} : { watched: status === "watched" }),
    ...(movieId ? { movie: movieId } : {}),
  };
  const [data, total] = await Promise.all([
    WatchlistItem.find(filter)
      .select("-userId")
      .populate("movie")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    WatchlistItem.countDocuments(filter),
  ]);
  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function createWatchlistItem(userId: string, movieId: string) {
  const item = await WatchlistItem.create({ userId, movie: movieId });
  return WatchlistItem.findOne({ _id: item._id, userId })
    .select("-userId")
    .populate("movie");
}

export function updateWatchlistItem(
  userId: string,
  id: string,
  input: UpdateWatchlistInput,
) {
  return WatchlistItem.findOneAndUpdate(
    { _id: id, userId },
    { $set: input },
    {
      returnDocument: "after",
      runValidators: true,
    },
  )
    .select("-userId")
    .populate("movie");
}

export function deleteWatchlistItem(userId: string, id: string) {
  return WatchlistItem.findOneAndDelete({ _id: id, userId });
}
