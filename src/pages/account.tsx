import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import { apiFetch } from "../api/api";
import "./account.css";

const TABS = ["Profilis", "Sauga", "Istorija"] as const;
const ROLE_OPTIONS = [
  { value: "doctor", label: "Gydytojas" },
  { value: "researcher", label: "Tyrėjas" },
] as const;
const AGE_GROUP_OPTIONS = [
  { value: "", label: "Nepasirinkta" },
  { value: "18-30", label: "18-30" },
  { value: "31-50", label: "31-50" },
  { value: "51-65", label: "51-65" },
  { value: "66-80", label: "66-80" },
] as const;

type TabName = (typeof TABS)[number];

type AccountProfileResponse = {
  id: number;
  email: string;
  full_name: string;
  organization: string | null;
  role: string;
  default_age_group: string | null;
  password_changed_at: string | null;
  created_at: string;
  stats: {
    analysis_count: number;
    patient_count: number;
    file_count: number;
    last_activity_at: string | null;
  };
};

type SecurityOverviewResponse = {
  password_changed_at: string | null;
  sessions: {
    id: number;
    user_agent: string | null;
    ip_address: string | null;
    created_at: string;
    last_seen_at: string;
    revoked_at: string | null;
    is_current: boolean;
  }[];
};

type AccountHistoryResponse = {
  total: number;
  items: {
    id: number;
    kind: "job" | "batch";
    file_id: number | null;
    batch_id: number | null;
    child_job_count: number;
    file_name: string;
    analysis_type: string;
    status: string;
    bands: string[];
    duration_seconds: number | null;
    queued_at: string;
    started_at: string | null;
    finished_at: string | null;
    result_created_at: string | null;
    result_url: string;
  }[];
};

type ProfileFormState = {
  full_name: string;
  email: string;
  organization: string;
  role: string;
  default_age_group: string;
};

type PasswordFormState = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

function parseApiError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Nepavyko įvykdyti užklausos.";
  }

  const match = error.message.match(/API error \d+:\s*(.*)$/s);
  if (!match) {
    return error.message;
  }

  const raw = match[1]?.trim();
  if (!raw) {
    return error.message;
  }

  try {
    const parsed = JSON.parse(raw) as { detail?: string };
    if (typeof parsed.detail === "string" && parsed.detail) {
      return parsed.detail;
    }
  } catch {
    return raw;
  }

  return raw;
}

function isAuthError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("API error 401");
}

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

function analysisTypeLabel(analysisType: string): string {
  return analysisType === "night" ? "Nakties EEG" : "Dienos EEG";
}

