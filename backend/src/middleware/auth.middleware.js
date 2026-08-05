import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { config } from "../config/app.config.js";
import { ApiError } from "../utils/ApiError.js";
import { db } from "../lib/db.js";
import { users } from "../db/schema.js";

/**
 * Protect routes by requiring a valid JWT bearer token.
 * Attaches the database user object to req.user.
 */
export const protect = async (req, _res, next) => {
  try {
    let token;

    // Check for authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new ApiError(401, "Authentication required. Please provide a bearer token.");
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Fetch user from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.id));

      if (!user) {
        throw new ApiError(401, "The user belonging to this token no longer exists.");
      }

      if (user.status !== "ACTIVE") {
        throw new ApiError(403, "Your account has been deactivated. Please contact support.");
      }

      // Remove sensitive properties before passing user to request
      const { password, otp, otpExpiresAt, ...safeUser } = user;

      req.user = safeUser;
      next();
    } catch (jwtError) {
      if (
        jwtError.name === "JsonWebTokenError" ||
        jwtError.name === "TokenExpiredError"
      ) {
        throw new ApiError(401, "Invalid or expired session token. Please log in again.");
      }
      throw jwtError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Restrict route access to specific roles.
 * Must be used after 'protect' middleware.
 * @param {...string} roles Allowed roles (e.g. 'ADMIN', 'STUDENT')
 */
export const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(
        new ApiError(500, "Auth protection middleware must be run before role authorization check.")
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};
