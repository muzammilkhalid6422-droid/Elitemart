import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  Heart,
  Headphones,
  Laptop,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Star,
  Truck,
  Watch,
} from "lucide-react";
import { addToCart } from "../../services/cartService";
import { getFavorites, toggleFavorite } from "../../services/favoriteService";
import { getProducts } from "../../services/productService";
import { splitBrandName, useBranding } from "../../context/BrandingContext";
import "./Home.css";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='650' viewBox='0 0 900 650'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%230ea5e9'/%3E%3Cstop offset='.5' stop-color='%232563eb'/%3E%3Cstop offset='1' stop-color='%237c3aed'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='650' fill='%2307111f'/%3E%3Ccircle cx='680' cy='140' r='210' fill='url(%23a)' opacity='.38'/%3E%3Crect x='260' y='190' width='380' height='270' rx='42' fill='url(%23a)' opacity='.86'/%3E%3Cpath d='M330 380h240M350 325h200M385 270h130' stroke='white' stroke-width='28' stroke-linecap='round' opacity='.78'/%3E%3Ctext x='450' y='555' text-anchor='middle' fill='white' font-family='Arial' font-size='42' font-weight='700'%3EEliteMart%3C/text%3E%3C/svg%3E";

const categoryConfig = [
  { name: "Electronics", icon: Laptop },
  { name: "Accessories", icon: Headphones },
  { name: "Smart Devices", icon: Smartphone },
  { name: "Wearables", icon: Watch },
];

const formatPrice = (price) => `PKR ${Number(price || 0).toLocaleString("en-PK")}`;

