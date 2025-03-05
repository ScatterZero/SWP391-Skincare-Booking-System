"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getTherapists } from "../../api/apiService";
import Layout from "../../layout/Layout";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Service {
  _id: string;
  service_id: number;
  name: string;
  description: string;
  image?: string;
  duration?: number;
  price?: number | { $numberDecimal: string };
  category: {
    _id: string;
    name: string;
    description: string;
  };
  createDate?: string;
  __v?: number;
}

interface Therapist {
  id: string;
  name: string;
  image?: string;
}

interface Booking {
  service: Service;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
  selectedDate: string;
  selectedSlot: string;
  selectedTherapist: Therapist | null;
  timestamp: number;
  status: "pending" | "confirmed" | "completed";
}

const EnhancedBookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(
    null
  );
  const [showCart, setShowCart] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [cart, setCart] = useState<Booking[]>([]);
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchService = async () => {
      try {
        const productsResponse = await fetch(
          "http://localhost:5000/api/products/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const productsData = await productsResponse.json();
        const foundService = productsData.find((s: Service) => s._id === id);
        setService(foundService || null);
      } catch (error) {
        console.error("Error fetching service data:", error);
        toast.error("Không thể tải dịch vụ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchService();

    const storedCart: Booking[] = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );
    setCart(storedCart);
  }, [id]);

  useEffect(() => {
    const fetchTherapists = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        toast.error("Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.", {
          toastId: "authError",
        });
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/users/skincare-staff",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Lỗi ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        setTherapists(
          data.map((staff: any) => ({
            id: staff._id,
            name: staff.username,
            image: staff.avatar || "/default-avatar.png",
          }))
        );
      } catch (error: any) {
        console.error("❌ Lỗi khi tải danh sách chuyên viên:", error.message);
        toast.error(`Không thể tải danh sách chuyên viên: ${error.message}`, {
          toastId: "fetchTherapistsError", // Ngăn hiển thị nhiều lần
        });
      }
    };

    fetchTherapists();
  }, []);


  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const today = getTodayDate();
    const isToday = selectedDate === today;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slot = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        if (isToday) {
          const slotHour = parseInt(slot.split(":")[0]);
          const slotMinute = parseInt(slot.split(":")[1]);
          if (
            slotHour > currentHour ||
            (slotHour === currentHour && slotMinute > currentMinute)
          ) {
            slots.push(slot);
          }
        } else {
          slots.push(slot);
        }
      }
    }
    return slots;
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!customerName.trim()) {
      errors.push("Tên khách hàng không được để trống.");
    }
    if (!customerPhone.trim() || !/^\d{10}$/.test(customerPhone)) {
      errors.push("Số điện thoại phải là 10 chữ số hợp lệ.");
    }
    if (
      !customerEmail.trim() ||
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(customerEmail)
    ) {
      errors.push("Email phải có định dạng hợp lệ.");
    }
    if (!selectedDate) {
      errors.push("Vui lòng chọn ngày đặt lịch.");
    }
    if (!selectedSlot) {
      errors.push("Vui lòng chọn khung giờ.");
    }

    if (errors.length > 0) {
      toast.error(errors[0]);
      return false;
    }

    return true;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm() || !service) return;

    const bookingData: Booking = {
      service,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      selectedDate,
      selectedSlot: selectedSlot as string,
      selectedTherapist,
      timestamp: Date.now(),
      status: "pending",
    };

    const updatedCart = [...cart, bookingData];
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCart(updatedCart);
    setShowCart(true);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setNotes("");
    setSelectedDate("");
    setSelectedSlot(null);
    setSelectedTherapist(null);
    toast.success("Đã thêm dịch vụ vào giỏ hàng.");
  };

  const toggleCart = () => setShowCart(!showCart);

  const handleRemoveFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCart(updatedCart);
    toast.success("Đã xóa dịch vụ khỏi giỏ hàng.");
  };

  const handleCheckout = async () => {
    setShowCart(false);
    setShowCheckoutModal(true);

    const totalAmount = calculateTotal();
    const orderName = service?.name || "Unknown Service";
    let description = `Dịch vụ ${orderName.substring(0, 25)}`;
    if (description.length > 25) description = description.substring(0, 25);

    const returnUrl = "http://localhost:5000/success.html";
    const cancelUrl = "http://localhost:5000/cancel.html";

    try {
      const response = await fetch(
        "http://localhost:5000/api/payments/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: totalAmount,
            orderName,
            description,
            returnUrl,
            cancelUrl,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || data.error !== 0 || !data.data) {
        throw new Error(`API Error: ${data.message || "Unknown error"}`);
      }

      setPaymentUrl(data.data.checkoutUrl);
      setQrCode(data.data.qrCode);
    } catch (error: any) {
      console.error("❌ Error during checkout:", error);
      toast.error("Khởi tạo thanh toán thất bại. Vui lòng thử lại.");
      setShowCheckoutModal(false);
    }
  };

  const handlePayment = () => {
    const updatedCart = cart.map(
      (item) => ({ ...item, status: "completed" } as Booking)
    );
    const bookingHistory: Booking[] = JSON.parse(
      localStorage.getItem("bookingHistory") || "[]"
    );
    localStorage.setItem(
      "bookingHistory",
      JSON.stringify([...bookingHistory, ...updatedCart])
    );
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCart(updatedCart);
    setShowCheckoutModal(false);
    setShowCart(true);
    toast.success("Thanh toán thành công!");
  };

  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
  };

  const formatPrice = (
    price: number | { $numberDecimal: string } | undefined
  ): string => {
    let priceValue = 0;
    if (typeof price === "object" && price?.$numberDecimal) {
      priceValue = Number.parseFloat(price.$numberDecimal);
    } else if (typeof price === "number") {
      priceValue = price;
    }
    return `${priceValue.toLocaleString("vi-VN")} VNĐ`;
  };

  const calculateTotal = (): number => {
    return cart
      .filter((item) => item.status === "confirmed")
      .reduce((sum, item) => {
        const priceValue =
          typeof item.service.price === "number"
            ? item.service.price
            : Number.parseFloat(
                (item.service.price as { $numberDecimal: string })
                  ?.$numberDecimal || "0"
              );
        return sum + (priceValue || 0);
      }, 0);
  };

  const formatTotal = (): string => {
    const totalValue = calculateTotal();
    return `${totalValue.toLocaleString("vi-VN")} VNĐ`;
  };

  const isAllServicesConfirmed = () =>
    cart.every(
      (item) => item.status === "confirmed" || item.status === "completed"
    );
  const isAllServicesCompleted = () =>
    cart.every((item) => item.status === "completed");

  const simulateStaffConfirmation = (bookingIndex: number) => {
    const updatedCart = [...cart];
    updatedCart[bookingIndex].status = "confirmed";
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    toast.success("Xác nhận nhân viên thành công.");
  };

  const clearCart = () => {
    localStorage.removeItem("cart");
    setCart([]);
    setShowCart(false);
    toast.success("Đã xóa toàn bộ giỏ hàng.");
  };

  const toggleExpand = (index: number) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(index)) {
      newExpandedItems.delete(index);
    } else {
      newExpandedItems.add(index);
    }
    setExpandedItems(newExpandedItems);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container mx-auto py-16 relative"
      >
        <h2 className="text-4xl font-bold text-center mb-10 text-gray-800">
          Book Your Service
        </h2>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleCart}
          className="fixed top-28 right-4 p-3 bg-yellow-400 rounded-full shadow-lg hover:bg-yellow-500 transition-colors duration-300"
        >
          🛒
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {showCart && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="fixed top-36 right-4 bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Your Cart
                </h3>
                {cart.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearCart}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Clear Cart
                  </motion.button>
                )}
              </div>
              {cart.length > 0 ? (
                cart.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 border-b pb-2"
                  >
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleExpand(index)}
                    >
                      <p className="font-semibold text-gray-800">
                        {item.service.name}
                      </p>
                      <span>{expandedItems.has(index) ? "−" : "+"}</span>
                    </div>
                    <AnimatePresence>
                      {expandedItems.has(index) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-2 text-gray-600"
                        >
                          <p>
                            Date: {item.selectedDate} - {item.selectedSlot}
                          </p>
                          <p>Email: {item.customerEmail}</p>
                          {item.notes && <p>Notes: {item.notes}</p>}
                          {item.selectedTherapist && (
                            <p>Therapist: {item.selectedTherapist.name}</p>
                          )}
                          <p
                            className={`${
                              item.status === "completed"
                                ? "text-green-500"
                                : item.status === "confirmed"
                                ? "text-blue-500"
                                : "text-yellow-500"
                            }`}
                          >
                            Status: {item.status}
                          </p>
                          {item.status === "pending" && (
                            <button
                              onClick={() => simulateStaffConfirmation(index)}
                              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded-md text-sm"
                            >
                              Simulate Staff Confirmation
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveFromCart(index)}
                            className="mt-2 ml-2 px-2 py-1 bg-red-500 text-white rounded-md text-sm"
                          >
                            Hủy
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-600">Your cart is empty.</p>
              )}
              {cart.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheckout}
                  disabled={
                    !isAllServicesConfirmed() || isAllServicesCompleted()
                  }
                  className={`w-full p-3 rounded-lg transition-colors duration-300 mt-4 ${
                    isAllServicesConfirmed() && !isAllServicesCompleted()
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Proceed to Checkout
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleCart}
                className="w-full p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-300 mt-2"
              >
                Close
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCheckoutModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 mt-16"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full"
              >
                <h3 className="text-2xl font-semibold mb-6 text-gray-800">
                  Confirm Payment
                </h3>
                <ul className="space-y-4">
                  {cart
                    .filter((item) => item.status === "confirmed")
                    .map((item, index) => (
                      <li
                        key={index}
                        className="flex justify-between py-2 border-b"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {item.service.name}
                          </p>
                          <p className="text-gray-600">
                            {item.selectedDate} - {item.selectedSlot}
                          </p>
                          {item.selectedTherapist && (
                            <p className="text-gray-600">
                              Therapist: {item.selectedTherapist.name}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-gray-800">
                          {formatPrice(item.service.price)}
                        </span>
                      </li>
                    ))}
                </ul>
                <div className="text-right text-xl font-bold mt-6 text-gray-800">
                  Total: {formatTotal()}
                </div>
                <div className="mt-6">
                  <p className="text-lg font-semibold mb-2">
                    Scan QR Code to Pay:
                  </p>
                  {/* <QRCode value={paymentUrl} size={200} className="mx-auto" /> */}
                </div>
                <p className="mt-4 text-blue-600 text-center">
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Click here to pay if QR code doesn't work
                  </a>
                </p>
                <div className="flex justify-end mt-8 space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCheckoutModal(false)}
                    className="p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePayment}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                  >
                    Confirm Payment
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap -mx-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full lg:w-1/3 px-4 mb-8 lg:mb-0"
          >
            {loading ? (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-lg text-gray-600">
                  Loading service details...
                </p>
              </div>
            ) : service ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src={service.image || "/default-service.jpg"}
                  alt={service.name}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-service.jpg";
                  }}
                />
                <div className="p-6">
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {service.description}
                  </p>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xl font-semibold text-yellow-500">
                        Price: {formatPrice(service.price)}
                      </p>
                      <p className="text-lg text-gray-600">
                        Duration: {service.duration || "N/A"} minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-red-100 rounded-lg">
                <p className="text-lg text-red-600">
                  Service not found. Please try again.
                </p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full lg:w-2/3 px-4"
          >
            <h3 className="text-3xl font-bold mb-6 text-gray-800">
              Booking Form
            </h3>
            <form
              className="space-y-6 bg-white p-6 rounded-lg shadow-md"
              onSubmit={handleSubmit}
            >
              <div>
                <label className="block text-lg text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-lg text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-lg text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-lg text-gray-700 mb-2">
                  Choose Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getTodayDate()}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-lg text-gray-700 mb-2">
                  Choose Time Slot <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {generateTimeSlots().map((slot) => (
                    <motion.button
                      key={slot}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 border rounded-lg transition-colors duration-300 ${
                        selectedSlot === slot
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {slot}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-lg text-gray-700 mb-2">
                  Choose Therapist (Optional)
                </label>
                <select
                  value={selectedTherapist ? selectedTherapist.id : ""}
                  onChange={(e) => {
                    const therapist = therapists.find(
                      (t) => t.id === e.target.value
                    );
                    setSelectedTherapist(therapist || null);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                  disabled={therapists.length === 0}
                >
                  <option value="">
                    {therapists.length > 0
                      ? "Select a therapist"
                      : "No available therapists"}
                  </option>
                  {therapists.map((therapist) => (
                    <option key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-lg text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any additional notes"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                  rows={3}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 text-lg font-semibold"
              >
                Book Now
              </motion.button>
            </form>
            <p className="mt-6 text-gray-600 italic">
              Note: If you don't select a therapist, one will be assigned to you
              upon check-in at our facility.
            </p>
          </motion.div>
        </div>
      </motion.div>
      <ToastContainer
        autoClose={3000}
        position="top-right"
        hideProgressBar={false}
        limit={1}
        pauseOnFocusLoss={false}
        closeOnClick
      />  
    </Layout>
  );
};

export default EnhancedBookingPage;
