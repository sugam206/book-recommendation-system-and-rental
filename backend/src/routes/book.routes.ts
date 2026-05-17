import { BookController } from "../controller/book.controller";
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import upload from "../config/multer";

const router = express.Router();
const bookController = new BookController();

// Apply authentication to all book routes
router.use(authenticateToken); // This protects ALL routes below

router.post('/', upload.single('image'), bookController.createBook);
router.get('/', bookController.getAllBooks);
router.get('/mine', bookController.getMyBooks);
router.get('/:id', bookController.getBookById);
router.put('/:id', upload.single('image'), bookController.updateBook);
router.delete('/:id', bookController.deleteBook);
router.post('/insert-many', bookController.insertManyBooks);

export default router;
