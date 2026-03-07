import express from "express";
import { RecommendationController } from "../controller/recommendation.controller.ts";
import { authenticateToken } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/", authenticateToken, RecommendationController.getCollaborativeRecommendations);

export default router;
