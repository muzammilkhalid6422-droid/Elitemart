import { useState, useEffect } from "react";
import { Search, Mail, Trash2 } from "lucide-react";
import api from "../../services/api";
import "./AdminPages.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id, name, email) => {
    const displayName = name || email || "this user";
    if (window.confirm(`Are you sure you want to permanently delete "${displayName}"?`)) {
      try {
        setDeletingId(id);
        const res = await api.delete(`/admin/users/${id}`);
        setMessage(res.data?.message || "User deleted successfully");
        setUsers((current) => current.filter((u) => (u._id || u.id) !== id));
      } catch (error) {
        console.error("Error deleting user:", error);
        alert(error.response?.data?.message || "Failed to delete user");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="admin-loading">Loading users...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Users Management</h1>
        <p>View and manage all registered users</p>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {message && <div className="admin-message" style={{ marginBottom: "16px" }}>{message}</div>}

      <div className="table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-cell">
                      {user.avatar && <img src={user.avatar} alt={user.name} />}
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <Mail size={14} style={{ marginRight: "4px" }} />
                    {user.email}
                  </td>
                  <td>{user.phone || "-"}</td>
                  <td>
                    <span className="status-badge active">Active</span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="delete-user-btn"
                      title="Delete user"
                      disabled={deletingId === (user._id || user.id)}
                      onClick={() => handleDeleteUser(user._id || user.id, user.name, user.email)}
                    >
                      <Trash2 size={14} />
                      <span>{deletingId === (user._id || user.id) ? "Deleting..." : "Delete"}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
