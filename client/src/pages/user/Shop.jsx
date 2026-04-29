import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { addToCart } from "../../services/cartService";
import { getFavorites, toggleFavorite } from "../../services/favoriteService";
import { getProducts } from "../../services/productService";

const Shop = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const query = searchParams.get("q")?.trim().toLowerCase() || "";

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        const [items, favorites] = await Promise.all([getProducts(), getFavorites()]);
        if (!ignore) {
          setProducts(items);
          setFavoriteIds(favorites.productIds || []);
        }
      } catch {
        if (!ignore) {
          setMessage("Unable to load products right now");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProducts();
    const intervalId = setInterval(loadProducts, 5000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      setMessage("Product added successfully");
      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Please login first to add items to cart"
      );
    }
  };

  const handleToggleFavorite = async (productId) => {
    try {
      const response = await toggleFavorite(productId);
      setFavoriteIds(response.productIds || []);
      setMessage(response.message);
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Favourite update nahi ho saka");
    }
  };

  const filteredProducts = products.filter((product) => {
    if (!query) {
      return true;
    }

    return [
      product.name,
      product.category,
      product.brand,
      product.shortDesc,
      product.description,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  return (
    <div className="shop-page" style={{ padding: "20px" }}>
      {message && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
            zIndex: 999,
          }}
        >
          {message}
        </div>
      )}

      <h1
        className="text-5xl font-bold mb-8 text-center"
        style={{ margin: "20px", color: "#7dd3fc" }}
      >
        Shop
      </h1>

      {query && (
        <p style={{ textAlign: "center", color: "#aaa", marginBottom: "20px" }}>
          Search results for: <span style={{ color: "#7dd3fc" }}>{searchParams.get("q")}</span>
        </p>
      )}

      {loading && <p style={{ textAlign: "center", color: "#aaa" }}>Loading products...</p>}
      {!loading && products.length === 0 && (
        <p style={{ textAlign: "center", color: "#aaa" }}>
          No products available yet. Seller products will appear here automatically.
        </p>
      )}
      {!loading && products.length > 0 && filteredProducts.length === 0 && (
        <p style={{ textAlign: "center", color: "#aaa" }}>
          No products found for this search.
        </p>
      )}

      <div
        className="shop-product-grid"
        style={{
          display: "grid",
          gap: "25px",
          width: "100%",
        }}
      >
        {filteredProducts.map((product) => (
          <div
            className="shop-product-card"
            key={product.id}
            style={{
              position: "relative",
              borderRadius: "20px",
              padding: "15px",
              background:
                "linear-gradient(145deg, rgba(0,212,255,0.08), rgba(0,0,50,0.6))",
              boxShadow:
                "0 0 20px rgba(0,255,255,0.2), inset 0 0 10px rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0,255,255,0.2)",
            }}
          >
            <button
              onClick={() => handleToggleFavorite(product.id)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                border: favoriteIds.includes(product.id)
                  ? "1px solid rgba(244,63,94,0.45)"
                  : "1px solid rgba(255,255,255,0.2)",
                background: favoriteIds.includes(product.id)
                  ? "rgba(244,63,94,0.2)"
                  : "rgba(8,13,30,0.75)",
                color: favoriteIds.includes(product.id) ? "#fb7185" : "white",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                zIndex: 2,
              }}
              aria-label="Toggle favourite"
            >
              <Heart size={17} fill={favoriteIds.includes(product.id) ? "currentColor" : "none"} />
            </button>
            <img
              src={product.image || "https://placehold.co/500x350?text=Product"}
              alt={product.name}
              style={{
                width: "100%",
                height: "180px",
                objectFit: "cover",
                borderRadius: "12px",
                marginBottom: "10px",
              }}
            />

            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                textAlign: "center",
                color: "#7dd3fc",
              }}
            >
              {product.name}
            </h2>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "3px",
                margin: "5px 0",
              }}
            >
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  size={14}
                  style={{
                    color: index < Math.round(product.rating || 0) ? "#facc15" : "#555",
                    fill: index < Math.round(product.rating || 0) ? "#facc15" : "none",
                  }}
                />
              ))}
              <span style={{ color: "#aaa", fontSize: "12px", marginLeft: "4px" }}>
                ({product.reviewCount || 0})
              </span>
            </div>

            <h3
              style={{
                textAlign: "center",
                fontSize: "18px",
                fontWeight: "bold",
                color: "#22d3ee",
              }}
            >
              PKR {product.price}
            </h3>

            <p
              style={{
                textAlign: "center",
                fontSize: "12px",
                color: "#aaa",
                marginBottom: "10px",
              }}
            >
              {product.stock} in stock
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <Link to={`/product/${product.id}`} style={btnPrimary}>
                View
              </Link>

              <Link to="/checkout" style={btnBuy}>
                Buy
              </Link>
            </div>

            <button onClick={() => handleAddToCart(product.id)} style={btnCart}>
              <ShoppingCart size={16} /> Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const btnPrimary = {
  flex: 1,
  padding: "10px",
  borderRadius: "12px",
  textAlign: "center",
  background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
  color: "white",
  fontSize: "13px",
  textDecoration: "none",
};

const btnBuy = {
  flex: 1,
  padding: "10px",
  borderRadius: "12px",
  textAlign: "center",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  fontSize: "13px",
  fontWeight: "600",
  textDecoration: "none",
};

const btnCart = {
  marginTop: "10px",
  width: "100%",
  padding: "10px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  cursor: "pointer",
};

export default Shop;
