import express from "express";
import { signup, signin } from "../controllers/authController.js";

const router = express.Router();

// signup
router.post("/signup", signup);

// login
router.post("/signin", signin);

export default router;
