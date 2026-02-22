import Bookmark from "../models/Bookmark.js";

// GET /api/bookmarks
export async function listBookmarks(req, res) {
  try {
    // default to 9 results per page so pagination appears once there are more
    const { search, category, platform, page = 1, limit = 9, pinned } = req.query;
    const filter = {};

    if (pinned === "true") {
      filter.pinned = true;
    }

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
        // pinned items should float to the top, then newest first
        .sort({ pinned: -1, createdAt: -1 })
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
}

// GET /api/bookmarks/random
export async function getRandomBookmark(req, res) {
  try {
    const count = await Bookmark.countDocuments();
    if (count === 0) {
      return res.status(404).json({ error: "No bookmarks yet" });
    }
    const random = Math.floor(Math.random() * count);
    const bookmark = await Bookmark.findOne()
      .skip(random)
      .populate("user", "phone name")
      .lean();
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch random bookmark" });
  }
}

// GET /api/bookmarks/categories
export async function getCategories(req, res) {
  try {
    const categories = await Bookmark.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(categories.map((c) => ({ name: c._id, count: c.count })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
}

// GET /api/bookmarks/stats
export async function getStats(req, res) {
  try {
    const [total, platforms, categories, pinnedCount] = await Promise.all([
      Bookmark.countDocuments(),
      Bookmark.aggregate([
        { $group: { _id: "$platform", count: { $sum: 1 } } },
      ]),
      Bookmark.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Bookmark.countDocuments({ pinned: true }),
    ]);

    res.json({
      total,
      pinned: pinnedCount,
      platforms: platforms.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {}),
      topCategories: categories.map((c) => ({ name: c._id, count: c.count })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
}

// GET /api/bookmarks/:id
export async function getBookmarkById(req, res) {
  try {
    const bookmark = await Bookmark.findById(req.params.id)
      .populate("user", "phone name")
      .lean();
    if (!bookmark) return res.status(404).json({ error: "Not found" });
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookmark" });
  }
}

// DELETE /api/bookmarks/:id
export async function deleteBookmark(req, res) {
  try {
    const bookmark = await Bookmark.findByIdAndDelete(req.params.id);
    if (!bookmark) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete bookmark:", err);
    res.status(500).json({ error: "Failed to delete bookmark" });
  }
}

// PATCH /api/bookmarks/:id  (update fields such as pinned)
export async function updateBookmark(req, res) {
  try {
    const updates = req.body || {};
    const allowed = {};
    if (typeof updates.pinned === "boolean") {
      // Enforce max 3 pinned posts
      if (updates.pinned === true) {
        const pinnedCount = await Bookmark.countDocuments({ pinned: true });
        if (pinnedCount >= 3) {
          return res.status(400).json({ error: "You can pin at most 3 posts." });
        }
      }
      allowed.pinned = updates.pinned;
    }
    const bookmark = await Bookmark.findByIdAndUpdate(req.params.id, allowed, {
      new: true,
    });
    if (!bookmark) return res.status(404).json({ error: "Not found" });
    res.json(bookmark);
  } catch (err) {
    console.error("Failed to update bookmark:", err);
    res.status(500).json({ error: "Failed to update bookmark" });
  }
}
