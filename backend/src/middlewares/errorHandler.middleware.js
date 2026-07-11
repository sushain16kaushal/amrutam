export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err); // Phase 7 mein proper logger se replace karenge
  res.status(statusCode).json({ success: false, message: err.message || 'Internal server error' });
};