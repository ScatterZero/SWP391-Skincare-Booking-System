export interface Booking {
  CartID: { type: String},
  Status: { type: String, default: "Active" },
  BookingID: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  notes: { type: String },
  service_id: { type: Number, required: true },
  serviceName: { type: String, required: true },
  serviceType: { type: String, required: true },
  bookingDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  currency: { type: String, default: "VND" },
  discountCode: { type: String },
  Skincare_staff: { type: String, required: false },
  timestamp: number;
  status: "pending" | "confirmed" | "completed";
}