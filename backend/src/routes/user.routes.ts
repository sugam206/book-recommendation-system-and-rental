import { UserController } from "../controller/user.controller";
import { RentalRequestController } from "../controller/rentalRequest.controller";
import { authenticateToken } from "../middleware/authMiddleware";
import uploadProfile from "../config/multerProfile";
import express from "express";
const router = express.Router();
const userController = new UserController();
const rentalRequestController = new RentalRequestController();

// Profile specific routes (must come before generic /:id routes)
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateBasicInfo);
router.post('/profile/picture', authenticateToken, uploadProfile.single('picture'), userController.uploadProfilePicture);
router.delete('/profile/picture', authenticateToken, userController.deleteProfilePicture);
router.post('/profile/password-change', authenticateToken, userController.changePassword);
router.put('/profile/enable-renter', authenticateToken, userController.enableRenterServices);
router.get('/profile/statistics', authenticateToken, userController.getProfileStatistics);

// Rental request routes
router.post('/rental-request', authenticateToken, rentalRequestController.submitRentalRequest);
router.get('/rental-request', authenticateToken, rentalRequestController.getCurrentRentalRequest);
router.get('/can-rent', authenticateToken, rentalRequestController.canUserRent);

// My books reading tracker routes
router.get('/my-books', authenticateToken, userController.getMyBooksByStatus);
router.get('/my-books/rented', authenticateToken, userController.getMyRentedBooks);
router.put('/my-books/:bookId', authenticateToken, userController.upsertMyBookStatus);
router.delete('/my-books/:bookId', authenticateToken, userController.removeMyBook);
router.put('/ratings/:bookId', authenticateToken, userController.upsertBookRating);

// favourite toggle (current user)
router.put('/favorites/:bookId', authenticateToken, userController.toggleFavoriteBook);

// Admin routes
router.get('/:id', authenticateToken, userController.getUserById);
router.put('/:id', authenticateToken, userController.updateProfile); // must be authenticated to populate req.user
router.delete('/:id', authenticateToken, userController.deleteUser);
router.get('/', authenticateToken, userController.getAllUsers);

export default router;
