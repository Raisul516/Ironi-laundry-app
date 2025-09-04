import React, { useState } from "react";
import axios from "axios";
import "./RatingModal.css";

const RatingModal = ({ isOpen, onClose, orderId, onSubmitted }) => {
  const [stars, setStars] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      await axios.post("/api/ratings", { orderId, stars, feedback });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rating-overlay" onClick={onClose}>
      <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rating-header">
          <h3>Rate Your Order</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="rating-content">
          <div className="stars">
            {[1,2,3,4,5].map((n) => (
              <button key={n} className={`star ${n <= stars ? 'active' : ''}`} onClick={() => setStars(n)}>
                {n <= stars ? "★" : "☆"}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Write your feedback (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
          {error && <div className="error-message">{error}</div>}
          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;

