import { Router } from "express";
import { z } from "zod";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

// Secure all user management routes to admin-only
router.use(protect);
router.use(authorize("ADMIN"));

// Zod schemas for user updating
const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Invalid email address"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "STUDENT"]).optional(),
  }),
});

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
router.post("/", validate(createUserSchema), createUser);
router.get("/:id", getUserById);
router.put("/:id", validate(updateUserSchema), updateUser);
router.patch("/:id/status", validate(toggleUserStatusSchema), toggleUserStatus);
router.delete("/:id", deleteUser);

export default router;
