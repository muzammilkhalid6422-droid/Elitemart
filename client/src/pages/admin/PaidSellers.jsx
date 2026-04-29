import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Crown, Search, XCircle } from "lucide-react";
import {
  approvePaymentRequest,
  getPaymentRequests,
  rejectPaymentRequest,
} from "../../services/adminService";
import "../admin/AdminPages.css";

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const PaidSellers = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState("");
  const [preview, setPreview] = useState(null);

  const loadRequests = async () => {
    try {
      const data = await getPaymentRequests();
      setRequests(data.paymentRequests || []);
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load payment records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;

    return requests.filter((request) =>
      [
        request.sellerName,
        request.sellerEmail,
        request.selectedPlan,
        request.paymentMethod,
        request.transactionId,
        request.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [requests, search]);

  const handleApprove = async (requestId) => {
    setActionId(requestId);
    try {
      await approvePaymentRequest(requestId);
      await loadRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to approve payment");
    } finally {
      setActionId("");
    }
  };

  const handleReject = async (requestId) => {
    setActionId(requestId);
    try {
      await rejectPaymentRequest(requestId);
      await loadRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to reject payment");
    } finally {
      setActionId("");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Paid Sellers</h1>
          <p className="admin-subtitle">Review seller subscription payment records</p>
        </div>
        <div className="admin-header-stats">
          <div className="stat-card">
            <Crown size={20} />
            <div>
              <span className="stat-label">Payment Records</span>
              <span className="stat-value">{requests.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by seller, plan, method, transaction..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="admin-table-card">
        {message && (
          <div className="admin-alert alert-warning">
            <AlertCircle size={16} />
            {message}
          </div>
        )}

        {loading && <p className="admin-loading">Loading payment records...</p>}
        {!loading && filteredRequests.length === 0 && (
          <p className="admin-empty">No payment records found.</p>
        )}

        {!loading && filteredRequests.length > 0 && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Plan</th>
                  <th>Payment</th>
                  <th>Transaction ID</th>
                  <th>Screenshot</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>{request.sellerName || "Seller"}</strong>
                      <br />
                      <small>{request.sellerEmail}</small>
                    </td>
                    <td>{request.selectedPlan}</td>
                    <td>
                      {request.paymentMethod}
                      <br />
                      <small>{request.paymentNumber}</small>
                    </td>
                    <td>{request.transactionId}</td>
                    <td>
                      {request.screenshot ? (
                        <button
                          type="button"
                          className="screenshot-preview-btn"
                          onClick={() => setPreview(request)}
                        >
                          Preview / Download
                        </button>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${request.status}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>{formatDate(request.createdAt)}</td>
                    <td>
                      <div className="admin-action-row">
                        <button
                          type="button"
                          className="approve-btn"
                          disabled={request.status !== "pending" || actionId === request.id}
                          onClick={() => handleApprove(request.id)}
                        >
                          <CheckCircle2 size={15} />
                          Approve
                        </button>
                        <button
                          type="button"
                          className="reject-btn"
                          disabled={request.status !== "pending" || actionId === request.id}
                          onClick={() => handleReject(request.id)}
                        >
                          <XCircle size={15} />
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

      {preview && (
        <div className="admin-preview-backdrop" onClick={() => setPreview(null)}>
          <div className="admin-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-preview-header">
              <div>
                <strong>{preview.sellerName || "Seller"} Payment Screenshot</strong>
                <span>{preview.transactionId}</span>
              </div>
              <button type="button" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>

            <img src={preview.screenshot} alt="Payment transaction screenshot" />

            <a href={preview.screenshot} download={`payment-${preview.transactionId || preview.id}.png`}>
              Download Screenshot
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaidSellers;
