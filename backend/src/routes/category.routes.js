import { Router } from "express";
import { z } from "zod";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = Router();

// Zod schemas for validation
const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Category name is required" })
      .trim()
      .min(2, "Category name must be at least 2 characters"),
    description: z.string().optional(),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Category name must be at least 2 characters")
      .optional(),
    description: z.string().optional(),
  }),
});

// Category fetch is open to authenticated users (protect)
router.get("/", protect, getCategories);

// Admin-only category management
router.post("/", protect, authorize("ADMIN"), validate(createCategorySchema), createCategory);
router.put("/:id", protect, authorize("ADMIN"), validate(updateCategorySchema), updateCategory);
router.delete("/:id", protect, authorize("ADMIN"), deleteCategory);

export default router;
