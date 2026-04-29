import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
} from "lucide-react";
import { getMyOrders, markSubOrderReceived } from "../../services/orderService";
import "./MyOrders.css";

const ORDER_STEPS = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Completed",
];

const statusClass = (status = "") => String(status).toLowerCase().replace(/\s+/g, "-");

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const money = (value) => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

const getStepTime = (subOrder, step, fallbackDate) => {
  const trackingStep = (subOrder.trackingSteps || []).find((item) => item.status === step);
  return formatDate(trackingStep?.timestamp || fallbackDate);
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      try {
        const data = await getMyOrders();
        if (!ignore) setOrders(data || []);
      } catch (error) {
        if (!ignore) setMessage(error.response?.data?.message || "Orders load nahi ho sake");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadOrders();
    const intervalId = setInterval(loadOrders, 10000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, []);

  const summary = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const totalItems = orders.reduce((sum, order) => sum + Number(order.totalItems || 0), 0);
    const pendingOrders = orders.filter((order) =>
      ["Pending", "Confirmed", "Shipped", "Out for Delivery"].includes(order.status)
    ).length;

    return {
      totalOrders: orders.length,
      totalItems,
      totalSpent,
      pendingOrders,
    };
  }, [orders]);

  const handleMarkReceived = async (orderId, subOrderId) => {
    setUpdatingId(subOrderId);
    setMessage("");

    try {
      const updatedOrder = await markSubOrderReceived(orderId, subOrderId);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? updatedOrder : order))
      );
    } catch (error) {
      setMessage(error.response?.data?.message || "Order complete nahi ho saka");
    } finally {
      setUpdatingId("");
    }
  };

  const toggleOrder = (orderId) => {
    setCollapsed((current) => ({ ...current, [orderId]: !current[orderId] }));
  };

  return (
    <main className="my-orders-page">
      <header className="my-orders-header">
        <div>
          <h1>My Orders</h1>
          <p>Track, view and manage your orders</p>
        </div>

        <section className="my-orders-summary">
          <article>
            <span>
              <Package size={18} />
            </span>
            <div>
              <small>Total Orders</small>
              <strong>{summary.totalOrders}</strong>
            </div>
          </article>
          <article>
            <span>
              <ShoppingBag size={18} />
            </span>
            <div>
              <small>Total Items</small>
              <strong>{summary.totalItems}</strong>
            </div>
          </article>
          <article>
            <span>
              <CreditCard size={18} />
            </span>
            <div>
              <small>Total Spent</small>
              <strong>{money(summary.totalSpent)}</strong>
            </div>
          </article>
          <article>
            <span>
              <Package size={18} />
            </span>
            <div>
              <small>Pending Orders</small>
              <strong>{summary.pendingOrders}</strong>
            </div>
          </article>
        </section>
      </header>

      {message && <div className="my-orders-message">{message}</div>}

      {loading && <div className="my-orders-empty">Loading orders...</div>}

      {!loading && orders.length === 0 && (
        <div className="my-orders-empty">Abhi tak koi order place nahi hua.</div>
      )}

      <section className="my-orders-list">
        {orders.map((order) => {
          const isCollapsed = collapsed[order.id];

          return (
            <article className="my-order-card" key={order.id}>
              <div className="my-order-top">
                <div className="my-order-icon">
                  <Package size={26} />
                </div>

                <div className="my-order-main">
                  <div className="my-order-title">
                    <h2>{order.orderNumber}</h2>
                    <span className={`order-status ${statusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="my-order-meta">
                    <span>
                      <CalendarDays size={14} />
                      {formatDate(order.createdAt)}
                    </span>
                    <span>
                      <Phone size={14} />
                      {order.phone || "N/A"}
                    </span>
                    <span>
                      <MapPin size={14} />
                      {order.location || "No address"}
                    </span>
                  </div>
                </div>

                <div className="my-order-facts">
                  <div>
                    <small>Amount</small>
                    <strong>{money(order.totalAmount)}</strong>
                  </div>
                  <div>
                    <small>Items</small>
                    <strong>{order.totalItems}</strong>
                  </div>
                  <div>
                    <small>Payment</small>
                    <strong>
                      <CreditCard size={14} />
                      {order.paymentMethod || "Cash on Delivery"}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className={`my-order-toggle ${isCollapsed ? "closed" : ""}`}
                  onClick={() => toggleOrder(order.id)}
                  aria-label="Toggle order details"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {!isCollapsed && (
                <div className="my-order-details">
                  {(order.subOrders || []).map((subOrder) => {
                    const activeIndex = ORDER_STEPS.indexOf(subOrder.status);

                    return (
                      <section className="seller-tracking-card" key={subOrder.id}>
                        <div className="seller-tracking-head">
                          <div>
                            <h3>Seller Tracking</h3>
                            <strong>{subOrder.sellerName || "Seller"}</strong>
                            <small>{subOrder.id}</small>
                          </div>
                          <div className="seller-tracking-actions">
                            <span className={`order-status ${statusClass(subOrder.status)}`}>
                              {subOrder.status}
                            </span>
                            {subOrder.status === "Delivered" && (
                              <button
                                type="button"
                                disabled={updatingId === subOrder.id}
                                onClick={() => handleMarkReceived(order.id, subOrder.id)}
                              >
                                {updatingId === subOrder.id ? "Updating..." : "Mark Received"}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="order-progress">
                          {ORDER_STEPS.map((step, index) => {
                            const isDone = activeIndex >= index;

                            return (
                              <div className={`order-step ${isDone ? "done" : ""}`} key={step}>
                                <i>{isDone ? "✓" : ""}</i>
                                <span>{step}</span>
                                <small>{isDone ? getStepTime(subOrder, step, order.createdAt) : ""}</small>
                              </div>
                            );
                          })}
                        </div>

                        <div className="ordered-items">
                          {(subOrder.items || []).map((item) => (
                            <div className="ordered-item" key={`${subOrder.id}-${item.productId}`}>
                              <img
                                src={item.image || "https://placehold.co/140x140?text=Product"}
                                alt={item.productName}
                              />
                              <div>
                                <strong>{item.productName}</strong>
                                <span>{money(item.price)} each</span>
                              </div>
                              <div className="ordered-item-total">
                                <span>Qty x {item.quantity}</span>
                                <strong>{money(item.lineTotal)}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
};

export default MyOrders;
