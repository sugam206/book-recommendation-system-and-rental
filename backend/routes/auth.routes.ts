// routes/auth.routes.ts
import authController from "../controller/auth.controller.ts"; // This is correct for default export
import express from "express";

const router = express.Router();

router.post('/register', authController.registerUser);  // Now this will work
router.post('/login', authController.loginUser);

// Add test route
router.get('/test', (req, res) => {
    res.json({ message: "Auth routes are working!" });
});

export default router;