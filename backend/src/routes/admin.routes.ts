import express from "express";
import { RentalRequestController } from "../controller/rentalRequest.controller";
import { authenticateToken } from "../middleware/authMiddleware";
import { BookModel } from "../modules/books/book.model";
import { UserModel } from "../modules/user/user.model";
import { RentModel } from "../modules/rent/rent.model";
const router = express.Router();
const rentalRequestController = new RentalRequestController();

const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
};

// GET /api/admin/stats
router.get("/stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalBooks, totalUsers, activeRentals, overdueRentals, completedRents, newUsersThisMonth] = await Promise.all([
            BookModel.countDocuments({}),
            UserModel.countDocuments({}),
            RentModel.countDocuments({ status: "active" }),
            RentModel.countDocuments({ status: "active", rentEndDate: { $lt: now } }),
            RentModel.find({ status: "completed", rentEndDate: { $gte: monthStart } }).select("amount"),
            UserModel.countDocuments({ createdAt: { $gte: monthStart } }),
        ]);

        const monthlyRevenue = completedRents.reduce((sum, r: any) => sum + (Number(r.amount) || 0), 0);

        res.json({
            totalBooks,
            totalUsers,
            activeRentals,
            overdueRentals,
            monthlyRevenue,
            newUsersThisMonth
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch stats" });
    }
});

// GET /api/admin/activities
router.get("/activities", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [recentBooks, recentUsers, recentRents] = await Promise.all([
            BookModel.find({}).sort({ lastUpdatedDate: -1 }).limit(3).select("title lastUpdatedDate"),
            UserModel.find({}).sort({ createdAt: -1 }).limit(3).select("username createdAt"),
            RentModel.find({}).sort({ rentStartDate: -1 }).limit(3).populate("bookId", "title").populate("userId", "username"),
        ]);

        const activities = [
            ...recentBooks.map((b: any) => ({
                type: "book",
                description: `Book updated: ${b.title}`,
                time: b.lastUpdatedDate || new Date()
            })),
            ...recentUsers.map((u: any) => ({
                type: "user",
                description: `New user joined: ${u.username}`,
                time: u.createdAt || new Date()
            })),
            ...recentRents.map((r: any) => ({
                type: "rental",
                description: `Rent ${r.status}: ${r.userId?.username || "User"} - ${r.bookId?.title || "Book"}`,
                time: r.rentStartDate || new Date()
            })),
        ]
            .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 10)
            .map((a: any) => ({
                ...a,
                time: new Date(a.time).toLocaleString()
            }));

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch activities" });
    }
});

// Rental Request Approval Routes (Admin Only)
router.get("/rental-requests", authenticateToken, requireAdmin, rentalRequestController.getAllRentalRequests);
router.get("/rental-requests/:requestId", authenticateToken, requireAdmin, rentalRequestController.getRentalRequestDetails);
router.put("/rental-requests/:requestId/approve", authenticateToken, requireAdmin, rentalRequestController.approveRentalRequest);
router.put("/rental-requests/:requestId/reject", authenticateToken, requireAdmin, rentalRequestController.rejectRentalRequest);

export default router;
