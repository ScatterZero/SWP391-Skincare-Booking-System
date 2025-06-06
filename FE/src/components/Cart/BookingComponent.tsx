import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { Booking } from "../../types/booking";
import { JSX } from "react/jsx-runtime";

type AuthUser = {
  username?: string;
  email?: string;
};

interface BookingComponentProps {
  handleCheckout?: () => Promise<void>;
  isBookingPage?: boolean;
  isCheckedOut?: boolean; // Thêm prop isCheckedOut
}

const ITEMS_PER_PAGE = 5;

const BookingComponent: React.FC<BookingComponentProps> = ({
  handleCheckout,
  isCheckedOut = false, // Giá trị mặc định là false nếu không được truyền
}) => {
  const { booking, fetchBooking, loadingBooking, bookingError, user, token, setBooking } = useAuth();
  const [showBooking, setShowBooking] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const API_BASE_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000/api"
      : "https://luluspa-production.up.railway.app/api";

  useEffect(() => {
    let isMounted = true;
    const loadBooking = async () => {
      try {
        await fetchBooking();
      } catch (error) {
        if (isMounted) console.error("Failed to load booking:", error);
      }
    };
    if ((user as AuthUser)?.username) loadBooking();
    return () => {
      isMounted = false;
    };
  }, [fetchBooking, user]);

  const userBooking = booking.filter(
    (item) => item.username === (user as AuthUser)?.username
  );

  const filteredBooking = selectedStatus
    ? userBooking.filter((item) => item.status === selectedStatus)
    : userBooking;

  const totalPages = Math.ceil(filteredBooking.length / ITEMS_PER_PAGE);
  const paginatedBooking = filteredBooking.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatPriceDisplay = (
    originalPrice: number,
    discountedPrice?: number | null
  ): JSX.Element => {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            textDecoration: discountedPrice != null ? "line-through" : "none",
            color: discountedPrice != null ? "#6b7280" : "#1f2937",
            fontWeight: 500,
          }}
        >
          {originalPrice.toLocaleString("en-US")} VND
        </span>
        {discountedPrice != null && (
          <span style={{ color: "#16a34a", fontWeight: 600 }}>
            {discountedPrice.toLocaleString("en-US")} VND
          </span>
        )}
      </div>
    );
  };

  const calculateTotal = (): number => {
    return userBooking
      .filter((item) => item.status === "completed")
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  const formatTotal = (): string => {
    const totalValue = calculateTotal();
    return `${totalValue.toLocaleString("en-US")} VND`;
  };

  const getStatusLabel = (status: string | undefined): string => {
    switch (status) {
      case "pending": return "Pending";
      case "checked-in": return "Checked In";
      case "completed": return "Completed";
      case "checked-out": return "Checked Out";
      case "cancel": return "Cancelled";
      case "reviewed": return "Reviewed";
      default: return "Unknown";
    }
  };

  const statusStyles = {
    pending: { icon: "⏳", color: "#854d0e", backgroundColor: "#fef9c3" },
    "checked-in": { icon: "✏️", color: "#1e40af", backgroundColor: "#dbeafe" },
    completed: { icon: "✔", color: "#065f46", backgroundColor: "#d1fae5" },
    "checked-out": { icon: "🚪", color: "#5b21b6", backgroundColor: "#ede9fe" },
    reviewed: { icon: "📝", color: "#c2410c", backgroundColor: "#ffedd5" },
  } as const;

  const statusCounts = userBooking.reduce(
    (acc, item) => {
      const status = item.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusTabs = [
    { status: "all", label: "All" },
    { status: "pending", label: "Pending" },
    { status: "checked-in", label: "Checked In" },
    { status: "completed", label: "Completed" },
    { status: "checked-out", label: "Checked Out" },
    { status: "reviewed", label: "Reviewed" },
  ];

  const toggleBooking = () => setShowBooking((prev) => !prev);

  const handleCancelBooking = async (bookingID: string | undefined) => {
    if (!bookingID) {
      toast.error("Cannot cancel booking: Invalid booking ID.");
      return;
    }
    try {
      if (!token) throw new Error("You need to log in to cancel the booking.");
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete booking");
      }
      setBooking((prevBooking: Booking[]) =>
        prevBooking.filter((item) => item.BookingID !== bookingID)
      );
      toast.success("Booking cancelled successfully!");
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel booking."
      );
    }
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status === "all" ? null : status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Updated styles
  const bookingContainerStyle: React.CSSProperties = {
    position: "fixed",
    top: "9rem",
    right: "4rem",
    backgroundColor: "white",
    padding: "0.5rem",
    borderRadius: "0.75rem",
    boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "27rem",
    height: "80vh",
    display: "flex",
    flexDirection: "column",
    zIndex: 50,
  };

  const bookingContentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    paddingBottom: "1rem",
  };

  const paginationStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "1rem",
  };

  const pageButtonStyle: React.CSSProperties = {
    padding: "0.25rem 0.75rem",
    borderRadius: "0.375rem",
    border: "1px solid #e5e7eb",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "background 0.3s ease",
  };

  const activePageButtonStyle: React.CSSProperties = {
    backgroundColor: "#2563eb",
    color: "white",
    borderColor: "#2563eb",
  };

  const bookingFooterStyle: React.CSSProperties = {
    position: "sticky",
    bottom: 0,
    backgroundColor: "white",
    paddingTop: "1rem",
    borderTop: "1px solid #e5e7eb",
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleBooking}
        style={{
          position: "fixed",
          top: "9rem",
          right: "1rem",
          padding: "0.75rem",
          backgroundColor: "#facc15",
          borderRadius: "50%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          border: "none",
          cursor: "pointer",
          transition: "background 0.3s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#eab308")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#facc15")
        }
        aria-label="Toggle booking"
      >
        📅
        {userBooking.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-0.25rem",
              right: "-0.25rem",
              backgroundColor: "#ef4444",
              color: "white",
              fontSize: "0.75rem",
              borderRadius: "50%",
              width: "1.25rem",
              height: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {userBooking.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showBooking && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            style={bookingContainerStyle}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#1f2937",
                  marginLeft: "0.5rem",
                }}
              >
                Your Bookings
              </h3>
              <button
                onClick={toggleBooking}
                style={{
                  color: "#6b7280",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.25rem",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#374151")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
                aria-label="Close booking"
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                padding: "0.5rem 0",
                borderBottom: "1px solid #e5e7eb",
                marginBottom: "1rem",
              }}
            >
              {statusTabs.map((tab) => {
                const count =
                  tab.status === "all"
                    ? userBooking.length
                    : statusCounts[tab.status] || 0;
                const style =
                  tab.status === "all"
                    ? {
                        icon: "📋",
                        color: "#374151",
                        backgroundColor: "#f3f4f6",
                      }
                    : statusStyles[tab.status as keyof typeof statusStyles] || {
                        icon: "❓",
                        color: "#6b7280",
                        backgroundColor: "#f3f4f6",
                      };

                return (
                  <motion.div
                    key={tab.status}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleStatusFilter(tab.status)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.25rem",
                      cursor: "pointer",
                      opacity:
                        selectedStatus === tab.status ||
                        (tab.status === "all" && !selectedStatus)
                          ? 1
                          : 0.6,
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          fontSize: "1.5rem",
                          color: count > 0 ? style.color : "#d1d5db",
                        }}
                      >
                        {style.icon}
                      </span>
                      {count > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: "-0.5rem",
                            right: "-0.5rem",
                            backgroundColor: "#ef4444",
                            color: "white",
                            fontSize: "0.625rem",
                            borderRadius: "50%",
                            width: "1rem",
                            height: "1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        textAlign: "center",
                      }}
                    >
                      {tab.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div style={bookingContentStyle}>
              {loadingBooking ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "1.5rem 0",
                  }}
                >
                  <svg
                    style={{
                      animation: "spin 1s linear infinite",
                      height: "1.5rem",
                      width: "1.5rem",
                      color: "#2563eb",
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      style={{ opacity: 0.25 }}
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      style={{ opacity: 0.75 }}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
                    ></path>
                  </svg>
                  <span style={{ marginLeft: "0.5rem", color: "#6b7280" }}>
                    Loading bookings...
                  </span>
                </div>
              ) : bookingError ? (
                <p style={{ color: "#dc2626", textAlign: "center" }}>
                  {bookingError}
                </p>
              ) : paginatedBooking.length > 0 ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {paginatedBooking.map((item) => (
                      <motion.div
                        key={item.BookingID || `booking-item-${Math.random()}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          padding: "1rem",
                          backgroundColor: "#f9fafb",
                          borderRadius: "0.5rem",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                          transition: "box-shadow 0.3s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.boxShadow =
                            "0 4px 8px rgba(0, 0, 0, 0.1)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.boxShadow =
                            "0 2px 4px rgba(0, 0, 0, 0.05)")
                        }
                      >
                        <h4
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: 600,
                            color: "#1f2937",
                          }}
                        >
                          {item.serviceName}
                        </h4>
                        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                          <span style={{ fontWeight: 500 }}>Booking Date:</span>{" "}
                          {item.bookingDate} | {item.startTime} - {item.endTime}
                        </p>
                        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                          <span style={{ fontWeight: 500 }}>Customer:</span>{" "}
                          {item.customerName}
                        </p>
                        {item.Skincare_staff && (
                          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                            <span style={{ fontWeight: 500 }}>Therapist:</span>{" "}
                            {item.Skincare_staff}
                          </p>
                        )}
                        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                          <span style={{ fontWeight: 500 }}>Duration:</span>{" "}
                          {item.duration} minutes
                        </p>
                        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                          <span style={{ fontWeight: 500 }}>Total:</span>{" "}
                          {formatPriceDisplay(
                            item.originalPrice || item.totalPrice || 0,
                            item.discountedPrice
                          )}
                        </p>
                        <p style={{ marginTop: "0.25rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              ...(statusStyles[
                                item.status as keyof typeof statusStyles
                              ] || {
                                backgroundColor: "#f3f4f6",
                                color: "#4b5563",
                              }),
                            }}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                        </p>
                        {item.status === "pending" && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCancelBooking(item.BookingID)}
                            style={{
                              marginTop: "0.5rem",
                              padding: "0.25rem 0.75rem",
                              backgroundColor: "#ef4444",
                              color: "white",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              border: "none",
                              cursor: "pointer",
                              transition: "background 0.3s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#dc2626")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#ef4444")
                            }
                          >
                            Cancel
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div style={paginationStyle}>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                          ...pageButtonStyle,
                          opacity: currentPage === 1 ? 0.5 : 1,
                          cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            style={{
                              ...pageButtonStyle,
                              ...(currentPage === page
                                ? activePageButtonStyle
                                : {}),
                            }}
                          >
                            {page}
                          </button>
                        )
                      )}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                          ...pageButtonStyle,
                          opacity: currentPage === totalPages ? 0.5 : 1,
                          cursor:
                            currentPage === totalPages
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p
                  style={{
                    color: "#6b7280",
                    textAlign: "center",
                    paddingTop: "1rem",
                  }}
                >
                  {selectedStatus
                    ? `No bookings with ${getStatusLabel(
                        selectedStatus
                      )} status`
                    : "You have no bookings"}
                </p>
              )}
            </div>

            <div style={bookingFooterStyle}>
              <p
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#1f2937",
                  marginBottom: "1rem",
                }}
              >
                Total: {formatTotal()}
              </p>
              <motion.button
                whileHover={{ scale: isCheckedOut ? 1 : 0.95 }}
                whileTap={{ scale: isCheckedOut ? 1 : 0.55 }}
                onClick={
                  handleCheckout || (() => (window.location.href = "/booking"))
                }
                disabled={
                  isCheckedOut ||
                  !userBooking.some((item) => item.status === "completed")
                }
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: isCheckedOut
                    ? "#9ca3af" // Màu xám nếu checked-out
                    : userBooking.some((item) => item.status === "completed")
                    ? "#2563eb"
                    : "#d1d5db",
                  color: isCheckedOut
                    ? "#f3f4f6" // Màu chữ nhạt nếu checked-out
                    : userBooking.some((item) => item.status === "completed")
                    ? "white"
                    : "#6b7280",
                  borderRadius: "0.5rem",
                  transition: "background 0.3s ease",
                  marginBottom: "0.5rem",
                  border: "none",
                  cursor:
                    isCheckedOut ||
                    !userBooking.some((item) => item.status === "checked-out")
                      ? "not-allowed"
                      : "pointer",
                }}
                onMouseEnter={(e) =>
                  !isCheckedOut &&
                  userBooking.some((item) => item.status === "completed") &&
                  (e.currentTarget.style.backgroundColor = "#1d4ed8")
                }
                onMouseLeave={(e) =>
                  !isCheckedOut &&
                  userBooking.some((item) => item.status === "completed") &&
                  (e.currentTarget.style.backgroundColor = "#2563eb")
                }
              >
                {isCheckedOut ? "Checked Out" : "Checkout"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 0.95 }}
                whileTap={{ scale: 0.55 }}
                onClick={toggleBooking}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "#e5e7eb",
                  color: "#1f2937",
                  borderRadius: "0.5rem",
                  transition: "background 0.3s ease",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#d1d5db")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e5e7eb")
                }
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BookingComponent;