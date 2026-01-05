import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartPopup from "./components/CartPopup";
import AdminLayout from "./admin/AdminLayout";

import Home from "./pages/Home";
import About from "./pages/About";
import Books from "./pages/Books";
import Packs from "./pages/Packs";
import Checkout from "./pages/Checkout"; 
import LegalNotice from "./pages/LegalNotice";
import PrivacyPolicy from "./pages/PrivacyPolicy";

import Login from "./admin/login";
import AdminDashboard from "./admin/AdminDashboard";
import AdminBooks from "./admin/AdminBooks";
import AdminPacks from "./admin/AdminPacks";
import AdminPromos from "./admin/AdminPromos";
import AdminOrders from "./admin/AdminOrders";
import NewsletterAdmin from "./admin/NewsletterAdmin";

import { onAuthState } from "./firebase/config";
import { CartProvider } from "./context/CartContext";

import "./styles/components.css";
import "./styles/pages.css";
import "./styles/admin.css";

/* ===============================
   🔹 PUBLIC LAYOUT
================================ */
function PublicLayout({ onCartClick, isCartOpen, setIsCartOpen }) {
  return (
    <>
      <Navbar onCartClick={onCartClick} />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <CartPopup
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
}

/* ===============================
   🔐 ADMIN GUARD
================================ */
const ProtectedAdmin = ({ adminUser, loadingAuth }) => {
  if (loadingAuth) {
    return <div className="loading-screen">Chargement...</div>;
  }

  if (!adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

/* ===============================
   🔹 APP
================================ */
function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthState((user) => {
      setAdminUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* 🔹 PUBLIC ROUTES */}
          <Route
            element={
              <PublicLayout
                onCartClick={() => setIsCartOpen(true)}
                isCartOpen={isCartOpen}
                setIsCartOpen={setIsCartOpen}
              />
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/books" element={<Books />} />
            <Route path="/packs" element={<Packs />} />
            <Route path="/checkout" element={<Checkout />} /> 
            <Route path="/LegalNotice" element={<LegalNotice />} />
            <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
          </Route>

          {/* 🔹 ADMIN LOGIN */}
          <Route path="/admin/login" element={<Login />} />

          {/* 🔹 ADMIN PROTECTED ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedAdmin
                adminUser={adminUser}
                loadingAuth={loadingAuth}
              />
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="books" element={<AdminBooks />} />
            <Route path="packs" element={<AdminPacks />} />
            <Route path="promos" element={<AdminPromos />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="newsletter" element={<NewsletterAdmin />} />
          </Route>

          {/* 🔹 FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
