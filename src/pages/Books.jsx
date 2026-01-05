import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllBooks, getBooksByCategory } from "../firebase/config";
import { CartContext } from "../context/CartContext";
import { 
  FaShoppingCart, FaSearch, FaStar, FaSpinner, FaTimes,
  FaFilter, FaSortAmountDown, FaEye, 
} from 'react-icons/fa';
import { db } from "../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

const Books = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams] = useSearchParams();
  const { addToCart } = useContext(CartContext);

  const [selectedBook, setSelectedBook] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const BOOKS_PER_PAGE = 12;

  const urlCategory = searchParams.get('category');

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "Quran & Tafsir", label: "Coran & Tafsir" },
    { value: "Sciences du Hadith", label: "Hadith" },
    { value: "Fiqh & Jurisprudence", label: "Jurisprudence" },
    { value: "Sira & Biographies", label: "Biographies" }
  ];

  const sortOptions = [
    { value: "default", label: "Par défaut" },
    { value: "price-asc", label: "Prix croissant" },
    { value: "price-desc", label: "Prix décroissant" },
    { value: "title", label: "Ordre alphabétique" }
  ];

  // ---------- Récupérer les promos générales actives ----------
  const getGeneralPromos = async () => {
    const promosRef = collection(db, "promos");
    const q = query(promosRef, where("active", "==", true), where("type", "==", "general"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  // ---------- Charger les livres avec promo appliquée ----------
  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);

      // 1. Récupérer les livres
      let data = (urlCategory && urlCategory !== "all") 
        ? await getBooksByCategory(urlCategory) 
        : await getAllBooks();

      // 2. Récupérer les promos générales actives
      const generalPromos = await getGeneralPromos();
      const applicablePromo = generalPromos.find(p => p.appliesTo === 'all' || p.appliesTo === 'books');

      // 3. Appliquer la promo générale sur le prix original
      if (applicablePromo) {
        data = data.map(book => {
          const basePrice = book.price;
          let promoPrice;

          if (applicablePromo.amount.includes('%')) {
            const percent = parseFloat(applicablePromo.amount.replace('%', ''));
            promoPrice = +(basePrice * (1 - percent / 100)).toFixed(2);
          } else {
            promoPrice = +(basePrice - parseFloat(applicablePromo.amount)).toFixed(2);
          }

          promoPrice = promoPrice < 0 ? 0 : promoPrice;

          return { ...book, promoPrice };
        });
      }

      setBooks(data);
      setFilteredBooks(data);
      setLoading(false);
    };

    loadBooks();
  }, [urlCategory]);

  // ---------- Filtrage et tri ----------
  useEffect(() => {
    let result = [...books];

    if (searchTerm.trim()) {
      result = result.filter(b => 
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter(b => b.category === selectedCategory);
    }

    let sorted = [...result];
    if (sortBy === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));

    setFilteredBooks(sorted);
  }, [searchTerm, selectedCategory, books, sortBy]);

  // Reset page lors de filtrage / recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy]);

  // ---------- Pagination logique ----------
  const indexOfLastBook = currentPage * BOOKS_PER_PAGE;
  const indexOfFirstBook = indexOfLastBook - BOOKS_PER_PAGE;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);

  // ---------- Gestion détails ----------
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
        <FaStar key={i} className={i < Math.floor(rating) ? "star-filled" : "star-empty"} />
      ))}
    </div>
  );

  // ---------- Rendu ----------
  return (
    <div className="books-page">
      <div className="container-inner">
        {/* Tools */}
        <div className="books-tools">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input 
              type="text" placeholder="Rechercher..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
            {searchTerm && <FaTimes className="clear-search" onClick={() => setSearchTerm('')} />}
          </div>

          <div className="action-buttons">
            <button className="tool-btn" onClick={() => setShowFilters(!showFilters)}>
              <FaFilter /> <span>Filtres</span>
            </button>
            <div className="sort-wrapper">
              <FaSortAmountDown className="sort-icon" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Drawer Filtres */}
        <div className={`filter-drawer ${showFilters ? 'open' : ''}`}>
           <h3>Catégories</h3>
           <div className="category-tags">
             {categories.map(cat => (
               <button 
                 key={cat.value} 
                 className={`tag-btn ${selectedCategory === cat.value ? 'active' : ''}`}
                 onClick={() => { setSelectedCategory(cat.value); setShowFilters(false); }}
               >
                 {cat.label}
               </button>
             ))}
           </div>
        </div>

        {/* Livres */}
        <div className="content-area">
          {loading ? (
            <div className="loading-state"><FaSpinner className="spinner" /> <p>Chargement...</p></div>
          ) : (
            <>
              <p className="results-text">{filteredBooks.length} ouvrages trouvés</p>
              <div className="books-grid">
                {currentBooks.map(book => (
                  <div className="book-card" key={book.id} onClick={() => openDetails(book)}>
                    <div className="book-image-container">
                      <img src={(book.images?.[0]) || book.image || "/placeholder.jpg"} alt={book.title} />
                      {book.featured && <span className="badge-gold">Populaire</span>}
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
                            <span className="current-price">{book.price?.toFixed(2)} €</span>
                            <button className="add-cart-mini disabled" disabled>
                              <FaShoppingCart />
                            </button>
                            <p className="stock-warning">Stock épuisé – veuillez commander plus tard</p>
                          </>
                        ) : (
                          <>
                            {book.promoPrice && book.promoPrice < book.price ? (
                              <span className="current-price">
                                <s>{book.price.toFixed(2)} €</s> <strong>{book.promoPrice.toFixed(2)} €</strong>
                              </span>
                            ) : (
                              <span className="current-price">{book.price?.toFixed(2)} €</span>
                            )}
                            <button className="add-cart-mini" onClick={(e) => { e.stopPropagation(); addToCart(book); }}>
                              <FaShoppingCart />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Précédent
                  </button>

                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx}
                      className={`page-btn ${currentPage === idx + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    className="page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Détails Livre */}
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
                      key={idx} src={img} 
                      className={activeImgIdx === idx ? "active-thumb" : ""} 
                      onClick={() => setActiveImgIdx(idx)} alt="thumb"
                    />
                  ))}
                </div>
              </div>

              <div className="details-info">
                <span className="overline">{selectedBook.category}</span>
                <h2 className="details-title">{selectedBook.title}</h2>
                <p className="details-author">Par <strong>{selectedBook.author}</strong></p>
                <div className="details-price">
                  {selectedBook.promoPrice && selectedBook.promoPrice < selectedBook.price ? (
                    <>
                      <s>{selectedBook.price.toFixed(2)} €</s> <strong>{selectedBook.promoPrice.toFixed(2)} €</strong>
                    </>
                  ) : (
                    <>{selectedBook.price?.toFixed(2)} €</>
                  )}
                </div>
                
                <div className="details-scroll-area">
                  <p className="details-description">
                    {selectedBook.description || "Aucune description disponible pour cet ouvrage."}
                  </p>
                  <div className="book-specs">
                    <div className="spec-item"><span>Format:</span> <strong>Relié</strong></div>
                    <div className="spec-item"><span>Langue:</span> <strong>{selectedBook.language || "N/A"}</strong></div>
                  </div>
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
                    Ajouter au panier <FaShoppingCart style={{marginLeft: '10px'}}/>
                  </button>
                  {selectedBook.stock === 0 && <p className="stock-warning">Stock épuisé – veuillez commander plus tard</p>}
                  {selectedBook.promoPrice && selectedBook.promoPrice < selectedBook.price && (
                    <p className="promo-label">Promotion: {selectedBook.promoPrice.toFixed(2)} € au lieu de {selectedBook.price.toFixed(2)} €</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
