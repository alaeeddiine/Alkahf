import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import { db } from "../firebase/config";
import {
  FaBook,
  FaShoppingCart,
  FaUsers,
  FaArrowUp,
  FaChartLine,
  FaChevronRight,
  FaRegCalendarAlt
} from "react-icons/fa";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    books: 0,
    orders: 0,
    newsletter: 0,
    revenue: 0,
  });

  const [latestBooks, setLatestBooks] = useState([]);
  const [latestOrders, setLatestOrders] = useState([]);
  const [latestSubs, setLatestSubs] = useState([]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "--:--";
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Date inconnue";
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString("fr-FR");
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [booksSnap, ordersSnap, newsSnap] = await Promise.all([
          getDocs(collection(db, "books")),
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "newsletter")),
        ]);

        const totalRevenue = ordersSnap.docs.reduce(
          (acc, doc) => acc + (doc.data().total || 0),
          0
        );

        setStats({
          books: booksSnap.size,
          orders: ordersSnap.size,
          newsletter: newsSnap.size,
          revenue: totalRevenue,
        });

        const qBooks = query(
          collection(db, "books"),
          orderBy("createdAt", "desc"),
          limit(4)
        );

        const qOrders = query(
          collection(db, "orders"),
          orderBy("createdAt", "desc"),
          limit(4)
        );

        const qNews = query(
          collection(db, "newsletter"),
          orderBy("createdAt", "desc"),
          limit(4)
        );

        const [bSnap, oSnap, nSnap] = await Promise.all([
          getDocs(qBooks),
          getDocs(qOrders),
          getDocs(qNews),
        ]);

        setLatestBooks(
          bSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );

        setLatestOrders(
          oSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );

        setLatestSubs(
          nSnap.docs.map((d) => ({
            id: d.id,
            email: d.data().email,
            joinedAt: d.data().createdAt,
          }))
        );
      } catch (err) {
        console.error("Admin Dashboard Error:", err);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="intelligence-hub">
      <header className="hub-header">
        <div className="welcome-text">
          <h1>Tableau de Bord Stratégique</h1>
          <p>Analyse des performances en temps réel.</p>
        </div>
        <div className="date-display">
          <FaRegCalendarAlt />
          <span>
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
      </header>

      <section className="metrics-deck">
        <div className="glass-card metric-item highlight">
          <div className="metric-content">
            <span className="label">Chiffre d'Affaires</span>
            <div className="value">
              {stats.revenue.toLocaleString()} <small>€</small>
            </div>
            <div className="trend positive">
              <FaArrowUp /> 12.5%
            </div>
          </div>
          <div className="metric-icon-box">
            <FaChartLine />
          </div>
        </div>

        <div className="glass-card metric-item">
          <div className="metric-content">
            <span className="label">Commandes</span>
            <div className="value">{stats.orders}</div>
          </div>
          <div className="metric-icon-box">
            <FaShoppingCart />
          </div>
        </div>

        <div className="glass-card metric-item">
          <div className="metric-content">
            <span className="label">Abonnés</span>
            <div className="value">{stats.newsletter}</div>
          </div>
          <div className="metric-icon-box">
            <FaUsers />
          </div>
        </div>

        <div className="glass-card metric-item">
          <div className="metric-content">
            <span className="label">Livres</span>
            <div className="value">{stats.books}</div>
          </div>
          <div className="metric-icon-box">
            <FaBook />
          </div>
        </div>
      </section>

      <div className="operations-grid">
        {/* ORDERS */}
        <div className="glass-panel stream-card">
          <div className="panel-top">
            <h3>Dernières Commandes</h3>
            <Link to="/admin/orders" className="hub-btn-sm">
              Voir tout <FaChevronRight />
            </Link>
          </div>
          <div className="stream-body">
            {latestOrders.map((o) => (
              <div className="stream-row" key={o.id}>
                <div className="stream-info">
                  <strong>{o.customerName || "Client"}</strong>
                  <span>{o.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="stream-amount">{o.total} €</div>
                <div className="stream-time">
                  {formatTime(o.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOOKS */}
        <div className="glass-panel inventory-card">
          <div className="panel-top">
            <h3>Derniers Livres</h3>
            <Link to="/admin/books" className="hub-btn-sm">
              Inventaire <FaChevronRight />
            </Link>
          </div>
          <div className="inventory-stack">
            {latestBooks.map((b) => (
              <div className="asset-mini-card" key={b.id}>
                <div className="asset-preview">
                  <img
                    src={b.images?.[0] || b.image || "/placeholder.jpg"}
                    alt={b.title}
                  />
                </div>
                <div className="asset-details">
                  <strong>{b.title}</strong>
                  <p>{b.author}</p>
                </div>
                <div className="asset-price">{b.price} €</div>
              </div>
            ))}
          </div>
        </div>

        {/* NEWSLETTER */}
        <div className="glass-panel audience-card">
          <div className="panel-top">
            <h3>Nouveaux Abonnés</h3>
            <Link to="/admin/newsletter" className="hub-btn-sm">
              Marketing <FaChevronRight />
            </Link>
          </div>
          <div className="audience-list">
            {latestSubs.length === 0 ? (
              <p className="empty-state">Aucun nouvel abonné</p>
            ) : (
              latestSubs.map((s) => (
                <div className="audience-item" key={s.id}>
                  <div className="audience-meta">
                    <strong>{s.email}</strong>
                    <span>Le {formatDate(s.joinedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
