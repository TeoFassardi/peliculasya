import { Schema, model } from "mongoose";

const watchlistItemSchema = new Schema(
  {
    userId: { type: String, required: true },
    movie: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
    watched: { type: Boolean, default: false },
    note: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

watchlistItemSchema.index({ userId: 1, movie: 1 }, { unique: true });
watchlistItemSchema.index({ userId: 1, createdAt: -1, _id: -1 });

export default model("WatchlistItem", watchlistItemSchema);
