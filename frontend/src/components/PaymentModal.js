import React, { useState } from "react";
import axios from "axios";
import "./PaymentModal.css";

const PaymentModal = ({ isOpen, onClose, order, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await axios.post(`/api/orders/${order.id}/pay`, {
        paymentMethod,
      });

      setSuccess(response.data.message);

      // If payment is successful, call the callback
      if (response.data.payment.status === "Paid") {
        setTimeout(() => {
          onPaymentSuccess(response.data);
          onClose();
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCardPayment = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Simulate payment confirmation (in real app, this would come from payment gateway)
      const transactionId = `TXN_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const response = await axios.put(`/api/orders/${order.id}/pay`, {
        transactionId,
      });

      setSuccess(response.data.message);

      setTimeout(() => {
        onPaymentSuccess(response.data);
        onClose();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || "Payment confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-header">
          <h3>Payment</h3>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <div className="payment-content">
          <div className="order-summary">
            <h4>Order Summary</h4>
            <div className="order-details">
              <p>
                <strong>Order ID:</strong> #{order.id.slice(-6)}
              </p>
              <p>
                <strong>Total Amount:</strong> ৳{order.totalAmount}
              </p>
              <p>
                <strong>Services:</strong> {order.services.join(", ")}
              </p>
            </div>
          </div>

          <div className="payment-methods">
            <h4>Select Payment Method</h4>
            <div className="method-options">
              <label className="method-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="method-info">
                  <span className="method-name">Cash on Delivery</span>
                  <span className="method-description">
                    Pay when your order is delivered
                  </span>
                </div>
              </label>

              <label className="method-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Card"
                  checked={paymentMethod === "Card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="method-info">
                  <span className="method-name">Credit/Debit Card</span>
                  <span className="method-description">
                    Secure online payment
                  </span>
                </div>
              </label>

              <label className="method-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Wallet"
                  checked={paymentMethod === "Wallet"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="method-info">
                  <span className="method-name">Digital Wallet</span>
                  <span className="method-description">
                    Pay using mobile wallet
                  </span>
                </div>
              </label>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="payment-actions">
            {paymentMethod === "COD" ? (
              <button
                onClick={handlePayment}
                disabled={loading}
                className="pay-btn cod-btn"
              >
                {loading ? "Processing..." : "Confirm COD"}
              </button>
            ) : (
              <div className="card-payment-flow">
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="pay-btn card-btn"
                >
                  {loading ? "Processing..." : "Pay Now"}
                </button>
                {paymentMethod !== "COD" && (
                  <button
                    onClick={handleConfirmCardPayment}
                    disabled={loading}
                    className="confirm-btn"
                  >
                    Confirm Payment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
