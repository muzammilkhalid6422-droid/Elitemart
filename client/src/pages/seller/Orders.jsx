import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Clock3,
  RefreshCcw,
  Search,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { getSellerOrders, updateSubOrderStatus } from "../../services/orderService";
import { getPlanStatus, hasPremiumPlan } from "../../services/planService";
import "./Orders.css";

const SELLER_STATUS_OPTIONS = ["Confirmed", "Shipped", "Out for Delivery", "Delivered"];

const formatOrderDate = (value) =>
  new Date(value).toLocaleString("en-PK", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [seller] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      try {
        const data = await getSellerOrders();
        if (!ignore) {
          setOrders(data || []);
          setMessage("");
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error.response?.data?.message || "Seller orders load nahi ho sake");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadOrders();
    const intervalId = setInterval(loadOrders, 5000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter((order) => {
      const productNames = (order.sellerItems || [])
        .map((item) => item.productName)
        .join(" ")
        .toLowerCase();

      return (
        String(order.orderNumber || "").toLowerCase().includes(query) ||
        String(order.customer?.name || "").toLowerCase().includes(query) ||
        String(order.location || "").toLowerCase().includes(query) ||
        productNames.includes(query)
      );
    });
  }, [orders, search]);

  const handleStatusChange = async (orderId, subOrderId, status) => {
    setUpdatingId(subOrderId);
    setMessage("");

    try {
      const updatedOrder = await updateSubOrderStatus(orderId, subOrderId, status);
      setOrders((current) =>
        current.map((order) => {
          if (order.id !== orderId) return order;

          const sellerSubOrders = (updatedOrder.subOrders || []).filter((subOrder) =>
            order.sellerSubOrders?.some((currentSubOrder) => currentSubOrder.id === subOrder.id)
          );

          return {
            ...order,
            ...updatedOrder,
            sellerSubOrders,
            sellerItems: sellerSubOrders.flatMap((subOrder) => subOrder.items || []),
            sellerTotal: sellerSubOrders.reduce(
              (sum, subOrder) => sum + Number(subOrder.subtotal || 0),
              0
            ),
            sellerQuantity: sellerSubOrders.reduce(
              (sum, subOrder) => sum + Number(subOrder.totalItems || 0),
              0
            ),
          };
        })
      );
    } catch (error) {
      setMessage(error.response?.data?.message || "Order status update nahi ho saka");
    } finally {
      setUpdatingId("");
    }
  };

  const stats = useMemo(() => {
    const today = new Date();

    const totalOrdersToday = orders.filter((order) => {
      const created = new Date(order.createdAt);
      return (
        created.getFullYear() === today.getFullYear() &&
        created.getMonth() === today.getMonth() &&
        created.getDate() === today.getDate()
      );
    }).length;

    const pending = orders.reduce(
      (count, order) =>
        count +
        (order.sellerSubOrders || []).filter((subOrder) => subOrder.status === "Pending").length,
      0
    );

    const revenue = orders.reduce((sum, order) => sum + Number(order.sellerTotal || 0), 0);

    return {
      totalOrdersToday,
      pending,
      revenue,
    };
  }, [orders]);

  return (
    <div className="seller-orders-page">
      <section className="seller-orders-welcome">
        <div className="seller-orders-welcome-brand">
          <div className="seller-orders-welcome-icon">
            <BriefcaseBusiness size={22} />
          </div>
          <div>
            <h1 className="seller-orders-welcome-title">
              Welcome, {seller?.name || "Seller"} <span>👋</span>
            </h1>
            <p className="seller-orders-welcome-subtitle">Manage your store</p>
          </div>
        </div>

        <div className="seller-orders-top-actions">
          <div className="seller-orders-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by order, customer, location, product..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button type="button" className="seller-orders-top-icon" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <div className="seller-orders-avatar">
            {seller?.avatar ? (
              <img src={seller.avatar} alt={seller.name || "Seller"} />
            ) : (
              <span>{seller?.name?.charAt(0)?.toUpperCase() || "S"}</span>
            )}
            <i />
          </div>
        </div>
      </section>

      <div className="seller-orders-container">
        <section className="seller-orders-main">
          <div className="seller-orders-shell">
            <div className="seller-orders-panel-header">
              <div>
                <h2>Orders</h2>
                <div className="seller-orders-tabs">
                  <button type="button" className="seller-orders-tab active">
                    All Orders
                  </button>
                  <button type="button" className="seller-orders-tab">
                    Live Orders
                    <span className="seller-orders-live-dot" />
                  </button>
                  <span className="seller-orders-refresh">
                    <RefreshCcw size={14} />
                    Auto refresh 5s
                  </span>
                </div>
              </div>

              <div className="seller-orders-plan-pill">
                {hasPremiumPlan(seller) ? getPlanStatus(seller) : "Free Plan"}
              </div>
            </div>

            <div className="seller-orders-table-card">
              {message && <p className="seller-orders-message">{message}</p>}
              {loading && <p className="seller-orders-loading">Loading orders...</p>}
              {!loading && filteredOrders.length === 0 && (
                <p className="seller-orders-empty">No orders yet.</p>
              )}

              {!loading && filteredOrders.length > 0 && (
                <div className="seller-orders-table-wrap">
                  <table className="seller-orders-table">
                    <thead>
                      <tr>
                        <th>ORDER</th>
                        <th>CUSTOMER</th>
                        <th>LOCATION</th>
                        <th>SELLER ORDERS</th>
                        <th>QTY</th>
                        <th>TOTAL</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="seller-orders-table-row">
                          <td className="seller-orders-table-cell">
                            <div className="seller-orders-order-id">ORD-{order.orderNumber}</div>
                            <div className="seller-orders-order-date">
                              {formatOrderDate(order.createdAt)}
                            </div>
                          </td>

                          <td className="seller-orders-table-cell">
                            <div className="seller-orders-customer-name">{order.customer?.name}</div>
                            <div className="seller-orders-customer-email">{order.customer?.email}</div>
                            <div className="seller-orders-customer-phone">{order.phone}</div>
                          </td>

                          <td className="seller-orders-table-cell">
                            <div className="seller-orders-location">{order.location}</div>
                          </td>

                          <td className="seller-orders-table-cell">
                            <div className="seller-orders-subitems">
                              {(order.sellerSubOrders || []).map((subOrder) => (
                                <div key={subOrder.id} className="seller-orders-subitem">
                                  <div className="seller-orders-subitem-id">{subOrder.id}</div>
                                  <div className="seller-orders-subitem-items">
                                    {(subOrder.items || []).map((item) => (
                                      <div key={`${subOrder.id}-${item.productId}`}>
                                        {item.productName} x {item.quantity}
                                      </div>
                                    ))}
                                  </div>
                                  {order.paymentProof?.selectedSellerId === subOrder.sellerId && (
                                    <div className="seller-orders-payment-proof">
                                      <strong>Payment proof</strong>
                                      <span>Amount: PKR {Number(order.paymentProof.amount || 0).toLocaleString()}</span>
                                      <span>ID: {order.paymentProof.transactionId}</span>
                                      <span>From: {order.paymentProof.accountName}</span>
                                      {order.paymentProof.screenshot && (
                                        <img src={order.paymentProof.screenshot} alt="Payment proof" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="seller-orders-table-cell">
                            <div className="seller-orders-qty">{order.sellerQuantity}</div>
                          </td>

                          <td className="seller-orders-table-cell">
                            <div className="seller-orders-total">
                              PKR {Number(order.sellerTotal || 0).toLocaleString()}
                            </div>
                          </td>

                          <td className="seller-orders-table-cell">
                            <div className="seller-orders-status-col">
                              {(order.sellerSubOrders || []).map((subOrder) => (
                                <div key={`${subOrder.id}-status`} className="seller-orders-status-item">
                                  <span
                                    className={`seller-orders-status-badge seller-status-${subOrder.status
                                      .toLowerCase()
                                      .replace(/\s+/g, "-")}`}
                                  >
                                    {subOrder.status}
                                  </span>
                                  {subOrder.status !== "Completed" &&
                                    subOrder.status !== "Cancelled" && (
                                      <select
                                        value=""
                                        disabled={updatingId === subOrder.id}
                                        onChange={(event) =>
                                          handleStatusChange(order.id, subOrder.id, event.target.value)
                                        }
                                        className="seller-orders-status-select"
                                      >
                                        <option value="" disabled>
                                          Update status
                                        </option>
                                        {SELLER_STATUS_OPTIONS.map((status) => (
                                          <option key={status} value={status}>
                                            {status}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                </div>
                              ))}
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
        </section>

        <aside className="seller-orders-stats">
          <h2 className="seller-orders-stats-title">
            <TrendingUp size={18} />
            Order Statistics
          </h2>

          <div className="seller-orders-stats-grid">
            <div className="seller-orders-stat-card">
              <div className="seller-orders-stat-icon orders-icon">
                <ShoppingBag size={22} />
              </div>
              <div className="seller-orders-stat-copy">
                <p>Total Orders Today</p>
                <strong>{stats.totalOrdersToday}</strong>
              </div>
              <div className="seller-orders-spark blue" />
            </div>

            <div className="seller-orders-stat-card">
              <div className="seller-orders-stat-icon pending-icon">
                <Clock3 size={22} />
              </div>
              <div className="seller-orders-stat-copy">
                <p>Pending Orders</p>
                <strong>{stats.pending}</strong>
              </div>
              <div className="seller-orders-spark purple" />
            </div>

            <div className="seller-orders-stat-card revenue-card">
              <div className="seller-orders-stat-icon revenue-icon">
                <TrendingUp size={22} />
              </div>
              <div className="seller-orders-stat-copy">
                <p>Seller Revenue</p>
                <strong>PKR {stats.revenue.toFixed(2)}</strong>
              </div>
              <div className="seller-orders-spark green" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Orders;
