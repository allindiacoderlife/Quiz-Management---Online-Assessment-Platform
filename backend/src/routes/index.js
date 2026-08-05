import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import categoryRoutes from "./category.routes.js";
import quizRoutes from "./quiz.routes.js";
import questionRoutes from "./question.routes.js";
import attemptRoutes from "./attempt.routes.js";
import { adminRouter, leaderboardRouter } from "./admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/quizzes", quizRoutes);
router.use("/quizzes/:quizId/questions", questionRoutes); // mergeParams handles quizId
router.use("/questions", questionRoutes);
router.use("/attempts", attemptRoutes);
router.use("/admin", adminRouter);
router.use("/leaderboard", leaderboardRouter);

export default router;
