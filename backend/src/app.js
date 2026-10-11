import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import formRoutes from "./modules/form/form.routes.js";
import publicFormRoutes from "./modules/response/response.routes.js";

const app = express();

app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/forms", formRoutes);
app.use("/api/v1/public/forms", publicFormRoutes);

export default app;
