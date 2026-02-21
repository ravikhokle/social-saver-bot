const express = require("express");
const Bookmark = require("../models/Bookmark");
const User = require("../models/User");

const router = express.Router();

/**
 * GET /api/bookmarks
 * Query params: ?search=&category=&platform=&page=1&limit=12
 */
router.get("/", async (req, res) => {
  try {
    const { search, category, platform, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (platform && platform !== "all") {
      filter.platform = platform;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookmarks, total] = await Promise.all([
      Bookmark.find(filter)
        .populate("user", "phone name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Bookmark.countDocuments(filter),
    ]);

    res.json({
      bookmarks,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("Error fetching bookmarks:", err);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

/**
 * GET /api/bookmarks/random
 * Returns a random bookmark for "Random Inspiration"
 */
router.get("/random", async (req, res) => {
  try {
    const count = await Bookmark.countDocuments();
    if (count === 0) {
      return res.status(404).json({ error: "No bookmarks yet" });
    }
    const random = Math.floor(Math.random() * count);
    const bookmark = await Bookmark.findOne().skip(random).populate("user", "phone name").lean();
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch random bookmark" });
  }
});

/**
 * GET /api/bookmarks/categories
 * Returns list of all categories with their counts
 */
router.get("/categories", async (req, res) => {
  try {
    const categories = await Bookmark.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(categories.map((c) => ({ name: c._id, count: c.count })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/**
 * GET /api/bookmarks/stats
 * Dashboard stats
 */
router.get("/stats", async (req, res) => {
  try {
    const [total, platforms, categories] = await Promise.all([
      Bookmark.countDocuments(),
      Bookmark.aggregate([
        { $group: { _id: "$platform", count: { $sum: 1 } } },
      ]),
      Bookmark.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      total,
      platforms: platforms.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {}),
      topCategories: categories.map((c) => ({ name: c._id, count: c.count })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/**
 * GET /api/bookmarks/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id)
      .populate("user", "phone name")
      .lean();
    if (!bookmark) return res.status(404).json({ error: "Not found" });
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookmark" });
  }
});

/**
 * DELETE /api/bookmarks/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    await Bookmark.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete bookmark" });
  }
});

module.exports = router;
