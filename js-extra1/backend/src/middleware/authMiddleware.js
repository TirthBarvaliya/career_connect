import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/env.js";
import { normalizeRole } from "../utils/roles.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized. Token missing." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Not authorized. User not found." });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ message: "Your account has been blocked by admin. Please contact support." });
    }

    req.user = user;
    req.user.role = normalizeRole(user.role);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized. Invalid token." });
  }
};

// Like protect, but silently continues for guests (no token or invalid token).
// Sets req.user if a valid token is present; otherwise req.user stays undefined.
export const optionalProtect = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select("-password");
      if (user) {
        req.user = user;
        req.user.role = normalizeRole(user.role);
      }
    }
  } catch {
    // Invalid token — treat as guest, continue without req.user
  }
  return next();
};

export const authorize = (...roles) => (req, res, next) => {
  const normalizedRoles = roles.map((role) => normalizeRole(role));
  if (!req.user || !normalizedRoles.includes(normalizeRole(req.user.role))) {
    return res.status(403).json({ message: "Forbidden. Insufficient role permissions." });
  }
  return next();
};
