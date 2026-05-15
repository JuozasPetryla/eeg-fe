import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./helpcenter.css";

const faqs = [
  {
    question: "Kokie failų formatai yra palaikomi?",
    answer: "Šiuo metu sistema pilnai palaiko .edf (European Data Format) ir specialiai sukonfigūruotus .csv failus. Rekomenduojame naudoti .edf formatą tiksliausiems rezultatams užtikrinti.",
  },
  {
    question: "Kas yra Z-balai ir kaip jie skaičiuojami?",
    answer: "Z-balai rodo, kiek paciento smegenų bangų aktyvumas nukrypsta nuo sveikos populiacijos vidurkio. Mes lyginame duomenis su normatyvine duomenų baze pagal paciento amžiaus grupę.",
  },
  {
    question: "Kiek laiko trunka viena analizė?",
    answer: "Dienos EEG analizė paprastai trunka nuo 1 iki 3 minučių. Nakties (miego) analizė dėl duomenų kiekio gali užtrukti iki 5–10 minučių.",
  },
  {
    question: "Ar duomenys yra saugūs?",
    answer: "Visi įkelti failai yra šifruojami. Po analizės galite pasirinkti ištrinti failus iš mūsų serverių rankiniu būdu arba jie bus automatiškai pašalinti po 30 dienų.",
  }
];

const categories = [
  { icon: "📄", title: "Dokumentacija", desc: "Išsamūs aprašymai apie algoritmus." },
  { icon: "video", title: "Video gidai", desc: "Kaip teisingai interpretuoti grafikus." },
  { icon: "✉️", title: "Pagalba", desc: "Susisiekite su technine komanda." },
];

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="home-page help-center">
      {/* HERO SECTION */}
      <section className="home-hero" style={{ minHeight: '40vh', paddingBottom: '4rem' }}>
        <div className="home-hero-content">
          <div className="home-badge">Pagalbos centras</div>
          <h1 className="home-title">
            Kaip galime <span className="home-title-accent">padėti?</span>
          </h1>
          <div className="help-search-container">
            <input 
              type="text" 
              placeholder="Ieškoti atsakymų..." 
              className="help-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* QUICK LINKS */}
      <section className="home-features">
        <div className="home-cards">
          {categories.map((cat, idx) => (
            <div key={idx} className="home-card" style={{ "--accent": idx === 1 ? "#149A85" : "#203d63" } as React.CSSProperties}>
              <div className="home-card-icon">{cat.icon === "video" ? "🎥" : cat.icon}</div>
              <h3 className="home-card-title">{cat.title}</h3>
              <p className="home-card-desc">{cat.desc}</p>
              <button className="home-card-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                Naršyti skiltį →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="home-how" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '4rem 2rem' }}>
        <h2 className="home-section-title">Dažniausiai užduodami klausimai</h2>
        <div className="faq-list" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div key={index} className="faq-item" style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.5rem' }}>
                <h4 className="home-step-title" style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#203d63' }}>
                  {faq.question}
                </h4>
                <p className="home-step-desc" style={{ opacity: 0.8 }}>{faq.answer}</p>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', opacity: 0.5 }}>Apgailestaujame, nieko neradome.</p>
          )}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="home-hero" style={{ minHeight: 'auto', background: 'none', padding: '4rem 0' }}>
        <div className="home-hero-content">
          <h3>Neradote atsakymo?</h3>
          <p className="home-subtitle">Mūsų komanda pasiruošusi atsakyti į specifinius klinikinius ar techninius klausimus.</p>
          <div className="home-ctas">
            <a href="mailto:support@eeg-platform.lt" className="home-btn-primary">
              Rašyti el. laišką
            </a>
            <NavLink to="/" className="home-btn-secondary">
              Grįžti į pradžią
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
}