import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaTimes,
  FaImage,
  FaGlobe,
  FaBookOpen
} from "react-icons/fa";

const LANGUAGES = ["arabic", "arabic/français", "français", "anglais", "arabic/anglais"];

const AdminPacks = () => {
  const [packs, setPacks] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    promoPrice: "",
    language: "",
    includedBooks: [""],
    images: [""]
  });

  const packsCollection = collection(db, "packs");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setAdminUser(user));
    fetchPacks();
    return () => unsub();
  }, []);

  const fetchPacks = async () => {
    const data = await getDocs(packsCollection);
    setPacks(
      data.docs.map((d) => {
        const p = d.data();
        return {
          ...p,
          id: d.id,
          images: Array.isArray(p.images) ? p.images : [""],
          includedBooks: Array.isArray(p.includedBooks) ? p.includedBooks : [""]
        };
      })
    );
  };

  /* --- LOGIQUE IMAGES --- */
  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const imgs = [...form.images];
      imgs[index] = reader.result;
      setForm({ ...form, images: imgs });
    };
    reader.readAsDataURL(file);
  };

  const addImageSlot = () => {
    if (form.images.length >= 5) return;
    setForm({ ...form, images: [...form.images, ""] });
  };

  const removeImage = (index) => {
    if (form.images.length === 1) return;
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  /* --- LOGIQUE LIVRES --- */
  const addIncludedBook = () => {
    setForm({ ...form, includedBooks: [...form.includedBooks, ""] });
  };

  const updateIncludedBook = (index, value) => {
    const books = [...form.includedBooks];
    books[index] = value;
    setForm({ ...form, includedBooks: books });
  };

  const removeIncludedBook = (index) => {
    if (form.includedBooks.length === 1) return;
    setForm({ ...form, includedBooks: form.includedBooks.filter((_, i) => i !== index) });
  };

  /* --- ACTIONS --- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminUser) return alert("Accès refusé");
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
        includedBooks: form.includedBooks.filter(b => b.trim() !== ""),
        updatedAt: Timestamp.now()
      };

      if (editId) {
        await updateDoc(doc(db, "packs", editId), payload);
      } else {
        await addDoc(packsCollection, { ...payload, createdAt: Timestamp.now() });
      }

      setShowForm(false);
      setEditId(null);
      resetForm();
      fetchPacks();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ title: "", description: "", price: "", promoPrice: "", language: "", includedBooks: [""], images: [""] });
  };

  const handleEdit = (pack) => {
    setEditId(pack.id);
    setForm({
      title: pack.title || "",
      description: pack.description || "",
      price: pack.price || "",
      promoPrice: pack.promoPrice || "",
      language: pack.language || "",
      includedBooks: pack.includedBooks?.length ? pack.includedBooks : [""],
      images: pack.images?.length ? pack.images : [""]
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce pack ?")) {
      await deleteDoc(doc(db, "packs", id));
      fetchPacks();
    }
  };

  return (
    <div className="admin-packs-container">
      <header className="hub-header-premium">
        <h1>Packs Exclusifs</h1>
        <button className="add-btn" onClick={() => setShowForm(true)}>
          <FaPlus /> Nouveau Pack
        </button>
      </header>

      <div className="packs-premium-grid">
        {packs.length === 0 && (
          <div className="empty-state">Aucun pack disponible pour le moment.</div>
        )}

        {packs.map((p) => (
          <div key={p.id} className="pack-glass-card">
            <div className="pack-image-wrapper">
              <img src={p.images?.[0] || "https://via.placeholder.com/300x180?text=No+Image"} alt={p.title} />
              <div className="pack-price-badge">
                {p.promoPrice ? `${p.promoPrice}€` : `${p.price}€`}
              </div>
            </div>

            <div className="pack-card-content">
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              
              <div className="pack-language-info">
                 <FaGlobe /> {p.language}
              </div>

              <div className="pack-card-footer">
                <button className="edit-btn" onClick={() => handleEdit(p)}>
                  <FaEdit />
                </button>
                <button className="delete-btn" onClick={() => handleDelete(p.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="popup-overlay">
          <form className="popup-card" onSubmit={handleSubmit}>
            <div className="popup-header">
              <h3>{editId ? "Édition du Pack" : "Création d'un Pack"}</h3>
              <button type="button" className="close-popup-btn" onClick={() => setShowForm(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="popup-form">
              <input
                placeholder="Nom du pack premium"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <textarea
                placeholder="Description détaillée du pack..."
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div className="form-row-split">
                <input
                  type="number"
                  placeholder="Prix de base (€)"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Prix promo (Optionnel)"
                  value={form.promoPrice}
                  onChange={(e) => setForm({ ...form, promoPrice: e.target.value })}
                />
              </div>

              <select
                required
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                <option value="">Sélectionner la langue</option>
                {LANGUAGES.map(l => (
                  <option key={l} value={l}>{l.toUpperCase()}</option>
                ))}
              </select>

              <div className="included-books-zone">
                <h4 style={{margin: '0 0 1rem 0', display:'flex', alignItems:'center', gap:'8px'}}>
                  <FaBookOpen /> Livres inclus
                </h4>
                {form.includedBooks.map((book, i) => (
                  <div key={i} className="included-book-row">
                    <input
                      style={{flex: 1}}
                      placeholder="Nom du livre"
                      value={book}
                      onChange={(e) => updateIncludedBook(i, e.target.value)}
                    />
                    <button type="button" onClick={() => removeIncludedBook(i)} className="delete-btn">
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addIncludedBook} className="add-btn" style={{padding:'5px 12px', fontSize:'0.8rem'}}>
                  <FaPlus /> Ajouter un titre
                </button>
              </div>

              <div className="image-upload-zone">
                <h4 style={{width:'100%', margin: '0 0 1rem 0'}}>Galerie Photos</h4>
                {form.images.map((img, i) => (
                  <div key={i} className="image-slot">
                    {img ? (
                      <>
                        <img src={img} alt="" />
                        <button type="button" onClick={() => removeImage(i)} className="remove-img-badge">
                          ×
                        </button>
                      </>
                    ) : (
                      <label style={{cursor:'pointer', textAlign:'center'}}>
                        <FaImage style={{color:'#cbd5e1', fontSize:'1.5rem'}} />
                        <input type="file" hidden onChange={(e) => handleImageUpload(i, e)} />
                      </label>
                    )}
                  </div>
                ))}
                {form.images.length < 5 && (
                  <button type="button" onClick={addImageSlot} className="image-slot" style={{background:'none', cursor:'pointer'}}>
                    <FaPlus style={{color:'#cbd5e1'}} />
                  </button>
                )}
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : (editId ? "Mettre à jour" : "Publier le pack")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPacks;