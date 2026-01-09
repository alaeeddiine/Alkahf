import React from "react";
import { Link } from "react-router-dom";
import {
  FaInstagram,
  FaEnvelope,
  // FaPhone,
  FaMapMarkerAlt,
  FaChevronRight,
  FaStore,
} from "react-icons/fa";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer className="footer-premium">
      <div className="container-inner footer-grid">
        {/* Brand */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src={logo} alt="Alkahf Logo" />
            <span>AL KAHF</span>
          </Link>
          <p className="footer-desc">
            La caverne fut un Refuge pour les Croyants.
          </p>
          <Link to="/books" className="footer-desc">
            <span>Découvrez les incontournables de notre librairie</span>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="footer-links">
          <h4>Navigation</h4>
          <div className="gold-underline"></div>
          <ul>
            <li><Link to="/books"><FaChevronRight /> Librairie</Link></li>
            <li><Link to="/kids"><FaChevronRight /> Librairie adultes</Link></li>
            <li><Link to="/packs"><FaChevronRight /> Packs Exclusifs</Link></li>
            <li><Link to="/about"><FaChevronRight /> À Propos</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-contact">
          <h4>Contactez-nous</h4>
          <div className="gold-underline"></div>
          <div className="contact-list">
            <div className="contact-item">
              <FaMapMarkerAlt className="c-icon" />
              <p>Belgique</p>
            </div>
            {/* <div className="contact-item">
              <FaPhone className="c-icon" />
              <p>+32 492 43 44 57</p>
            </div> */}
            <div className="contact-item">
              <FaEnvelope className="c-icon" />
              <p>alkahf.be@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="footer-social">
          <h4>Suivez-nous</h4>
          <div className="gold-underline"></div>
          <div className="social-links-row">
            <a href="mailto:alkahf.be@gmail.com" className="social-circle"><FaEnvelope /></a>
            <a href="https://www.instagram.com/alkahf.be/" className="social-circle"><FaInstagram /></a>
            <a href="https://www.vinted.be/member/271277738-maktaba-al-kahf" className="social-circle"><FaStore /></a>
          </div>
        </div>  
      </div> <br />

      <div className="footer-copyright">
        <div className="container-inner copyright-flex">
          <p>&copy; {new Date().getFullYear()} <strong>Alkahf</strong>. Tous droits réservés.</p>
          <div className="footer-legal">
            <a href="/LegalNotice">Mentions Légales</a>
            <span className="dot"></span>
            <a href="/PrivacyPolicy">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
