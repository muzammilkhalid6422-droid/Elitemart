import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import UserNavbar from "./UserNavbar";
import { clearAuthSession, getRoleSession, setActiveSession } from "../../utils/authSession";


const UserLayout = () => {
  const navigate = useNavigate();
  const restoredSession = getRoleSession("user");

  if (restoredSession) {
    setActiveSession("user");
  }

  // ✅ AUTO-REDIRECT IF NOT USER
  useEffect(() => {
    const session = getRoleSession("user");

    if (!session) {
      clearAuthSession("user");
      navigate("/login", { replace: true });
      return;
    }

    try {
      if (session.user.role !== "user") {
        clearAuthSession("user");
        navigate("/login", { replace: true });
        return;
      }
      setActiveSession("user");
    } catch (error) {
      clearAuthSession("user");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="user-layout-root min-h-screen bg-[#08111f] text-white">
      <UserNavbar />
      

      <div className="user-layout-content p-6">
        <Outlet />
      </div>
     
    </div>
  );
};

export default UserLayout;
