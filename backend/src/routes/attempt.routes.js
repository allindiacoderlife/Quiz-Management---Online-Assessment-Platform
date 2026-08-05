import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getAttempts, getAttemptById } from "../controllers/attempt.controller.js";

const router = Router();

// Protect all attempt tracking routes
router.use(protect);

router.get("/", getAttempts);
router.get("/:id", getAttemptById);

export default router;
