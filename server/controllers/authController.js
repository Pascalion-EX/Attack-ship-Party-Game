import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
};


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

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = generateToken(admin._id.toString());

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
    return res.status(500).json({
      success: false,
      message: error.message || "Login failed.",
    });
  }
};

export const logoutAdmin = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("attackshipToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
};

export const getCurrentAdmin = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
};

export const checkAuth = async (req, res) => {
  return res.status(200).json({
    success: true,
    authenticated: true,
    user: sanitizeUser(req.user),
  });
};