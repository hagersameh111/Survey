import express from "express";
const app = express();

app.use((req, res, next) => {
  console.log("Middleware is running...");
  next();
});

app.get("/", (req, res) => {
    res.send("Hello Express");
});

export default app;