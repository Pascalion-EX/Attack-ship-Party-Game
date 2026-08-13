import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";

/*
 * Detect whether the app is running in production.
 *
 * VERCEL is automatically available on Vercel deployments,
 * so this also works if NODE_ENV is not set correctly.
 */
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL === "1";

/*
 * Cookie configuration.
 */
const getCookieOptions = () => ({
  httpOnly: true,

  // Required for HTTPS / cross-site cookies in production.
  secure: isProduction,

  // Frontend and backend use different Vercel domains.
  sameSite: isProduction ? "none" : "lax",

  path: "/",

  maxAge: 7 * 24 * 60 * 60 * 1000,
});

/*
 * Return only safe user information.
 */
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

/*
 * LOGIN
 */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const admin = await userModel
      .findOne({
        email: normalizedEmail,
      })
      .select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been disabled.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "This account does not have admin access.",
      });
    }

    /*
     * Update login timestamp.
     */
    admin.lastLoginAt = new Date();

    await admin.save();

    /*
     * Create JWT.
     */
    const token = generateToken(
      admin._id.toString()
    );

    /*
     * Store JWT in HttpOnly cookie.
     */
    res.cookie(
      "attackshipToken",
      token,
      getCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: sanitizeUser(admin),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Login failed."
          : error.message || "Login failed.",
    });
  }
};

/*
 * LOGOUT
 */
export const logoutAdmin = async (req, res) => {
  try {
    res.clearCookie("attackshipToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction
        ? "none"
        : "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
};

/*
 * GET CURRENT ADMIN
 */
export const getCurrentAdmin = async (
  req,
  res
) => {
  return res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
};

/*
 * CHECK AUTHENTICATION
 */
export const checkAuth = async (
  req,
  res
) => {
  return res.status(200).json({
    success: true,
    authenticated: true,
    user: sanitizeUser(req.user),
  });
};