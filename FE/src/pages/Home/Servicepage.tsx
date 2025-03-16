import type React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../../layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { JSX } from "react/jsx-runtime";

interface Service {
  _id: string;
  service_id: number;
  name: string;
  description: string;
  image?: string;
  duration?: number;
  price?: number | { $numberDecimal: string };
  discountedPrice?: number | null | undefined;
  category: {
    _id: string;
    name: string;
    description: string;
  };
  createDate?: string;
  isRecommended?: boolean;
}

// Animation variants từ HomePage
const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  hover: {
    scale: 1.03,
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
    transition: { duration: 0.3 },
  },
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.3, ease: "easeInOut" } },
  tap: { scale: 0.95, transition: { duration: 0.2, ease: "easeInOut" } },
};

const ServicePage: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recommendedType, setRecommendedType] = useState<string | null>(null);
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const recommended = queryParams.get("recommended");

    if (recommended) {
      setRecommendedType(recommended);
    } else {
      const savedAssessment = localStorage.getItem("skinAssessmentResult");
      if (savedAssessment) {
        try {
          const { recommendedService } = JSON.parse(savedAssessment);
          setRecommendedType(recommendedService.type.toLowerCase());
        } catch (error) {
          console.error("Error parsing saved assessment:", error);
        }
      }
    }
  }, [location.search]);

  useEffect(() => {
    fetchServices();
  }, [recommendedType]);

  const fetchServices = async () => {
    setLoading(true);
    const API_BASE_URL =
      window.location.hostname === "localhost"
        ? "http://localhost:5000/api"
        : "https://luluspa-production.up.railway.app/api";

    try {
      const response = await axios.get(`${API_BASE_URL}/products/`);
      setServices(formatServices(response.data));
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatServices = (data: any[]) => {
    return data.map((service) => ({
      ...service,
      price:
        typeof service.price === "object" && service.price?.$numberDecimal
          ? Number.parseFloat(service.price.$numberDecimal)
          : typeof service.price === "string"
          ? Number.parseFloat(service.price.replace(/\./g, ""))
          : service.price || 0,
      discountedPrice: service.discountedPrice ?? null,
      isRecommended: recommendedType
        ? service.category?.name.toLowerCase().includes(recommendedType)
        : false,
    }));
  };

  const formatPriceDisplay = (
    price: number,
    discountedPrice?: number | null | undefined,
  ): JSX.Element => {
    let discountPercentage = 0;
    if (discountedPrice != null && price > 0) {
      discountPercentage = Math.round(((price - discountedPrice) / price) * 100);
    }

    return (
      <div className="flex items-center gap-2">
        <span
          className={`text-base font-semibold ${
            discountedPrice != null ? "text-gray-500 line-through" : "text-yellow-600"
          }`}
        >
          {price.toLocaleString("vi-VN")} VNĐ
        </span>
        {discountPercentage > 0 && (
          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {discountPercentage}% OFF
          </span>
        )}
        {discountedPrice != null && (
          <span className="text-base font-semibold text-green-600">
            {discountedPrice.toLocaleString("vi-VN")} VNĐ
          </span>
        )}
      </div>
    );
  };

  const handleServiceClick = (serviceId: string) => {
    if (isAuthenticated) {
      navigate(`/booking/${serviceId}`);
    } else {
      navigate("/login", {
        state: { from: `/booking/${serviceId}` },
      });
    }
  };

  return (
    <Layout>
      <motion.section
        className="py-24 bg-gray-50"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
        }}
      >
        <div className="container mx-auto px-8">
          {recommendedType && (
            <motion.div
              className="mb-12 p-6 bg-purple-50 border border-purple-200 rounded-lg"
              variants={cardVariants}
            >
              <h3 className="text-xl font-semibold text-purple-800">
                Personalized Recommendation
              </h3>
              <p className="text-gray-700">
                Based on your skin assessment, we've highlighted services for your skin type.
              </p>
            </motion.div>
          )}

          <div className="text-center mb-16">
            <motion.h2
              className="text-5xl font-extrabold text-gray-900 mb-4"
              variants={cardVariants}
            >
              Skincare Combo Packages
            </motion.h2>
            <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Discover our premium skincare treatments designed to rejuvenate and transform your skin
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {services.map((service) => (
                <motion.div
                  key={service._id}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                    service.isRecommended ? "border-2 border-purple-500" : ""
                  }`}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  onClick={() => handleServiceClick(service._id)}
                  onMouseEnter={() => setHoveredService(service._id)}
                  onMouseLeave={() => setHoveredService(null)}
                >
                  <div className="relative">
                    {service.isRecommended && (
                      <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                        Recommended
                      </div>
                    )}
                    {service.discountedPrice != null && (
                      <div className="absolute top-4 right-4 z-10 flex items-center justify-center">
                        <div className="bg-red-500 text-white font-bold rounded-full h-16 w-16 flex items-center justify-center transform rotate-12 shadow-lg">
                          <span className="text-lg">
                            {Math.round(
                              ((service.price as number - service.discountedPrice!) /
                                (service.price as number)) *
                                100,
                            )}
                            %
                          </span>
                          <span className="text-xs block -mt-1">OFF</span>
                        </div>
                      </div>
                    )}
                    <img
                      src={service.image || "/default-image.jpg"}
                      alt={service.name}
                      className="w-full h-80 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/default-image.jpg";
                      }}
                    />
                    {service.discountedPrice != null && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-500/80 to-transparent text-white py-2 px-4">
                        <span className="font-semibold">Special Offer</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem]">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 mb-4 flex-grow line-clamp-2 text-sm">
                      {service.description}
                    </p>
                    <div className="mt-auto space-y-4">
                      <div>{formatPriceDisplay(service.price as number, service.discountedPrice)}</div>
                      <div className="flex justify-between items-center">
                        <div className="text-gray-500 text-xs flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {service.duration ? `${service.duration} min` : "TBD"}
                        </div>
                        <motion.button
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition duration-300 ${
                            service.discountedPrice != null
                              ? "bg-red-500 text-white hover:bg-red-600"
                              : "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
                          }`}
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          Book Now
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {hoveredService === service._id && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-white bg-opacity-95 flex flex-col justify-center p-6 rounded-lg shadow-md"
                      >
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                        <p className="text-md text-gray-700 mb-4">{service.description}</p>
                        <p className="text-md mb-4">
                          Duration: {service.duration || "N/A"} minutes
                        </p>
                        <p className="text-lg font-bold text-gray-900 mb-4">
                          {formatPriceDisplay(service.price as number, service.discountedPrice)}
                        </p>
                        <motion.button
                          onClick={() => handleServiceClick(service._id)}
                          className={`px-6 py-3 rounded-lg font-semibold text-sm transition duration-300 ${
                            service.discountedPrice != null
                              ? "bg-red-500 text-white hover:bg-red-600"
                              : "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
                          }`}
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          Book Now
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </Layout>
  );
};

export default ServicePage;