import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import { apiFetch } from "../api/api";
import "./home.css";

const features = [
  {
    icon: "🌙",
    title: "Nakties EEG signalai",
    desc: "Miego stadijų analizė, hipnogramos ir lėtų bangų vizualizacija.",
    to: "/night",
    color: "#203d63",
    analysisType: "night",
  },
  {
    icon: "☀️",
    title: "Dienos EEG signalai",
    desc: "ADHD, depresijos, epilepsijos ir migrenos biomarkerių paieška.",
    to: "/day",
    color: "#149A85",
    analysisType: "day",
  },
];

const stats = [
  { value: "5", label: "Dažnių juostos" },
  { value: "7", label: "EEG sąlygos" },
  { value: "6", label: "Amžiaus grupės" },
  { value: "4", label: "Ligos" },
];

type HomeJob = {
  id: number;
  kind: "job" | "batch";
  batch_id?: number | null;
  analysis_type: string;
  status: string;
  error_message?: string | null;
  child_job_count?: number;
  queued_child_count?: number;
  processing_child_count?: number;
  completed_child_count?: number;
  failed_child_count?: number;
  queued_at?: string;
  started_at?: string | null;
  finished_at?: string | null;
  result_url: string;
  file: {
    original_filename: string;
  };
};

const STATUS_LABELS: Record<string, string> = {
  queued: "Eilėje",
  processing: "Vykdoma",
  completed: "Baigta",
  failed: "Klaida",
  partial_failed: "Dalinai nepavyko",
};

function formatStatus(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function formatJobTime(job: HomeJob) {
  const timestamp = job.finished_at ?? job.started_at ?? job.queued_at;
  if (!timestamp) return "Nėra laiko";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Nėra laiko";

  return date.toLocaleString("lt-LT", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function jobRoute(job: HomeJob, basePath: string) {
  return job.kind === "batch" || job.batch_id
    ? `${basePath}?batchId=${job.batch_id ?? job.id}`
    : `${basePath}?jobId=${job.id}`;
}

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [jobs, setJobs] = useState<HomeJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadJobs = async () => {
      try {
        let data: { jobs: HomeJob[] };
        try {
          data = await apiFetch<{ jobs: HomeJob[] }>(
            "/analysis-jobs/?uploaded_by_user_id=1&grouped=true&limit=12"
          );
        } catch {
          data = await apiFetch<{ jobs: HomeJob[] }>(
            "/analysis-jobs/?uploaded_by_user_id=1&limit=12"
          );
        }
        if (!cancelled) {
          setJobs(Array.isArray(data.jobs) ? data.jobs : []);
          setJobsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setJobs([]);
          setJobsLoading(false);
        }
      }
    };

    loadJobs();
    const intervalId = window.setInterval(loadJobs, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

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
          {features.map(f => {
            const moduleJobs = jobs.filter((job) => job.analysis_type === f.analysisType);
            const activeJobs = moduleJobs.filter(
              (job) => job.status === "queued" || job.status === "processing"
            );
            const activeJobCount = activeJobs.reduce(
              (sum, job) => sum + (job.kind === "batch" ? (job.queued_child_count ?? 0) + (job.processing_child_count ?? 0) : 1),
              0
            );
            const recentJobs = moduleJobs.slice(0, 3);

            return (
            <div key={f.to} className="home-card" style={{ "--accent": f.color } as React.CSSProperties}>
              <div className="home-card-icon">{f.icon}</div>
              <h3 className="home-card-title">{f.title}</h3>
              <p className="home-card-desc">{f.desc}</p>
              <div className="home-card-status">
                <span className="home-card-status-count">
                  {activeJobCount} aktyv.
                </span>
                <span className="home-card-status-note">
                  {jobsLoading ? "Atnaujinama..." : `${moduleJobs.length} naujausi įrašai`}
                </span>
              </div>
              <div className="home-job-list">
                {recentJobs.length === 0 ? (
                  <div className="home-job-empty">
                    {jobsLoading ? "Kraunami darbai..." : "Šiuo metu darbų nėra"}
                  </div>
                ) : (
                  recentJobs.map((job) => (
                    <div key={job.id} className="home-job-row">
                      <div className="home-job-main">
                        <span className="home-job-file">{job.file.original_filename}</span>
                        <span className={`home-job-badge home-job-badge--${job.status}`}>
                          {formatStatus(job.status)}
                        </span>
                      </div>
                      <div className="home-job-meta">
                        <span>{job.kind === "batch" ? `Batch #${job.id}` : `#${job.id}`}</span>
                        <span>{formatJobTime(job)}</span>
                      </div>
                      {job.kind === "batch" && job.child_job_count ? (
                        <div className="home-job-meta">
                          <span>{job.child_job_count} failai</span>
                          <span>
                            {job.completed_child_count ?? 0}/{job.child_job_count} baigta
                          </span>
                        </div>
                      ) : null}
                      {job.status === "failed" && job.error_message ? (
                        <div className="home-job-error">{job.error_message}</div>
                      ) : null}
                      <NavLink
                        to={jobRoute(job, f.to)}
                        className="home-job-link"
                      >
                        Peržiūrėti darbą →
                      </NavLink>
                    </div>
                  ))
                )}
              </div>
              <NavLink to={f.to} className="home-card-link">
                Atidaryti modulį →
              </NavLink>
            </div>
            );
          })}
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
