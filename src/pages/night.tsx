import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import AnalysisResultView from "../components/analysis-result";
import { apiRequest } from "../api/api";
import "./style.css";

const VIZ_OPTIONS = [
  { id: "classic", label: "Klasikinė hipnograma" },
  { id: "heatmap", label: "Heatmap" },
  { id: "scatter", label: "Taškinė hipnograma" },
  { id: "stages", label: "Stadijų pasiskirstymas" },
  { id: "eeg", label: "EEG su miego stadijomis" },
  { id: "stage_stats", label: "Stadijų bangų analizė" },
];

type JobResultResponse = {
  job?: {
    id: number;
    status: string;
    error_message?: string | null;
  };
  result?: {
    result_json: unknown;
  } | null;
};

type BatchJob = {
  id: number;
  status: string;
  error_message?: string | null;
  file: {
    original_filename: string;
  };
  result: {
    result_json: unknown;
  } | null;
};

type BatchResponse = {
  batch: {
    id: number;
    status: string;
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
  };
  jobs: BatchJob[];
};

function parseErrorText(status: number, text: string): string {
  try {
    const parsed = JSON.parse(text) as { detail?: string };
    if (typeof parsed.detail === "string" && parsed.detail) {
      return parsed.detail;
    }
  } catch {
    return `API klaida ${status}: ${text}`;
  }

  return `API klaida ${status}: ${text}`;
}

function statusProgress(status: string): number {
  if (status === "completed" || status === "failed") return 100;
  if (status === "processing") return 60;
  return 15;
}

