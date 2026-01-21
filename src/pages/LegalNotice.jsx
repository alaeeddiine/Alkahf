import React from "react";

const LegalNotice = () => {
  return (
    <section className="legal-section">
      <div className="container-inner legal-container">

        <header className="legal-header">
          <span className="gold-label">Cadre juridique</span>
          <h1>Mentions légales</h1>
          <p className="legal-subtitle">
            Dernière mise à jour : 01/02/2026
          </p>
        </header>

        <div className="legal-card">
          <h2>1. Informations générales</h2>
          <p>
            Nom commercial : <strong>Al Kahf</strong><br />
            Statut : Société<br />
            Email : alkahf.be@gmail.com<br />
            Numéro d’entreprise (BCE) : XXXXXXXX<br />
            Numéro de TVA : XXXXXXXX
          </p>
        </div>

        <div className="legal-card">
          <h2>2. Hébergement du site</h2>
          <p>
            Le site est hébergé par : Alkahf <br /><br />
            Nom : Combell<br />
            Site web : www.combell.com/fr/
          </p>
        </div>

        <div className="legal-card">
          <h2>3. Propriété intellectuelle</h2>
          <p>
            L’ensemble des contenus du site (textes, images, logos, graphismes,
            vidéos) est la propriété exclusive de Al Kahf ou de ses partenaires.
            <br /><br />
            Toute reproduction sans autorisation écrite est strictement interdite.
          </p>
        </div>

        <div className="legal-card">
          <h2>4. Données personnelles</h2>
          <p>
            Les données collectées sont utilisées uniquement pour la gestion des
            commandes et la relation client, conformément au RGPD.
            <br /><br />
            Pour plus d’informations, consulter la Politique de confidentialité.
          </p>
        </div>

        <div className="legal-card">
          <h2>5. Cookies</h2>
          <p>
            Le site utilise des cookies.
            <br /><br />
            Pour plus d’informations, consulter la Politique de cookies.
          </p>
        </div>

        <div className="legal-card">
          <h2>6. Responsabilité</h2>
          <p>
            Al Kahf s’efforce d’assurer l’exactitude des informations publiées,
            sans pouvoir garantir l’absence d’erreurs.
          </p>
        </div>

        <div className="legal-card">
          <h2>7. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont régies par le droit belge.
          </p>
        </div>

        <div className="legal-card">
          <h2>8. Contact</h2>
          <p>📧 <strong>alkahf.be@gmail.com</strong></p>
        </div>

      </div>
    </section>
  );
};

export default LegalNotice;
