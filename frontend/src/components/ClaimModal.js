import React, { useState } from "react";
import axios from "axios";
import "./ClaimModal.css";

const ClaimModal = ({ isOpen, onClose, orderId, onSubmitted }) => {
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Please provide a description of the issue");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await axios.post("/api/claims", { orderId, description, photoUrl });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit claim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claim-overlay" onClick={onClose}>
      <div className="claim-modal" onClick={(e) => e.stopPropagation()}>
        <div className="claim-header">
          <h3>Report Damage</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="claim-content">
          <textarea
            placeholder="Describe the issue (required)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <input
            type="url"
            placeholder="Photo URL (optional)"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
          {error && <div className="error-message">{error}</div>}
          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Claim"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimModal;

