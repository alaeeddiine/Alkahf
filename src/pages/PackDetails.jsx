import React, { useState, useEffect, useContext } from "react"; 
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowRight, FaChevronLeft, FaChevronRight, FaShoppingCart, FaMinus, FaPlus } from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const TAX_RATE = 21;
const getPriceWithTax = (price) => +(price * (1 + TAX_RATE / 100)).toFixed(2);

const PackDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { packId, packData } = location.state || {};
  const { addToCart } = useContext(CartContext);

  const [pack, setPack] = useState(packData || null);
  const [quantity, setQuantity] = useState(1);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // ---------------- LOAD PACK ----------------
  useEffect(() => {
    if (!pack && packId) {
      const fetchPack = async () => {
        try {
          const docRef = doc(db, "packs", packId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setPack({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchPack();
    }
  }, [pack, packId]);

  // ---------------- CAROUSEL ----------------
  const handlePrevImg = () => {
    setActiveImgIdx(prev => (prev === 0 ? (pack.images?.length || 1) - 1 : prev - 1));
  };
  const handleNextImg = () => {
    setActiveImgIdx(prev => (prev === (pack.images?.length || 1) - 1 ? 0 : prev + 1));
  };

  // ---------------- SWIPE MOBILE ----------------
  useEffect(() => {
    const imgContainer = document.querySelector(".pack-images .main-img");
    if (!imgContainer) return;

    let startX = 0;
    let endX = 0;

    const handleTouchStart = (e) => { startX = e.touches[0].clientX; };
    const handleTouchMove = (e) => { endX = e.touches[0].clientX; };
    const handleTouchEnd = () => {
      const deltaX = endX - startX;
      if (Math.abs(deltaX) > 50) deltaX > 0 ? handlePrevImg() : handleNextImg();
      startX = 0; endX = 0;
    };

    imgContainer.addEventListener("touchstart", handleTouchStart);
    imgContainer.addEventListener("touchmove", handleTouchMove);
    imgContainer.addEventListener("touchend", handleTouchEnd);

    return () => {
      imgContainer.removeEventListener("touchstart", handleTouchStart);
      imgContainer.removeEventListener("touchmove", handleTouchMove);
      imgContainer.removeEventListener("touchend", handleTouchEnd);
    };
  }, [activeImgIdx, pack]);

  if (!pack) return <p>Chargement du pack...</p>;

  // ---------------- ACTIONS ----------------
  const handleAddToCart = () => {
    addToCart({ ...pack, quantity });
    alert(`${quantity} exemplaire(s) ajouté(s) au panier`);
  };

  const handleCheckout = () => {
    navigate("/checkout", { state: { pack, quantity } });
  };

  // ---------------- PROMO BADGE ----------------
  const hasDiscount = pack.promoPrice && pack.promoPrice < pack.price;
  const discountPercent = hasDiscount ? Math.round(100 - (pack.promoPrice / pack.price) * 100) : 0;

  return (
    <div className="book-details-page"> {/* same as book-details-page */}
      <div className="container-inner">
        <div className="book-details-grid">

          {/* ---------------- IMAGE CAROUSEL ---------------- */}
          <div className="book-images"> {/* same as book-images */}
            {pack.images?.length > 1 ? (
              <div className="carousel-container">
                <img src={pack.images[activeImgIdx]} alt={`${pack.title} ${activeImgIdx + 1}`} className="main-img" />
                <button className="prev-btn" onClick={handlePrevImg}><FaChevronLeft /></button>
                <button className="next-btn" onClick={handleNextImg}><FaChevronRight /></button>
                <div className="thumbnail-row">
                  {pack.images.map((img, idx) => (
                    <img key={idx} src={img} className={`thumb ${activeImgIdx === idx ? "active-thumb" : ""}`} onClick={() => setActiveImgIdx(idx)} alt={`thumb ${idx + 1}`} />
                  ))}
                </div>
              </div>
            ) : (
              <img src={pack.images?.[0] || "/placeholder.jpg"} alt={pack.title} className="main-img" />
            )}
          </div>

          {/* ---------------- INFO PANEL ---------------- */}
          <div className="book-info-panel"> {/* same as book-info-panel */}
            {hasDiscount && <div className="discount-badge">-{discountPercent}%</div>}
            <h1 className="book-title">{pack.title}</h1>

            {pack.includedBooks?.length > 0 && (
              <p className="author">{pack.includedBooks.length} livres inclus</p>
            )}

            {/* Quantité + prix */}
            <div className="quantity-price">
              <label>Quantité :</label>

              <div className="qty-stepper">
                <button
                  onClick={() =>
                    setQuantity(prev => Math.max(1, prev - 1))
                  }
                  disabled={quantity <= 1}
                >
                  <FaMinus />
                </button>

                <span>{quantity}</span>

                <button
                  onClick={() =>
                    setQuantity(prev => Math.min(5, prev + 1))
                  }
                  disabled={quantity >= 5}
                >
                  <FaPlus />
                </button>
              </div>

              {quantity > 5 && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  Quantité maximale : 5
                </p>
              )}

              {hasDiscount && <div className="discount-badge">-{discountPercent}%</div>}

              <span className="price-packs">
                {hasDiscount ? (
                  <>
                    <s>
                      {(getPriceWithTax(pack.price) * quantity).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </s>{" "}
                    <strong>
                      {(getPriceWithTax(pack.promoPrice) * quantity).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </strong>
                  </>
                ) : (
                  <span>
                    {(getPriceWithTax(pack.price) * quantity).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                )}
              </span>
            </div>


            {/* Actions */}
            <div className="book-actions"> {/* same as book-actions */}
              <button
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={quantity > pack.stock}
              >
                Ajouter au panier <FaShoppingCart style={{ marginLeft: "8px" }} />
              </button>
              <button className="btn btn-sec-book" onClick={handleCheckout}>
                Passer au Paiement <FaArrowRight style={{ marginLeft: "8px" }} />
              </button>
            </div>

            {/* Politique de retour */}
            <div className="return-badge">
              <center><strong> Expédition sous 48h - Frais offerts dés 100€ d'achat</strong></center> <br />
              <strong> Politique de retour:</strong> Vous disposez de 14 jours pour retourner votre Articles après sa réception. 
            </div>

            {/* Description */}
            <div className="book-description">
              <h2>Description</h2>
              <p>{pack.description || "aucune description pour le moment"}</p>
            </div>

            {/* Livres inclus */}
            {pack.includedBooks?.length > 0 && (
              <div className="pack-included-books">
                <h3>Livres inclus</h3>
                <ul>
                  {pack.includedBooks.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PackDetails;
