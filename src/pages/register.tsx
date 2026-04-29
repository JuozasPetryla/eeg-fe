import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./auth.css";

export default function RegisterPage() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Slaptažodžiai nesutampa.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Registracija nepavyko.");
      }

      window.location.href = "/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Klaida.");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : 3;

  const strengthLabel = ["", "Silpnas", "Vidutinis", "Stiprus"][passwordStrength];
  const strengthClass = ["", "weak", "medium", "strong"][passwordStrength];

  return (
    <div className="auth-root">
      {/* Left panel */}
      <div className="auth-side">
        <div className="auth-side-inner">
          <div className="auth-logo">
            <span className="auth-logo-icon">🧠</span>
            <span className="auth-logo-text">Psich.ai</span>
          </div>
          <h2 className="auth-side-title">Pradėkite nemokamai</h2>
          <p className="auth-side-sub">
            Sukurkite paskyrą ir gaukite prieigą prie klinikinės EEG analizės įrankių.
          </p>
          <ul className="auth-side-list">
            <li>✓ Dažnių juostų analizė su Z-balais</li>
            <li>✓ Dienos ir nakties EEG palaikymas</li>
            <li>✓ 4 ligų biomarkeriai</li>
            <li>✓ Analizių istorija</li>
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          <h1 className="auth-title">Registruotis</h1>
          <p className="auth-subtitle">Sukurkite naują paskyrą</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Vardas Pavardė</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Jonas Jonaitis"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

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
              <label className="auth-label">Slaptažodis</label>
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              {password.length > 0 && (
                <div className="auth-strength">
                  <div className={`auth-strength-bar ${strengthClass}`}>
                    <div />
                  </div>
                  <span className={`auth-strength-label ${strengthClass}`}>{strengthLabel}</span>
                </div>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-label">Pakartokite slaptažodį</label>
              <input
                className={`auth-input ${confirm && confirm !== password ? "auth-input--error" : ""}`}
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
              {confirm && confirm !== password && (
                <span className="auth-field-hint">Slaptažodžiai nesutampa</span>
              )}
            </div>

            {error && <p className="auth-error">⚠️ {error}</p>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <><span className="auth-spinner" /> Kuriama paskyra…</> : "Registruotis"}
            </button>
          </form>

          <p className="auth-switch">
            Jau turite paskyrą?{" "}
            <NavLink to="/login" className="auth-link">Prisijungti</NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}