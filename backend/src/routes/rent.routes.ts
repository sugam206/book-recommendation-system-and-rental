import { RentController } from "../controller/rent.controller";
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();
const rentController = new RentController();

// protect all rent routes
router.use(authenticateToken);

// admin listing with optional status filter and pagination
router.get('/', rentController.getAllRents);
router.get('/provider/incoming', rentController.getProviderRents);

router.post('/checkout-order', rentController.createCheckoutOrder);
router.post('/verify-payment', rentController.verifyCheckoutPayment);
router.put('/:id/provider-decision', rentController.providerDecision);
router.put('/:id/admin-confirm-start', rentController.adminConfirmStart);
router.put('/:id/admin-confirm-completion', rentController.adminConfirmCompletion);
router.put('/:id/admin-refund', rentController.adminRefundDeposit);
router.post('/', rentController.createRent);
router.put('/:id', rentController.updateRent);
router.delete('/:id', rentController.deleteRent);
router.get('/:id', rentController.getRentById);

export default router;
