import { db } from "../lib/db.js";
import { categories, quizzes } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCategories = asyncHandler(async (req, res) => {
  const list = await db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      createdAt: categories.createdAt,
      quizCount: sql`count(${quizzes.id})::int`,
    })
    .from(categories)
    .leftJoin(quizzes, eq(categories.id, quizzes.categoryId))
    .groupBy(categories.id);

  res.status(200).json({ success: true, data: list });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === "") {
    throw new ApiError(400, "Category name is required");
  }

  const [existing] = await db
    .select()
    .from(categories)
    .where(eq(categories.name, name.trim()));

  if (existing) {
    throw new ApiError(400, "Category name already exists");
  }

  const [newCategory] = await db
    .insert(categories)
    .values({
      name: name.trim(),
      description,
    })
    .returning();

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: newCategory,
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (name) {
    if (name.trim() === "") {
      throw new ApiError(400, "Category name cannot be empty");
    }

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name.trim()));

    if (existing && existing.id !== id) {
      throw new ApiError(400, "Category name already exists");
    }
  }

  const [updated] = await db
    .update(categories)
    .set({
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description }),
    })
    .where(eq(categories.id, id))
    .returning();

  if (!updated) {
    throw new ApiError(404, "Category not found");
  }

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: updated,
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [deleted] = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning();

  if (!deleted) {
    throw new ApiError(404, "Category not found");
  }

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
    data: deleted,
  });
});
