import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import "./home.css";

const features = [
  {
    icon: "🌙",
    title: "Nakties EEG signalai",
    desc: "Miego stadijų analizė, hipnogramos ir lėtų bangų vizualizacija.",
    to: "/night",
    color: "#203d63",
  },
  {
    icon: "☀️",
    title: "Dienos EEG signalai",
    desc: "ADHD, depresijos, epilepsijos ir migrenos biomarkerių paieška.",
    to: "/day",
    color: "#149A85",
  },
];

const stats = [
  { value: "5", label: "Dažnių juostos" },
  { value: "7", label: "EEG sąlygos" },
  { value: "6", label: "Amžiaus grupės" },
  { value: "4", label: "Ligos" },
];

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animuota EEG banga fone
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let t = 0;
    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // EEG tipo banga
      const waves = [
        { amp: 18, freq: 0.018, speed: 0.4, color: "rgba(32,61,99,0.18)", offset: 0 },
        { amp: 10, freq: 0.03,  speed: 0.7, color: "rgba(20,154,133,0.13)", offset: 2 },
        { amp: 25, freq: 0.012, speed: 0.2, color: "rgba(32,61,99,0.08)", offset: 5 },
      ];

      waves.forEach(w => {
        ctx.beginPath();
        ctx.strokeStyle = w.color;
        ctx.lineWidth = 2;
        for (let x = 0; x <= width; x++) {
          const spike = Math.sin(x * 0.05 + t * 1.5) > 0.9
            ? Math.sin(x * 0.05 + t * 1.5) * 40
            : 0;
          const y = height / 2
            + Math.sin(x * w.freq + t * w.speed + w.offset) * w.amp
            + Math.sin(x * w.freq * 2.3 + t * w.speed * 1.4) * (w.amp * 0.4)
            + spike;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      t += 0.03;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="home-page">
      {/* HERO */}
      <section className="home-hero">
        <canvas ref={canvasRef} className="home-canvas" />

        <div className="home-hero-content">
          <div className="home-badge">EEG Analizės Platforma</div>
          <h1 className="home-title">
            Smegenų bangos —<br />
            <span className="home-title-accent">matoma forma</span>
          </h1>
          <p className="home-subtitle">
            Įkelkite EEG įrašus ir gaukite kliniškai pagrįstą dažnių juostų analizę
            su normatyviniais Z-balais pagal amžiaus grupę.
          </p>

          <div className="home-ctas">
            <NavLink to="/day" className="home-btn-primary">
              Pradėti analizę
            </NavLink>
            <NavLink to="/night" className="home-btn-secondary">
              Miego analizė →
            </NavLink>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="home-stats">
        {stats.map(s => (
          <div key={s.label} className="home-stat">
            <span className="home-stat-value">{s.value}</span>
            <span className="home-stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section className="home-features">
        <h2 className="home-section-title">Analizės moduliai</h2>
        <div className="home-cards">
          {features.map(f => (
            <NavLink key={f.to} to={f.to} className="home-card" style={{ "--accent": f.color } as React.CSSProperties}>
              <div className="home-card-icon">{f.icon}</div>
              <h3 className="home-card-title">{f.title}</h3>
              <p className="home-card-desc">{f.desc}</p>
              <span className="home-card-link">Atidaryti →</span>
            </NavLink>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="home-how">
        <h2 className="home-section-title">Kaip tai veikia</h2>
        <div className="home-steps">
          {[
            { n: "01", title: "Įkelkite failą", desc: "Palaikomi .edf ir .csv formatai" },
            { n: "02", title: "Pasirinkite analizę", desc: "Dienos ar nakties EEG, amžiaus grupė" },
            { n: "03", title: "Gaukite rezultatus", desc: "Z-balai, grafikai, klinikinė interpretacija" },
          ].map(s => (
            <div key={s.n} className="home-step">
              <span className="home-step-num">{s.n}</span>
              <h4 className="home-step-title">{s.title}</h4>
              <p className="home-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}