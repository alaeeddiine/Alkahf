import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { 
  FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaEye, 
  FaUser, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaShoppingBag 
} from "react-icons/fa";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const ordersCollection = collection(db, "orders");

  const loadOrders = async () => {
    const snap = await getDocs(ordersCollection);
    setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  const toggleStatus = async (order, newStatus) => {
    try {
      const ref = doc(db, "orders", order.id);
      await updateDoc(ref, { status: newStatus });
      loadOrders();
      setSelectedOrder({ ...order, status: newStatus });
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  return (
    <div className="admin-page-container">
      {/* HEADER SECTION */}
      <header className="hub-header-premium">
        <div className="title-group">
          <span className="overline">Sales Management</span>
          <h1>Gestion des Commandes</h1>
        </div>

        <div className="filter-pill-group">
          <button 
            className={`filter-pill ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            Tout
          </button>
          <button 
            className={`filter-pill pending ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            <FaHourglassHalf /> En cours
          </button>
          <button 
            className={`filter-pill confirmed ${filterStatus === "confirmed" ? "active" : ""}`}
            onClick={() => setFilterStatus("confirmed")}
          >
            <FaCheckCircle /> Confirmé
          </button>
          <button 
            className={`filter-pill rejected ${filterStatus === "rejected" ? "active" : ""}`}
            onClick={() => setFilterStatus("rejected")}
          >
            <FaTimesCircle /> Refusé
          </button>
        </div>
      </header>

      {/* ORDERS INVENTORY */}
      <div className="inventory-card">
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaShoppingBag className="gold-text" />
            <span className="auth-subtitle">Transactions Récentes</span>
          </div>
          <span className="count-badge">{filteredOrders.length} Commandes</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "#a1a1aa" }}>
                    Aucune commande trouvée.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="book-cell">
                        <div className="order-avatar">
                          {order.fullName ? order.fullName.charAt(0) : "?"}
                        </div>
                        <div>
                          <span className="b-title">{order.fullName || "Inconnu"}</span>
                          <span className="b-author">ID: #{order.id.slice(0, 6)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info-cell">
                        <span><FaPhoneAlt size={10} /> {order.phone || "-"}</span>
                        <span><FaEnvelope size={10} /> {order.email || "-"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="price-tag">{order.total || 0} €</span>
                    </td>
                    <td>
                      <span className={`status-badge ${order.status}`}>
                        {order.status === "pending" ? "En cours" : 
                         order.status === "confirmed" ? "Confirmé" : "Refusé"}
                      </span>
                    </td>
                    <td>
                      <div className="action-cluster">
                        <button className="edit-btn" onClick={() => setSelectedOrder(order)}>
                          <FaEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP DETAILS */}
      {selectedOrder && (
        <div className="popup-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="popup-card order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2 className="auth-title">Détails <span className="gold-text">Commande</span></h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="popup-form">
              <div className="order-grid-info">
                <div className="info-item">
                  <label><FaUser /> Client</label>
                  <p>{selectedOrder.fullName}</p>
                </div>
                <div className="info-item">
                  <label><FaPhoneAlt /> Téléphone</label>
                  <p>{selectedOrder.phone}</p>
                </div>
                <div className="info-item full">
                  <label><FaMapMarkerAlt /> Adresse</label>
                  <p>{selectedOrder.address}</p>
                </div>
              </div>

              <div className="order-items-box">
                <h3 className="premium-tag">Articles Commandés</h3>
                <div className="items-list-premium">
                  {selectedOrder?.items?.map((item, idx) => (
                    <div key={idx} className="item-row">
                      <span>{item.title} <strong>× {item.quantity}</strong></span>
                      <span className="item-price-small">{item.price * (item.quantity || 1)} €</span>
                    </div>
                  ))}
                  <div className="item-row total-row">
                    <span>Total</span>
                    <span className="gold-text">{selectedOrder.total} €</span>
                  </div>
                </div>
              </div>

              <div className="modal-actions-premium">
                <button 
                  className="btn-confirm"
                  onClick={() => toggleStatus(selectedOrder, "confirmed")}
                >
                  <FaCheckCircle /> Confirmer
                </button>
                <button 
                  className="btn-reject"
                  onClick={() => toggleStatus(selectedOrder, "rejected")}
                >
                  <FaTimesCircle /> Refuser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;