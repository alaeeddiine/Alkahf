import React, { useState, useEffect, useContext } from "react";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { CartContext } from "../context/CartContext";
import {
  FaTimes,
  FaShoppingCart,
  FaShieldAlt,
  FaGlobe,
  FaGem,
  FaBoxOpen
} from "react-icons/fa";

// ----- UTILITAIRES TAXES -----
const TAX_RATE = 21; // %
const getPriceWithTax = (price) => +(price * (1 + TAX_RATE / 100)).toFixed(2);

const PacksClient = () => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const { addToCart } = useContext(CartContext);
  const [currentPage, setCurrentPage] = useState(1);
  const PACKS_PER_PAGE = 6;

  const navigate = useNavigate();

  // ---------- Récupérer les promos générales actives ----------
  const getGeneralPromos = async () => {
    const promosRef = collection(db, "promos");
    const q = query(promosRef, where("active", "==", true), where("type", "==", "general"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  // ---------- Charger les packs avec promo appliquée ----------
  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const q = query(collection(db, "packs"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Appliquer la promo générale si applicable
        const generalPromos = await getGeneralPromos();
        const applicablePromo = generalPromos.find(p => p.appliesTo === 'all' || p.appliesTo === 'packs');

        if (applicablePromo) {
          data = data.map(pack => {
            const basePrice = pack.price; // prix original
            let promoPrice;

            if (applicablePromo.amount.includes('%')) {
              const percent = parseFloat(applicablePromo.amount.replace('%', ''));
              promoPrice = +(basePrice * (1 - percent / 100)).toFixed(2);
            } else {
              promoPrice = +(basePrice - parseFloat(applicablePromo.amount)).toFixed(2);
            }

            promoPrice = promoPrice < 0 ? 0 : promoPrice;

            return { ...pack, promoPrice };
          });
        }

        setPacks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPacks();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("modal-open", !!selectedPack);
    return () => document.body.classList.remove("modal-open");
  }, [selectedPack]);
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, [currentPage]);

  const openDetails = (pack) => {
    setSelectedPack(pack);
    setActiveImgIdx(0);
  };

  const closeDetails = () => setSelectedPack(null);

  const getFinalPrice = (pack) => pack.promoPrice ?? pack.price;
  const getFinalPriceTTC = (pack) => getPriceWithTax(getFinalPrice(pack));

  if (loading) {
    return (
      <div className="cinematic-loader">
        <div className="gold-pulse"></div>
      </div>
    );
  }
  const indexOfLastPack = currentPage * PACKS_PER_PAGE;
  const indexOfFirstPack = indexOfLastPack - PACKS_PER_PAGE;
  const currentPacks = packs.slice(indexOfFirstPack, indexOfLastPack);
  const totalPages = Math.ceil(packs.length / PACKS_PER_PAGE);

  return (
    <div className="cinematic-page">
      <header className="cinematic-hero">
        <div className="hero-visual-bg"></div>
        <div className="hero-content-reveal">
          <span className="hero-tag">L'art du savoir</span>
          <h1>
            Les <span className="gold-text">Collections</span> Alkahf
          </h1>
          <p>
            Plongez dans des univers thématiques curatés pour illuminer votre esprit.
          </p>
        </div>
      </header>

      <main className="container-inner">
        <h2 className="grid-label">Séries Disponibles</h2>

        <div className="cinematic-grid">
          {currentPacks.map(pack => (
            <div
              key={pack.id}
              className="cinematic-card"
              onClick={() => navigate(`/pack/${pack.id}`, { state: { packData: pack } })}
            >
              <div className="card-media">
                <div className="carousel-wrapper">
                  {pack.images?.map((img, idx) => (
                    <img key={idx} src={img} alt={`${pack.title} ${idx + 1}`} className="carousel-image" />
                  ))}
                </div>

                <div className="price-float">
                  {pack.promoPrice ? (
                    <>
                      <s>{getPriceWithTax(pack.price)}€</s>{" "}
                      <b>{getPriceWithTax(pack.promoPrice)}€</b>
                    </>
                  ) : (
                    `${getPriceWithTax(pack.price)}€`
                  )}
                </div>
              </div>

              <div className="card-info">
                <h3>{pack.title}</h3>
                {pack.includedBooks?.length > 0 && (
                  <span className="mini-includes">{pack.includedBooks.length} livres inclus</span>
                )}

                <div className="card-footer-cinematic">
                  <span className="view-link">Voir détails</span>
                  <button
                    className="quick-add"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart({ ...pack, price: getFinalPrice(pack) });
                    }}
                  >
                    <FaShoppingCart />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Précédent
            </button>

            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={`page-btn ${currentPage === idx + 1 ? "active" : ""}`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}

            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Suivant
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PacksClient;
