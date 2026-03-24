import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/header";
import Footer from "./components/footer";
import Night from "./pages/night";
import Day from "./pages/day";
import Home from "./pages/home";
//import Import from "./pages/import";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* <Route path="/import" element={<Import />} /> */}
        <Route path="/" element={<Home />} />
        <Route path="/night" element={<Night />} />
        <Route path="/day" element={<Day />} />
      </Routes>
      <Footer />
    </BrowserRouter>
    /*<div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">
            <img
              src="/src/assets/logo.png"
              alt="Psich.ai logo"
              className="brand-logo-img"
            />
          </div>
          <h1 className="brand-title">Psich.ai</h1>
        </div>

        <div className="topbar-actions">
          <button className="icon-btn" aria-label="History">
            ↻+
          </button>
          <button className="icon-btn" aria-label="Profile">
            👤
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="hero-panel">
          <h2 className="hero-title">EEG duomenų analizės tyrimų platforma</h2>

          <div className="upload-box">
            <p className="upload-text">
              Įkelkite savo EEG duomenis ir gaukite vizualizuotus analizės
              rezultatus
            </p>

            <div className="upload-icon">📄</div>

            <p className="upload-formats">Palaikomi formatai: .edf, .csv</p>
          </div>
        </section>

        <section className="info-section">
          <div className="info-text">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
              quam velit, vulputate eu pharetra nec, mattis ac neque. Duis
              vulputate commodo lectus, ac blandit elit tincidunt id. Sed
              rhoncus, tortor sed eleifend tristique, tortor mauris molestie
              elit, et lacinia ipsum quam nec dui. Quisque nec mauris sit amet
              elit iaculis pretium sit amet quis magna. Aenean velit odio,
              elementum in tempus ut, vehicula eu diam. Pellentesque rhoncus
              aliquam mattis. Ut vulputate eros sed felis sodales nec vulputate
              justo hendrerit. Vivamus varius pretium ligula, a aliquam odio
              euismod sit amet. Quisque laoreet sem sit amet orci ullamcorper at
              ultricies metus viverra. Pellentesque arcu mauris, malesuada quis
              ornare accumsan, blandit sed diam.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>© 2025 Coffeino. All rights reserved.</div>
        <div className="footer-links">
          <a href="/">Help Center</a>
          <a href="/">Privacy Policy</a>
          <a href="/">Terms</a>
        </div>
      </footer>
    </div>*/
  );
}
