import express from "express";
import { RecommendationController } from "../controller/recommendation.controller";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authenticateToken, RecommendationController.getCollaborativeRecommendations);

export default router;