export default function NightPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState<File[]>([]);
  const [selectedVisualizations, setSelectedVisualizations] = useState<string[]>(
    VIZ_OPTIONS.map((opt) => opt.id)
  );
  const [result, setResult] = useState<unknown>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<number | null>(null);
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [selectedBatchJobId, setSelectedBatchJobId] = useState<number | null>(null);

  const toggleVisualization = (id: string) => {
    setSelectedVisualizations((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    setFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
  };

  useEffect(() => {
    const batchIdParam = searchParams.get("batchId");
    const jobIdParam = searchParams.get("jobId");
    if (!batchIdParam && !jobIdParam) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    const pollSingle = async (jobId: number) => {
      try {
        setAnalyzing(true);
        setError(null);
        setActiveJobId(jobId);
        setActiveBatchId(null);
        setBatchJobs([]);
        setSelectedBatchJobId(null);
        setResult(null);

        const response = await apiRequest(`/analysis-jobs/${jobId}/result`);
        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = (await response.json()) as JobResultResponse;
        if (cancelled) return;

        if (data.result?.result_json !== undefined) {
          setResult(data.result.result_json);
          setAnalyzing(false);
          return;
        }

        if (data.job?.status === "failed") {
          setError(data.job.error_message ?? "Analizė nepavyko.");
          setAnalyzing(false);
          return;
        }

        timeoutId = window.setTimeout(() => {
          void pollSingle(jobId);
        }, 2000);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Nepavyko gauti analizės rezultatų.");
          setAnalyzing(false);
        }
      }
    };

    const pollBatch = async (batchId: number) => {
      try {
        setAnalyzing(true);
        setError(null);
        setActiveJobId(null);
        setActiveBatchId(batchId);
        setResult(null);

        const response = await apiRequest(`/analysis-batches/${batchId}`);
        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = (await response.json()) as BatchResponse;
        if (cancelled) return;

        setBatchJobs(data.jobs);
        setSelectedBatchJobId((current) => {
          if (current && data.jobs.some((job) => job.id === current)) {
            return current;
          }
          const firstCompleted = data.jobs.find((job) => job.result?.result_json !== undefined);
          return firstCompleted?.id ?? data.jobs[0]?.id ?? null;
        });

        const hasActiveJobs = data.jobs.some(
          (job) => job.status === "queued" || job.status === "processing"
        );
        setAnalyzing(hasActiveJobs);

        if (hasActiveJobs) {
          timeoutId = window.setTimeout(() => {
            void pollBatch(batchId);
          }, 2000);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Nepavyko gauti batch rezultatų.");
          setAnalyzing(false);
        }
      }
    };

    if (batchIdParam) {
      const batchId = Number(batchIdParam);
      if (!Number.isInteger(batchId) || batchId <= 0) {
        setError("Netinkamas batch identifikatorius.");
        return;
      }
      void pollBatch(batchId);
    } else if (jobIdParam) {
      const jobId = Number(jobIdParam);
      if (!Number.isInteger(jobId) || jobId <= 0) {
        setError("Netinkamas darbo identifikatorius.");
        return;
      }
      void pollSingle(jobId);
    }

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [searchParams]);

  const startAnalysis = async () => {
    if (!files.length) return;

    setAnalyzing(true);
    setResult(null);
    setBatchJobs([]);
    setSelectedBatchJobId(null);
    setError(null);

    try {
      if (files.length === 1) {
        const formData = new FormData();
        formData.append("file", files[0]);
        formData.append("uploaded_by_user_id", "1");
        formData.append("patient_id", "1");
        formData.append("analysis_type", "night");

        const response = await apiRequest("/files/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error(parseErrorText(response.status, await response.text()));
        }

        const uploadData = (await response.json()) as {
          analysis_job: { id: number };
        };
        setSearchParams({ jobId: String(uploadData.analysis_job.id) });
        return;
      }

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("uploaded_by_user_id", "1");
      formData.append("patient_id", "1");
      formData.append("analysis_type", "night");

      const response = await apiRequest("/files/upload-batch", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(parseErrorText(response.status, await response.text()));
      }

      const uploadData = (await response.json()) as {
        batch: { id: number };
      };
      setSearchParams({ batchId: String(uploadData.batch.id) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepavyko gauti analizės rezultatų.");
      setAnalyzing(false);
    }
  };

  const selectedBatchJob = batchJobs.find((job) => job.id === selectedBatchJobId) ?? null;
  const selectedResult =
    selectedBatchJob?.result?.result_json !== undefined
      ? selectedBatchJob.result.result_json
      : result;

  return (
    <div className="np-page">
      <div
        className="np-dropzone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <p>Nutempk failus čia arba</p>

        <label className="np-upload-btn">
          Pasirink failus
          <input type="file" multiple onChange={handleSelect} />
        </label>

        {files.length > 0 && (
          <div className="np-files">
            {files.map((file, index) => (
              <p key={`${file.name}-${index}`}>{file.name}</p>
            ))}
          </div>
        )}
      </div>

      <div className="np-options">
        {VIZ_OPTIONS.map((opt) => (
          <label key={opt.id}>
            <input
              type="checkbox"
              checked={selectedVisualizations.includes(opt.id)}
              onChange={() => toggleVisualization(opt.id)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      <button onClick={startAnalysis} disabled={!files.length || analyzing}>
        {files.length > 1 ? (analyzing ? "Skaičiuojamas batch..." : "Analizuoti batch") : analyzing ? "Skaičiuojama..." : "Analizuoti"}
      </button>

      {analyzing && activeBatchId === null && (
        <div className="np-loading">
          <div className="sin-wave">
            <svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 30 Q20 0 40 30 T80 30 T120 30 T160 30 T200 30 T240 30 T280 30 T320 30 T360 30 T400 30" stroke="#203d63" strokeWidth="2" fill="transparent" />
            </svg>
          </div>
          <p>Analizuojamas miegas...</p>
          {activeJobId !== null ? <p>Darbo ID: #{activeJobId}</p> : null}
        </div>
      )}

      {activeBatchId !== null && (
        <div className="np-batch">
          <div className="np-card">
            <h3>Batch analizė #{activeBatchId}</h3>
            <p>Pasirinkite failą iš batch ir peržiūrėkite jo vizualizacijas tame pačiame lange.</p>
            <div className="np-batch-list">
              {batchJobs.map((job) => (
                <button
                  key={job.id}
                  className={`np-batch-row ${selectedBatchJobId === job.id ? "active" : ""}`}
                  onClick={() => setSelectedBatchJobId(job.id)}
                  type="button"
                >
                  <div className="np-batch-row__top">
                    <span className="np-batch-row__file">{job.file.original_filename}</span>
                    <span className={`np-batch-row__status np-batch-row__status--${job.status}`}>{job.status}</span>
                  </div>
                  <div className="np-batch-progress">
                    <div
                      className={`np-batch-progress__bar np-batch-progress__bar--${job.status}`}
                      style={{ width: `${statusProgress(job.status)}%` }}
                    />
                  </div>
                  {job.error_message ? <div className="np-batch-row__error">{job.error_message}</div> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <p className="np-error">{error}</p>}

      {activeBatchId !== null && selectedBatchJob && selectedBatchJob.result == null && !error ? (
        <div className="np-card">
          <h3>{selectedBatchJob.file.original_filename}</h3>
          <p>Rezultatas dar ruošiamas arba nepavyko.</p>
        </div>
      ) : null}

      {selectedResult !== null && selectedResult !== undefined && (
        <AnalysisResultView result={selectedResult} visibleKeys={selectedVisualizations} />
      )}
    </div>
  );
}
