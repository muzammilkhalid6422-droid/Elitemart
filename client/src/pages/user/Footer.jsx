import { Link } from "react-router-dom";
import {
  ChevronRight,
  Headphones,
  Mail,
  RotateCcw,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { splitBrandName, useBranding } from "../../context/BrandingContext";
import "./Footer.css";

const marketplaceLinks = [
  { label: "Home", path: "/home" },
  { label: "Shop", path: "/shop" },
  { label: "Cart", path: "/cart" },
  { label: "Wishlist", path: "/favorites" },
  { label: "All Products", path: "/shop" },
  { label: "Deals & Offers", path: "/shop" },
];

const supportLinks = [
  "Help Center",
  "FAQs",
  "Contact Us",
  "Shipping & Delivery",
  "Returns & Refunds",
  "Privacy Policy",
];

const benefits = [
  { title: "Fast Delivery", text: "Quick delivery across Pakistan", icon: Truck },
  { title: "Secure Payments", text: "100% secure payment methods", icon: ShieldCheck },
  { title: "Easy Returns", text: "7-day easy return policy", icon: RotateCcw },
  { title: "24/7 Support", text: "We're here to help anytime", icon: Headphones },
];

const Footer = () => {
  const { branding } = useBranding();
  const brandName = splitBrandName(branding.marketplaceName);

  return (
    <footer className="footer">
      <div className="footer-shell">
        <section className="footer-main">
          <div className="footer-brand-block">
            <h2 className="footer-logo">
              {brandName.primary}<span>{brandName.accent || "."}</span>
            </h2>
            <p className="footer-text">
              Pakistan&apos;s premium marketplace for gadgets, accessories and smart devices.
            </p>
            <div className="footer-social" aria-label="Social links">
              <a href="#" aria-label="Facebook">f</a>
              <a href="#" aria-label="Instagram">◎</a>
              <a href="#" aria-label="Twitter">t</a>
              <a href="#" aria-label="YouTube">▶</a>
            </div>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">
              <Store size={17} />
              Marketplace
            </h3>
            <ul className="footer-links">
              {marketplaceLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.path}>
                    {link.label}
                    <ChevronRight size={15} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">
              <ShieldCheck size={17} />
              Support
            </h3>
            <ul className="footer-links">
              {supportLinks.map((link) => (
                <li key={link}>
                  <a href="#">
                    {link}
                    <ChevronRight size={15} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-newsletter">
            <h3 className="footer-title">
              <Mail size={17} />
              Newsletter
            </h3>
            <p>Subscribe to get the latest updates, exclusive offers and more.</p>
            <form className="footer-input-box">
              <label>
                <input type="email" placeholder="Enter your email" />
                <Mail size={17} />
              </label>
              <button type="submit">Subscribe</button>
            </form>
            <small>
              <ShieldCheck size={13} />
              We respect your privacy. Unsubscribe anytime.
            </small>
          </div>
        </section>

        <section className="footer-benefits">
          {benefits.map((item) => (
            <article key={item.title}>
              <span>
                <item.icon size={23} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="footer-bottom">
          <p>
            © {new Date().getFullYear()} <Link to="/home">{branding.marketplaceName}.</Link> All rights reserved.
          </p>
          <nav>
            <a href="#">Terms & Conditions</a>
            <i />
            <a href="#">Privacy Policy</a>
            <i />
            <a href="#">Sitemap</a>
          </nav>
          <div className="footer-payments" aria-label="Payment methods">
            <span>VISA</span>
            <span>●●</span>
            <span>easypaisa</span>
            <span>JazzCash</span>
          </div>
        </section>
      </div>
    </footer>
  );
};

export default Footer;
