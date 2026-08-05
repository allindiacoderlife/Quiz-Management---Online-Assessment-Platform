import { ApiError } from "../utils/ApiError.js";

/**
 * Express middleware to validate incoming requests using Zod schemas.
 * Expects a schema containing 'body', 'query', or 'params' objects.
 * @param {import("zod").ZodSchema} schema
 */
export const validate = (schema) => (req, _res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      const errorDetails = parsed.error.errors.map((err) => ({
        field: err.path.slice(1).join("."), // e.g. "email" instead of "body.email"
        message: err.message,
      }));
      throw new ApiError(400, "Request validation failed", errorDetails);
    }

    // Re-assign validated and structured data back to express req object
    req.body = parsed.data.body;
    req.query = parsed.data.query;
    req.params = parsed.data.params;
    next();
  } catch (error) {
    next(error);
  }
};
