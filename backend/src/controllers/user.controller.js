import { db } from "../lib/db.js";
import { users, attempts, quizzes } from "../db/schema.js";
import { eq, like, or, and } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../services/email.service.js";

export const getUsers = asyncHandler(async (req, res) => {
  const { search, role, status } = req.query;
  
  let query = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    })
    .from(users);

  const conditions = [];
  if (role) {
    conditions.push(eq(users.role, role));
  }
  if (status) {
    conditions.push(eq(users.status, status));
  }
  if (search) {
    conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const allUsers = await query;
  res.status(200).json({ success: true, data: allUsers });
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id));

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Fetch attempts for this user
  const userAttempts = await db
    .select({
      id: attempts.id,
      score: attempts.score,
      percentage: attempts.percentage,
      correctAnswers: attempts.correctAnswers,
      incorrectAnswers: attempts.incorrectAnswers,
      unanswered: attempts.unanswered,
      timeTaken: attempts.timeTaken,
      status: attempts.status,
      startedAt: attempts.startedAt,
      completedAt: attempts.completedAt,
      quizTitle: quizzes.title,
    })
    .from(attempts)
    .innerJoin(quizzes, eq(attempts.quizId, quizzes.id))
    .where(eq(attempts.userId, id));

  // Compute metrics
  const totalAttempts = userAttempts.length;
  const passedAttempts = userAttempts.filter(a => a.status === "PASSED").length;
  const avgPercentage = totalAttempts > 0 
    ? (userAttempts.reduce((sum, a) => sum + parseFloat(a.percentage), 0) / totalAttempts).toFixed(2)
    : "0.00";
  const highestPercentage = totalAttempts > 0 
    ? Math.max(...userAttempts.map(a => parseFloat(a.percentage))).toFixed(2)
    : "0.00";

  res.status(200).json({
    success: true,
    data: {
      user,
      stats: {
        totalAttempts,
        passedAttempts,
        failedAttempts: totalAttempts - passedAttempts,
        avgPercentage,
        highestPercentage,
      },
      attempts: userAttempts,
    },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, role } = req.body;

  const [updatedUser] = await db
    .update(users)
    .set({
      ...(name && { name }),
      ...(role && { role }),
    })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
    });

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    message: "User details updated successfully",
    data: updatedUser,
  });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["ACTIVE", "INACTIVE"].includes(status)) {
    throw new ApiError(400, "Invalid status. Status must be ACTIVE or INACTIVE.");
  }

  const [updatedUser] = await db
    .update(users)
    .set({ status })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
    });

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    message: `User status changed to ${status} successfully`,
    data: updatedUser,
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
    });

  if (!deletedUser) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    data: deletedUser,
  });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = "STUDENT" } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password fields are required");
  }

  // Check duplicate email
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()));

  if (existingUser) {
    throw new ApiError(400, "Email address is already registered");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const [newUser] = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      isVerified: true, // Pre-verified since created by admin
      status: "ACTIVE",
      mustChangePassword: true, // Force change on first login
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      isVerified: users.isVerified,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
    });

  // Dispatch Welcome email containing credentials in background
  try {
    await sendWelcomeEmail(email.trim().toLowerCase(), name.trim(), password);
  } catch (err) {
    console.error("Welcome email delivery failed:", err);
  }

  res.status(201).json({
    success: true,
    message: "User account created successfully by administrator",
    data: newUser,
  });
});
