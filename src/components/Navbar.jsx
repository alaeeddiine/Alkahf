import React, { useContext, useEffect, useState, useMemo } from "react"; 
import { Link, NavLink } from "react-router-dom";
import { 
  FaShoppingCart, 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaInfoCircle, 
  FaBook, 
  FaBox 
} from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import logo from "../assets/logo.png";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const NAV_LINKS = [
  { path: "/", label: "Accueil", icon: <FaHome /> },
  { path: "/books", label: "Librairie", icon: <FaBook /> },
  { path: "/packs", label: "Packs", icon: <FaBox /> },
  { path: "/about", label: "À Propos", icon: <FaInfoCircle /> },
];

// ---------- Helpers ----------
const getRemainingDays = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  const target = new Date(endDate);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : 0;
};

const translateTarget = (value) => {
  switch (value) {
    case "all": return "Tout le site";
    case "books": return "Livres";
    case "packs": return "Packs";
    default: return value;
  }
};

const formatTarget = (appliesTo) => {
  if (!appliesTo) return "Tout le site";
  if (Array.isArray(appliesTo)) {
    return appliesTo.map(v => translateTarget(v)).join(", ");
  }
  return translateTarget(appliesTo);
};

const Navbar = ({ onCartClick }) => {
  const { cartItems = [] } = useContext(CartContext) || {};
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [promos, setPromos] = useState([]);
  const [currentPromo, setCurrentPromo] = useState(0);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cartItems]
  );

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch only active "general" promos and "announce"
  useEffect(() => {
    const q = query(
      collection(db, "promos"), 
      where("active", "==", true)
    );
    const unsub = onSnapshot(q, snap => {
      // filter only general or announce
      const filtered = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.type === "general" || p.type === "announce");
      setPromos(filtered);
      setCurrentPromo(0);
    });
    return () => unsub();
  }, []);

  // Promo slider interval
  useEffect(() => {
    if (promos.length <= 1) return;
    const interval = setInterval(
      () => setCurrentPromo(prev => (prev + 1) % promos.length),
      4000
    );
    return () => clearInterval(interval);
  }, [promos]);

  const formatPromoText = (promo) => {
    if (!promo) return null;

    if (promo.type === "announce") {
      return <strong>{promo.title}</strong>;
    }

    // type general
    const daysLeft = getRemainingDays(promo.endDate);
    return (
      <>
        <strong>{promo.title}</strong>
        {promo.amount && ` -${promo.amount}`}
        {` sur ${formatTarget(promo.appliesTo)}`}
        {daysLeft !== null && (
          ` | ⏳ Plus que ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`
        )}
      </>
    );
  };

  return (
    <>
      {/* --- PROMO BAR --- */}
      {promos.length > 0 && (
        <div className="royal-promo-bar">
          <p className="promo-animate">
            {formatPromoText(promos[currentPromo])}
          </p>
        </div>
      )}

      {/* --- MAIN NAVBAR --- */}
      <header className={`royal-navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          
          {/* LOGO */}
          <Link to="/" className="nav-logo">
            <img src={logo} alt="Logo" />
            <div className="logo-text">
              <span className="brand">ALKAHF</span>
              <span className="arabic">مكتبة الكهف</span>
            </div>
          </Link>

          {/* DESKTOP LINKS */}
          <nav className="nav-desktop">
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => isActive ? "active" : ""}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ACTIONS */}
          <div className="nav-actions">
            <button className="action-btn cart" onClick={onCartClick}>
              <FaShoppingCart />
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </button>

            <button
              className="action-btn menu-toggle"
              onClick={() => setIsMobileOpen(true)}
            >
              <FaBars />
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE DRAWER --- */}
      <div
        className={`drawer-overlay ${isMobileOpen ? "show" : ""}`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside className={`mobile-drawer ${isMobileOpen ? "open" : ""}`}>
        <div className="drawer-top">
          <img src={logo} alt="Logo" className="drawer-logo" />
          <button
            className="close-btn"
            onClick={() => setIsMobileOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        <div className="drawer-links">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Navbar;
