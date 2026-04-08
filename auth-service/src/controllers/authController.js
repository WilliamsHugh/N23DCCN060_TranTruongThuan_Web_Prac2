const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
    );
    return { accessToken, refreshToken };
};

// POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: "Email đã tồn tại" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name },
            select: { id: true, email: true, name: true, role: true, createdAt: true }
        });

        res.status(201).json({ success: true, data: user, message: "Đăng ký thành công" });
    } catch (error) { next(error); }
};

// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        // Lưu refreshToken vào DB
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken }
        });

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                user: { id: user.id, email: user.email, name: user.name, role: user.role }
            }
        });
    } catch (error) { next(error); }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "Thiếu refresh token" });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: "Refresh token không hợp lệ" });
        }

        const tokens = generateTokens(user);

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });

        res.json({ success: true, data: tokens });
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
    }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, name: true, role: true, createdAt: true }
        });
        res.json({ success: true, data: user });
    } catch (error) { next(error); }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { refreshToken: null }
        });
        res.json({ success: true, message: "Đăng xuất thành công" });
    } catch (error) { next(error); }
};

module.exports = { register, login, refresh, getMe, logout };