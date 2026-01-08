import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaArrowRight, 
  FaBookOpen, 
  FaFire, 
  FaShieldAlt, 
  FaShippingFast, 
  FaHeadset, 
  FaEnvelope 
} from 'react-icons/fa';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import heroVideo from "../assets/hero.mp4";

const Home = () => {
  const [latestBooks, setLatestBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [exclusivePack, setExclusivePack] = useState(null);
  const [loadingPack, setLoadingPack] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewData, setReviewData] = useState({
    name: "",
    email: "",
    message: ""
  });

  // ---------- Newsletter ----------
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'newsletter'), {
        email: newsletterEmail,
        createdAt: serverTimestamp()
      });
      setNewsletterMessage("Merci ! Votre email a été enregistré.");
      setNewsletterEmail('');
    } catch (error) {
      console.error("Erreur newsletter :", error);
      setNewsletterMessage("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  // ---------- Utilitaire promo ----------
  const applyPromo = (originalPrice, promo) => {
    if (!promo) return originalPrice;
    let promoPrice;
    if (promo.amount.includes('%')) {
      const percent = parseFloat(promo.amount.replace('%', ''));
      promoPrice = +(originalPrice * (1 - percent / 100)).toFixed(2);
    } else {
      promoPrice = +(originalPrice - parseFloat(promo.amount)).toFixed(2);
    }
    return promoPrice < 0 ? 0 : promoPrice;
  };

  // ---------- Récupérer promos générales ----------
  const getGeneralPromos = async () => {
    const promosRef = collection(db, "promos");
    const q = query(promosRef, where("active", "==", true), where("type", "==", "general"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  // ---------- Fetch Latest Books ----------
  useEffect(() => {
    const fetchLatestBooks = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'), limit(4));
        const snap = await getDocs(q);
        let booksData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const generalPromos = await getGeneralPromos();
        const applicablePromo = generalPromos.find(p => p.appliesTo === 'all' || p.appliesTo === 'books');

        if (applicablePromo) {
          booksData = booksData.map(book => ({
            ...book,
            promoPrice: applyPromo(book.price, applicablePromo)
          }));
        }

        setLatestBooks(booksData);
      } catch (error) {
        console.error("Erreur chargement des livres :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestBooks();
  }, []);

  // ---------- Fetch Latest Pack ----------
  useEffect(() => {
    const fetchLatestPack = async () => {
      try {
        const q = query(
          collection(db, 'packs'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          let pack = { id: snap.docs[0].id, ...snap.docs[0].data() };

          const generalPromos = await getGeneralPromos();
          const applicablePromo = generalPromos.find(p => p.appliesTo === 'all' || p.appliesTo === 'packs');

          if (applicablePromo) {
            pack = {
              ...pack,
              promoPrice: applyPromo(pack.price, applicablePromo)
            };
          }

          setExclusivePack(pack);
        }
      } catch (error) {
        console.error("Erreur chargement pack exclusif :", error);
      } finally {
        setLoadingPack(false);
      }
    };
    fetchLatestPack();
  }, []);

  // ---------- Price formatter ----------
  const formatPrice = (price) => new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(price);

  // ---------- Reviews carousel ----------
  useEffect(() => {
    const grid = document.querySelector('.reviews-grid');
    const next = document.querySelector('.reviews-arrow.next');
    const prev = document.querySelector('.reviews-arrow.prev');
    if (!grid || !next || !prev) return;

    const scrollAmount = grid.offsetWidth * 0.9;
    next.addEventListener('click', () => grid.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
    prev.addEventListener('click', () => grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
  }, []);

  return (
    <div className="home">
      {/* HERO SECTION */}
      <section className="hero">
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-content">
          <h1>
            La caverne fut un Refuge{" "}
            <span className="highlight">pour les Croyants.</span>
          </h1>   
          <p>
            Explorez notre collection de livres authentiques. Porfitez d'une expérience enrichissante à chaque page.
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
                    <p className="author">de {book.author}</p>
                    <div className="book-footer">
                      <span className="price">
                        {book.promoPrice && book.promoPrice < book.price ? (
                          <>
                            <s>{formatPrice(book.price)}</s>{" "}
                            <strong>{formatPrice(book.promoPrice)}</strong>
                          </>
                        ) : formatPrice(book.price)}
                      </span>
                    </div>

                    {/* --- Navigation vers Books/Kids avec bookId dans state --- */}
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
      <section className="exclusive-mini-luxe">
        <div className="mesh-gradient-subtle"></div>
        <div className="container-compact">
          <div className="mini-branding">
            <span className="gold-label">ÉDITION SIGNATURE</span>
            <h2 className="mini-title-luxe">L'Exclusivité <span className="serif-italic">Alkahf</span></h2>
          </div>

          {loadingPack ? (
            <div className="mini-shimmer"></div>
          ) : exclusivePack && (
            <div className="mini-luxury-card">
              <div className="card-inner-flex">
                <div className="mini-visual">
                  <img src={exclusivePack.images?.[0] || exclusivePack.image} alt={exclusivePack.title} />
                </div>
                <div className="mini-content">
                  <div className="text-top">
                    <h3 className="pack-name">{exclusivePack.title}</h3>
                    <p className="pack-summary">{exclusivePack.description}</p>
                  </div>
                  <div className="mini-action-row">
                    <div className="price-minimal">
                      {exclusivePack.promoPrice && exclusivePack.promoPrice < exclusivePack.price ? (
                        <>
                          <span className="price-old">{exclusivePack.price}€</span>
                          <span className="price-val">{exclusivePack.promoPrice}€</span>
                        </>
                      ) : (
                        <span className="price-val">{exclusivePack.price}€</span>
                      )}
                    </div>
                    <Link to={`/packs`} className="mini-cta-black">
                      Découvrir <FaArrowRight />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="review-card">
              <p>"Un service client exceptionnel et des livres d'une qualité rare."</p>
              <span>- Youssef B.</span>
            </div>
            <div className="review-card">
              <p>"Enfin une librairie en ligne qui garantit l'authenticité des sources."</p>
              <span>- Leila K.</span>
            </div>
            <div className="review-card">
              <p>"La livraison est ultra rapide et les livres arrivent très bien protégés."</p>
              <span>- Ahmed M.</span>
            </div>
            <div className="review-card">
              <p>"Une sélection de livres magnifique, surtout les biographies."</p>
              <span>- Fatima Z.</span>
            </div>
            <div className="review-card">
              <p>"Le site est très fluide sur mobile, l'expérience d'achat est vraiment agréable."</p>
              <span>- Omar S.</span>
            </div>
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
