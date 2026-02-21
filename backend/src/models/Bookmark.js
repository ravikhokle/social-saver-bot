const mongoose = require("mongoose");

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
    embedUrl: {
      type: String,
      default: "",
    },
    author: {
      type: String,
      default: "",
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

module.exports = mongoose.model("Bookmark", bookmarkSchema);
