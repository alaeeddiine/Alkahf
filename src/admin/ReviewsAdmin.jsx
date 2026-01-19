import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FaCheckCircle, FaTimesCircle, FaSearch, FaStar, FaCalendarAlt } from 'react-icons/fa';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // ---------- Fetch Reviews ----------
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
    } catch (error) {
      console.error("Erreur récupération reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // ---------- Filtered Reviews ----------
  const filteredReviews = reviews.filter(r =>
    (r.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.review || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ---------- Count Active ----------
  const activeCount = reviews.filter(r => r.active).length;

  // ---------- Toggle Active ----------
  const toggleActive = async (review) => {
    if (!review.active && activeCount >= 6) {
      alert("Maximum 6 avis actifs.");
      return;
    }

    try {
      const ref = doc(db, "reviews", review.id);
      await updateDoc(ref, {
        active: !review.active,
        updatedAt: serverTimestamp(),
      });

      setReviews(prev =>
        prev.map(r =>
          r.id === review.id ? { ...r, active: !r.active } : r
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-page-container">
      {/* HEADER */}
      <header className="hub-header-premium">
        <div className="title-group">
          <span className="overline">Gestion des Avis</span>
          <h1>Avis Clients</h1>
        </div>
        <div className="action-cluster">
          <div className="search-bar-premium">
            <FaSearch />
            <input
              type="text"
              placeholder="Rechercher un nom, email ou avis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: "10px" }}>
            <span>{activeCount}/6 activées</span>
          </div>
        </div>
      </header>

      {/* TABLE DES AVIS */}
      <div className="inventory-card">
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaStar className="gold-text" />
            <span className="auth-subtitle"> Tableau des Avis</span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Avis</th>
                <th>Note</th>
                <th>Date</th>
                <th>Actif</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="table-loader">Chargement des Avis...</td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table-msg">Aucun avis trouvé.</td>
                </tr>
              ) : (
                filteredReviews.map((rev) => (
                  <tr key={rev.id}>
                    <td>{rev.fullName}</td>
                    <td>{rev.email}</td>
                    <td>{rev.review}</td>
                    <td>
                      <div className="stars">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={s <= rev.rating ? "star filled" : "star"}>★</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell-premium">
                        <FaCalendarAlt className="gold-text" size={12} />
                        {rev.createdAt?.toDate().toLocaleDateString('fr-FR') || '-'}
                      </div>
                    </td>
                    <td>
                      <button
                        className={`status-badge ${rev.active ? 'confirmed' : 'pending'}`}
                        onClick={() => toggleActive(rev)}
                        title={rev.active ? "Désactiver" : "Activer"}
                      >
                        {rev.active ? <FaCheckCircle /> : <FaTimesCircle />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;
