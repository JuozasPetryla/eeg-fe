import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./auth.css";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Prisijungti nepavyko.");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Klaida.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* Left panel */}
      <div className="auth-side">
        <div className="auth-side-inner">
          <div className="auth-logo">
            <span className="auth-logo-icon">🧠</span>
            <span className="auth-logo-text">Psich.ai</span>
          </div>
          <h2 className="auth-side-title">EEG analizės platforma</h2>
          <p className="auth-side-sub">
            Kliniškai pagrįsta dažnių juostų analizė su normatyviniais Z-balais.
          </p>
          <div className="auth-side-stats">
            <div className="auth-stat"><span>5</span>Dažnių juostos</div>
            <div className="auth-stat"><span>6</span>Amžiaus grupės</div>
            <div className="auth-stat"><span>4</span>Ligos</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          <h1 className="auth-title">Prisijungti</h1>
          <p className="auth-subtitle">Įveskite savo paskyros duomenis</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">El. paštas</label>
              <input
                className="auth-input"
                type="email"
                placeholder="vardas@psich.ai"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">
                Slaptažodis
                <a href="/forgot" className="auth-forgot">Pamiršote?</a>
              </label>
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="auth-error">⚠️ {error}</p>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <><span className="auth-spinner" /> Jungiamasi…</> : "Prisijungti"}
            </button>
          </form>

          <p className="auth-switch">
            Neturite paskyros?{" "}
            <NavLink to="/register" className="auth-link">Registruotis</NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}