const Home = () => {
  const { branding } = useBranding();
  const brandName = splitBrandName(branding.marketplaceName);
  const [username] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      return user?.name || "";
    } catch {
      return "";
    }
  });
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [message, setMessage] = useState("");
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        const [items, favorites] = await Promise.all([getProducts(), getFavorites()]);
        if (!ignore) {
          setProducts(items || []);
          setFavoriteIds(favorites.productIds || []);
        }
      } catch {
        if (!ignore) setMessage("Products load nahi ho sake");
      } finally {
        if (!ignore) setLoadingProducts(false);
      }
    };

    loadProducts();
    const intervalId = setInterval(loadProducts, 5000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, []);

  const features = [
    {
      icon: Truck,
      title: "Fast Shipping",
      desc: "Free delivery on selected orders",
    },
    {
      icon: ShieldCheck,
      title: "Secure Checkout",
      desc: "Safe payments and protected orders",
    },
    {
      icon: Award,
      title: "Top Quality",
      desc: "Authentic products from verified sellers",
    },
  ];

  const categories = useMemo(
    () =>
      categoryConfig.map((category) => ({
        ...category,
        count: products.filter((product) => product.category === category.name).length,
        image:
          products.find((product) => product.category === category.name)?.image ||
          FALLBACK_IMAGE,
      })),
    [products]
  );

  const latestProducts = products.slice(0, 8);
  const heroProducts = latestProducts.slice(0, 3);

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      setMessage("Product cart mein add ho gaya");
    } catch (error) {
      setMessage(error.response?.data?.message || "Cart mein add karne ke liye login karein");
    } finally {
      setTimeout(() => setMessage(""), 2200);
    }
  };

  const handleToggleFavorite = async (productId) => {
    try {
      const response = await toggleFavorite(productId);
      setFavoriteIds(response.productIds || []);
      setMessage(response.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Favourite update nahi ho saka");
    } finally {
      setTimeout(() => setMessage(""), 2200);
    }
  };

  return (
    <main className="user-home-page">
      {message && <div className="user-home-toast">{message}</div>}

      <section className="user-home-hero">
        <div className="user-home-hero-copy">
          <span className="user-home-kicker">Welcome back to</span>
          <h1>
            {brandName.primary}<span>{brandName.accent || "."}</span>
          </h1>
          <h2>
            Hi <strong>{username || "Guest"}</strong>
          </h2>
          <p>
            Discover premium gadgets, accessories, and smart products with the best
            prices and quality guaranteed.
          </p>
          <div className="user-home-actions">
            <Link to="/shop" className="user-home-primary">
              <ShoppingCart size={17} />
              Shop Now
            </Link>
            <Link to="/cart" className="user-home-secondary">
              View Cart
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="user-home-hero-stage" aria-hidden="true">
          <div className="user-home-product-orbit">
            {heroProducts.length ? (
              heroProducts.map((product, index) => (
                <img
                  key={product.id}
                  src={product.image || FALLBACK_IMAGE}
                  alt=""
                  className={`hero-product hero-product-${index + 1}`}
                />
              ))
            ) : (
              <>
                <Headphones className="hero-icon hero-product-1" />
                <Smartphone className="hero-icon hero-product-2" />
                <Watch className="hero-icon hero-product-3" />
              </>
            )}
            <div className="user-home-stage-base" />
          </div>
        </div>
      </section>

      <section className="user-home-features">
        {features.map((feature) => (
          <article key={feature.title}>
            <div>
              <feature.icon size={24} />
            </div>
            <span>{feature.title}</span>
            <p>{feature.desc}</p>
          </article>
        ))}
      </section>

      <section className="user-home-section">
        <div className="user-home-section-head">
          <h2>Browse by Category</h2>
          <Link to="/shop">
            View All <ArrowRight size={15} />
          </Link>
        </div>

        <div className="user-category-grid">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/shop?q=${encodeURIComponent(category.name)}`}
              className="user-category-card"
            >
              <img src={category.image} alt={category.name} loading="lazy" />
              <div>
                <strong>{category.name}</strong>
                <span>{category.count} items</span>
              </div>
              <i>
                <ArrowRight size={16} />
              </i>
            </Link>
          ))}
        </div>
      </section>

      {products.length > 0 && (
        <section className="user-product-marquee" aria-label="All products">
          <div className="user-marquee-track">
            {[...products, ...products].map((product, index) => (
              <Link
                to={`/product/${product.id}`}
                className="user-marquee-item"
                key={`${product.id}-${index}`}
              >
                <img src={product.image || FALLBACK_IMAGE} alt={product.name} loading="lazy" />
                <div>
                  <strong>{product.name}</strong>
                  <span>{formatPrice(product.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="user-home-section">
        <div className="user-home-section-head">
          <h2>Latest Products</h2>
          <Link to="/shop">
            View All <ArrowRight size={15} />
          </Link>
        </div>

        {loadingProducts && (
          <div className="user-product-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <article className="user-product-card skeleton" key={index}>
                <div />
                <span />
                <strong />
              </article>
            ))}
          </div>
        )}

        {!loadingProducts && latestProducts.length === 0 && (
          <div className="user-home-empty">
            <PackageCheck size={24} />
            Seller ke add kiye hue products yahan show honge.
          </div>
        )}

        {!loadingProducts && latestProducts.length > 0 && (
          <div className="user-product-grid">
            {latestProducts.map((product) => (
              <article className="user-product-card" key={product.id}>
                <Link to={`/product/${product.id}`} className="user-product-image">
                  <img src={product.image || FALLBACK_IMAGE} alt={product.name} loading="lazy" />
                  <span>{product.stock} in stock</span>
                </Link>
                <button
                  type="button"
                  className={`user-product-fav ${favoriteIds.includes(product.id) ? "active" : ""}`}
                  onClick={() => handleToggleFavorite(product.id)}
                  aria-label="Toggle favourite"
                >
                  <Heart size={17} fill={favoriteIds.includes(product.id) ? "currentColor" : "none"} />
                </button>

                <div className="user-product-info">
                  <small>{product.sellerName || product.category || branding.marketplaceName}</small>
                  <h3>{product.name}</h3>
                  <div className="user-product-stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={13}
                        fill={index < Math.round(product.rating || 0) ? "#facc15" : "none"}
                        color={
                          index < Math.round(product.rating || 0)
                            ? "#facc15"
                            : "rgba(148,163,184,.45)"
                        }
                      />
                    ))}
                    <span>({product.reviewCount || 0})</span>
                  </div>
                  <strong>{formatPrice(product.price)}</strong>
                  <div className="user-product-actions">
                    <button type="button" onClick={() => handleAddToCart(product.id)}>
                      <ShoppingCart size={14} />
                      Add to Cart
                    </button>
                    <Link to={`/product/${product.id}`}>View Details</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Link to="/shop" className="user-home-floating-search" aria-label="Search products">
        <Search size={18} />
      </Link>
    </main>
  );
};

export default Home;
