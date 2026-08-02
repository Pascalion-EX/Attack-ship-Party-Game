import express from "express";

import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getCurrentAdmin,
  checkAuth,
} from "../controllers/authController.js";

import userAuth from "../middleware/userAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const authRouter = express.Router();

authRouter.post("/register", registerAdmin);
authRouter.post("/login", loginAdmin);
authRouter.post("/logout", logoutAdmin);

authRouter.get(
  "/me",
  userAuth,
  requireAdmin,
  getCurrentAdmin
);

authRouter.get(
  "/check",
  userAuth,
  requireAdmin,
  checkAuth
);

export default authRouter;