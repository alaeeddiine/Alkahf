import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate, Link} from 'react-router-dom';
import { getAllBooks, getBooksByCategory } from "../firebase/config";
import { CartContext } from "../context/CartContext";
import { FaShoppingCart, FaSearch, FaTimes, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import { db } from "../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

const TAX_RATE = 21;
const getPriceWithTax = (price) => +(price * (1 + TAX_RATE / 100)).toFixed(2);

const Books = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const formatPrice = (price) => price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  const currentPageState = useState(1);
  const [currentPage, setCurrentPage] = currentPageState;
  const BOOKS_PER_PAGE = 12;
  const urlCategory = searchParams.get('category');

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "Quran & Tafsir", label: "Coran & Tafsir" },
    { value: "Sciences du Hadith", label: "Hadith" },
    { value: "Fiqh & Jurisprudence", label: "Jurisprudence" },
    { value: "Sira & Biographies", label: "Biographies" },
    { value: "Tawhid ", label: "Tawhid" },
    { value: "Aqida & Croyances", label: "Aqida & Croyances" }
  ];

  const sortOptions = [
    { value: "default", label: "Par défaut" },
    { value: "price-asc", label: "Prix croissant" },
    { value: "price-desc", label: "Prix décroissant" },
    { value: "title", label: "Ordre alphabétique" }
  ];

  // ---------- Récupérer promos ----------
  const getGeneralPromos = async () => {
    const promosRef = collection(db, "promos");
    const q = query(promosRef, where("active", "==", true), where("type", "==", "general"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  // ---------- Charger les livres ----------
  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);
      let data = (urlCategory && urlCategory !== "all")
        ? await getBooksByCategory(urlCategory)
        : await getAllBooks();

      data = data.filter(book => book.category !== "Livres enfants");

      const generalPromos = await getGeneralPromos();
      const applyPromo = (price, promo) => {
        if (!promo || promo.amount == null) return price;
        return +(price * (1 - promo.amount / 100)).toFixed(2);
      };

      const applicablePromo = generalPromos.find(
        p => p.appliesTo === "all" || p.appliesTo === "books"
      );

      if (applicablePromo) {
        data = data.map(book => ({
          ...book,
          promoPrice: applyPromo(book.price, applicablePromo)
        }));
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
      const term = searchTerm.toLowerCase();
      result = result.filter(b =>
        b.title?.toLowerCase().includes(term) ||
        b.author?.toLowerCase().includes(term) ||
        b.category?.toLowerCase().includes(term) ||
        b.edition?.toLowerCase().includes(term)
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

  useEffect(() => setCurrentPage(1), [searchTerm, selectedCategory, sortBy]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [currentPage]);

  const indexOfLastBook = currentPage * BOOKS_PER_PAGE;
  const indexOfFirstBook = indexOfLastBook - BOOKS_PER_PAGE;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const PAGES_PER_GROUP = 6;
  const currentGroup = Math.floor((currentPage - 1) / PAGES_PER_GROUP);
  const startPage = currentGroup * PAGES_PER_GROUP + 1;
  const endPage = Math.min(startPage + PAGES_PER_GROUP - 1, totalPages);

  return (
    <div className="books-page">
      <div className="container-inner">
        {/* Tools */}
        <div className="books-tools">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
            <div className="loading-state">Chargement des livres...</div>
          ) : (
            <>
              <p className="results-text">{filteredBooks.length} ouvrages trouvés</p>
              <div className="books-grid">
                {currentBooks.map(book => (
                  <Link
                    key={book.id}
                    to={`/book/${book.id}`}
                    state={{ bookData: book }}
                    className="book-card-link"
                  >
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" disabled={currentGroup === 0} onClick={() => setCurrentPage(startPage - 1)}>Précédent</button>
                  {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                    const page = startPage + i;
                    return (
                      <button 
                        key={page} 
                        className={`page-btn ${currentPage === page ? 'active' : ''}`} 
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button className="page-btn" disabled={endPage >= totalPages} onClick={() => setCurrentPage(endPage + 1)}>Suivant</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Books;
