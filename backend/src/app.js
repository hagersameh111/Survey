import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import formRoutes from "./modules/form/form.routes.js";
import responseRoutes, {
  publicSubmissionRoutes,
} from "./modules/response/response.routes.js";
import publicFormRoutes from "./modules/form/public-form.routes.js";
import shortUrlRoutes, { publicShortUrlRoutes } from "./modules/short-url/short-url.routes.js";

const app = express();

app.use(express.json({ limit: "8mb" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/public/forms", publicFormRoutes);
app.use("/api/v1/public/forms", publicSubmissionRoutes);
app.use("/api/v1/forms", formRoutes);
app.use("/api/v1/forms", responseRoutes);
app.use("/api/v1/short-urls", shortUrlRoutes);
app.use("/s", publicShortUrlRoutes);

export default app;
