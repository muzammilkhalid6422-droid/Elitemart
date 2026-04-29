import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Award,
  Box,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Heart,
  MessageSquare,
  RefreshCw,
  Rocket,
  Send,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { addToCart } from "../../services/cartService";
import { getFavorites, toggleFavorite } from "../../services/favoriteService";
import {
  getProductById,
  getProductReviews,
  submitProductReview,
} from "../../services/productService";
import "./ProductDetails.css";

const FALLBACK_IMAGE = "https://placehold.co/900x650?text=Product";

const ProductStars = ({ rating = 0, size = 17 }) => (
  <div className="product-detail-stars">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={size}
        color={index < Math.round(rating) ? "#facc15" : "rgba(148,163,184,.48)"}
        fill={index < Math.round(rating) ? "#facc15" : "none"}
      />
    ))}
  </div>
);

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ rating: 0, reviewCount: 0 });
  const [message, setMessage] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [activeImage, setActiveImage] = useState(0);

  const user = useMemo(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadProduct = async () => {
      try {
        const [item, reviewData, favoriteData] = await Promise.all([
          getProductById(id),
          getProductReviews(id),
          getFavorites().catch(() => ({ productIds: [] })),
        ]);

        if (!ignore) {
          setProduct(item);
          setReviews(reviewData.reviews || []);
          setStats(reviewData.stats || { rating: item.rating || 0, reviewCount: item.reviewCount || 0 });
          setFavoriteIds(favoriteData.productIds || []);
        }
      } catch {
        if (!ignore) setMessage("Product not found");
      }
    };

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, 1);
      setMessage("Product added to cart");
    } catch (error) {
      setMessage(error.response?.data?.message || "Please login first to add to cart");
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const response = await toggleFavorite(product.id);
      setFavoriteIds(response.productIds || []);
      setMessage(response.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Favourite update nahi ho saka");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Product link copied");
    } catch {
      setMessage("Share link copy nahi ho saka");
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmittingReview(true);
      const response = await submitProductReview(product.id, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setReviews(response.reviews || []);
      setStats(response.stats || { rating: 0, reviewCount: 0 });
      setReviewForm({ rating: 5, comment: "" });
      setMessage(response.message || "Review submitted");
    } catch (error) {
      setMessage(error.response?.data?.message || "Review submit nahi ho saka");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!product) {
    return <h1 className="product-detail-loading">{message || "Loading product..."}</h1>;
  }

  const productImages = [
    product.image,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean);
  const galleryImages = productImages.length > 0 ? productImages : [FALLBACK_IMAGE];
  const visibleThumbs = galleryImages.slice(0, 4);
  const isFavorite = favoriteIds.includes(product.id);

  return (
    <div className="product-detail-page">
      {message && <div className="product-detail-toast">{message}</div>}

      <header className="product-detail-topbar">
        <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
          <span>Home</span>
          <ChevronRight size={14} />
          <span>Products</span>
          <ChevronRight size={14} />
          <span>{product.category || "Digital Products"}</span>
          <ChevronRight size={14} />
          <strong>{product.name}</strong>
        </nav>
        <div className="product-detail-top-actions">
          <button type="button" onClick={handleShare}>
            <Share2 size={16} />
            Share
          </button>
          <button type="button" onClick={handleToggleFavorite} className={isFavorite ? "active" : ""}>
            <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
            {isFavorite ? "Wishlisted" : "Add to Wishlist"}
          </button>
        </div>
      </header>

      <section className="product-detail-grid">
        <div className="product-detail-media">
          <button
            type="button"
            className="product-gallery-nav previous"
            aria-label="Previous image"
            onClick={() => setActiveImage((current) => (current === 0 ? galleryImages.length - 1 : current - 1))}
          >
            <ChevronLeft size={22} />
          </button>
          <img src={galleryImages[activeImage] || FALLBACK_IMAGE} alt={product.name} />
          <button
            type="button"
            className="product-gallery-nav next"
            aria-label="Next image"
            onClick={() => setActiveImage((current) => (current + 1) % galleryImages.length)}
          >
            <ChevronRight size={22} />
          </button>
          <div className="product-gallery-thumbs">
            {visibleThumbs.map((image, index) => (
              <button
                type="button"
                className={activeImage === index ? "active" : ""}
                onClick={() => setActiveImage(index)}
                key={`${image}-${index}`}
              >
                <img src={image} alt={`${product.name} preview ${index + 1}`} />
              </button>
            ))}
            {galleryImages.length > 4 && (
              <button type="button" className="product-gallery-more" onClick={() => setActiveImage(4)}>
                +{galleryImages.length - 4}
              </button>
            )}
          </div>
        </div>

        <div className="product-detail-info">
          <span className="product-detail-category">{product.category || "Digital Product"}</span>
          <h1>{product.name}</h1>
          <div className="product-detail-rating-line">
            <ProductStars rating={stats.rating || product.rating} />
            <strong>{Number(stats.rating || product.rating || 0).toFixed(1)}</strong>
            <span>({stats.reviewCount || product.reviewCount || 0} reviews)</span>
          </div>
          <h2>PKR {Number(product.price || 0).toLocaleString("en-PK")}</h2>

          <p>{product.description || product.shortDesc || "No description added yet."}</p>

          <div className="product-detail-meta-grid">
            <article>
              <Grid2X2 size={18} />
              <div>
                <span>Category</span>
                <strong>{product.category || "Digital Products"}</strong>
              </div>
            </article>
            <article>
              <Box size={18} />
              <div>
                <span>Product ID</span>
                <strong>{product.id}</strong>
              </div>
            </article>
            <article>
              <ShieldCheck size={18} />
              <div>
                <span>Availability</span>
                <strong className={Number(product.stock || 0) > 0 ? "stock-ok" : "stock-out"}>
                  {Number(product.stock || 0) > 0 ? `${product.stock} in stock` : "Out of stock"}
                </strong>
              </div>
            </article>
            <article>
              <Rocket size={18} />
              <div>
                <span>Delivery</span>
                <strong>Instant Delivery</strong>
              </div>
            </article>
          </div>

          <div className="product-detail-actions">
            <button type="button" onClick={handleAddToCart}>
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            <button
              type="button"
              className={`product-detail-fav ${favoriteIds.includes(product.id) ? "active" : ""}`}
              onClick={handleToggleFavorite}
            >
              <Heart size={18} fill={favoriteIds.includes(product.id) ? "currentColor" : "none"} />
              {favoriteIds.includes(product.id) ? "Favourited" : "Favourite"}
            </button>
          </div>

          <div className="product-detail-mini-benefits">
            <article>
              <Rocket size={19} />
              <div>
                <strong>Instant Delivery</strong>
                <span>Get instantly</span>
              </div>
            </article>
            <article>
              <ShieldCheck size={19} />
              <div>
                <strong>Secure Payment</strong>
                <span>100% secure</span>
              </div>
            </article>
            <article>
              <RefreshCw size={19} />
              <div>
                <strong>Refund Policy</strong>
                <span>7-day return</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="product-detail-benefit-strip">
        <article>
          <ShieldCheck size={25} />
          <div>
            <strong>100% Secure Checkout</strong>
            <span>Your data is safe with us</span>
          </div>
        </article>
        <article>
          <Rocket size={25} />
          <div>
            <strong>Instant Delivery</strong>
            <span>Get your product instantly</span>
          </div>
        </article>
        <article>
          <Truck size={25} />
          <div>
            <strong>24/7 Support</strong>
            <span>We're here to help</span>
          </div>
        </article>
        <article>
          <Award size={25} />
          <div>
            <strong>Satisfaction Guaranteed</strong>
            <span>Quality you can trust</span>
          </div>
        </article>
      </section>

      <section className="product-reviews-panel">
        <div className="product-reviews-head">
          <div>
            <span>
              <MessageSquare size={17} />
              Customer Reviews
            </span>
            <h2>{Number(stats.rating || 0).toFixed(1)} average rating</h2>
          </div>
          <ProductStars rating={stats.rating} size={20} />
        </div>

        {user?.role === "user" && (
          <form className="product-review-form" onSubmit={handleReviewSubmit}>
            <label>
              Rating
              <select
                value={reviewForm.rating}
                onChange={(event) =>
                  setReviewForm((current) => ({ ...current, rating: event.target.value }))
                }
              >
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </label>
            <label>
              Your Review
              <textarea
                value={reviewForm.comment}
                onChange={(event) =>
                  setReviewForm((current) => ({ ...current, comment: event.target.value }))
                }
                placeholder="Product ke bare mein apna review likhein..."
              />
            </label>
            <button type="submit" disabled={submittingReview}>
              <Send size={16} />
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}

        <div className="product-review-list">
          {reviews.length === 0 ? (
            <p className="product-review-empty">Abhi is product par koi review nahi hai.</p>
          ) : (
            reviews.map((review) => (
              <article className="product-review-card" key={review.id}>
                <div className="product-review-avatar">
                  {String(review.userName || "C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="product-review-meta">
                    <strong>{review.userName}</strong>
                    <ProductStars rating={review.rating} size={14} />
                  </div>
                  <p>{review.comment}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetails;
