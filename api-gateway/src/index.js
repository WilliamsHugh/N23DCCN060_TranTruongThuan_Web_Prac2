const express = require("express");
const proxy = require("express-http-proxy");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*"
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.get("/health", (req, res) => res.json({ status: "ok", gateway: true }));

// Route: /api/products/* → Product Service
app.use("/api/products", proxy(process.env.PRODUCT_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/products${req.url}`
}));

// Route: /api/orders/* → Order Service
app.use("/api/orders", proxy(process.env.ORDER_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/orders${req.url}`
}));

// Route: /api/auth/* → Auth Service  ← thêm vào
app.use("/api/auth", proxy(process.env.AUTH_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/auth${req.url}`
}));

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route không tồn tại" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));