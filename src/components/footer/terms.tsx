import { useEffect } from "react";
import "./helpcenter.css";

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="home-page help-center">
      {/* HERO SECTION */}
      <section className="home-hero" style={{ minHeight: '30vh', paddingBottom: '3rem' }}>
        <div className="home-hero-content">
          <div className="home-badge">Teisinė informacija</div>
          <h1 className="home-title">
            Naudojimosi <span className="home-title-accent">sąlygos</span>
          </h1>
          <p className="home-subtitle">
            Taisyklės ir atsakomybės naudojantis EEG analizės platforma.
          </p>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="faq-container" style={{ textAlign: 'left', marginBottom: '6rem' }}>
        <div className="privacy-content" style={{ color: 'var(--primary-blue)' }}>
          
          <div className="faq-item" style={{ padding: '2rem', border: 'none', background: 'rgba(0,0,0,0.02)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)' }}>1. Paslaugų pobūdis</h3>
            <p style={{ lineHeight: '1.6' }}>
              Ši platforma teikia automatizuotą EEG duomenų analizę. Rezultatai yra skirti 
              <strong> pagalbinei informacijai</strong> ir neturėtų būti laikomi galutine medicinine diagnoze. 
              Sprendimus dėl gydymo turi priimti kvalifikuotas specialistas.
            </p>
          </div>

          <div className="faq-item" style={{ padding: '2rem', border: 'none' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)' }}>2. Vartotojo atsakomybė</h3>
            <p style={{ lineHeight: '1.6' }}>
              Naudodamiesi sistema jūs sutinkate:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
              <li>Teikti tik tikrus ir tikslius metaduomenis (amžių, lytį).</li>
              <li>Nekelti neteisėto ar kenksmingo turinio.</li>
              <li>Atsakyti už savo paskyros duomenų konfidencialumą.</li>
            </ul>
          </div>

          <div className="faq-item" style={{ padding: '2rem', border: 'none', background: 'rgba(0,0,0,0.02)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)' }}>3. Intelektinė nuosavybė</h3>
            <p style={{ lineHeight: '1.6' }}>
              Visi platformos algoritmai, vizualizacijos metodai ir programinis kodas yra 
              platformos kūrėjų nuosavybė. Vartotojas išlieka savo įkeltų duomenų savininku, 
              tačiau suteikia teisę sistemai juos apdoroti analizės tikslais.
            </p>
          </div>

          <div className="faq-item" style={{ padding: '2rem', border: 'none' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)' }}>4. Atsakomybės ribojimas</h3>
            <p style={{ lineHeight: '1.6' }}>
              Mes dedame visas pastangas užtikrinti algoritmų tikslumą, tačiau neprisiimame atsakomybės už:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
              <li>Klaidas dėl prastos įrašo kokybės (artefaktų).</li>
              <li>Sistemos sutrikimus dėl trečiųjų šalių paslaugų tiekėjų.</li>
              <li>Netinkamą gautų rezultatų interpretavimą.</li>
            </ul>
          </div>

          <div className="faq-item" style={{ padding: '2rem', border: 'none', background: 'rgba(0,0,0,0.02)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)' }}>5. Pakeitimai</h3>
            <p style={{ lineHeight: '1.6' }}>
              Mes pasiliekame teisę bet kada atnaujinti šias sąlygas. Tęsdami naudojimąsi platforma, 
              jūs automatiškai sutinkate su naujausia sąlygų versija.
            </p>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '3rem', textAlign: 'center' }}>
            Dokumento versija: 1.0.2 | Galioja nuo: 2026-05-12
          </p>
        </div>
      </section>
    </div>
  );
}