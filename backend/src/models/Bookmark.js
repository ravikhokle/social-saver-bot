import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ["instagram", "twitter", "youtube", "article"],
      index: true,
    },
    title: {
      type: String,
      default: "",
    },
    caption: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "Uncategorized",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    thumbnail: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    embedUrl: {
      type: String,
      default: "",
    },
    author: {
      type: String,
      default: "",
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Text index for search
bookmarkSchema.index({ title: "text", caption: "text", summary: "text", tags: "text" });

export default mongoose.model("Bookmark", bookmarkSchema);
