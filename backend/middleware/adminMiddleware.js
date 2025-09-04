exports.adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    next();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Middleware error", error: err.message });
  }
};
