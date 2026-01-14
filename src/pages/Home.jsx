import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBookOpen,
  FaFire,
  FaShieldAlt,
  FaShippingFast,
  FaHeadset,
  FaEnvelope,
} from "react-icons/fa";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import heroVideo from "../assets/hero.mp4";

/* ---------- TAX UTILS (IDENTIQUE À PACKS) ---------- */
const TAX_RATE = 21;
const getPriceWithTax = (price) =>
  +(price * (1 + TAX_RATE / 100)).toFixed(2);

const Home = () => {
  const [latestBooks, setLatestBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [exclusivePack, setExclusivePack] = useState(null);
  const [loadingPack, setLoadingPack] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [reviewData, setReviewData] = useState({
    name: "",
    email: "",
    message: "",
  });

  // ---------- Newsletter ----------
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "newsletter"), {
        email: newsletterEmail,
        createdAt: serverTimestamp(),
      });
      setNewsletterMessage("Merci ! Votre email a été enregistré.");
      setNewsletterEmail("");
    } catch {
      setNewsletterMessage("Une erreur est survenue. Veuillez réessayer.");
    }
  };
  const reviews = [
    { message: "Un service client exceptionnel et des livres d'une qualité rare.", author: "Youssef B.", rating: 5 },
    { message: "Enfin une librairie en ligne qui garantit l'authenticité des sources.", author: "Leila K.", rating: 5 },
    { message: "La livraison est ultra rapide et les livres arrivent très bien protégés.", author: "Ahmed M.", rating: 4 },
    { message: "Une sélection de livres magnifique, surtout les biographies.", author: "Fatima Z.", rating: 5 },
    { message: "Le site est très fluide sur mobile, l'expérience d'achat est vraiment agréable.", author: "Omar S.", rating: 4 },
  ];
  
  const StarRating = ({ rating }) => (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "star filled" : "star"}>
          ★
        </span>
      ))}
    </div>
  );

  // ---------- Promo utils ----------
  const applyPromo = (price, promo) => {
    if (!promo || promo.amount == null) return price;

    // On considère que promo.amount est un pourcentage
    return +(price * (1 - promo.amount / 100)).toFixed(2);
  };


  const getGeneralPromos = async () => {
    const q = query(
      collection(db, "promos"),
      where("active", "==", true),
      where("type", "==", "general")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  // ---------- Fetch Books ----------
  useEffect(() => {
    (async () => {
      setLoading(true);
      const snap = await getDocs(
        query(collection(db, "books"), orderBy("createdAt", "desc"), limit(4))
      );
      let books = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const promos = await getGeneralPromos();
      const promo = promos.find((p) => p.appliesTo === "all" || p.appliesTo === "books");
      if (promo) {
        books = books.map((b) => ({
          ...b,
          promoPrice: applyPromo(b.price, promo),
        }));
      }
      setLatestBooks(books);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
  }, []);


  // ---------- Fetch Pack ----------
  useEffect(() => {
    (async () => {
      const snap = await getDocs(
        query(collection(db, "packs"), orderBy("createdAt", "desc"), limit(1))
      );
      if (!snap.empty) {
        let pack = { id: snap.docs[0].id, ...snap.docs[0].data() };
        const promos = await getGeneralPromos();
        const promo = promos.find((p) => p.appliesTo === "all" || p.appliesTo === "packs");
        if (promo) pack.promoPrice = applyPromo(pack.price, promo);
        setExclusivePack(pack);
      }
      setLoadingPack(false);
    })();
  }, []);

  const formatPrice = (p) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(p);

  return (
    <div className="home">
      {/* HERO */}
      <section className={`hero ${videoReady ? "video-loaded" : ""}`}>
        {!isIOS && (
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            webkit-playsinline="true"
            preload="metadata"
            poster="/poster.jpg"
            onCanPlay={() => setVideoReady(true)}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        )}

        <div className="hero-content">
          <h1>
            La caverne fut un Refuge <span className="highlight">pour les Croyants.</span>
          </h1>
          <p>
            Explorez notre collection de livres authentiques. Profitez d'une expérience
            enrichissante à chaque page.
          </p>
          <div className="hero-actions">
            <Link to="/books" className="btn btn-primary">
              <FaBookOpen /> Parcourir la collection <FaArrowRight />
            </Link>
            <Link to="/about" className="btn btn-secondary">
              <FaFire /> Notre Histoire
            </Link>
          </div>
        </div>
      </section>

      {/* LATEST BOOKS */}
      <section className="latest-books">
        <div className="container-inner">
          <div className="section-header">
            <h2>Nos Meilleurs Ventes</h2>
            <p className="section-subtitle">Découvrez les incontournables de notre librairie</p>
          </div>

          {loading ? (
            <div className="loading-state">Chargement des livres...</div>
          ) : latestBooks.length === 0 ? (
            <p className="no-data">Aucun livre disponible pour le moment.</p>
          ) : (
            <div className="books-grid">
              {latestBooks.map(book => (
                <div key={book.id} className="book-card">
                  <div className="book-image">
                    <img src={book.images?.[0] || book.image || "/placeholder.jpg"} alt={book.title} />
                  </div>
                  <div className="book-info">
                    <div className="meta"><span>{book.category}</span></div>
                    <h3>{book.title}</h3>
                    <p className="author">Edition {book.edition}</p>
                    <div className="book-footer">
                      <span className="price">
                        {book.promoPrice && book.promoPrice < book.price ? (
                          <>
                            <s>{formatPrice(getPriceWithTax(book.price))}</s>{" "}
                            <strong>{formatPrice(getPriceWithTax(book.promoPrice))}</strong>
                          </>
                        ) : (
                          formatPrice(getPriceWithTax(book.price))
                        )}
                      </span>
                    </div>
                    <Link
                      to={book.category === "Livres enfants" ? "/kids" : "/books"}
                      state={{ bookId: book.id }}
                      className="btn-outline-small"
                    >
                      Voir les détails
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* EXCLUSIVE PACK */}
      {/* EXCLUSIVE PACK */}
      <section className="exclusive-mini-luxe">
        <div className="mesh-gradient-subtle"></div>
        <div className="container-compact">
          <div className="mini-branding">
            <span className="gold-label">ÉDITION SIGNATURE</span>
            <h2 className="mini-title-luxe">
              L'Exclusivité <span className="serif-italic">Alkahf</span>
            </h2>
          </div>

          {loadingPack ? (
            <div className="mini-shimmer"></div>
          ) : (
            exclusivePack && (
              <div className="mini-luxury-card">
                <div className="card-inner-flex">
                  <div className="mini-visual">
                    <img
                      src={exclusivePack.images?.[0] || exclusivePack.image}
                      alt={exclusivePack.title}
                    />
                  </div>

                  <div className="mini-content">
                    <div className="text-top">
                      <h3 className="pack-name">{exclusivePack.title}</h3>
                      <p className="pack-summary">{exclusivePack.description}</p>
                    </div>

                    <div className="mini-action-row">
                      <div className="price-minimal">
                        {exclusivePack.promoPrice &&
                        exclusivePack.promoPrice < exclusivePack.price ? (
                          <>
                            <span className="price-old">
                              {formatPrice(getPriceWithTax(exclusivePack.price))}
                            </span>
                            <span className="price-val">
                              {formatPrice(getPriceWithTax(exclusivePack.promoPrice))}
                            </span>
                          </>
                        ) : (
                          <span className="price-val">
                            {formatPrice(getPriceWithTax(exclusivePack.price))}
                          </span>
                        )}
                      </div>

                      <Link to="/packs" className="mini-cta-black">
                        Découvrir <FaArrowRight />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="why-choose">
        <div className="container-inner">
          <h2>Pourquoi Choisir Nos Livres ?</h2>
          <p className="section-subtitle">Nous nous engageons à fournir une qualité irréprochable et un savoir authentique.</p>
          <div className="features-grid">
            <div className="feature-card">
              <FaShieldAlt />
              <h3>Contenu Authentique</h3>
              <p>Chaque ouvrage est rigoureusement sélectionné et vérifié par des étudiants en science et des savants.</p>
            </div>
            <div className="feature-card">
              <FaShippingFast />
              <h3>Livraison Rapide</h3>
              <p>Expédition sécurisée sous 48h. Livraison gratuite pour toute commande supérieure à 100€.</p>
            </div>
            <div className="feature-card">
              <FaBookOpen />
              <h3>Qualité Premium</h3>
              <p>Reliures durables et papier de haute qualité pour une lecture confortable et pérenne.</p>
            </div>
            <div className="feature-card">
              <FaHeadset />
              <h3>Support Dédié</h3>
              <p>Notre équipe est à votre écoute pour vous conseiller dans vos choix de lecture.</p>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="reviews">
        <div className="container-inner">
          <h2>Avis de nos Lecteurs</h2>
          <p className="section-subtitle">
            Découvrez les témoignages de notre communauté de lecteurs passionnés.
          </p>

          <div className="reviews-grid">
            {reviews.map((review, index) => (
              <div className="review-card" key={index}>
                <StarRating rating={review.rating} />
                <p>"{review.message}"</p>
                <span>- {review.author}</span>
              </div>
            ))}
          </div>

          <button className="reviews-arrow prev" aria-label="Avis précédent">‹</button>
          <button className="reviews-arrow next" aria-label="Avis suivant">›</button>

          <button 
            className="btn-outline-small" 
            onClick={() => { setShowReview(true); setSubmitted(false); }}
          >
            Laisser un avis
          </button>

          {showReview && (
            <div className="popup-overlay">
              <div className="popup-card floating-card">
                <div className="popup-header">
                  <h2>Laisser un avis</h2>
                  <button className="close-btn" onClick={() => setShowReview(false)}>×</button>
                </div>

                {!submitted ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      console.log("Avis soumis:", reviewData);
                      setSubmitted(true);
                      setReviewData({ name: "", email: "", message: "" });
                    }}
                    className="popup-form"
                  >
                    <div className="input-group">
                      <label>Nom</label>
                      <input
                        type="text"
                        name="name"
                        value={reviewData.name}
                        onChange={(e) =>
                          setReviewData({ ...reviewData, name: e.target.value })
                        }
                        required
                        placeholder="Votre nom"
                      />
                    </div>

                    <div className="input-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={reviewData.email}
                        onChange={(e) =>
                          setReviewData({ ...reviewData, email: e.target.value })
                        }
                        required
                        placeholder="Votre email"
                      />
                    </div>

                    <div className="input-group">
                      <label>Avis</label>
                      <textarea
                        name="message"
                        value={reviewData.message}
                        onChange={(e) =>
                          setReviewData({ ...reviewData, message: e.target.value })
                        }
                        required
                        placeholder="Votre avis"
                        rows={4}
                      />
                    </div>
                    <div className="input-group">
                      <label>Note</label>
                      <div className="stars selectable">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={star <= reviewData.rating ? "star filled" : "star"}
                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button type="submit" className="submit-action-btn">
                      Envoyer
                    </button>
                  </form>
                ) : (
                  <div className="confirmation-message">
                    <p>Merci pour votre avis ! Il a bien été envoyé.</p>
                    <button
                      onClick={() => setShowReview(false)}
                      className="submit-action-btn"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter">
        <div className="container-inner">
          <h2><FaEnvelope /> Restez Informés</h2>
          <p>Inscrivez-vous pour recevoir nos nouveaux arrivages, nos offres exclusives et nos conseils de lecture.</p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="votre.email@exemple.com"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">S'abonner</button>
          </form>
          {newsletterMessage && <p className="newsletter-message">{newsletterMessage}</p>}
        </div>
      </section>
    </div>
  );
};

export default Home;
