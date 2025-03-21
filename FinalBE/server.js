require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/auth");
const voucherRoutes = require("./routes/voucherRoutes");
const userRoutes = require("./routes/userRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const payOS = require("./utils/payos");
const cartRoutes = require("./routes/cartRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const questionRoutes = require("./routes/questionRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const blogRoutes = require("./routes/blogRoutes");

const app = express();

// ✅ Cấu hình CORS (Đặt đúng vị trí)
const allowedOrigins = [
  "http://localhost:3000",
  "https://swp-391-skincare-booking-system.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", express.static("public"));

// ✅ Định tuyến API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/payments/webhook", webhookRoutes);
app.use("/api/payments", paymentRoutes);

// ✅ Payment API (Sửa `YOUR_DOMAIN`)
// app.post("/create-payment-link", async (req, res) => {
//   const YOUR_DOMAIN = process.env.CLIENT_URL || "http://localhost:3000"; // 🔥 Sửa lỗi hardcode

//   const body = {
//     orderCode: Number(String(Date.now()).slice(-6)),
//     amount: 1000,
//     description: "Thanh toan don hang",
//     returnUrl: `${YOUR_DOMAIN}/success.html`,
//     cancelUrl: `${YOUR_DOMAIN}/cancel.html`,
//   };

//   try {
//     const paymentLinkResponse = await payOS.createPaymentLink(body);
//     res.redirect(paymentLinkResponse.checkoutUrl);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Something went wrong");
//   }
// });

// ✅ Connect DB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

app.get("/", (req, res) => {
  res.send("Server is running!");
});
