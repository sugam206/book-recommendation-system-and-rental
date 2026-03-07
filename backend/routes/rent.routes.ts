import { RentController } from "../controller/rent.controller.ts";
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.ts";

const router = express.Router();
const rentController = new RentController();

// protect all rent routes
router.use(authenticateToken);

// admin listing with optional status filter and pagination
router.get('/', rentController.getAllRents);

router.post('/request', rentController.createRentRequest);
router.post('/', rentController.createRent);
router.put('/:id', rentController.updateRent);
router.delete('/:id', rentController.deleteRent);
router.get('/:id', rentController.getRentById);

export default router;
