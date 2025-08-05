import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    pickupDate: "",
    pickupTime: "",
    address: "",
    services: [],
    items: [],
  });

  const availableServices = [
    { id: "washing", label: "Washing", price: "৳50" },
    { id: "ironing", label: "Ironing", price: "৳30" },
    { id: "dryCleaning", label: "Dry Cleaning", price: "৳80" },
    { id: "expressDelivery", label: "Express Delivery", price: "৳100" },
  ];

  const availableItems = [
    { type: "Shirt", basePrice: 30 },
    { type: "Pants", basePrice: 40 },
    { type: "Dress", basePrice: 60 },
    { type: "Suit", basePrice: 100 },
    { type: "Jacket", basePrice: 80 },
    { type: "Sweater", basePrice: 50 },
    { type: "T-Shirt", basePrice: 25 },
    { type: "Jeans", basePrice: 45 },
    { type: "Skirt", basePrice: 35 },
    { type: "Blouse", basePrice: 35 },
    { type: "Coat", basePrice: 90 },
    { type: "Towel", basePrice: 20 },
    { type: "Bed Sheet", basePrice: 80 },
    { type: "Curtain", basePrice: 120 },
    { type: "Table Cloth", basePrice: 60 },
  ];

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/orders");
      setOrders(response.data.orders);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load orders" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((id) => id !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { type: "", quantity: 1 }],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.pickupDate || !formData.pickupTime || !formData.address) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    if (formData.services.length === 0) {
      setMessage({ type: "error", text: "Please select at least one service" });
      return;
    }

    if (formData.items.length === 0) {
      setMessage({ type: "error", text: "Please add at least one item" });
      return;
    }

    // Validate items
    for (const item of formData.items) {
      if (!item.type) {
        setMessage({
          type: "error",
          text: "Please select item type for all items",
        });
        return;
      }
      if (!item.quantity || item.quantity < 1) {
        setMessage({
          type: "error",
          text: "Please enter valid quantity for all items",
        });
        return;
      }
    }

    try {
      setSubmitLoading(true);
      setMessage({ type: "", text: "" });

      const orderData = {
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        address: formData.address,
        services: formData.services.map((serviceId) => {
          const service = availableServices.find((s) => s.id === serviceId);
          return service.label;
        }),
        items: formData.items,
      };

      await axios.post("/api/orders", orderData);

      setMessage({ type: "success", text: "Order created successfully!" });
      setFormData({
        pickupDate: "",
        pickupTime: "",
        address: "",
        services: [],
        items: [],
      });
      fetchOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create order",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>IRONI</h1>
          <div className="user-info">
            <span>Welcome, {user?.name}!</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="dashboard-grid">
          <div className="order-form-section">
            <h2>Schedule Pickup & Services</h2>
            <form onSubmit={handleSubmit} className="order-form">
              <div className="form-group">
                <label htmlFor="pickupDate">Pickup Date *</label>
                <input
                  type="date"
                  id="pickupDate"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleInputChange}
                  min={today}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pickupTime">Pickup Time *</label>
                <input
                  type="time"
                  id="pickupTime"
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Pickup Address *</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your complete pickup address..."
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Select Services *</label>
                <div className="services-grid">
                  {availableServices.map((service) => (
                    <div key={service.id} className="service-item">
                      <label className="service-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service.id)}
                          onChange={() => handleServiceChange(service.id)}
                        />
                        <span className="checkmark"></span>
                        <div className="service-info">
                          <span className="service-name">{service.label}</span>
                          <span className="service-price">{service.price}</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Add Items *</label>
                <div className="items-section">
                  {formData.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <select
                        value={item.type}
                        onChange={(e) =>
                          updateItem(index, "type", e.target.value)
                        }
                        className="item-select"
                      >
                        <option value="">Select Item Type</option>
                        {availableItems.map((availableItem) => (
                          <option
                            key={availableItem.type}
                            value={availableItem.type}
                          >
                            {availableItem.type} (৳{availableItem.basePrice})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="item-quantity"
                        placeholder="Qty"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="remove-item-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItem}
                    className="add-item-btn"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={submitLoading}
              >
                {submitLoading ? "Creating Order..." : "Schedule Pickup"}
              </button>
            </form>
          </div>

          <div className="orders-section">
            <h2>Recent Orders</h2>
            {loading ? (
              <div className="loading">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="no-orders">
                <p>No orders yet. Schedule your first pickup above!</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <span className="order-status">{order.status}</span>
                      <span className="order-date">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="order-details">
                      <p>
                        <strong>Pickup:</strong> {order.pickupDate} at{" "}
                        {order.pickupTime}
                      </p>
                      <p>
                        <strong>Address:</strong> {order.address}
                      </p>
                      <p>
                        <strong>Services:</strong> {order.services.join(", ")}
                      </p>
                      {order.items && order.items.length > 0 && (
                        <div className="order-items">
                          <p>
                            <strong>Items:</strong>
                          </p>
                          <ul>
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                {item.quantity}x {item.type} (৳{item.price}{" "}
                                each)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {order.totalAmount && (
                        <p className="order-total">
                          <strong>Total Amount:</strong> ৳{order.totalAmount}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
