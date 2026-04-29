import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Headphones,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Trash2,
  Truck,
} from "lucide-react";
import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../../services/cartService";
import { getProducts } from "../../services/productService";
import "./Cart.css";

const FREE_SHIPPING_TARGET = 5000;
const FALLBACK_IMAGE = "https://placehold.co/360x260?text=Product";
const money = (value) => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

const Cart = () => {
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    totalItems: 0,
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const shipping = 0;
  const total = cart.subtotal + shipping;
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_TARGET - cart.subtotal, 0);
  const progress = Math.min(100, (cart.subtotal / FREE_SHIPPING_TARGET) * 100);

  useEffect(() => {
    let ignore = false;

    const loadCart = async () => {
      try {
        const [cartData, productData] = await Promise.all([getCart(), getProducts()]);
        if (!ignore) {
          setCart(cartData);
          setProducts(productData || []);
        }
      } catch (error) {
        if (!ignore) setMessage(error.response?.data?.message || "Unable to load cart");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadCart();

    return () => {
      ignore = true;
    };
  }, []);

  const recommendedProducts = useMemo(() => {
    const cartProductIds = new Set(cart.items.map((item) => item.productId));
    return products.filter((product) => !cartProductIds.has(product.id)).slice(0, 3);
  }, [cart.items, products]);

  const changeQuantity = async (productId, quantity) => {
    try {
      if (quantity < 1) {
        const data = await removeCartItem(productId);
        setCart(data.cart);
        return;
      }

      const data = await updateCartItem(productId, quantity);
      setCart(data.cart);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update cart");
    }
  };

  const removeItem = async (productId) => {
    try {
      const data = await removeCartItem(productId);
      setCart(data.cart);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to remove item");
    }
  };

  const clearCart = async () => {
    try {
      let nextCart = cart;
      for (const item of cart.items) {
        const data = await removeCartItem(item.productId);
        nextCart = data.cart;
      }
      setCart(nextCart);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to clear cart");
    }
  };

  const handleRecommendedAdd = async (productId) => {
    try {
      const data = await addToCart(productId, 1);
      setCart(data.cart);
      setMessage("Product cart mein add ho gaya");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to add product");
    }
  };

  return (
    <main className="cart-page">
      <header className="cart-header">
        <div>
          <h1>
            Your Cart <span>({cart.items.length})</span>
          </h1>
          <p>Review your items and proceed to checkout</p>
        </div>

        <div className="cart-steps">
          <span className="active">1 Cart</span>
          <i />
          <span>2 Checkout</span>
          <i />
          <span>3 Order Placed</span>
        </div>
      </header>

      {message && <div className="cart-message">{message}</div>}
      {loading && <div className="cart-empty">Loading cart...</div>}

      {!loading && cart.items.length === 0 && (
        <div className="cart-empty">
          Your cart is empty. Add products from the shop page.
          <Link to="/shop">Start Shopping</Link>
        </div>
      )}

      {!loading && cart.items.length > 0 && (
        <>
          <section className="cart-layout">
            <div className="cart-left">
              <section className="cart-items-panel">
                <div className="cart-table-head">
                  <span>Product</span>
                  <span>Price</span>
                  <span>Quantity</span>
                  <span>Total</span>
                  <span />
                </div>

                <div className="cart-items-list">
                  {cart.items.map((item) => (
                    <article className="cart-item-row" key={item.productId}>
                      <div className="cart-product-cell">
                        <img
                          src={item.product.image || FALLBACK_IMAGE}
                          alt={item.product.name}
                        />
                        <div>
                          <strong>{item.product.name}</strong>
                          <span>{item.product.category || "Product"}</span>
                          <small>In stock</small>
                        </div>
                      </div>

                      <div className="cart-price-cell">{money(item.product.price)}</div>

                      <div className="cart-qty-cell">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <strong>{item.quantity}</strong>
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="cart-total-cell">
                        {money(item.product.price * item.quantity)}
                      </div>

                      <button
                        type="button"
                        className="cart-remove-icon"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  ))}
                </div>

                <footer className="cart-panel-footer">
                  <Link to="/shop">
                    <ArrowLeft size={15} />
                    Continue Shopping
                  </Link>
                  <button type="button" onClick={clearCart}>
                    <Trash2 size={15} />
                    Clear Cart
                  </button>
                </footer>
              </section>

              <section className="cart-benefits">
                <article>
                  <Truck size={20} />
                  <div>
                    <strong>Free Shipping</strong>
                    <span>On orders over PKR 5000</span>
                  </div>
                </article>
                <article>
                  <ShieldCheck size={20} />
                  <div>
                    <strong>Secure Checkout</strong>
                    <span>100% secure payments</span>
                  </div>
                </article>
                <article>
                  <Headphones size={20} />
                  <div>
                    <strong>Easy Returns</strong>
                    <span>7-day return policy</span>
                  </div>
                </article>
                <article>
                  <Award size={20} />
                  <div>
                    <strong>Top Quality</strong>
                    <span>Authentic products</span>
                  </div>
                </article>
              </section>
            </div>

            <aside className="cart-right">
              <section className="cart-summary-panel">
                <h2>Order Summary</h2>
                <div className="cart-summary-row">
                  <span>Subtotal ({cart.totalItems} items)</span>
                  <strong>{money(cart.subtotal)}</strong>
                </div>
                <div className="cart-summary-row">
                  <span>Shipping</span>
                  <strong className="free">Free</strong>
                </div>
                <div className="cart-summary-total">
                  <span>Total</span>
                  <strong>{money(total)}</strong>
                </div>
                <Link to="/checkout">
                  Proceed to Checkout
                  <ArrowRight size={17} />
                </Link>
                <p>
                  <ShieldCheck size={14} />
                  Your payment information is secured and encrypted
                </p>
              </section>

              {recommendedProducts.length > 0 && (
                <section className="cart-recommend-panel">
                  <div className="cart-recommend-head">
                    <h2>You May Also Like</h2>
                    <Link to="/shop">View All</Link>
                  </div>
                  <div className="cart-recommend-grid">
                    {recommendedProducts.map((product) => (
                      <article className="cart-recommend-card" key={product.id}>
                        <Link to={`/product/${product.id}`}>
                          <img src={product.image || FALLBACK_IMAGE} alt={product.name} />
                        </Link>
                        <strong>{product.name}</strong>
                        <div className="cart-recommend-stars">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              size={12}
                              color={
                                index < Math.round(product.rating || 0)
                                  ? "#facc15"
                                  : "rgba(148,163,184,.45)"
                              }
                              fill={
                                index < Math.round(product.rating || 0) ? "#facc15" : "none"
                              }
                            />
                          ))}
                          <span>({product.reviewCount || 0})</span>
                        </div>
                        <b>{money(product.price)}</b>
                        <button type="button" onClick={() => handleRecommendedAdd(product.id)}>
                          <ShoppingCart size={14} />
                          Add to Cart
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </section>

          <section className="cart-shipping-progress">
            <div>
              <ShieldCheck size={22} />
              {remainingForFreeShipping > 0 ? (
                <span>
                  Hurry! Add <strong>{money(remainingForFreeShipping)}</strong> more to get
                  free shipping on your order.
                </span>
              ) : (
                <span>
                  Nice! Your order qualifies for <strong>free shipping</strong>.
                </span>
              )}
            </div>
            <div className="cart-progress-meter">
              <small>
                {money(cart.subtotal)} / {money(FREE_SHIPPING_TARGET)}
              </small>
              <i>
                <b style={{ width: `${progress}%` }} />
              </i>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default Cart;
