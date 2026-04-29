import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, Trash2 } from "lucide-react";
import { addToCart } from "../../services/cartService";
import { getFavorites, removeFavorite } from "../../services/favoriteService";
import "./Favorites.css";

const FALLBACK_IMAGE = "https://placehold.co/600x420?text=Product";
const money = (value) => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

const Favorites = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadFavorites = async () => {
      try {
        const data = await getFavorites();
        if (!ignore) setProducts(data.products || []);
      } catch (error) {
        if (!ignore) setMessage(error.response?.data?.message || "Favourites load nahi ho sake");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadFavorites();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRemove = async (productId) => {
    try {
      await removeFavorite(productId);
      setProducts((current) => current.filter((product) => product.id !== productId));
      setMessage("Product favourites se remove ho gaya");
    } catch (error) {
      setMessage(error.response?.data?.message || "Product remove nahi ho saka");
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      setMessage("Product cart mein add ho gaya");
    } catch (error) {
      setMessage(error.response?.data?.message || "Cart mein add nahi ho saka");
    }
  };

  return (
    <main className="favorites-page">
      <section className="favorites-hero">
        <div>
          <span>
            <Heart size={16} />
            Saved Products
          </span>
          <h1>Favourites</h1>
          <p>Aap ke liked products yahan save rahenge, taake baad me jaldi cart ya details open kar sako.</p>
        </div>
        <strong>{products.length} items</strong>
      </section>

      {message && <div className="favorites-message">{message}</div>}
      {loading && <div className="favorites-empty">Loading favourites...</div>}

      {!loading && products.length === 0 && (
        <div className="favorites-empty">
          <Heart size={32} />
          <h2>No favourites yet</h2>
          <p>Shop page se heart button press karo, product yahan add ho jayega.</p>
          <Link to="/shop">Explore Products</Link>
        </div>
      )}

      {!loading && products.length > 0 && (
        <section className="favorites-grid">
          {products.map((product) => (
            <article className="favorite-card" key={product.id}>
              <Link to={`/product/${product.id}`} className="favorite-image">
                <img src={product.image || FALLBACK_IMAGE} alt={product.name} />
                <span>{product.stock} in stock</span>
              </Link>
              <div className="favorite-body">
                <small>{product.category || "Product"}</small>
                <h2>{product.name}</h2>
                <div className="favorite-stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={14}
                      color={index < Math.round(product.rating || 0) ? "#facc15" : "rgba(148,163,184,.45)"}
                      fill={index < Math.round(product.rating || 0) ? "#facc15" : "none"}
                    />
                  ))}
                  <span>({product.reviewCount || 0})</span>
                </div>
                <strong>{money(product.price)}</strong>
                <div className="favorite-actions">
                  <button type="button" onClick={() => handleAddToCart(product.id)}>
                    <ShoppingCart size={15} />
                    Add to Cart
                  </button>
                  <button type="button" onClick={() => handleRemove(product.id)}>
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default Favorites;
