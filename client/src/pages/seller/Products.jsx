import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  Eye,
  Filter,
  Grid2x2,
  List,
  Package2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { deleteProduct, getSellerProducts } from "../../services/productService";
import "./Product.css";

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const getProductRating = (product, index) => {
  if (typeof product.rating === "number") {
    return product.rating.toFixed(1);
  }

  return (4.8 - index * 0.1).toFixed(1);
};

const getProductViews = (product, index) => {
  if (typeof product.views === "number") {
    return product.views;
  }

  return 120 + index * 34;
};

const getProductStatus = (product) => {
  if (product.stock > 0) {
    return "Active";
  }

  return "Out of Stock";
};

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        const items = await getSellerProducts();
        if (!ignore) {
          setProducts(items);
        }
      } catch (error) {
        if (!ignore) {
          setMessage(
            error.response?.data?.message || "Unable to load seller products"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  const sortedProducts = useMemo(
    () =>
      [...products].sort(
        (left, right) =>
          new Date(right.createdAt || 0).getTime() -
          new Date(left.createdAt || 0).getTime()
      ),
    [products]
  );

  const featuredProduct = sortedProducts[0];

  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
    [products]
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    try {
      await deleteProduct(id);
      setProducts((current) => current.filter((product) => product.id !== id));
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete product");
    }
  };

  return (
    <section className="seller-products-page">
      <div className="seller-products-shell">
        <div className="seller-products-header">
          <div className="seller-products-title">
            <span className="seller-products-icon">
              <Package2 size={18} />
            </span>

            <div>
              <h1>Products</h1>
              <p>Manage and organize your products</p>
            </div>
          </div>

          <div className="seller-products-header-actions">
            <button type="button" className="seller-filter-btn">
              <Filter size={16} />
              Filter
            </button>

            <button
              type="button"
              onClick={() => navigate("/seller/products/new")}
              className="seller-add-product-btn"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>
        </div>

        {message && <p className="seller-products-message">{message}</p>}
        {loading && (
          <p className="seller-products-loading">Loading products...</p>
        )}

        {!loading && products.length === 0 && (
          <div className="seller-products-empty">
            No products yet. Add your first product and it will show on the user
            shop automatically.
          </div>
        )}

        {!loading && featuredProduct && (
          <div className="seller-products-feature-card">
            <div className="seller-products-feature-main">
              <img
                src={
                  featuredProduct.image ||
                  featuredProduct.images?.[0] ||
                  "https://placehold.co/300x300?text=Product"
                }
                alt={featuredProduct.name}
                className="seller-products-feature-image"
              />

              <div className="seller-products-feature-copy">
                <span className="seller-products-badge">
                  <Star size={12} />
                  {featuredProduct.featured ? "Featured" : "Newest"}
                </span>

                <h2>{featuredProduct.name}</h2>

                <div className="seller-products-subtitle">
                  <Package2 size={14} />
                  Seller Product
                </div>

                <p>
                  {featuredProduct.description ||
                    featuredProduct.shortDesc ||
                    "A polished product listing ready for your storefront."}
                </p>

                <strong>{featuredProduct.stock} in stock</strong>

                <div className="seller-products-tags">
                  <span>{featuredProduct.category}</span>
                  {featuredProduct.brand && <span>{featuredProduct.brand}</span>}
                </div>
              </div>
            </div>

            <div className="seller-products-feature-side">
              <div className="seller-products-stat-card">
                <span>{formatCurrency(featuredProduct.price)}</span>
                <small>Price</small>
              </div>

              <div className="seller-products-stat-card">
                <span>
                  {getProductRating(featuredProduct, 0)}
                  <Star size={12} fill="currentColor" />
                </span>
                <small>Rating</small>
              </div>

              <div className="seller-products-stat-card">
                <span>{getProductViews(featuredProduct, 0)}</span>
                <small>Views</small>
              </div>
            </div>

            <div className="seller-products-feature-actions">
              <button
                type="button"
                className="action-btn seller-accent-action"
                onClick={() => setMessage("Edit screen is not added yet.")}
              >
                <Pencil size={16} />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(featuredProduct.id)}
                className="action-btn seller-danger-action"
              >
                <Trash2 size={16} />
              </button>

              <button
                type="button"
                className="action-btn seller-view-action"
                onClick={() => setMessage("Preview screen is not added yet.")}
              >
                <Eye size={16} />
              </button>
            </div>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="seller-products-table-card">
            <div className="seller-products-table-header">
              <div>
                <div className="seller-products-section-title">
                  <h3>All Products</h3>
                  <span>{products.length}</span>
                </div>
                <p>Here's all your products in one place.</p>
              </div>

              <div className="seller-products-table-controls">
                <button type="button" className="seller-sort-btn">
                  <ArrowUpDown size={14} />
                  Newest First
                </button>

                <div className="seller-products-view-toggle">
                  <button
                    type="button"
                    className={viewMode === "grid" ? "active" : ""}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid2x2 size={15} />
                  </button>
                  <button
                    type="button"
                    className={viewMode === "list" ? "active" : ""}
                    onClick={() => setViewMode("list")}
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            <div className="seller-products-table-wrap">
              <table className="seller-products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product, index) => (
                    <tr key={product.id}>
                      <td>
                        <div className="seller-product-cell">
                          <img
                            src={
                              product.image ||
                              product.images?.[0] ||
                              "https://placehold.co/140x140?text=Product"
                            }
                            alt={product.name}
                          />

                          <div>
                            <strong>{product.name}</strong>
                            <span>
                              {product.description ||
                                product.shortDesc ||
                                "Premium quality product"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="seller-chip">{product.category}</span>
                      </td>
                      <td>{formatCurrency(product.price)}</td>
                      <td className="seller-stock-text">
                        {product.stock} in stock
                      </td>
                      <td>
                        <div className="seller-rating-cell">
                          {getProductRating(product, index)}
                          <Star size={12} fill="currentColor" />
                        </div>
                      </td>
                      <td>
                        <span
                          className={`seller-status-pill ${
                            product.stock > 0 ? "active" : "inactive"
                          }`}
                        >
                          {getProductStatus(product)}
                        </span>
                      </td>
                      <td>
                        <div className="seller-table-actions">
                          <button
                            type="button"
                            className="action-btn seller-accent-action"
                            onClick={() =>
                              setMessage("Edit screen is not added yet.")
                            }
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="action-btn seller-danger-action"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="action-btn seller-view-action"
                            onClick={() =>
                              setMessage("Preview screen is not added yet.")
                            }
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="seller-products-table-footer">
              <p>
                Showing 1 to {products.length} of {products.length} results
              </p>

              <div className="seller-products-pagination">
                <button type="button">{"<"}</button>
                <button type="button" className="active">
                  1
                </button>
                <button type="button">{">"}</button>
              </div>

              <button type="button" className="seller-page-size">
                {Math.min(10, Math.max(products.length, 1))} / page
              </button>
            </div>

            <div className="seller-products-summary">
              <span>{products.length} total products</span>
              <span>{totalStock} total stock</span>
              <span>{products.filter((product) => product.featured).length} featured</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
