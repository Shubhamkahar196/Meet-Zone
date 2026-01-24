import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    // 1️ Get authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing or invalid",
      });
    }

    //  Extract token
   
    const token = authHeader.split(" ")[1];

    //  Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //  Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
