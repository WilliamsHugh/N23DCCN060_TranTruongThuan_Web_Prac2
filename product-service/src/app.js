const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger/swagger");
const productRoutes = require("./routes/productRoutes");
const errorHandler = require("./middleware/errorHandler");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Product Service API Docs",
}));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

// Routes
app.get("/health", (req, res) => res.json({
    status: "ok",
    service: process.env.SERVICE_NAME,
    uptime: process.uptime()
}));
app.use("/api/products", productRoutes);

// Error Handler — phải đặt cuối cùng
app.use(errorHandler);

module.exports = app;