function analysisRoute(analysisType: string, item: { kind: "job" | "batch"; id: number; batch_id: number | null }): string {
  const basePath = analysisType === "night" ? "/night" : "/day";
  return item.kind === "batch"
    ? `${basePath}?batchId=${item.batch_id ?? item.id}`
    : `${basePath}?jobId=${item.id}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Nėra duomenų";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Nėra duomenų";
  }

  return date.toLocaleString("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(value: string | null | undefined): string {
  if (!value) {
    return "Nėra duomenų";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Nėra duomenų";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return "Dabar";
  if (diffMinutes < 60) return `Prieš ${diffMinutes} min.`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `Prieš ${diffHours} val.`;

  const diffDays = Math.round(diffHours / 24);
  return `Prieš ${diffDays} d.`;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || Number.isNaN(seconds)) {
    return "Nėra duomenų";
  }

  const rounded = Math.round(seconds);
  return `${rounded.toLocaleString("lt-LT")} s`;
}

function avatarLetters(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NA"
  );
}

function sessionLabel(userAgent: string | null): string {
  if (!userAgent) {
    return "Nežinomas įrenginys";
  }

  return userAgent;
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<TabName>("Profilis");
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [profile, setProfile] = useState<AccountProfileResponse | null>(null);
  const [security, setSecurity] = useState<SecurityOverviewResponse | null>(null);
  const [history, setHistory] = useState<AccountHistoryResponse | null>(null);

  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    full_name: "",
    email: "",
    organization: "",
    role: "doctor",
    default_age_group: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAccount = async () => {
      try {
        setPageLoading(true);
        setPageError(null);
        setSecurityMessage(null);

        const [profileResult, securityResult, historyResult] = await Promise.allSettled([
          apiFetch<AccountProfileResponse>("/account/profile"),
          apiFetch<SecurityOverviewResponse>("/account/security"),
          apiFetch<AccountHistoryResponse>("/account/history?limit=50"),
        ]);

        if (cancelled) {
          return;
        }

        if (profileResult.status === "rejected") {
          throw profileResult.reason;
        }

        if (historyResult.status === "rejected") {
          throw historyResult.reason;
        }

        const profileData = profileResult.value;
        const historyData = historyResult.value;

        setProfile(profileData);
        setHistory(historyData);
        setProfileForm({
          full_name: profileData.full_name,
          email: profileData.email,
          organization: profileData.organization ?? "",
          role: profileData.role,
          default_age_group: profileData.default_age_group ?? "",
        });

        if (securityResult.status === "fulfilled") {
          setSecurity(securityResult.value);
        } else {
          setSecurity(null);
          setSecurityMessage(
            isAuthError(securityResult.reason)
              ? "Saugos duomenims reikia naujo prisijungimo rakto. Gaukite naują `access_token` per `/auth/login`."
              : parseApiError(securityResult.reason)
          );
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(parseApiError(error));
        }
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    };

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileSave = async () => {
    try {
      setProfileSaving(true);
      setProfileMessage(null);

      const updatedProfile = await apiFetch<AccountProfileResponse>("/account/profile", {
        method: "PUT",
        body: JSON.stringify({
          full_name: profileForm.full_name,
          email: profileForm.email,
          organization: profileForm.organization || null,
          role: profileForm.role,
          default_age_group: profileForm.default_age_group || null,
        }),
      });

      setProfile(updatedProfile);
      setProfileForm({
        full_name: updatedProfile.full_name,
        email: updatedProfile.email,
        organization: updatedProfile.organization ?? "",
        role: updatedProfile.role,
        default_age_group: updatedProfile.default_age_group ?? "",
      });
      setProfileMessage("Profilis išsaugotas.");
    } catch (error) {
      setProfileMessage(parseApiError(error));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setPasswordSaving(true);
      setSecurityMessage(null);

      await apiFetch<{ message: string }>("/account/security/password", {
        method: "POST",
        body: JSON.stringify(passwordForm),
      });

      const updatedSecurity = await apiFetch<SecurityOverviewResponse>("/account/security");
      setSecurity(updatedSecurity);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setSecurityMessage("Slaptažodis pakeistas.");
    } catch (error) {
      setSecurityMessage(parseApiError(error));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    try {
      setRevokingSessionId(sessionId);
      setSecurityMessage(null);

      await apiFetch<{ message: string; session_id: number }>(`/account/security/sessions/${sessionId}`, {
        method: "DELETE",
      });

      const updatedSecurity = await apiFetch<SecurityOverviewResponse>("/account/security");
      setSecurity(updatedSecurity);
      setSecurityMessage("Sesija atjungta.");
    } catch (error) {
      setSecurityMessage(parseApiError(error));
    } finally {
      setRevokingSessionId(null);
    }
  };

  const heroName = profileForm.full_name || profile?.full_name || "Paskyra";
  const heroEmail = profileForm.email || profile?.email || "";
  const stats = profile?.stats;

  if (pageLoading) {
    return (
      <div className="ac-page">
        <div className="ac-body">
          <div className="ac-card">
            <p className="ac-message">Kraunami paskyros duomenys...</p>
          </div>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="ac-page">
        <div className="ac-body">
          <div className="ac-card">
            <h3 className="ac-card-title">Nepavyko užkrauti paskyros</h3>
            <p className="ac-message ac-message--error">{pageError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ac-page">
      <div className="ac-hero">
        <div className="ac-avatar">{avatarLetters(heroName)}</div>
        <div className="ac-hero-info">
          <h1 className="ac-hero-name">{heroName}</h1>
          <p className="ac-hero-email">{heroEmail}</p>
          <span className="ac-hero-badge">{roleLabel(profileForm.role || profile?.role || "doctor")}</span>
        </div>
      </div>

      <div className="ac-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`ac-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="ac-body">
        {activeTab === "Profilis" && (
          <div className="ac-section">
            <div className="ac-card">
              <h3 className="ac-card-title">Asmeninė informacija</h3>

              {profileMessage ? (
                <p className={`ac-message ${profileMessage.includes("išsaugotas") ? "ac-message--success" : "ac-message--error"}`}>
                  {profileMessage}
                </p>
              ) : null}

              <div className="ac-field-grid">
                <div className="ac-field">
                  <label className="ac-label">Vardas Pavardė</label>
                  <input
                    className="ac-input"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm((current) => ({ ...current, full_name: e.target.value }))
                    }
                  />
                </div>
                <div className="ac-field">
                  <label className="ac-label">El. paštas</label>
                  <input
                    className="ac-input"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((current) => ({ ...current, email: e.target.value }))
                    }
                  />
                </div>
                <div className="ac-field ac-field--full">
                  <label className="ac-label">Organizacija</label>
                  <input
                    className="ac-input"
                    value={profileForm.organization}
                    onChange={(e) =>
                      setProfileForm((current) => ({ ...current, organization: e.target.value }))
                    }
                  />
                </div>
                <div className="ac-field">
                  <label className="ac-label">Rolė</label>
                  <select
                    className="ac-input ac-select"
                    value={profileForm.role}
                    onChange={(e) =>
                      setProfileForm((current) => ({ ...current, role: e.target.value }))
                    }
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ac-field">
                  <label className="ac-label">Amžiaus grupės numatytoji</label>
                  <select
                    className="ac-input ac-select"
                    value={profileForm.default_age_group}
                    onChange={(e) =>
                      setProfileForm((current) => ({
                        ...current,
                        default_age_group: e.target.value,
                      }))
                    }
                  >
                    {AGE_GROUP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ac-actions">
                <button className="ac-btn ac-btn--primary" onClick={handleProfileSave} disabled={profileSaving}>
                  {profileSaving ? "Saugoma..." : "Išsaugoti"}
                </button>
              </div>
            </div>

            <div className="ac-stats">
              {[
                { value: String(stats?.analysis_count ?? 0), label: "Analizės" },
                { value: String(stats?.patient_count ?? 0), label: "Pacientai" },
                { value: String(stats?.file_count ?? 0), label: "Failai" },
                { value: formatRelativeTime(stats?.last_activity_at), label: "Aktyvus" },
              ].map((stat) => (
                <div key={stat.label} className="ac-stat">
                  <span className="ac-stat-value">{stat.value}</span>
                  <span className="ac-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Sauga" && (
          <div className="ac-section">
            <div className="ac-card">
              <h3 className="ac-card-title">Slaptažodžio keitimas</h3>

              <p className="ac-message ac-message--muted">
                Paskutinis keitimas: {formatDate(security?.password_changed_at ?? profile?.password_changed_at)}
              </p>

              {securityMessage ? (
                <p className={`ac-message ${securityMessage.includes("pakeistas") || securityMessage.includes("atjungta") ? "ac-message--success" : "ac-message--error"}`}>
                  {securityMessage}
                </p>
              ) : null}

              <div className="ac-field-grid">
                <div className="ac-field ac-field--full">
                  <label className="ac-label">Dabartinis slaptažodis</label>
                  <input
                    className="ac-input"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm((current) => ({
                        ...current,
                        current_password: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="ac-field">
                  <label className="ac-label">Naujas slaptažodis</label>
                  <input
                    className="ac-input"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm((current) => ({
                        ...current,
                        new_password: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="ac-field">
                  <label className="ac-label">Pakartokite slaptažodį</label>
                  <input
                    className="ac-input"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm((current) => ({
                        ...current,
                        confirm_password: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="ac-actions">
                <button
                  className="ac-btn ac-btn--primary"
                  onClick={handlePasswordChange}
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "Keičiama..." : "Keisti slaptažodį"}
                </button>
              </div>
            </div>

            <div className="ac-card">
              <h3 className="ac-card-title">Sesijų valdymas</h3>
              {security?.sessions.length ? (
                security.sessions.map((session) => (
                  <div key={session.id} className="ac-session">
                    <div className="ac-session-info">
                      <span className="ac-session-device">{sessionLabel(session.user_agent)}</span>
                      <span className="ac-session-meta">
                        {session.ip_address ?? "Nežinoma vieta"} · {formatRelativeTime(session.last_seen_at)}
                      </span>
                    </div>
                    {session.is_current ? (
                      <span className="ac-session-badge">Aktyvi</span>
                    ) : (
                      <button
                        className="ac-btn ac-btn--ghost ac-btn--sm"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokingSessionId === session.id}
                      >
                        {revokingSessionId === session.id ? "Jungiama..." : "Atjungti"}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="ac-message ac-message--muted">Aktyvių sesijų nėra.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "Istorija" && (
          <div className="ac-section">
            <div className="ac-card ac-card--flush">
              <div className="ac-table-header">
                <h3 className="ac-card-title" style={{ margin: 0 }}>Analizių istorija</h3>
                <span className="ac-count">{history?.total ?? 0} įrašai</span>
              </div>
              {!history?.items.length ? (
                <div className="ac-empty">Analizių istorijos kol kas nėra.</div>
              ) : (
                <table className="ac-table">
                  <thead>
                    <tr>
                      <th>Failas</th>
                      <th>Tipas</th>
                      <th>Juostos</th>
                      <th>Trukmė</th>
                      <th>Data</th>
                      <th>Veiksmas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.items.map((row) => (
                      <tr key={row.id}>
                        <td className="ac-table-file">{row.file_name}</td>
                        <td>
                          <span className={`ac-type-badge ${row.analysis_type === "night" ? "night" : "day"}`}>
                            {row.analysis_type === "night" ? "🌙" : "☀️"} {analysisTypeLabel(row.analysis_type)}
                          </span>
                        </td>
                        <td>
                          <div className="ac-bands">
                            {row.bands.length ? (
                              row.bands.map((band) => (
                                <span key={band} className="ac-band-chip">{band}</span>
                              ))
                            ) : (
                              <span className="ac-band-chip">Nėra</span>
                            )}
                          </div>
                        </td>
                        <td className="ac-table-muted">{formatDuration(row.duration_seconds)}</td>
                        <td className="ac-table-muted">
                          {formatDate(row.finished_at ?? row.queued_at)}
                        </td>
                        <td>
                          <NavLink
                            to={analysisRoute(row.analysis_type, row)}
                            className="ac-history-link"
                          >
                            Atidaryti →
                          </NavLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
