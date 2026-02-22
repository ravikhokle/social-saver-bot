import express from "express";
import {
  listBookmarks,
  getRandomBookmark,
  getCategories,
  getStats,
  getBookmarkById,
  deleteBookmark,
  updateBookmark,
} from "../controllers/bookmarkController.js";

const router = express.Router();

router.get("/", listBookmarks);
router.get("/random", getRandomBookmark);
router.get("/categories", getCategories);
router.get("/stats", getStats);
router.get("/:id", getBookmarkById);
router.patch("/:id", updateBookmark);
router.delete("/:id", deleteBookmark);

export default router;
