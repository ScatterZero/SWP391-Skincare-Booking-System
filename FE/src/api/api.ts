import axios from "axios";

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://luluspa-production.up.railway.app/api";
// Tạo axios instance
const axiosInstance = axios.create({
  baseURL: API_URL, // <-- bạn có thể chuyển thành process.env.BASE_URL nếu muốn
  withCredentials: true,
  
});

// Hàm GET chung
const get = (url: string, token: string) => {
  return axiosInstance.get(url, {
    headers: { "x-auth-token": token },
  });
};

// USERS
export const getUsers = (token: string) => get("/users", token);

// CARTS
export const getBookings = (token: string) => get("/bookings", token);

// PRODUCTS
export const getServices = (token: string) => get("/services", token);

// PAYMENTS
export const getPayments = (token: string) => get("/payments/all", token);

// RATINGS
export const getRatings = (token: string) => get("/ratings", token);

// CATEGORIES
export const getCategories = (token: string) => get("/categories", token);

// VOUCHERS
export const getVouchers = (token: string) => get("/vouchers", token);

// REVIEWS
export const getReviews = (token: string) => get("/reviews", token);

// BLOGS
export const getBlogs = (token: string) => get("/blogs", token);

// QUESTIONS
export const getQuizzs = (token: string) => get("/quizzs", token);

export default {
  getUsers,
  getBookings,
  getServices,
  getPayments,
  getRatings,
  getCategories,
  getVouchers,
  getReviews,
  getBlogs,
  getQuizzs,
};
