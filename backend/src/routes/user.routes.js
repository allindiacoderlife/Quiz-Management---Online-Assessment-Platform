import { Router } from "express";
import { z } from "zod";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

// Secure all user management routes to admin-only
router.use(protect);
router.use(authorize("ADMIN"));

// Zod schemas for user updating
const updateUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    role: z.enum(["ADMIN", "STUDENT"]).optional(),
  }),
});

const toggleUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"], {
      required_error: "Status field is required",
    }),
  }),
});

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", validate(updateUserSchema), updateUser);
router.patch("/:id/status", validate(toggleUserStatusSchema), toggleUserStatus);
router.delete("/:id", deleteUser);

export default router;
