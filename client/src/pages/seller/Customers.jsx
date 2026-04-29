import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  PlusCircle,
  Search,
  Star,
  Tag,
} from "lucide-react";
import { getSellerOrders } from "../../services/orderService";
import "./Customers.css";

const ITEMS_PER_PAGE = 5;

const avatarColors = ["violet", "blue", "teal", "amber", "indigo"];

const formatCustomerId = (value, index) => {
  const fallback = String(index + 1).padStart(3, "0");
  return `CUST-${String(value || fallback).slice(-3).toUpperCase().padStart(3, "0")}`;
};

const getCustomerKey = (order) =>
  order.customer?.id || order.customer?.email || order.customer?.name || order.id;

const buildCustomers = (orders) => {
  const customerMap = new Map();

  orders.forEach((order) => {
    const key = getCustomerKey(order);
    const existing = customerMap.get(key);
    const currentTotal = Number(order.sellerTotal || 0);
    const currentQuantity = Number(order.sellerQuantity || 0);
    const orderDate = order.createdAt ? new Date(order.createdAt).getTime() : 0;

    if (!existing) {
      customerMap.set(key, {
        sourceId: key,
        name: order.customer?.name || "Customer",
        email: order.customer?.email || "N/A",
        phone: order.phone || "N/A",
        location: order.shippingAddress?.city || order.location || "N/A",
        fullLocation: order.location || "N/A",
        status: "Active",
        totalOrders: 1,
        totalSpent: currentTotal,
        totalItems: currentQuantity,
        latestOrderAt: order.createdAt,
        latestOrderTime: orderDate,
      });
      return;
    }

    existing.totalOrders += 1;
    existing.totalSpent += currentTotal;
    existing.totalItems += currentQuantity;

    if (orderDate > existing.latestOrderTime) {
      existing.latestOrderAt = order.createdAt;
      existing.latestOrderTime = orderDate;
      existing.phone = order.phone || existing.phone;
      existing.location = order.shippingAddress?.city || order.location || existing.location;
      existing.fullLocation = order.location || existing.fullLocation;
    }
  });

  return Array.from(customerMap.values())
    .sort((a, b) => b.latestOrderTime - a.latestOrderTime)
    .map((customer, index) => ({
      ...customer,
      id: formatCustomerId(customer.sourceId, index),
      avatarTone: avatarColors[index % avatarColors.length],
    }));
};

const Customers = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let ignore = false;

    const loadCustomers = async () => {
      try {
        const data = await getSellerOrders();
        if (!ignore) {
          setOrders(data || []);
          setMessage("");
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error.response?.data?.message || "Customers load nahi ho sake");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadCustomers();
    const intervalId = setInterval(loadCustomers, 5000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, []);

  const customers = useMemo(() => buildCustomers(orders), [orders]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) =>
      [
        customer.id,
        customer.name,
        customer.email,
        customer.phone,
        customer.location,
        customer.fullLocation,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleCustomers = filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="seller-customers-page">
      <section className="seller-customers-shell">
        <div className="seller-customers-header">
          <div>
            <h1>Customers</h1>
            <p>Manage your customers and their details</p>
          </div>

          {/* <button type="button" className="seller-customers-add">
            <PlusCircle size={16} />
            Add Customer
          </button> */}
        </div>

        <div className="seller-customers-controls">
          <label className="seller-customers-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={handleSearch}
            />
          </label>

          <button type="button" className="seller-customers-filter active">
            <span className="seller-customers-dot" />
            Status: Active
            <ChevronDown size={14} />
          </button>

          <button type="button" className="seller-customers-filter">
            <MapPin size={16} />
            Location: All
            <ChevronDown size={14} />
          </button>

          <button type="button" className="seller-customers-filter">
            <Tag size={16} />
            Discounts: All
            <ChevronDown size={14} />
          </button>

          <button type="button" className="seller-customers-filter">
            <Star size={16} />
            Wanting: All
            <ChevronDown size={14} />
          </button>

          <button type="button" className="seller-customers-filter-icon" aria-label="Filter">
            <Filter size={18} />
          </button>
        </div>

        <div className="seller-customers-table-card">
          {message && <p className="seller-customers-message">{message}</p>}
          {loading && <p className="seller-customers-empty">Loading customers...</p>}
          {!loading && filteredCustomers.length === 0 && (
            <p className="seller-customers-empty">No customers yet. Customer data will appear after orders.</p>
          )}

          {!loading && filteredCustomers.length > 0 && (
            <>
              <div className="seller-customers-table-wrap">
                <table className="seller-customers-table">
                  <thead>
                    <tr>
                      <th>Customer ID <span>↕</span></th>
                      <th>Name <span>↕</span></th>
                      <th>Email <span>↕</span></th>
                      <th>Phone <span>↕</span></th>
                      <th>Location <span>↕</span></th>
                      <th>Status <span>↕</span></th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleCustomers.map((customer) => (
                      <tr key={customer.sourceId}>
                        <td>
                          <span className="seller-customers-id">{customer.id}</span>
                        </td>
                        <td>
                          <div className="seller-customers-name-cell">
                            <span className={`seller-customers-avatar ${customer.avatarTone}`}>
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                            <span>{customer.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="seller-customers-info-cell">
                            <Mail size={15} />
                            <span>{customer.email}</span>
                          </div>
                        </td>
                        <td>
                          <div className="seller-customers-info-cell">
                            <Phone size={15} />
                            <span>{customer.phone}</span>
                          </div>
                        </td>
                        <td>
                          <div className="seller-customers-info-cell">
                            <MapPin size={15} />
                            <span>{customer.location}</span>
                          </div>
                        </td>
                        <td>
                          <span className="seller-customers-status">
                            <i />
                            {customer.status}
                          </span>
                        </td>
                        <td>
                          <button type="button" className="seller-customers-action">
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="seller-customers-footer">
                <p>
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredCustomers.length)} of{" "}
                  {filteredCustomers.length} customers
                </p>

                <div className="seller-customers-pagination">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        type="button"
                        key={page}
                        className={currentPage === page ? "active" : ""}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <button type="button" className="seller-customers-page-size">
                  10 / page
                  <ChevronDown size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Customers;
