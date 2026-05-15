import { useEffect } from "react";
import "./helpcenter.css";

export default function PrivacyPage() {
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
            Privatumo <span className="home-title-accent">politika</span>
          </h1>
          <p className="home-subtitle">
            Skaidrumas ir jūsų duomenų saugumas yra mūsų prioritetas. 
            Sužinokite, kaip tvarkome jūsų EEG įrašus.
          </p>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="faq-container" style={{ textAlign: 'left', marginBottom: '6rem' }}>
        <div className="privacy-content" style={{ color: 'var(--primary-blue)' }}>
          
          <div className="faq-item" style={{ padding: '2rem', border: 'none', background: 'rgba(0,0,0,0.02)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)' }}>1. Duomenų rinkimas</h3>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              Mes renkame tik tuos duomenis, kuriuos jūs pateikiate analizei:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>EEG signalų failai (.edf, .csv formatu).</li>
              <li>Metaduomenys, reikalingi tiksliam Z-balų skaičiavimui (paciento amžius, lytis).</li>
              <li>Paskyros duomenys (el. pašto adresas).</li>
            </ul>
          </div>

          <div className="faq-item" style={{ padding: '2rem', border: 'none' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)' }}>2. Kaip naudojami jūsų duomenys?</h3>
            <p style={{ lineHeight: '1.6' }}>
              Jūsų įkelti EEG įrašai naudojami išskirtinai skaičiavimams atlikti. Algoritmai analizuoja dažnių juostas, 
              generuoja hipnogramas ir lėtąsias bangas. Mes nenaudojame jūsų duomenų reklamai ar trečiųjų šalių paslaugoms.
            </p>
          </div>

          <div className="faq-item" style={{ padding: '2rem', border: 'none', background: 'rgba(0,0,0,0.02)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)' }}>3. Duomenų saugojimas ir šalinimas</h3>
            <p style={{ lineHeight: '1.6' }}>
              Saugumas mums yra kritiškai svarbus:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
              <li><strong>Šifravimas:</strong> Visi duomenys perduodami per saugų SSL ryšį.</li>
              <li><strong>Automatinis šalinimas:</strong> Neapdoroti EEG failai automatiškai pašalinami po 30 dienų.</li>
              <li><strong>Kontrolė:</strong> Vartotojas bet kuriuo metu gali rankiniu būdu ištrinti savo analizės istoriją.</li>
            </ul>
          </div>

          <div className="faq-item" style={{ padding: '2rem', border: 'none' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)' }}>4. BDAR (GDPR) atitiktis</h3>
            <p style={{ lineHeight: '1.6' }}>
              Jūs turite teisę susipažinti su savo duomenimis, reikalauti juos ištaisyti arba ištrinti ("teisė būti pamirštam"). 
              Dėl visų užklausų, susijusių su duomenų apsauga, kreipkitės adresu <strong>privacy@eeg-platform.lt</strong>.
            </p>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '3rem', textAlign: 'center' }}>
            Paskutinį kartą atnaujinta: 2026 m. gegužės 12 d.
          </p>
        </div>
      </section>
    </div>
  );
}