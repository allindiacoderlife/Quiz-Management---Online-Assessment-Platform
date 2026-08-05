export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorMessage =
    err.message || (typeof err === "string" ? err : "Unknown Error");

  // Log clean 1-liner for expected 4xx client errors (401, 403, 404, 400)
  if (statusCode >= 400 && statusCode < 500) {
    console.warn(
      `⚠️ [HTTP ${statusCode}] ${req.method} ${req.originalUrl || req.url} - ${errorMessage}`,
    );
  } else {
    console.error(`❌ [HTTP ${statusCode}] Server Error:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: err.name || "Error",
    details: err.details || err.message || "No additional details",
    ...(process.env.NODE_ENV !== "production" ? { raw: err } : {}),
  });
};
