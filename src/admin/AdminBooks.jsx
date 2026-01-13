import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaTrash,
  FaEdit,
  FaSearch,
  FaPlus,
  FaTimes,
  FaImage,
} from "react-icons/fa";

const CATEGORIES = [
  "Quran & Tafsir",
  "Sciences du Hadith",
  "Fiqh & Jurisprudence",
  "Sira & Biographies",
  "Livres enfants",
  "Tawhid ",
  "Aqida & Croyances"
];

const LANGUAGES = ["arabic", "arabic/français", "français", "anglais", "arabic/anglais"];

const AdminBooks = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    author: "",
    description: "",
    price: "",
    promoPrice: "",
    stock: "",
    language: "",
    category: "",
    images: [""],
  });

  const booksCollection = collection(db, "books");

  /* ================= AUTH & FETCH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setAdminUser(user));
    getBooks();
    return () => unsub();
  }, []);

  const getBooks = async () => {
    const data = await getDocs(booksCollection);
    setBooks(
      data.docs.map((d) => {
        const bookData = d.data();
        if (!bookData.images || !Array.isArray(bookData.images)) bookData.images = [""];
        return { ...bookData, id: d.id };
      })
    );
  };

  /* ================= IMAGE UPLOAD ================= */
  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Image max 2MB");

    const reader = new FileReader();
    reader.onloadend = () => {
      const imgs = [...form.images];
      imgs[index] = reader.result;
      setForm({ ...form, images: imgs });
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageSlot = () => {
    if (form.images.length >= 5) return;
    setForm({ ...form, images: [...form.images, ""] });
  };

  const handleRemoveImage = (index) => {
    if (form.images.length === 1) return;
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminUser) return alert("Accès refusé");

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        price: Number(Number(form.price).toFixed(2)),
        promoPrice: form.promoPrice
          ? Number(Number(form.promoPrice).toFixed(2))
          : null,
        stock: Number(form.stock),
        updatedAt: Timestamp.now(),
      };

      if (editId) {
        await updateDoc(doc(db, "books", editId), payload);
      } else {
        await addDoc(booksCollection, { ...payload, createdAt: Timestamp.now() });
      }

      setShowForm(false);
      setEditId(null);
      setForm({
        title: "",
        author: "",
        description: "",
        price: "",
        promoPrice: "",
        stock: "",
        language: "",
        category: "",
        images: [""],
      });
      getBooks();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce livre ?")) {
      await deleteDoc(doc(db, "books", id));
      getBooks();
    }
  };

  const handleEdit = (book) => {
    setEditId(book.id);
    setForm({
      title: book.title || "",
      author: book.author || "",
      description: book.description || "",
      price: book.price || "",
      promoPrice: book.promoPrice || "",
      stock: book.stock || "",
      language: book.language || "",
      category: book.category || "",
      images: book.images?.length ? book.images : [""],
    });
    setShowForm(true);
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page-container">
      {/* HEADER */}
      <header className="hub-header-premium">
        <h1>Bibliothèque Royale</h1>
        <div className="search-wrapper-premium">
          <FaSearch className="gold-text" />
          <input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="add-btn auth-submit-btn-premium"
            onClick={() => {
              setShowForm(true);
              setEditId(null);
            }}
          >
            <FaPlus /> Ajouter un livre
          </button>
        </div>
      </header>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Livre</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map((book) => (
              <tr key={book.id}>
                <td>
                  <div className="book-cell">
                    <img src={book.images?.[0] || "/placeholder.jpg"} alt={book.title} />
                    <div>
                      <span className="b-title">{book.title}</span>
                      <span className="b-author">{book.author}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="cat-pill">{book.category}</span>
                </td>
                <td className="price-tag">
                  {book.promoPrice ? (
                    <>
                      <s>{book.price.toFixed(2)}€</s>{" "}
                      <b>{book.promoPrice.toFixed(2)}€</b>
                    </>
                  ) : (
                    `${book.price.toFixed(2)}€`
                  )}
                </td>
                <td>{book.stock}</td>
                <td>
                  <div className="action-cluster">
                    <button className="edit-btn" onClick={() => handleEdit(book)}>
                      <FaEdit />
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(book.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORM POPUP */}
      {showForm && (
        <div className="popup-overlay">
          <form className="popup-card" onSubmit={handleSubmit}>
            <div className="popup-header">
              <h3>{editId ? "Modifier" : "Ajouter"} un livre</h3>
              <button type="button" className="close-btn" onClick={() => setShowForm(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="popup-form">
              <div className="input-group">
                <label>Titre</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Edition</label>
                <input
                  required
                  value={form.edition}
                  onChange={(e) => setForm({ ...form, edition: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Auteur</label>
                <input
                  required
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-row-split">
                <div className="input-group">
                  <label>Prix</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Prix promo (optionnel)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.promoPrice}
                    onChange={(e) => setForm({ ...form, promoPrice: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Stock</label>
                <input
                  type="number"
                  required
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>

              <div className="form-row-split">
                <div className="input-group">
                  <label>Langue</label>
                  <select
                    required
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                  >
                    <option value="">Langue</option>
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Catégorie</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Catégorie</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* IMAGE UPLOAD */}
              <div className="image-upload-zone">
                {form.images.map((img, index) => (
                  <div className="image-slot" key={index}>
                    {img ? (
                      <div className="preview-container">
                        <img src={img} alt={`Book ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-img"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <label className="upload-placeholder">
                        <FaImage size={24} />
                        <span>Ajouter une image</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => handleImageUpload(index, e)}
                        />
                      </label>
                    )}
                  </div>
                ))}
                {form.images.length < 5 && (
                  <button type="button" className="add-image-btn" onClick={handleAddImageSlot}>
                    <FaPlus /> Ajouter une image
                  </button>
                )}
              </div>

              <button type="submit" className="submit-action-btn auth-submit-btn-premium" disabled={isSubmitting}>
                {isSubmitting ? "..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminBooks;
