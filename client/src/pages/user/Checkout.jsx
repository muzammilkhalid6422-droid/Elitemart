import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  ClipboardList,
  Headphones,
  Home,
  Info,
  Lock,
  Map,
  MapPin,
  ReceiptText,
  Phone,
  ShieldCheck,
  Truck,
  User,
  Zap,
} from "lucide-react";
import { getCart } from "../../services/cartService";
import { placeOrder } from "../../services/orderService";
import "./Checkout.css";

const initialForm = {
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  region: "",
  country: "Pakistan",
  phone: "",
};

const money = (value) => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;
const paymentMethods = [
  { name: "Cash on Delivery", detail: "Pay when your order arrives" },
  { name: "JazzCash", detail: "Send payment to account number" },
  { name: "EasyPaisa", detail: "Send payment to account number" },
  { name: "Bank Transfer", detail: "Send payment to bank account" },
];

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(initialForm);
  const [delivery, setDelivery] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [paymentProof, setPaymentProof] = useState({
    selectedSellerId: "",
    amount: "",
    screenshot: "",
    transactionId: "",
    accountName: "",
  });

  const shipping = delivery === "express" ? 250 : 0;
  const total = cart.subtotal + shipping;
  const sellerAccounts = cart.sellerAccounts || [];
  const selectedSellerAccount =
    sellerAccounts.find((account) => account.sellerId === paymentProof.selectedSellerId) ||
    sellerAccounts[0] ||
    null;
  const requiresPaymentProof = paymentMethod !== "Cash on Delivery";

  useEffect(() => {
    let ignore = false;

    const loadCart = async () => {
      try {
        const data = await getCart();
        if (!ignore) setCart(data);
      } catch (error) {
        if (!ignore) setMessage(error.response?.data?.message || "Cart load nahi ho saka");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadCart();

    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePaymentProofChange = (event) => {
    const { name, value } = event.target;
    setPaymentProof((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePaymentMethodChange = (methodName) => {
    setPaymentMethod(methodName);

    if (methodName !== "Cash on Delivery" && !paymentProof.selectedSellerId && sellerAccounts[0]) {
      setPaymentProof((current) => ({
        ...current,
        selectedSellerId: sellerAccounts[0].sellerId,
        amount: current.amount || String(total),
      }));
    }
  };

  const handleScreenshotUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProof((current) => ({
        ...current,
        screenshot: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handlePlaceOrder = async () => {
    try {
      if (requiresPaymentProof) {
        const missingProof =
          !String(paymentProof.selectedSellerId || selectedSellerAccount?.sellerId || "").trim() ||
          !String(paymentProof.amount || "").trim() ||
          !String(paymentProof.screenshot || "").trim() ||
          !String(paymentProof.transactionId || "").trim() ||
          !String(paymentProof.accountName || "").trim();

        if (missingProof) {
          setMessage("Payment proof form complete karein, phir order proceed hoga.");
          return;
        }
      }

      setPlacingOrder(true);
      const response = await placeOrder({
        shippingAddress: {
          firstName: form.firstName,
          lastName: form.lastName,
          address: form.address,
          city: form.city,
          region: form.region,
          country: form.country,
        },
        phone: form.phone,
        paymentMethod,
        paymentProof: requiresPaymentProof
          ? {
              ...paymentProof,
              selectedSellerId: paymentProof.selectedSellerId || selectedSellerAccount?.sellerId || "",
              amount: paymentProof.amount || total,
            }
          : null,
      });

      setMessage(`Order place ho gaya: ${response.order.orderNumber}`);
      setCart({ items: [], subtotal: 0, totalItems: 0 });

      setTimeout(() => {
        navigate("/my-orders");
      }, 1200);
    } catch (error) {
      setMessage(error.response?.data?.message || "Order place nahi ho saka");
    } finally {
      setPlacingOrder(false);
    }
  };

  const fields = [
    { name: "firstName", label: "First Name", placeholder: "Enter first name", icon: User },
    { name: "lastName", label: "Last Name", placeholder: "Enter last name", icon: User },
    { name: "address", label: "Address", placeholder: "House no., street, area", icon: Home, wide: true },
    { name: "city", label: "City", placeholder: "Enter city", icon: Building2 },
    { name: "region", label: "Area / Region", placeholder: "Enter area or region", icon: Map },
    { name: "country", label: "Country", placeholder: "Pakistan", icon: Briefcase },
    { name: "phone", label: "Phone Number", placeholder: "03XX XXXXXXX", icon: Phone },
  ];

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <button type="button" onClick={() => navigate("/cart")} aria-label="Back to cart">
          <ArrowLeft size={22} />
        </button>
        <h1>Checkout</h1>
        <div className="checkout-steps">
          <span className="active">1 Shipping</span>
          <i />
          <span>2 Payment</span>
          <i />
          <span>3 Confirmation</span>
        </div>
        <aside className="checkout-secure-card">
          <ShieldCheck size={21} />
          <div>
            <strong>100% Secure Checkout</strong>
            <small>Your data is safe and encrypted</small>
          </div>
        </aside>
      </header>

      {message && <div className="checkout-message">{message}</div>}

      <section className="checkout-layout">
        <div className="checkout-left">
          <section className="checkout-panel">
            <div className="checkout-panel-head">
              <span>
                <MapPin size={22} />
              </span>
              <div>
                <h2>Shipping Information</h2>
                <p>Please fill in your details to deliver your order</p>
              </div>
            </div>

            <div className="checkout-form-grid">
              {fields.map((field) => (
                <label className={`checkout-field ${field.wide ? "wide" : ""}`} key={field.name}>
                  <field.icon size={20} />
                  <div>
                    <span>{field.label}</span>
                    <input
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                    />
                  </div>
                </label>
              ))}
            </div>

            <label className="checkout-save-info">
              <input type="checkbox" defaultChecked />
              <span>Save this information for next time</span>
            </label>
          </section>

          <section className="checkout-panel">
            <div className="checkout-panel-head">
              <span>
                <Truck size={22} />
              </span>
              <div>
                <h2>Delivery Options</h2>
                <p>Choose your preferred delivery option</p>
              </div>
            </div>

            <div className="delivery-options">
              <button
                type="button"
                className={delivery === "standard" ? "active" : ""}
                onClick={() => setDelivery("standard")}
              >
                <i />
                <Truck size={24} />
                <div>
                  <strong>Standard Delivery</strong>
                  <span>3-5 business days</span>
                </div>
                <b>Free</b>
              </button>
              <button
                type="button"
                className={delivery === "express" ? "active" : ""}
                onClick={() => setDelivery("express")}
              >
                <i />
                <Zap size={24} />
                <div>
                  <strong>Express Delivery</strong>
                  <span>1-2 business days</span>
                </div>
                <b>{money(250)}</b>
              </button>
            </div>
          </section>

          <section className="checkout-panel">
            <div className="checkout-panel-head">
              <span>
                <Lock size={22} />
              </span>
              <div>
                <h2>Payment Method</h2>
                <p>Select Cash on Delivery or send payment to the account number</p>
              </div>
            </div>

            <div className="payment-options">
              {paymentMethods.map((method) => (
                <button
                  type="button"
                  className={paymentMethod === method.name ? "active" : ""}
                  onClick={() => handlePaymentMethodChange(method.name)}
                  key={method.name}
                >
                  <i />
                  <div>
                    <strong>{method.name}</strong>
                    <span>{method.detail}</span>
                  </div>
                  {method.name === "Cash on Delivery" ? (
                    <b>No advance payment</b>
                  ) : (
                    <b>{selectedSellerAccount?.accountNumber || "No seller account number"}</b>
                  )}
                </button>
              ))}
            </div>
          </section>

          {requiresPaymentProof && (
            <section className="checkout-panel">
              <div className="checkout-panel-head">
                <span>
                  <ReceiptText size={22} />
                </span>
                <div>
                  <h2>Payment Proof</h2>
                  <p>Send payment to the product seller account, then fill this form</p>
                </div>
              </div>

              <div className="seller-account-options">
                {sellerAccounts.length === 0 && (
                  <p className="checkout-muted">Seller account number available nahi hai.</p>
                )}
                {sellerAccounts.map((account) => (
                  <button
                    type="button"
                    className={
                      (paymentProof.selectedSellerId || selectedSellerAccount?.sellerId) === account.sellerId
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setPaymentProof((current) => ({
                        ...current,
                        selectedSellerId: account.sellerId,
                        amount: current.amount || String(total),
                      }))
                    }
                    key={account.sellerId}
                  >
                    <i />
                    <div>
                      <strong>{account.sellerName || "Seller"}</strong>
                      <span>{account.accountNumber || "No account number"}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="payment-proof-grid">
                <label className="checkout-field">
                  <ReceiptText size={20} />
                  <div>
                    <span>Sent Amount</span>
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      value={paymentProof.amount}
                      onChange={handlePaymentProofChange}
                      placeholder={String(total)}
                    />
                  </div>
                </label>

                <label className="checkout-field">
                  <User size={20} />
                  <div>
                    <span>Your Account Name</span>
                    <input
                      name="accountName"
                      value={paymentProof.accountName}
                      onChange={handlePaymentProofChange}
                      placeholder="Name on sender account"
                    />
                  </div>
                </label>

                <label className="checkout-field wide">
                  <ClipboardList size={20} />
                  <div>
                    <span>Transaction ID</span>
                    <input
                      name="transactionId"
                      value={paymentProof.transactionId}
                      onChange={handlePaymentProofChange}
                      placeholder="Enter transaction / transcript ID"
                    />
                  </div>
                </label>

                <label className="payment-screenshot-upload">
                  <span>Payment Screenshot</span>
                  {paymentProof.screenshot ? (
                    <img src={paymentProof.screenshot} alt="Payment screenshot" />
                  ) : (
                    <small>Upload screenshot</small>
                  )}
                  <input type="file" accept="image/*" onChange={handleScreenshotUpload} hidden />
                </label>
              </div>
            </section>
          )}

          <div className="checkout-info-note">
            <Info size={21} />
            <span>
              Payment selected: <strong>{paymentMethod}</strong>
              {requiresPaymentProof && selectedSellerAccount
                ? ` - ${selectedSellerAccount.sellerName} account ${selectedSellerAccount.accountNumber}`
                : ""}
              .
            </span>
          </div>
        </div>

        <aside className="checkout-right">
          <section className="checkout-summary">
            <div className="checkout-panel-head">
              <span>
                <ClipboardList size={22} />
              </span>
              <div>
                <h2>Order Summary</h2>
              </div>
            </div>

            {loading && <p className="checkout-muted">Loading cart...</p>}
            {!loading && cart.items.length === 0 && (
              <p className="checkout-muted">Cart empty hai. Pehle products add karein.</p>
            )}

            <div className="checkout-summary-items">
              {cart.items.map((item) => (
                <article className="checkout-summary-item" key={item.productId}>
                  <img src={item.product.image || "https://placehold.co/120x120?text=Product"} alt={item.product.name} />
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>{item.product.category || "Product"}</span>
                    <small>Qty: {item.quantity}</small>
                  </div>
                  <b>{money(item.product.price * item.quantity)}</b>
                </article>
              ))}
            </div>

            <div className="checkout-summary-row">
              <span>Subtotal ({cart.totalItems} items)</span>
              <strong>{money(cart.subtotal)}</strong>
            </div>
            <div className="checkout-summary-row">
              <span>Shipping</span>
              <strong className="free">{shipping === 0 ? "Free" : money(shipping)}</strong>
            </div>
            <div className="checkout-summary-row">
              <span>Payment</span>
              <strong>{paymentMethod}</strong>
            </div>
            {paymentMethod !== "Cash on Delivery" && (
              <div className="checkout-summary-row">
                <span>Account Number</span>
                <strong>{selectedSellerAccount?.accountNumber || "N/A"}</strong>
              </div>
            )}
            <div className="checkout-total">
              <span>Total Amount</span>
              <strong>{money(total)}</strong>
            </div>

            <button
              type="button"
              disabled={placingOrder || cart.items.length === 0}
              onClick={handlePlaceOrder}
            >
              <Lock size={17} />
              {placingOrder ? "Placing Order..." : "Place Order"}
              <ArrowRight size={18} />
            </button>

            <p className="checkout-terms">
              <ShieldCheck size={14} />
              By placing this order you agree to our <a>Terms & Conditions</a>
            </p>
          </section>

          <section className="checkout-benefits">
            <article>
              <Truck size={22} />
              <strong>Secure Payment</strong>
              <span>100% secure payments</span>
            </article>
            <article>
              <Headphones size={22} />
              <strong>Easy Returns</strong>
              <span>7-day return policy</span>
            </article>
            <article>
              <MapPin size={22} />
              <strong>24/7 Support</strong>
              <span>We're here to help</span>
            </article>
            <article>
              <Award size={22} />
              <strong>Best Quality</strong>
              <span>Premium products</span>
            </article>
          </section>
        </aside>
      </section>
    </main>
  );
};

export default Checkout;
