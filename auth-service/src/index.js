const app = require("./app");

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Auth Service running on http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});