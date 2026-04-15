import { useState } from "react";
import "./account.css";

const TABS = ["Profilis", "Sauga", "Istorija"];

const mockHistory = [
  { id: 1, file: "pacientas_001.edf", date: "2025-06-12 14:32", type: "Dienos EEG", bands: ["Alpha", "Beta"], duration: "182 s" },
  { id: 2, file: "naktis_2025_06_10.edf", date: "2025-06-10 09:15", type: "Nakties EEG", bands: ["Delta", "Theta"], duration: "28 800 s" },
  { id: 3, file: "random_testuks.edf", date: "2025-06-08 17:44", type: "Dienos EEG", bands: ["Gamma"], duration: "95 s" },
  { id: 4, file: "pacientas_003.edf", date: "2025-06-05 11:20", type: "Dienos EEG", bands: ["Alpha", "Theta", "Beta"], duration: "240 s" },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("Profilis");
  const [name, setName]           = useState("Jonas Jonaitis");
  const [email, setEmail]         = useState("jonas@psich.ai");
  const [org, setOrg]             = useState("Vilniaus universitetinė ligoninė");
  const [saved, setSaved]         = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="ac-page">

      {/* ── Header strip ── */}
      <div className="ac-hero">
        <div className="ac-avatar">
          {name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="ac-hero-info">
          <h1 className="ac-hero-name">{name}</h1>
          <p className="ac-hero-email">{email}</p>
          <span className="ac-hero-badge">Gydytojas</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="ac-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`ac-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="ac-body">

        {/* PROFILIS */}
        {activeTab === "Profilis" && (
          <div className="ac-section">
            <div className="ac-card">
              <h3 className="ac-card-title">Asmeninė informacija</h3>

              <div className="ac-field-grid">
                <div className="ac-field">
                  <label className="ac-label">Vardas Pavardė</label>
                  <input
                    className="ac-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="ac-field">
                  <label className="ac-label">El. paštas</label>
                  <input
                    className="ac-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="ac-field ac-field--full">
                  <label className="ac-label">Organizacija</label>
                  <input
                    className="ac-input"
                    value={org}
                    onChange={e => setOrg(e.target.value)}
                  />
                </div>
                <div className="ac-field">
                  <label className="ac-label">Rolė</label>
                  <select className="ac-input ac-select">
                    <option>Gydytojas</option>
                    <option>Tyrėjas</option>
                  </select>
                </div>
                <div className="ac-field">
                  <label className="ac-label">Amžiaus grupės numatytoji</label>
                  <select className="ac-input ac-select">
                    <option>18–30</option>
                    <option>31–50</option>
                    <option>51–65</option>
                    <option>66–80</option>
                  </select>
                </div>
              </div>

              <div className="ac-actions">
                <button className="ac-btn ac-btn--primary" onClick={handleSave}>
                  {saved ? "✓ Išsaugota" : "Išsaugoti"}
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="ac-stats">
              {[
                { value: "4",  label: "Analizės" },
                { value: "2",  label: "Pacientai" },
                { value: "12", label: "Failai" },
                { value: "7d", label: "Aktyvus" },
              ].map(s => (
                <div key={s.label} className="ac-stat">
                  <span className="ac-stat-value">{s.value}</span>
                  <span className="ac-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SAUGA */}
        {activeTab === "Sauga" && (
          <div className="ac-section">
            <div className="ac-card">
              <h3 className="ac-card-title">Slaptažodžio keitimas</h3>
              <div className="ac-field-grid">
                <div className="ac-field ac-field--full">
                  <label className="ac-label">Dabartinis slaptažodis</label>
                  <input className="ac-input" type="password" placeholder="••••••••" />
                </div>
                <div className="ac-field">
                  <label className="ac-label">Naujas slaptažodis</label>
                  <input className="ac-input" type="password" placeholder="••••••••" />
                </div>
                <div className="ac-field">
                  <label className="ac-label">Pakartokite slaptažodį</label>
                  <input className="ac-input" type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="ac-actions">
                <button className="ac-btn ac-btn--primary">Keisti slaptažodį</button>
              </div>
            </div>

            <div className="ac-card">
              <h3 className="ac-card-title">Sesijų valdymas</h3>
              {[
                { device: "Chrome · Windows 11", location: "Vilnius, LT", current: true,  time: "Dabar" },
                { device: "Safari · iPhone 15",  location: "Kaunas, LT",  current: false, time: "Prieš 2 val." },
              ].map((s, i) => (
                <div key={i} className="ac-session">
                  <div className="ac-session-info">
                    <span className="ac-session-device">{s.device}</span>
                    <span className="ac-session-meta">{s.location} · {s.time}</span>
                  </div>
                  {s.current
                    ? <span className="ac-session-badge">Aktyvi</span>
                    : <button className="ac-btn ac-btn--ghost ac-btn--sm">Atjungti</button>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ISTORIJA */}
        {activeTab === "Istorija" && (
          <div className="ac-section">
            <div className="ac-card ac-card--flush">
              <div className="ac-table-header">
                <h3 className="ac-card-title" style={{ margin: 0 }}>Analizių istorija</h3>
                <span className="ac-count">{mockHistory.length} įrašai</span>
              </div>
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Failas</th>
                    <th>Tipas</th>
                    <th>Juostos</th>
                    <th>Trukmė</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {mockHistory.map(row => (
                    <tr key={row.id}>
                      <td className="ac-table-file">{row.file}</td>
                      <td>
                        <span className={`ac-type-badge ${row.type.includes("Nakties") ? "night" : "day"}`}>
                          {row.type.includes("Nakties") ? "🌙" : "☀️"} {row.type}
                        </span>
                      </td>
                      <td>
                        <div className="ac-bands">
                          {row.bands.map(b => (
                            <span key={b} className="ac-band-chip">{b}</span>
                          ))}
                        </div>
                      </td>
                      <td className="ac-table-muted">{row.duration}</td>
                      <td className="ac-table-muted">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}