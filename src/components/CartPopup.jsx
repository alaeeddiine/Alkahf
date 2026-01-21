import React, { useEffect, useContext, useMemo, useState } from "react";
import {
  FaTimes,
  FaTrashAlt,
  FaPlus,
  FaMinus,
  FaShoppingBag,
  FaArrowRight,
  FaLock,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";

// --- TAXES ---
const TAX_RATE = 21; // %
const priceWithTax = (price) => +(price * (1 + TAX_RATE / 100)).toFixed(2);

const CartPopup = ({ isOpen, onClose }) => {
  const { cartItems = [], removeFromCart, updateQuantity } = useContext(CartContext);
  const [stockWarnings, setStockWarnings] = useState({});
  const items = Array.isArray(cartItems) ? cartItems : [];

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  // ---------- SUBTOTAL ET TOTALS ----------
  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (item.promoPrice ?? item.price ?? 0) * item.quantity,
      0
    );
  }, [items]);

  const subtotalTTC = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + priceWithTax(item.promoPrice ?? item.price ?? 0) * item.quantity,
      0
    );
  }, [items]);

  const calculateShipping = (amount) => {
    if (amount === 0) return 0;
    if (amount < 49.99) return 5;
    if (amount < 99.99) return 10;
    return 0;
  };

  const shipping = calculateShipping(subtotalTTC);
  const grandTotalTTC = subtotalTTC + shipping;

  // ---------- GESTION STOCK ----------
  const handleIncrease = (item) => {
    if (item.quantity + 1 > item.stock) {
      setStockWarnings(prev => ({ ...prev, [item.id]: `Stock épuisé ! Maximum disponible : ${item.stock}` }));
      return;
    }
    updateQuantity(item.id, item.quantity + 1);
    setStockWarnings(prev => ({ ...prev, [item.id]: "" }));
  };

  const handleDecrease = (item) => {
    if (item.quantity - 1 >= 1) updateQuantity(item.id, item.quantity - 1);
    setStockWarnings(prev => ({ ...prev, [item.id]: "" }));
  };

  return (
    <>
      <div className={`cart-overlay-blur ${isOpen ? "active" : ""}`} onClick={onClose} />
      <aside className={`cart-sidebar-premium ${isOpen ? "open" : ""}`}>
        <header className="cart-side-header">
          <div className="title-group">
            <FaShoppingBag className="bag-icon" />
            <h3>Votre Panier</h3>
            <span className="item-count-pill">{items.length}</span>
          </div>
          <button className="close-cart-btn" onClick={onClose}><FaTimes /></button>
        </header>

        <section className="cart-side-body">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-icon-wrapper"><FaShoppingBag /></div>
              <p>Votre panier est encore vide.</p>
              <button className="btn-gold-outline" onClick={onClose}>Découvrir nos livres</button>
            </div>
          ) : (
            <div className="cart-items-wrapper">
              {items.map(item => (
                <article key={item.id} className="cart-item-card">
                  <div className="item-img-box">
                    <img src={item.images?.[0] || item.image || "/placeholder.jpg"} alt={item.title} />
                  </div>
                  <div className="item-info-box">
                    <div className="item-header-row">
                      <h4>{item.title}</h4>
                      <button className="remove-small" onClick={() => removeFromCart(item.id)}>
                        <FaTrashAlt />
                      </button>
                    </div>
                    <p className="item-meta">Edition {item.edition}</p>
                    {item.language && <p className="book-language">{item.language}</p>}

                    <div className="item-controls-row">
                      <div className="qty-stepper">
                        <button onClick={() => handleDecrease(item)} disabled={item.quantity <= 1}><FaMinus /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleIncrease(item)}><FaPlus /></button>
                      </div>

                      {/* Prix affiché TTC */}
                      <span className="item-price-final">
                        {item.promoPrice ? (
                          <>
                            <s>{priceWithTax(item.price).toFixed(2)} €</s>{" "}
                            {(priceWithTax(item.promoPrice) * item.quantity).toFixed(2)} €
                          </>
                        ) : (
                          (priceWithTax(item.price) * item.quantity).toFixed(2) + " €"
                        )}
                      </span>
                    </div>

                    {stockWarnings[item.id] && <p className="stock-warning">{stockWarnings[item.id]}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {items.length > 0 && (
          <footer className="cart-side-footer">
            <div className="summary-details">
              <div className="sum-line">
                <span>Sous-total (TTC)</span>
                <span>{subtotalTTC.toFixed(2)} €</span>
              </div>
              <div className="sum-line">
                <span>Livraison</span>
                <span className={shipping === 0 ? "free-text" : ""}>{shipping === 0 ? "Gratuite" : `${shipping.toFixed(2)} €`}</span>
              </div>
              <div className="sum-line grand-total">
                <span>Total</span> 
                <span>{grandTotalTTC.toFixed(2)} €</span>
              </div>
              {subtotalTTC < 100 && (
                <p className="shipping-hint">
                  Plus que {(100 - subtotalTTC).toFixed(2)} € pour bénéficier de la livraison gratuite 🚚
                </p>
              )}
            </div>

            <Link to="/checkout" className="checkout-btn-premium" onClick={onClose}>
              Commander maintenant <FaArrowRight />
            </Link>

            <div className="secure-footer-note"><FaLock /> Paiement 100% sécurisé</div>
          </footer>
        )}
      </aside>
    </>
  );
};

export default CartPopup;
