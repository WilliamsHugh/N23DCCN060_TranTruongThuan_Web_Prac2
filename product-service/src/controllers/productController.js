// src/controllers/productController.js
const prisma = require("../config/prisma");
const { cloudinary } = require("../config/cloudinary");
const redis = require("../config/redis");

const CACHE_TTL = 300; // 5 phút
const CACHE_PREFIX = "products";

// Helper: xoá toàn bộ cache liên quan products
const clearProductCache = async () => {
  const keys = await redis.keys(`${CACHE_PREFIX}:*`);
  if (keys.length > 0) await redis.del(...keys);
};

// ──────────────────────────────────
// GET /api/products — Lấy danh sách có phân trang, lọc, sắp xếp
// ──────────────────────────────────
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category,
      sortBy = "createdAt",
      order = "desc",
      minPrice,
      maxPrice,
      inStock,
    } = req.query;

    // Tạo cache key từ query params
    const cacheKey = `${CACHE_PREFIX}:list:${JSON.stringify(req.query)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      isActive: true,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(category && { category: { slug: category } }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      }),
      ...(inStock === "true" && { stock: { gt: 0 } }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { [sortBy]: order },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    // Lưu vào cache 5 phút
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// GET /api/products/:id
// ──────────────────────────────────
const getProductById = async (req, res, next) => {
  try {
    const cacheKey = `${CACHE_PREFIX}:${req.params.id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true },
    });

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });

    const result = { success: true, data: product };
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// POST /api/products
// ──────────────────────────────────
const createProduct = async (req, res, next) => {
  try {
    const { name, price, description, stock, imageUrl, categoryId } = req.body;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const product = await prisma.product.create({
      data: { name, slug, price, description, stock, imageUrl, categoryId },
      include: { category: true },
    });

    await clearProductCache();

    res.status(201).json({
      success: true,
      data: product,
      message: "Tạo sản phẩm thành công",
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// PUT /api/products/:id
// ──────────────────────────────────
const updateProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: { category: true },
    });

    await clearProductCache();

    res.json({ success: true, data: product, message: "Cập nhật thành công" });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// DELETE /api/products/:id (Soft delete)
// ──────────────────────────────────
const deleteProduct = async (req, res, next) => {
  try {
    await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });

    await clearProductCache();

    res.json({ success: true, message: "Đã ẩn sản phẩm thành công" });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────
// POST /api/products/:id/image — Upload ảnh lên Cloudinary
// ──────────────────────────────────
const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Chưa chọn file ảnh" });
    }

    const imageUrl = req.file.path; // Cloudinary trả về URL đầy đủ

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { imageUrl },
      include: { category: true },
    });

    await clearProductCache();

    res.json({
      success: true,
      data: product,
      message: "Upload ảnh thành công",
    });
  } catch (error) {
    // Nếu lỗi DB, xoá ảnh đã upload trên Cloudinary
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
};