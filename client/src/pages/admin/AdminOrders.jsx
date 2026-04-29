import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { getAdminOrders, updateSubOrderStatus } from "../../services/orderService";
import "./AdminPages.css";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");
const formatCurrency = (value) => `PKR ${Number(value || 0).toLocaleString()}`;
const ADMIN_STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Completed",
  "Cancelled",
];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getAdminOrders();
        setOrders(data || []);
      } catch (error) {
        setMessage(error.response?.data?.message || "Unable to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return orders;

    return orders.filter((order) => {
      const products = (order.items || []).map((item) => item.productName).join(" ");
      return [
        order.orderNumber,
        order.customer?.name,
        order.customer?.email,
        order.phone,
        order.status,
        products,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [orders, searchTerm]);

  const handleStatusChange = async (orderId, subOrderId, status) => {
    setUpdatingId(subOrderId);
    setMessage("");

    try {
      const updatedOrder = await updateSubOrderStatus(orderId, subOrderId, status, {
        admin: true,
      });
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? updatedOrder : order))
      );
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update order status");
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) return <div className="admin-loading">Loading orders...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Orders Management</h1>
        <p>View all order records from every user and seller</p>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search order, customer, product or status..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {message && <div className="admin-message error">{message}</div>}

      <div className="table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Seller Sub Orders</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  <ShoppingCart size={28} />
                  <div>No orders found</div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>
                    <div>{order.customer?.name || "-"}</div>
                    <small>{order.customer?.email || "-"}</small>
                    <small>{order.phone || "-"}</small>
                  </td>
                  <td>
                    <div className="suborder-list">
                      {(order.subOrders || []).map((subOrder) => (
                        <div key={subOrder.id} className="suborder-admin-card">
                          <strong>{subOrder.sellerName}</strong>
                          <small>{subOrder.id}</small>
                          <div>
                            {(subOrder.items || [])
                              .map((item) => `${item.productName} x ${item.quantity}`)
                              .join(", ")}
                          </div>
                          <div className="tracking-mini">
                            {(subOrder.trackingSteps || []).map((step) => (
                              <span key={`${subOrder.id}-${step.status}-${step.timestamp}`}>
                                {step.status}
                              </span>
                            ))}
                          </div>
                          {order.paymentProof?.selectedSellerId === subOrder.sellerId && (
                            <div className="admin-payment-proof">
                              <strong>Payment proof</strong>
                              <small>Amount: {formatCurrency(order.paymentProof.amount)}</small>
                              <small>ID: {order.paymentProof.transactionId}</small>
                              <small>From: {order.paymentProof.accountName}</small>
                              {order.paymentProof.screenshot && (
                                <img src={order.paymentProof.screenshot} alt="Payment proof" />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>{order.totalItems}</td>
                  <td>{formatCurrency(order.totalAmount)}</td>
                  <td>
                    <div className="suborder-status-list">
                      {(order.subOrders || []).map((subOrder) => (
                        <div key={`${subOrder.id}-status`} className="suborder-status-control">
                          <span className="status-badge pending">{subOrder.status || "Pending"}</span>
                          <select
                            value=""
                            disabled={updatingId === subOrder.id}
                            onChange={(event) =>
                              handleStatusChange(order.id, subOrder.id, event.target.value)
                            }
                          >
                            <option value="" disabled>
                              Override
                            </option>
                            {ADMIN_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
