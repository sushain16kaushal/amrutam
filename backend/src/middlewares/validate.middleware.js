export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '); // .errors → .issues
    return res.status(400).json({ success: false, message });
  }
  req.body = result.data;
  next();
};