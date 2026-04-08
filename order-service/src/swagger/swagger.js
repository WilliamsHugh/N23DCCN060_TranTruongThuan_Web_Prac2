const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Order Service API",
            version: "1.0.0",
            description: "API quản lý đơn hàng — Lab 2",
        },
        servers: [
            { url: "http://localhost:3002", description: "Development" },
        ],
    },
    apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);