import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBookOpen,
  FaShieldAlt,
  FaShippingFast,
  FaHeadset,
  FaEnvelope,
  FaFire,
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

/* ---------- TAX UTILS ---------- */
const TAX_RATE = 21;
const getPriceWithTax = (price) => +(price * (1 + TAX_RATE / 100)).toFixed(2);// ✅ 1. Déclarer les URLs AVANT utilisation

const heroVideo =
  "https://res.cloudinary.com/djukqnpbs/video/upload/q_auto,f_auto/hero_pmwncb";

const heroImg1 =
  "https://res.cloudinary.com/djukqnpbs/image/upload/f_auto,q_auto/mobile1_xvrpdy";

const heroImg2 =
  "https://res.cloudinary.com/djukqnpbs/image/upload/f_auto,q_auto/mobile2_ngk5fv";

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
  const [reviewData, setReviewData] = useState({ name: "", email: "", message: "", rating: 0 });

  const [currentSlide, setCurrentSlide] = useState(0);

  // ✅ 2. Maintenant on peut les utiliser
  const mobileSlides = [heroImg1, heroImg2];


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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "reviews"), {
        fullName: reviewData.name,
        email: reviewData.email,
        review: reviewData.message,
        rating: reviewData.rating,
        active: false, // <-- important pour que l'admin active
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setReviewData({ name: "", email: "", message: "", rating: 0 });
    } catch (err) {
      console.error(err);
    }
  };

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
      const snap = await getDocs(query(collection(db, "books"), orderBy("createdAt", "desc"), limit(4)));
      let books = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const promos = await getGeneralPromos();
      const promo = promos.find((p) => p.appliesTo === "all" || p.appliesTo === "books");
      if (promo) {
        books = books.map((b) => ({ ...b, promoPrice: applyPromo(b.price, promo) }));
      }
      setLatestBooks(books);
      setLoading(false);
    })();
  }, []);

  // ---------- Hero Video iOS Play Fix ----------
  useEffect(() => {
    const video = document.querySelector(".hero-video");
    if (!video) return;
    const tryPlay = () => {
      video.play().catch(() => {});
      window.removeEventListener("touchstart", tryPlay);
    };
    window.addEventListener("touchstart", tryPlay);
  }, []);

  // ---------- Fetch Pack ----------
  useEffect(() => {
    (async () => {
      const snap = await getDocs(query(collection(db, "packs"), orderBy("createdAt", "desc"), limit(1)));
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

  const formatPrice = (p) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(p);

  // ---------- Mobile Carousel ----------
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mobileSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // fetch reviews 
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, "reviews"),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        const snap = await getDocs(q);

        const data = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(r => r.active === true) // ✅ FILTRAGE ICI
          .slice(0, 6);

        setReviews(data);
      } catch (err) {
        console.error("Erreur fetch reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="home">
      {/* HERO */}
      <section className={`hero ${videoReady ? "video-loaded" : ""}`}>
        {/* Vidéo sur ordinateur */}
        <video
          className="hero-video desktop-only"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          poster="/poster.jpg"
          onLoadedData={() => setVideoReady(true)}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        {/* Carrousel sur mobile */}
        <div className="mobile-carousel mobile-only">
          {mobileSlides.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Slide ${index + 1}`}
              className={`carousel-slide ${currentSlide === index ? "active" : ""}`}
            />
          ))}
        </div>

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
            <h2>Nos Coups de Cœur</h2>
            <p className="section-subtitle">
              Découvrez les incontournables de notre librairie
            </p>
          </div>

          {loading ? (
            <div className="loading-state">Chargement des livres...</div>
          ) : latestBooks.length === 0 ? (
            <p className="no-data">Aucun livre disponible pour le moment.</p>
          ) : (
            <>
              <div className="books-grid">
                {latestBooks.map((book) => (
                  <Link
                    key={book.id}
                    to={`/book/${book.id}`}       // redirige vers la page BookDetails
                    state={{ bookData: book }} // passe le livre complet
                    className="book-card-link">
                    <div className="book-card">
                      <div className="book-image">
                        <img
                          src={book.images?.[0] || book.image || "/placeholder.jpg"}
                          alt={book.title}
                        />
                      </div>

                      <div className="book-info">
                        <div className="meta">
                          <span>{book.category}</span>
                        </div>

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
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* BOUTON VERS LA PAGE LIVRES */}
              <div className="books-section-btn">
                <Link to="/books" className="btn-outline-small">
                  Notre Librairie
                </Link>
              </div>
            </>
          )}
        </div>
      </section>


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
            <div className="loading-state">Chargement des Packs...</div>
                ) : latestBooks.length === 0 ? (
                <p className="no-data">Aucun Pack disponible pour le moment.</p>
          ) : (
            exclusivePack && (
              <Link
                key={exclusivePack.id}
                to={`/pack/${exclusivePack.id}`} // redirige vers PackDetails
                state={{ packId: exclusivePack.id, packData: exclusivePack }} // passe le pack complet
                className="mini-luxury-card-link"
              >
                <div className="mini-luxury-card">
                  <div className="card-inner-flex">
                    <div className="mini-visual">
                      <img
                        src={exclusivePack.images?.[0] || exclusivePack.image || "/placeholder.jpg"}
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
                          {exclusivePack.promoPrice && exclusivePack.promoPrice < exclusivePack.price ? (
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

                        <div className="mini-cta-black">
                          Découvrir <FaArrowRight />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
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
            {reviewsLoading ? (
              <div className="loading-state">Chargement des livres...</div>
            ) : reviews.length === 0 ? (
              <p>Aucun avis disponible pour le moment.</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="review-card">
                  <StarRating rating={rev.rating} />
                  <p>"{rev.review}"</p>
                  <span>- {rev.fullName}</span>
                </div>
              ))
            )}
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
              <section className="reviews popup-reviews">
                <div className="container-inner">
                  <div className="popup-header">
                    <h2>Laisser un avis</h2>
                    <button className="close-btn" onClick={() => setShowReview(false)}>×</button>
                  </div>

                  {!submitted ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();

                        if (!reviewData.rating) {
                          alert("Veuillez donner une note.");
                          return;
                        }

                        try {
                          await addDoc(collection(db, "reviews"), {
                            fullName: reviewData.name,
                            email: reviewData.email,
                            review: reviewData.message,
                            rating: reviewData.rating,
                            active: false,
                            createdAt: serverTimestamp(),
                          });

                          setSubmitted(true);
                          setReviewData({ name: "", email: "", message: "", rating: 0 });
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                      className="reviews-grid"
                    >
                      <div className="review-card review-form-card">

                        <div className="input-group">
                          <label>Nom</label>
                          <input
                            type="text"
                            value={reviewData.name}
                            onChange={(e) =>
                              setReviewData({ ...reviewData, name: e.target.value })
                            }
                            required
                          />
                        </div>

                        <div className="input-group">
                          <label>Email</label>
                          <input
                            type="email"
                            value={reviewData.email}
                            onChange={(e) =>
                              setReviewData({ ...reviewData, email: e.target.value })
                            }
                            required
                          />
                        </div>

                        <div className="input-group review-textarea-group">
                          <label>Avis</label>

                          <textarea
                            value={reviewData.message}
                            onChange={(e) => {
                              const text = e.target.value;
                              if (text.length <= 170) {
                                setReviewData({ ...reviewData, message: text });
                              }
                            }}
                            maxLength={170}
                            rows={4}
                            required
                            placeholder="Exprimez votre avis"
                          />

                          <div className="char-counter">
                            {reviewData.message.length} / 170
                          </div>
                        </div>


                        <div className="input-group">
                          <label>Note</label>
                          <div className="stars selectable">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={star <= reviewData.rating ? "star filled" : "star"}
                                onClick={() =>
                                  setReviewData({ ...reviewData, rating: star })
                                }
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>

                        <button type="submit" className="btn-outline-small">
                          Envoyer l’avis
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="review-card confirmation-message">
                      <p>Merci pour votre avis !</p>
                      <button
                        onClick={() => setShowReview(false)}
                        className="btn-outline-small"
                      >
                        Fermer
                      </button>
                    </div>
                  )}
                </div>
              </section>
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
