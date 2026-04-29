import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfile } from "../services/authService";
import { hasPremiumPlan } from "../services/planService";
import { getRoleSession, setActiveSession } from "../utils/authSession";

const getStoredSeller = () => {
  return getRoleSession("seller")?.user || null;
};

const ProtectedPremiumRoute = ({ children, seller }) => {
  const [currentSeller, setCurrentSeller] = useState(() => seller || getStoredSeller());
  const [checkingProfile, setCheckingProfile] = useState(() => !hasPremiumPlan(seller || getStoredSeller()));

  useEffect(() => {
    let ignore = false;
    const token = getRoleSession("seller")?.token;

    if (!token) {
      setCheckingProfile(false);
      return () => {
        ignore = true;
      };
    }

    const storedSeller = getStoredSeller();
    setActiveSession("seller");

    if (hasPremiumPlan(storedSeller)) {
      setCurrentSeller(storedSeller);
      setCheckingProfile(false);
      return () => {
        ignore = true;
      };
    }

    const syncPremiumStatus = async () => {
      try {
        setCheckingProfile(true);
        const response = await getProfile();
        const profileUser = response.data?.user;

        if (!ignore && profileUser?.role === "seller") {
          localStorage.setItem("user", JSON.stringify(profileUser));
          setCurrentSeller(profileUser);
        }
      } catch {
        if (!ignore) {
          setCurrentSeller(storedSeller);
        }
      } finally {
        if (!ignore) {
          setCheckingProfile(false);
        }
      }
    };

    syncPremiumStatus();

    return () => {
      ignore = true;
    };
  }, [seller]);

  if (!getRoleSession("seller")?.token || (!currentSeller && !checkingProfile)) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPremiumPlan(currentSeller)) {
    if (checkingProfile) {
      return <div className="seller-premium-loading">Checking subscription...</div>;
    }

    return <Navigate to="/seller/settings" replace />;
  }

  return children;
};

export default ProtectedPremiumRoute;
