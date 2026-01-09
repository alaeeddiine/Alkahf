import React from "react";

const LegalNotice = () => {
  return (
    <section className="legal-section">
      <div className="container-inner legal-container">
        
        <header className="legal-header">
          <span className="gold-label">Informations légales</span>
          <h1>Mentions légales</h1>
          <p className="legal-subtitle">
            Conformément au Code de droit économique belge
          </p>
        </header>

        <div className="legal-card">
          <h2>Éditeur du site</h2>
          <p>
            <strong>Islamic Books Store</strong><br />
            Activité : Vente de livres islamiques<br />
            Adresse : Rue Exemple 10, 1000 Bruxelles, Belgique<br />
            Email : alkahf.be@gmail.com<br />
            Numéro BCE : 0XXX.XXX.XXX<br />
            TVA : BE0XXX.XXX.XXX
          </p>
        </div>

        <div className="legal-card">
          <h2>Hébergement</h2>
          <p>
            Hébergeur : combell<br />
            Site web : www.combell.com/fr
          </p>
        </div>

        <div className="legal-card">
          <h2>Propriété intellectuelle</h2>
          <p>
            Tous les contenus présents sur ce site sont protégés par le droit
            d’auteur. Toute reproduction ou utilisation sans autorisation est
            strictement interdite.
          </p>
        </div>

        <div className="legal-card">
          <h2>Responsabilité</h2>
          <p>
            Le vendeur ne peut être tenu responsable des interruptions,
            dysfonctionnements ou dommages indirects liés à l’utilisation du site.
          </p>
        </div>

        <div className="legal-card">
          <h2>Droit applicable</h2>
          <p>
            Le site est soumis au droit belge. Tout litige relève de la compétence
            exclusive des tribunaux belges.
          </p>
        </div>

      </div>
    </section>
  );
};

export default LegalNotice;
