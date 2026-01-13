import React, { useEffect, useState, useContext } from 'react';
import { getBooksByCategory } from "../firebase/config";
import { CartContext } from "../context/CartContext";
import { useLocation } from 'react-router-dom';
import {
  FaShoppingCart, FaSpinner, FaTimes, FaEye, FaStar,
  FaSortAmountDown, FaSearch
} from 'react-icons/fa';
import logo from "../assets/kids.png";
import headerBg from "../assets/kids-banner.png";

/* 🔥 FIRESTORE PROMOS */
import { db } from "../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

/* ---------- TAX ---------- */
const TAX_RATE = 21;
const getPriceWithTax = (price) =>
  +(price * (1 + TAX_RATE / 100)).toFixed(2);

/* ---------- PROMO UTILS (IDENTIQUE HOME / BOOKS) ---------- */
const applyPromo = (price, promo) => {
  if (!promo || promo.amount == null) return price;
  return +(price * (1 - promo.amount / 100)).toFixed(2);
};

const KidsBooks = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const { addToCart } = useContext(CartContext);
  const location = useLocation();

  const BOOKS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  const sortOptions = [
    { value: "default", label: "Par défaut" },
    { value: "price-asc", label: "Prix croissant" },
    { value: "price-desc", label: "Prix décroissant" },
    { value: "title", label: "Ordre alphabétique" }
  ];

  /* ---------- PROMOS ---------- */
  const getGeneralPromos = async () => {
    const q = query(
      collection(db, "promos"),
      where("active", "==", true),
      where("type", "==", "general")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  /* ---------- LOAD KIDS BOOKS ---------- */
  useEffect(() => {
    const loadKidsBooks = async () => {
      setLoading(true);

      let data = await getBooksByCategory("Livres enfants");

      const promos = await getGeneralPromos();
      const promo = promos.find(
        p => p.appliesTo === "all" || p.appliesTo === "books"
      );

      if (promo) {
        data = data.map(book => ({
          ...book,
          promoPrice: applyPromo(book.price, promo)
        }));
      }

      setBooks(data);
      setFilteredBooks(data);
      setLoading(false);

      if (location.state?.bookId) {
        const bookToOpen = data.find(b => b.id === location.state.bookId);
        if (bookToOpen) {
          setSelectedBook(bookToOpen);
          setActiveImgIdx(0);
          document.body.style.overflow = 'hidden';
        }
      }
    };

    loadKidsBooks();
  }, [location.state]);

  /* ---------- FILTER & SORT ---------- */
  useEffect(() => {
    let result = [...books];

    if (searchTerm.trim()) {
      result = result.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'title') result.sort((a, b) => a.title.localeCompare(b.title));

    setFilteredBooks(result);
    setCurrentPage(1);
  }, [searchTerm, sortBy, books]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const indexOfLastBook = currentPage * BOOKS_PER_PAGE;
  const indexOfFirstBook = indexOfLastBook - BOOKS_PER_PAGE;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);

  const openDetails = (book) => {
    setSelectedBook(book);
    setActiveImgIdx(0);
    document.body.style.overflow = 'hidden';
  };

  const closeDetails = () => {
    setSelectedBook(null);
    document.body.style.overflow = 'auto';
  };

  const renderStars = (rating = 5) => (
    <div className="rating-stars">
      {[...Array(5)].map((_, i) => (
        <FaStar
          key={i}
          className={i < Math.floor(rating) ? "star-filled" : "star-empty"}
        />
      ))}
    </div>
  );

  return (
    <div className="books-page">
      {/* HERO */}
      <div className="kids-hero-banner">
        <div className="hero-bg-container" style={{ backgroundImage: `url(${headerBg})` }}></div>
        <div className="hero-content">
          <img src={logo} alt="Kids Books" className="books-logo-main" />
        </div>
      </div>

      {/* SEARCH & SORT */}
      <div className="books-tools container-inner">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <FaTimes className="clear-search" onClick={() => setSearchTerm('')} />
          )}
        </div>

        <div className="sort-wrapper">
          <FaSortAmountDown className="sort-icon" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <br />

      {/* BOOKS GRID */}
      <div className="container-inner">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" />
            <p>Chargement...</p>
          </div>
        ) : (
          <>
            <p className="results-text">{filteredBooks.length} ouvrages trouvés</p>

            <div className="books-grid">
              {currentBooks.map(book => (
                <div className="book-card" key={book.id} onClick={() => openDetails(book)}>
                  <div className="book-image-container">
                    <img src={book.images?.[0] || book.image || "/placeholder.jpg"} alt={book.title} />
                    <div className="card-overlay">
                      <button className="overlay-btn"><FaEye /></button>
                    </div>
                  </div>

                  <div className="book-info">
                    <span className="book-category-tag">{book.category}</span>
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">{book.author}</p>
                    {renderStars(book.rating)}

                    <div className="book-card-footer">
                      {book.stock === 0 ? (
                        <>
                          <span className="current-price">{getPriceWithTax(book.price)} € TTC</span>
                          <button className="add-cart-mini disabled" disabled><FaShoppingCart /></button>
                          <p className="stock-warning">Stock épuisé</p>
                        </>
                      ) : (
                        <>
                          {book.promoPrice && book.promoPrice < book.price ? (
                            <span className="current-price">
                              <s>{getPriceWithTax(book.price)} €</s>{" "}
                              <strong>{getPriceWithTax(book.promoPrice)} €</strong>
                            </span>
                          ) : (
                            <span className="current-price">{getPriceWithTax(book.price)} €</span>
                          )}
                          <button
                            className="add-cart-mini"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(book);
                            }}
                          >
                            <FaShoppingCart />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Précédent</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} className={`page-btn ${currentPage === i + 1 ? "active" : ""}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                ))}
                <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Suivant</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL DETAILS */}
      {selectedBook && (
        <div className="details-overlay" onClick={closeDetails}>
          <div className="details-modal" onClick={e => e.stopPropagation()}>
            <button className="close-details" onClick={closeDetails}><FaTimes /></button>

            <div className="details-grid">
              <div className="details-gallery">
                <div className="main-image-container book-main-img">
                  <img src={selectedBook.images?.[activeImgIdx] || selectedBook.image} alt="Preview" />
                </div>

                <div className="thumbnails-row">
                  {(selectedBook.images || [selectedBook.image]).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      className={activeImgIdx === idx ? "active-thumb" : ""}
                      onClick={() => setActiveImgIdx(idx)}
                      alt="thumb"
                    />
                  ))}
                </div>
              </div>

              <div className="details-info">
                <span className="overline">{selectedBook.category}</span>
                <h2 className="details-title">{selectedBook.title}</h2>
                <p className="details-author">Par <strong>{selectedBook.author}</strong></p>
                <p className="details-author">Edition <strong>{selectedBook.edition}</strong></p>
                

                <div className="details-price">
                  {selectedBook.promoPrice && selectedBook.promoPrice < selectedBook.price ? (
                    <>
                      <s>{getPriceWithTax(selectedBook.price)} €</s>{" "}
                      <strong>{getPriceWithTax(selectedBook.promoPrice)} €</strong>
                    </>
                  ) : (
                    <>{getPriceWithTax(selectedBook.price)} € TTC</>
                  )}
                </div>

                <div className="details-scroll-area">
                  <p className="details-description">
                    {selectedBook.description || "Aucune description disponible."}
                  </p>
                </div>

                <div className="details-actions">
                  <button
                    className={`add-btn buy-btn-large ${selectedBook.stock === 0 ? "disabled" : ""}`}
                    disabled={selectedBook.stock === 0}
                    onClick={() => {
                      if (selectedBook.stock > 0) {
                        addToCart(selectedBook);
                        closeDetails();
                      }
                    }}
                  >
                    Ajouter au panier <FaShoppingCart style={{ marginLeft: 10 }} />
                  </button>
                </div>

                <div className="return-policy">
                  <span className="return-icon">📦</span>
                  <p>
                    <strong>Politique retours</strong> Vous disposez de 14 jours pour retourner
                    votre Articles après sa réception.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsBooks;
