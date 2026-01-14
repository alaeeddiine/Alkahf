import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { FaTag, FaLock, FaChevronLeft } from "react-icons/fa";

const europeanCountries = [
  "France","Germany","Italy","Spain","Portugal","Belgium","Netherlands","Luxembourg",
  "Switzerland","Austria","Denmark","Sweden","Norway","Finland","Poland","Czech Republic",
  "Hungary","Slovakia","Greece","Ireland","United Kingdom","Croatia","Slovenia","Estonia",
  "Latvia","Lithuania","Malta","Cyprus","Bulgaria","Romania"
];

const TAX_RATE = 21; // %

const priceWithTax = (price) => +(price * (1 + TAX_RATE / 100)).toFixed(2);

const Checkout = () => {
  const { cartItems, clearCart } = useContext(CartContext);

  const [formData, setFormData] = useState({
    name: "", email: "", address: "", city: "", country: "", zipCode: "", promoCode: "",
  });

  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState({ text: "", type: "" });
  const [totals, setTotals] = useState({ subtotal: 0, shipping: 0, tax: 0, grandTotal: 0 });
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const calculateShipping = (amount) => {
    if (amount === 0) return 0;
    if (amount < 50) return 5;
    if (amount < 100) return 10;
    return 0;
  };

  // 🔹 Calcul des totaux TTC
  useEffect(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + priceWithTax(item.promoPrice ?? item.price ?? 0) * item.quantity,
      0
    );

    const shipping = calculateShipping(subtotal);
    const totalAfterDiscount = subtotal - promoDiscount;
    const tax = totalAfterDiscount * (TAX_RATE / (100 + TAX_RATE)); // fraction de la TVA déjà incluse

    setTotals({
      subtotal,
      shipping,
      tax,
      grandTotal: totalAfterDiscount + shipping
    });
  }, [cartItems, promoDiscount]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleApplyPromo = async () => {
    if (!formData.promoCode.trim()) return;
    try {
      const q = query(
        collection(db, "promos"),
        where("code", "==", formData.promoCode.trim()),
        where("active", "==", true)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setPromoDiscount(0);
        setPromoMessage({ text: "Code invalide.", type: "error" });
      } else {
        const discount = Number(snap.docs[0].data().amount || 0);
        setPromoDiscount(discount);
        setPromoMessage({ text: `Réduction de ${discount}€ appliquée !`, type: "success" });
      }
    } catch {
      setPromoMessage({ text: "Erreur serveur.", type: "error" });
    }
  };

  const handlePaymentSuccess = async (details) => {
    try {
      await addDoc(collection(db, "orders"), {
        items: cartItems.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          promoPrice: item.promoPrice ?? null,
          images: item.images ?? []
        })),
        total: totals.grandTotal,
        buyer: { ...formData },
        paypalDetails: details,
        status: "paid",
        createdAt: serverTimestamp()
      });

      alert(`Paiement réussi 🎉 Merci ${details.payer.name.given_name} !`);
      setPaymentSuccess(true);
      clearCart();

    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la commande :", err);
      alert("Erreur lors de l'enregistrement de la commande !");
    }
  };

  if (cartItems.length === 0 && !paymentSuccess) {
    return (
      <div className="empty-checkout">
        <div className="empty-content">
          <h2 className="details-title">Votre panier est vide</h2>
          <p>La quête du savoir commence par un premier ouvrage.</p>
          <Link to="/books" className="buy-btn-large">Parcourir la collection</Link>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="checkout-success">
        <h2>Paiement réussi 🎉</h2>
        <p>Merci pour votre commande !</p>
        <Link to="/books" className="buy-btn-large">Retour à la boutique</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link to="/cart" className="back-link"><FaChevronLeft /> Retour au panier</Link>
        <h1 className="details-title">Finaliser la <span className="gold-text">Commande</span></h1>
      </header>

      <div className="checkout-grid-layout">
        {/* FORMULAIRE */}
        <section className="checkout-main-content">
          <div className="checkout-section-card">
            <span className="overline">01. Expédition</span>
            <div className="input-grid">
              <input type="text" name="name" placeholder="Nom complet" onChange={handleInputChange} required />
              <input type="email" name="email" placeholder="Adresse Email" onChange={handleInputChange} required />
              <input type="text" name="address" placeholder="Adresse de livraison" onChange={handleInputChange} required />
              <input type="text" name="city" placeholder="Ville" onChange={handleInputChange} required />
              <input type="text" name="zipCode" placeholder="Code Postal" onChange={handleInputChange} required />
              <select name="country" value={formData.country} onChange={handleInputChange} required>
                <option value="">Sélectionnez votre pays</option>
                {europeanCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="checkout-section-card promo-section">
            <span className="overline">02. Privilèges</span>
            <div className="promo-flex">
              <input type="text" name="promoCode" placeholder="Code privilège" value={formData.promoCode} onChange={handleInputChange} />
              <button type="button" className="tool-btn" onClick={handleApplyPromo}>Appliquer</button>
            </div>
            {promoMessage.text && <p className={`promo-msg ${promoMessage.type}`}>{promoMessage.text}</p>}
          </div>
        </section>

        {/* RÉSUMÉ */}
        <aside className="checkout-summary-sidebar">
          <div className="summary-sticky-card">
            <h3 className="summary-title">Votre Sélection</h3>
            {cartItems.map(item => (
              <div key={item.id} className="mini-item-card">
                <img src={item.images?.[0]} alt={item.title} className="mini-img" />
                <div className="mini-details">
                  <p className="mini-title">{item.title}</p>
                  <p className="mini-meta">Qté: {item.quantity} • {priceWithTax(item.promoPrice ?? item.price).toFixed(2)}€</p>
                </div>
                <span className="mini-total">{(priceWithTax(item.promoPrice ?? item.price) * item.quantity).toFixed(2)}€</span>
              </div>
            ))}

            <div className="summary-calculation">
              <div className="calc-row"><span>Sous-total (TTC)</span><span>{totals.subtotal.toFixed(2)}€</span></div>
              <div className="calc-row"><span>Frais d'envoi</span><span>{totals.shipping === 0 ? "Offerts" : `${totals.shipping.toFixed(2)}€`}</span></div>
              {/* <div className="calc-row"><span>Taxe (21%) incluse</span><span>{totals.tax.toFixed(2)}€</span></div> */}
              {promoDiscount > 0 && <div className="calc-row discount-row"><span>Réduction</span><span>-{promoDiscount.toFixed(2)}€</span></div>}
              <div className="calc-row grand-total-row"><span>Total</span><span>{totals.grandTotal.toFixed(2)}€</span></div>
            </div>

            <div className="payment-security-note"><FaLock /> Paiement 100% sécurisé et crypté</div>

            {cartItems.length > 0 && (
              <PayPalButtons
                style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
                createOrder={(data, actions) => actions.order.create({
                  purchase_units: [{ amount: {currency_code: "EUR",value: totals.grandTotal.toFixed(2)} }]
                })}
                onApprove={async (data, actions) => {
                  const details = await actions.order.capture();
                  handlePaymentSuccess(details);
                }}
                onCancel={() => {alert("Paiement annulé.");}}
                onError={(err) => {console.error("PayPal error:", err); alert("Le paiement a échoué. Vérifiez votre carte ou votre banque.");}}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
