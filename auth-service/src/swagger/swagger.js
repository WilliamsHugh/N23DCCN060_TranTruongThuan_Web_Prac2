const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Auth Service API",
            version: "1.0.0",
            description: "API xác thực JWT — Lab 2",
        },
        servers: [{ url: "http://localhost:3003", description: "Development" }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                }
            }
        }
    },
    apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);