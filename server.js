import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.js";
dotenv.config();

const app = express();

// 🔐 Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());
app.use("/api/payment", paymentRoutes);

// 🌍 Root Route (Test)
app.get("/", (req, res) => {
  res.send("Secure Payment Backend Running 🚀");
});

// 🗄️ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
  });

// 🚀 Server Port
const PORT = process.env.PORT || 5000;

// ▶️ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
