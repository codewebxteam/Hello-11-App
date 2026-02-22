import express from "express";
import {
  getCabRates,
  getOutstationRates,
  calculateFareEstimate,
} from "../controllers/fareController.js";

const router = express.Router();

// GET /api/fare/cab - Get cab fare rates
router.get("/cab", getCabRates);

// GET /api/fare/outstation - Get outstation fare rates
router.get("/outstation", getOutstationRates);

// POST /api/fare/estimate - Calculate fare estimate
router.post("/estimate", calculateFareEstimate);

export default router;
