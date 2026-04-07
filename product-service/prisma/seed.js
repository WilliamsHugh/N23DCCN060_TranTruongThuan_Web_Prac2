// prisma/seed.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    const mobile = await prisma.category.upsert({
        where: { slug: "mobile" },
        update: {},
        create: { name: "Điện thoại", slug: "mobile", description: "Điện thoại smartphone" }
    });

    await prisma.product.createMany({
        data: [
            { name: "iPhone 15 Pro", slug: "iphone-15-pro", price: 27990000, stock: 50, categoryId: mobile.id },
            { name: "Samsung Galaxy S24", slug: "samsung-s24", price: 22990000, stock: 30, categoryId: mobile.id },
        ],
        skipDuplicates: true
    });

    console.log("Seed thành công!");
}

main().catch(console.error).finally(() => prisma.$disconnect());