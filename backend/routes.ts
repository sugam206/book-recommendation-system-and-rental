import { Router } from "express";
import userRoutes from "./routes/user.routes.ts";
import bookRoutes from "./routes/book.routes.ts";
import rentRoutes from "./routes/rent.routes.ts";
import authRoutes from "./routes/auth.routes.ts";
import adminRoutes from "./routes/admin.routes.ts";
import recommendationRoutes from "./routes/recommendation.routes.ts";

class AppRoutes {
    static routes() {
        const router = Router();
        router.use("/users", userRoutes);
        router.use("/books", bookRoutes);
        router.use("/rents", rentRoutes);
        router.use("/auth", authRoutes);
        router.use("/admin", adminRoutes);
        router.use("/recommendations", recommendationRoutes);
        return router;
    }
}
export default AppRoutes;
