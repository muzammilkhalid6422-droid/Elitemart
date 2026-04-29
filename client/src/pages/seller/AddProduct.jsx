import { Upload, Plus, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../services/productService";
import "./AddProduct.css";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_DIMENSION = 1600;
const TARGET_IMAGE_SIZE = 1.5 * 1024 * 1024;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Unable to process image"));
    };

    image.src = imageUrl;
  });

const dataUrlSize = (dataUrl) => {
  const base64 = String(dataUrl).split(",")[1] || "";
  const padding = (base64.match(/=*$/) || [""])[0].length;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

const compressImage = async (file) => {
  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.width, image.height)
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  while (dataUrlSize(dataUrl) > TARGET_IMAGE_SIZE && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  return {
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    url: dataUrl,
  };
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    shortDesc: "",
    description: "",
    sku: "",
    brand: "",
    featured: true,
  });
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const categories = ["Electronics", "Clothing", "Shoes"];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (images.length + selectedFiles.length > MAX_IMAGE_COUNT) {
      const msg = "You can upload maximum 5 images only";
      setMessage(msg);
      alert(msg);
      e.target.value = "";
      return;
    }

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_IMAGE_SIZE);

    if (oversizedFile) {
      const msg = "Image cannot be uploaded because file size is larger than 5 MB";
      setMessage(msg);
      alert(msg);
      e.target.value = "";
      return;
    }

    try {
      const preview = await Promise.all(
        selectedFiles.map((file) => compressImage(file))
      );

      setMessage("");
      setImages((current) => [...current, ...preview].slice(0, MAX_IMAGE_COUNT));
    } catch {
      const msg = "Error processing images";
      setMessage(msg);
      alert(msg);
    }

    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async () => {
    if (!product.name || !product.category || !product.price || !product.stock) {
      const msg = "Please fill all required fields";
      setMessage(msg);
      alert(msg);
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await createProduct({
        ...product,
        price: Number(product.price),
        stock: Number(product.stock),
        images: images.map((image) => image.url),
      });

      alert("Product added successfully");
      navigate("/seller/products");
    } catch (error) {
      if (error.response?.status === 413) {
        const msg = "Data size is too large. Please upload smaller images";
        setMessage(msg);
        alert(msg);
      } else {
        const msg =
          error.response?.data?.message || "Unable to save product right now";
        setMessage(msg);
        alert(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-bg text-white min-h-screen p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="title">Add New Product</h1>
          <p className="subtitle">Fill in the details to create product</p>
          {message && <p className="subtitle">{message}</p>}
        </div>

        <div className="flex gap-3">
          <button
            className="btn-cancel"
            onClick={() => navigate("/seller/products")}
          >
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-save" disabled={saving}>
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </div>

      <div className="glass-container">
        <div className="grid md:grid-cols-[260px_1fr] gap-6">
          <div>
            <p className="label">Product Images</p>

            <label className="upload-panel">
              <Upload size={26} />
              <span>Upload Product Image</span>
              <p className="hint">PNG, JPG (Max 5MB)</p>

              <input type="file" hidden multiple onChange={handleImageUpload} />
            </label>

            <div className="preview-grid">
              {images.map((img, index) => (
                <div key={`${img.name}-${index}`} className="img-box">
                  <img src={img.url} alt={img.name} />
                  <button onClick={() => removeImage(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGE_COUNT &&
                [...Array(MAX_IMAGE_COUNT - images.length)].map((_, index) => (
                  <div key={index} className="mini-box">
                    <Plus size={16} />
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Product Name *</label>
              <input
                name="name"
                value={product.name}
                onChange={handleChange}
                className="input"
                placeholder="Enter product name"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="select-wrapper">
                <label className="label">Category *</label>
                <select
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Price *</label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  value={product.price}
                  onChange={handleChange}
                  className="input"
                  placeholder="Price"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Stock *</label>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={product.stock}
                  onChange={handleChange}
                  className="input"
                  placeholder="Quantity"
                />
              </div>

              <div>
                <label className="label">Brand</label>
                <input
                  name="brand"
                  value={product.brand}
                  onChange={handleChange}
                  className="input"
                  placeholder="Brand"
                />
              </div>
            </div>

            <div>
              <label className="label">Short Description</label>
              <textarea
                name="shortDesc"
                value={product.shortDesc}
                onChange={handleChange}
                className="input textarea"
              />
            </div>

            <div>
              <label className="label">Full Description</label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                className="input textarea"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="sku"
                value={product.sku}
                onChange={handleChange}
                className="input"
                placeholder="SKU"
              />
              <div className="input flex items-center text-white/50">
                Images: {images.length}/{MAX_IMAGE_COUNT}
              </div>
            </div>

            <div className="featured-box">
              <input
                type="checkbox"
                name="featured"
                checked={product.featured}
                onChange={handleChange}
              />
              <div>
                <p className="font-medium">Featured Product</p>
                <p className="hint">Feature this product on homepage</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
