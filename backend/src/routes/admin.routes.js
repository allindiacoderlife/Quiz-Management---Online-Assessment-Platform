import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getAllAttempts,
  getAttemptDetails,
  getAnalytics,
  getLeaderboard,
} from "../controllers/admin.controller.js";

const adminRouter = Router();
const leaderboardRouter = Router();

// ==========================================
// ADMIN UTILITIES ROUTER
// ==========================================
adminRouter.use(protect);
adminRouter.use(authorize("ADMIN"));

adminRouter.get("/attempts", getAllAttempts);
adminRouter.get("/attempts/:id", getAttemptDetails);
adminRouter.get("/analytics", getAnalytics);

// ==========================================
// PUBLIC/STUDENT LEADERBOARD ROUTER
// ==========================================
leaderboardRouter.use(protect);
leaderboardRouter.get("/", getLeaderboard);

export { adminRouter, leaderboardRouter };
