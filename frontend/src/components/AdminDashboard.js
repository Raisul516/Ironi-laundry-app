import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const statusOptions = [
  "Pending",
  "Confirmed",
  "Washing",
  "Delivered",
  "Cancelled",
];

const badgeClass = (status) => {
  const normalized = (status || "").toLowerCase();
  const s = normalized === "approved" ? "accepted" : normalized;
  if (s === "pending") return "status-badge status-pending";
  if (s === "confirmed") return "status-badge status-confirmed";
  if (s === "washing") return "status-badge status-washing";
  if (s === "delivered") return "status-badge status-delivered";
  if (s === "cancelled") return "status-badge status-cancelled";
  if (s === "accepted") return "status-badge status-confirmed";
  if (s === "rejected") return "status-badge status-cancelled";
  return "status-badge";
};

const TabButton = ({ active, onClick, children }) => (
  <button className={`admin-tab ${active ? "active" : ""}`} onClick={onClick}>
    {children}
  </button>
);

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchOrders = async () => {
    const res = await axios.get("/api/admin/orders");
    setOrders(res.data.orders || []);
  };
  const fetchUsers = async () => {
    const res = await axios.get("/api/admin/users");
    setUsers(res.data.users || []);
  };
  const fetchRatings = async () => {
    const res = await axios.get("/api/admin/ratings");
    setRatings(res.data.ratings || []);
  };
  const fetchClaims = async () => {
    const res = await axios.get("/api/admin/claims");
    setClaims(res.data.claims || []);
  };
  const fetchStats = async () => {
    const res = await axios.get("/api/admin/stats");
    setStats(res.data);
  };

  const loadTabData = async (key) => {
    setLoading(true);
    setMessage("");
    try {
      if (key === "overview") {
        await fetchStats();
      } else if (key === "orders") {
        await fetchOrders();
      } else if (key === "users") {
        await fetchUsers();
      } else if (key === "ratings") {
        await fetchRatings();
      } else if (key === "claims") {
        await fetchClaims();
      }
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/admin/orders/${orderId}/status`, {
        status: newStatus,
      });
      setMessage("Status updated");
      await fetchOrders();
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteRating = async (ratingId) => {
    try {
      await axios.delete(`/api/admin/ratings/${ratingId}`);
      setMessage("Rating deleted");
      await fetchRatings();
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to delete rating");
    }
  };

  const handleUpdateClaim = async (claimId, status, adminResponse) => {
    try {
      await axios.put(`/api/admin/claims/${claimId}`, {
        status,
        adminResponse,
      });
      setMessage("Claim updated");
      await fetchClaims();
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to update claim");
    }
  };

  const displayClaimStatus = (s) => (s === "Approved" ? "Accepted" : s);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <div className="admin-tabs" style={{ gap: 12, alignItems: "center" }}>
          <TabButton
            active={tab === "overview"}
            onClick={() => setTab("overview")}
          >
            Overview
          </TabButton>
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
            Orders
          </TabButton>
          <TabButton active={tab === "users"} onClick={() => setTab("users")}>
            Users
          </TabButton>
          <TabButton
            active={tab === "ratings"}
            onClick={() => setTab("ratings")}
          >
            Ratings
          </TabButton>
          <TabButton active={tab === "claims"} onClick={() => setTab("claims")}>
            Claims
          </TabButton>
          <button className="admin-tab" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`admin-alert ${
            message.includes("Fail") ? "error" : "success"
          }`}
        >
          {message}
        </div>
      )}

      <div className="admin-card">
        {loading ? (
          <div>Loading...</div>
        ) : tab === "overview" ? (
          <div className="admin-table-wrap">
            <div className="admin-kpis">
              <div className="admin-card" style={{ padding: 12 }}>
                <strong>Total Users</strong>
                <div style={{ fontSize: 24 }}>{stats?.totalUsers ?? 0}</div>
              </div>
              <div className="admin-card" style={{ padding: 12 }}>
                <strong>Active Orders</strong>
                <div style={{ fontSize: 24 }}>{stats?.activeOrders ?? 0}</div>
              </div>
              <div className="admin-card" style={{ padding: 12 }}>
                <strong>Average Rating</strong>
                <div style={{ fontSize: 24 }}>
                  {stats?.averageRating ?? 0} / 5
                </div>
              </div>
              <div className="admin-card" style={{ padding: 12 }}>
                <strong>Pending Claims</strong>
                <div style={{ fontSize: 24 }}>{stats?.pendingClaims ?? 0}</div>
              </div>
            </div>
          </div>
        ) : tab === "orders" ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>User</th>
                  <th>Created</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="order-id">#{String(o.id).slice(-6)}</td>
                    <td>{o.user ? `${o.user.name} (${o.user.email})` : "-"}</td>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                    <td>৳{o.totalAmount}</td>
                    <td>
                      <span className={badgeClass(o.status)}>{o.status}</span>
                    </td>
                    <td>
                      <select
                        className="admin-select"
                        value={o.status}
                        onChange={(e) =>
                          handleStatusChange(o.id, e.target.value)
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === "users" ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id || u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.role !== "admin" && (
                        <button
                          className="admin-btn danger"
                          onClick={async () => {
                            if (!window.confirm(`Delete user ${u.email}?`))
                              return;
                            try {
                              await axios.delete(
                                `/api/admin/users/${u._id || u.id}`
                              );
                              setMessage("User deleted");
                              fetchUsers();
                            } catch (e) {
                              setMessage(
                                e.response?.data?.message ||
                                  "Failed to delete user"
                              );
                            }
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === "ratings" ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Order</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((r) => (
                  <tr key={r.id}>
                    <td>{r.user ? `${r.user.name} (${r.user.email})` : "-"}</td>
                    <td>#{String(r.orderId).slice(-6)}</td>
                    <td>{"★★★★★".slice(0, r.stars)}</td>
                    <td>{r.feedback || "-"}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        className="admin-btn danger"
                        onClick={() => handleDeleteRating(r.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Order</th>
                  <th>Description</th>
                  <th>Photo</th>
                  <th>Status</th>
                  <th>Response</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.id}>
                    <td>{c.user ? `${c.user.name} (${c.user.email})` : "-"}</td>
                    <td>#{String(c.orderId).slice(-6)}</td>
                    <td style={{ maxWidth: 280, whiteSpace: "normal" }}>
                      {c.description}
                    </td>
                    <td>
                      {c.photoUrl ? (
                        <a href={c.photoUrl} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <span className={badgeClass(c.status)}>
                        {displayClaimStatus(c.status)}
                      </span>
                    </td>
                    <td style={{ maxWidth: 240, whiteSpace: "normal" }}>
                      {c.adminResponse || "-"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="admin-btn primary"
                          onClick={() =>
                            handleUpdateClaim(
                              c.id,
                              "Approved",
                              c.adminResponse || "Accepted"
                            )
                          }
                        >
                          Accept
                        </button>
                        <button
                          className="admin-btn danger"
                          onClick={() => {
                            const reason = prompt(
                              "Rejection reason:",
                              c.adminResponse || ""
                            );
                            if (reason !== null)
                              handleUpdateClaim(c.id, "Rejected", reason);
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
