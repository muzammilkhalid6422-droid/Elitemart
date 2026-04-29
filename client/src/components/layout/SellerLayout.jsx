import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { getProfile } from "../../services/authService";
import { clearAuthSession, getRoleSession, setActiveSession } from "../../utils/authSession";
import "./SellerLayout.css";

const SellerLayout = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const restoredSession = getRoleSession("seller");

  if (restoredSession) {
    setActiveSession("seller");
  }

  useEffect(() => {
    const session = getRoleSession("seller");

    if (!session) {
      clearAuthSession("seller");
      navigate("/login", { replace: true });
      return;
    }

    try {
      if (session.user.role !== "seller" || session.user.isApproved === false) {
        clearAuthSession("seller");
        navigate("/login", { replace: true });
        return;
      }
      setActiveSession("seller");
    } catch {
      clearAuthSession("seller");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let ignore = false;

    const syncSellerProfile = async () => {
      try {
        const response = await getProfile();
        const profileUser = response.data?.user;

        if (!ignore && profileUser?.role === "seller") {
          localStorage.setItem("sellerAccount", JSON.stringify(profileUser));
          localStorage.setItem("user", JSON.stringify(profileUser));
        }
      } catch (error) {
        if (!ignore && error.response?.status === 401) {
          clearAuthSession("seller");
          navigate("/login", { replace: true });
        }
      }
    };

    syncSellerProfile();

    return () => {
      ignore = true;
    };
  }, [navigate]);

  return (
    <div className="seller-shell">
      <div className="seller-shell-overlay">
        {open && (
          <div
            className="seller-mobile-overlay"
            onClick={() => setOpen(false)}
          />
        )}

        <div className={`seller-sidebar-drawer ${open ? "open" : ""}`}>
          <Sidebar closeSidebar={() => setOpen(false)} />
        </div>

        <div className="seller-main">
          <Topbar openSidebar={() => setOpen(true)} />

          <main className="seller-content">
            <div className="seller-content-inner">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SellerLayout;
