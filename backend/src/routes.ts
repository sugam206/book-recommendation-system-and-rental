import { Router } from "express";
import userRoutes from "./routes/user.routes";
import bookRoutes from "./routes/book.routes";
import rentRoutes from "./routes/rent.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import recommendationRoutes from "./routes/recommendation.routes";
import notificationRoutes from "./routes/notification.routes";

class AppRoutes {
    static routes() {
        const router = Router();
        router.use("/users", userRoutes);
        router.use("/books", bookRoutes);
        router.use("/rents", rentRoutes);
        router.use("/auth", authRoutes);
        router.use("/admin", adminRoutes);
        router.use("/recommendations", recommendationRoutes);
        router.use("/notifications", notificationRoutes);
        return router;
    }
}
export default AppRoutes;
