// src/middleware/validate.js — Dùng express-validator
const { body, validationResult } = require("express-validator");
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};
const productValidation = [
  body("name")
    .notEmpty()
    .withMessage("Tên sản phẩm không được rỗng")
    .isLength({ min: 2, max: 200 })
    .withMessage("Tên từ 2-200 ký tự"),
  body("price").isFloat({ min: 0 }).withMessage("Giá phải là số dương"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Số lượng phải là số nguyên ≥ 0"),
  handleValidation,
];
module.exports = { productValidation };

// ───────────────────────────────────────
// src/middleware/errorHandler.js
// ───────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err);
  // Prisma unique constraint violation
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: `${err.meta?.target} đã tồn
tại`,
    });
  }
  // Prisma record not found
  if (err.code === "P2025") {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy bản ghi" });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi hệ thống",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
module.exports = errorHandler;
