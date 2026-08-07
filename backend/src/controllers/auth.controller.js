import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { config } from "../config/app.config.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { db } from "../lib/db.js";
import { users } from "../db/schema.js";
import { sendOtpEmail, sendResetPasswordEmail } from "../services/email.service.js";

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const generateOtp = () => {
  // Returns a 6-digit numeric OTP as an integer
  return Math.floor(100000 + Math.random() * 900000);
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = "STUDENT" } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "All fields (name, email, password) are required");
  }

  // Check duplicate email in User table
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (existingUser) {
    throw new ApiError(400, "Email address is already registered");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate OTP (valid for 10 minutes)
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Perform user creation
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      otp,
      otpExpiresAt,
      isVerified: false,
    })
    .returning();

  // Send OTP email
  await sendOtpEmail(newUser.email, otp);

  res.status(201).json({
    success: true,
    requireOtp: true,
    message:
      "Account created successfully. An OTP has been sent to your email.",
    data: {
      email: newUser.email,
    },
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Fetch user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "Your account has been deactivated. Please contact support.");
  }

  // Enforce OTP verification if email is not verified
  if (!user.isVerified) {
    // Generate new OTP and save it
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db
      .update(users)
      .set({ otp, otpExpiresAt })
      .where(eq(users.id, user.id));

    // Send verification email
    await sendOtpEmail(user.email, otp);

    return res.status(403).json({
      success: false,
      requireOtp: true,
      message: "Please verify your email address. An OTP has been sent to your email.",
      data: {
        email: user.email,
      },
    });
  }

  const token = generateToken(user.id, user.role);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    token,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      },
    },
  });
});

export const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP code are required");
  }

  // Fetch user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (!user) {
    throw new ApiError(404, "User account not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  // Validate OTP code (database column matches number)
  if (!user.otp || user.otp !== parseInt(otp, 10)) {
    throw new ApiError(400, "Invalid OTP verification code");
  }

  // Check expiration
  if (new Date() > new Date(user.otpExpiresAt)) {
    throw new ApiError(400, "Verification code has expired. Please request a new OTP.");
  }

  // Update verification status and clear OTP columns
  const [updatedUser] = await db
    .update(users)
    .set({
      isVerified: true,
      otp: null,
      otpExpiresAt: null,
    })
    .where(eq(users.id, user.id))
    .returning();

  const token = generateToken(updatedUser.id, updatedUser.role);

  res.status(200).json({
    success: true,
    message: "Email address verified successfully",
    token,
    data: {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt,
      },
    },
  });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email address is required");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (!user) {
    throw new ApiError(404, "User account not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  // Generate new OTP and update user
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .update(users)
    .set({ otp, otpExpiresAt })
    .where(eq(users.id, user.id));

  // Resend email
  await sendOtpEmail(user.email, otp);

  res.status(200).json({
    success: true,
    message: "A new OTP verification code has been sent to your email.",
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email address is required");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (!user) {
    throw new ApiError(404, "No account associated with this email address");
  }

  // Generate OTP reset code (valid for 10 minutes)
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .update(users)
    .set({ otp, otpExpiresAt })
    .where(eq(users.id, user.id));

  // Send password reset email
  await sendResetPasswordEmail(user.email, otp);

  res.status(200).json({
    success: true,
    message: "Password reset instructions have been sent to your email.",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, reset code, and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (!user) {
    throw new ApiError(404, "User account not found");
  }

  // Verify code
  if (!user.otp || user.otp !== parseInt(otp, 10)) {
    throw new ApiError(400, "Invalid password reset code");
  }

  // Check expiration
  if (new Date() > new Date(user.otpExpiresAt)) {
    throw new ApiError(400, "Reset code has expired. Please request a new password reset.");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password and clear OTP columns
  await db
    .update(users)
    .set({
      password: hashedPassword,
      otp: null,
      otpExpiresAt: null,
    })
    .where(eq(users.id, user.id));

  res.status(200).json({
    success: true,
    message: "Password reset successfully. You can now log in with your new password.",
  });
});

export const getMe = asyncHandler(async (req, res) => {
  // Protect middleware attaches safe user details to req.user
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.user.id;

  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password in db and clear mustChangePassword flag
  await db
    .update(users)
    .set({
      password: hashedPassword,
      mustChangePassword: false,
    })
    .where(eq(users.id, userId));

  res.status(200).json({
    success: true,
    message: "Password updated successfully. You can now use the application.",
  });
});
