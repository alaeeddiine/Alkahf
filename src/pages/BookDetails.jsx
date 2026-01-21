import React, { useState, useEffect, useContext } from "react"; 
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowRight, FaChevronLeft, FaChevronRight, FaShoppingCart, FaPlus, FaMinus} from "react-icons/fa";
import { CartContext } from "../context/CartContext";

const TAX_RATE = 21;
const getPriceWithTax = (price) => +(price * (1 + TAX_RATE / 100)).toFixed(2);

const BookDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookId, bookData } = location.state || {};
  const { addToCart } = useContext(CartContext);

  const [book, setBook] = useState(bookData || null);
  const [quantity, setQuantity] = useState(1);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const totalPrice = book ? getPriceWithTax(book.promoPrice ?? book.price) * quantity : 0;

  // ---------------- LOAD BOOK ----------------
  useEffect(() => {
    if (!book && bookId) {
      // fetch book by id et setBook(fetchedBook)
    }
  }, [book, bookId]);

  // ---------------- CAROUSEL ----------------
  const handlePrevImg = () => {
    setActiveImgIdx(prev => (prev === 0 ? (book.images?.length || 1) - 1 : prev - 1));
  };
  const handleNextImg = () => {
    setActiveImgIdx(prev => (prev === (book.images?.length || 1) - 1 ? 0 : prev + 1));
  };

  // ---------------- SWIPE MOBILE ----------------
  useEffect(() => {
    const imgContainer = document.querySelector(".book-images .main-img");
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
  }, [activeImgIdx, book]);

  if (!book) return <p>Chargement du livre...</p>;

  // ---------------- ACTIONS ----------------
  const handleAddToCart = () => {
    addToCart({ ...book, quantity });
    alert(`${quantity} exemplaire(s) ajouté(s) au panier`);
  };

  const handleCheckout = () => {
    navigate("/checkout", { state: { book, quantity } });
  };

  // ---------------- PROMO BADGE ----------------
  const hasDiscount = book.promoPrice && book.promoPrice < book.price;
  const discountPercent = hasDiscount ? Math.round(100 - (book.promoPrice / book.price) * 100) : 0;

  return (
    <div className="book-details-page">
      <div className="container-inner">
        <div className="book-details-grid">

          {/* ---------------- IMAGE CAROUSEL ---------------- */}
          <div className="book-images">
            {book.images?.length > 1 ? (
              <div className="carousel-container">
                <img src={book.images[activeImgIdx]} alt={`${book.title} ${activeImgIdx + 1}`} className="main-img" />
                <button className="prev-btn" onClick={handlePrevImg}><FaChevronLeft /></button>
                <button className="next-btn" onClick={handleNextImg}><FaChevronRight /></button>
                <div className="thumbnail-row">
                  {book.images.map((img, idx) => (
                    <img key={idx} src={img} className={`thumb ${activeImgIdx === idx ? "active-thumb" : ""}`} onClick={() => setActiveImgIdx(idx)} alt={`thumb ${idx + 1}`} />
                  ))}
                </div>
              </div>
            ) : (
              <img src={book.images?.[0] || book.image || "/placeholder.jpg"} alt={book.title} className="main-img" />
            )}
          </div>

          {/* ---------------- INFO LIVRE ---------------- */}
          <div className="book-info-panel">
            <h1 className="book-title">{book.title}</h1>
            <p className="author">Par <strong>{book.author || "Auteur inconnu"}</strong></p>
            <p className="edition">Édition <strong>{book.edition}</strong></p>
            <p className="edition">Langue: <strong>{book.language}</strong></p>

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
                    setQuantity(prev => Math.min(book.stock, prev + 1))
                  }
                  disabled={quantity >= book.stock}
                >
                  <FaPlus />
                </button>
              </div>

              {quantity > book.stock && (
                <p style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  Stock insuffisant pour cette quantité
                </p>
              )}

              {hasDiscount && (
                <div className="discount-badge">-{discountPercent}%</div>
              )}

              <span className="price-book">
                {hasDiscount ? (
                  <>
                    <s>
                      {(getPriceWithTax(book.price) * quantity).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </s>{" "}
                    <strong>
                      {(getPriceWithTax(book.promoPrice) * quantity).toLocaleString(
                        "fr-FR",
                        { style: "currency", currency: "EUR" }
                      )}
                    </strong>
                  </>
                ) : (
                  <span>
                    {(getPriceWithTax(book.price) * quantity).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                )}
              </span>
            </div>

            {/* Actions */}
            <div className="book-actions">
              <button className="btn btn-primary" disabled={quantity > book.stock} onClick={handleAddToCart}>
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
              <p>{book.description || "aucune description pour le moment"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
