import { useState, useEffect } from "react";
import { Eye, Check, X, Search } from "lucide-react";
import api from "../../services/api";
import "./SellersList.css";

const SellersList = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cnicView, setCnicView] = useState(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const response = await api.get("/admin/sellers/history");
      setSellers(response.data.sellers || []);
    } catch (error) {
      console.error("Error:", error);
      setMessage(error.response?.data?.message || "Unable to fetch sellers");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (id) => {
    try {
      await api.put(`/admin/sellers/${id}/approve`);
      setMessage("Seller approved successfully!");
      setSellers((current) =>
        current.map((seller) =>
          seller._id === id ? { ...seller, isApproved: true } : seller
        )
      );
      setSelectedSeller((current) =>
        current?._id === id ? { ...current, isApproved: true } : current
      );
    } catch (error) {
      console.error("Error:", error);
      setMessage(error.response?.data?.message || "Unable to approve seller");
    }
  };

  const handleRejectSeller = async (id) => {
    if (window.confirm("Are you sure you want to reject this seller?")) {
      try {
        await api.delete(`/admin/sellers/${id}/reject`);
        setMessage("Seller rejected successfully!");
        setSellers(sellers.filter((s) => s._id !== id));
        setSelectedSeller(null);
      } catch (error) {
        console.error("Error:", error);
        setMessage(error.response?.data?.message || "Unable to reject seller");
      }
    }
  };

  const filteredSellers = sellers.filter((seller) =>
    seller.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="admin-loading">Loading sellers...</div>;
  }

  return (
    <div className="sellers-page">
      {/* HEADER */}
      <div className="page-header">
        <h1>Seller Management</h1>
        <p>All previous approved sellers and new pending seller applications</p>
      </div>

      {/* SEARCH */}
      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="sellers-container">
        {/* LEFT PANEL - SELLERS LIST */}
        <div className="sellers-list-panel">
          <h2>Seller History ({filteredSellers.length})</h2>
          {filteredSellers.length === 0 ? (
            <p className="no-data">No sellers found</p>
          ) : (
            <div className="sellers-grid">
              {filteredSellers.map((seller) => (
                <div
                  key={seller._id}
                  className={`seller-card ${selectedSeller?._id === seller._id ? "active" : ""}`}
                  onClick={() => setSelectedSeller(seller)}
                >
                  {seller.avatar && (
                    <img src={seller.avatar} alt={seller.name} className="seller-avatar" />
                  )}
                  <div className="seller-card-info">
                    <h4>{seller.name}</h4>
                    <p>{seller.email}</p>
                    <span className={`seller-status ${seller.isApproved ? "approved" : "pending"}`}>
                      {seller.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL - SELLER DETAILS */}
        {selectedSeller && (
          <div className="seller-details-panel">
            <h2>Seller Details</h2>

            <div className="seller-details">
              {selectedSeller.avatar && (
                <img src={selectedSeller.avatar} alt={selectedSeller.name} className="detail-avatar" />
              )}
              <div className="detail-info">
                <div className="detail-row">
                  <label>Name:</label>
                  <span>{selectedSeller.name}</span>
                </div>
                <div className="detail-row">
                  <label>Email:</label>
                  <span>{selectedSeller.email}</span>
                </div>
                <div className="detail-row">
                  <label>Phone:</label>
                  <span>{selectedSeller.phone}</span>
                </div>
                <div className="detail-row">
                  <label>Company:</label>
                  <span>{selectedSeller.companyName}</span>
                </div>
                <div className="detail-row">
                  <label>Country:</label>
                  <span>{selectedSeller.country || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <label>Region:</label>
                  <span>{selectedSeller.region || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span>{selectedSeller.isApproved ? "Approved" : "Pending Approval"}</span>
                </div>
              </div>
            </div>

            {/* CNIC SECTION */}
            <div className="cnic-section">
              <h3>CNIC Verification</h3>
              <div className="cnic-images">
                <div className="cnic-card">
                  <label>CNIC Front</label>
                  {selectedSeller.cnicFront ? (
                    <>
                      <img
                        src={selectedSeller.cnicFront}
                        alt="CNIC Front"
                        className={`cnic-image ${cnicView === "front" ? "fullscreen" : ""}`}
                        onClick={() => setCnicView(cnicView === "front" ? null : "front")}
                      />
                      <button
                        className="view-btn"
                        onClick={() => setCnicView(cnicView === "front" ? null : "front")}
                      >
                        <Eye size={16} />
                        {cnicView === "front" ? "Close" : "View"}
                      </button>
                    </>
                  ) : (
                    <p>No image provided</p>
                  )}
                </div>

                <div className="cnic-card">
                  <label>CNIC Back</label>
                  {selectedSeller.cnicBack ? (
                    <>
                      <img
                        src={selectedSeller.cnicBack}
                        alt="CNIC Back"
                        className={`cnic-image ${cnicView === "back" ? "fullscreen" : ""}`}
                        onClick={() => setCnicView(cnicView === "back" ? null : "back")}
                      />
                      <button
                        className="view-btn"
                        onClick={() => setCnicView(cnicView === "back" ? null : "back")}
                      >
                        <Eye size={16} />
                        {cnicView === "back" ? "Close" : "View"}
                      </button>
                    </>
                  ) : (
                    <p>No image provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            {!selectedSeller.isApproved && (
              <div className="action-buttons">
                <button
                  className="approve-btn"
                  onClick={() => handleApproveSeller(selectedSeller._id)}
                >
                  <Check size={18} />
                  Approve Seller
                </button>
                <button
                  className="reject-btn"
                  onClick={() => handleRejectSeller(selectedSeller._id)}
                >
                  <X size={18} />
                  Reject Seller
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellersList;
