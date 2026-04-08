const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger/swagger");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Auth Service API Docs",
}));

app.get("/health", (req, res) => res.json({
    status: "ok",
    service: process.env.SERVICE_NAME,
    uptime: process.uptime()
}));

app.use("/api/auth", authRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Lỗi hệ thống",
    });
});

module.exports = app;