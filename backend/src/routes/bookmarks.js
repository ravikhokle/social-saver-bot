import express from "express";
import {
  listBookmarks,
  getRandomBookmark,
  getCategories,
  getStats,
  getBookmarkById,
  deleteBookmark,
} from "../controllers/bookmarkController.js";

const router = express.Router();

// route definitions delegate to controller functions
router.get("/", listBookmarks);


/**
 * GET /api/bookmarks/random
 * Returns a random bookmark for "Random Inspiration"
 */
router.get("/random", getRandomBookmark);

/**
 * GET /api/bookmarks/categories
 * Returns list of all categories with their counts
 */
router.get("/categories", getCategories);

/**
 * GET /api/bookmarks/stats
 * Dashboard stats
 */
router.get("/stats", getStats);

/**
 * GET /api/bookmarks/:id
 */
router.get("/:id", getBookmarkById);

/**
 * DELETE /api/bookmarks/:id
 */
router.delete("/:id", deleteBookmark);

export default router;
