import { useState } from "react";
import AnalysisResultView from "../components/analysis-result";
import "./style.css";

const VIZ_OPTIONS = [
  { id: "scatter", label: "Taškinė hipnograma" },
  { id: "classic", label: "Klasikinė hipnograma" },
  { id: "heatmap", label: "Heatmap" },
  { id: "stages", label: "Stadijų pasiskirstymas" },
];

export default function NightPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedVisualizations, setSelectedVisualizations] = useState<string[]>(
    VIZ_OPTIONS.map((opt) => opt.id)
  );
  const [result, setResult] = useState<unknown>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleVisualization = (id: string) => {
    setSelectedVisualizations((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
  };

  const startAnalysis = async () => {
    if (!files.length) return;

    setAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("uploaded_by_user_id", "1");
      formData.append("patient_id", "1");
      formData.append("analysis_type", "night");

      const uploadRes = await fetch("http://localhost:8000/files/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        throw new Error(`Failed to upload file: ${uploadRes.status}`);
      }

      const uploadData = await uploadRes.json();
      const jobId = uploadData.analysis_job.id;

      console.log("File uploaded, job ID:", jobId);

      const poll = async () => {
        const statusRes = await fetch(`http://localhost:8000/analysis-jobs/${jobId}/result`);
        if (!statusRes.ok) {
          throw new Error(`Failed to fetch analysis result: ${statusRes.status}`);
        }
        const statusData = await statusRes.json();

        console.log("Job status:", statusData);

        if(statusData.result && statusData.result.result_json) {
          setResult(statusData.result.result_json);
          setAnalyzing(false);
          return;
        }
        if (statusData.job?.status === "completed" && !statusData.result) {
          setError("Analizė baigta, bet rezultatai nebuvo rasti.");
          setAnalyzing(false);
          return;
        }
        setTimeout(poll, 2000);
      };
      poll();
    }
       catch (err) {
      console.error("Error during analysis:", err);
      setError(err instanceof Error ? err.message : "Nepavyko gauti analizės rezultatų.");
      setAnalyzing(false);
    }

  };

  return (
    <div className="np-page">

      {/* UPLOAD */}
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
            {files.map((f, i) => (
              <p key={i}>{f.name}</p>
            ))}
          </div>
        )}
      </div>

      {/* CHECKBOX */}
      <div className="np-options">
        {VIZ_OPTIONS.map(opt => (
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

      {/* BUTTON */}
      <button onClick={startAnalysis} disabled={!files.length || analyzing}>
        {analyzing ? "Skaičiuojama..." : "Analizuoti"}
      </button>

      {/* LOADING */}
      {analyzing && (
        <div className="np-loading">
          <div className="sin-wave">
            <svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg">
              <path d="
                M0 30 
                Q20 0 40 30 
                T80 30 
                T120 30
                T160 30
                T200 30
                T240 30
                T280 30
                T320 30
                T360 30
                T400 30
        " stroke="#203d63" strokeWidth="2" fill="transparent"/>
      </svg>
    </div>
          <p>Analizuojamas miegas...</p>
        </div>
      )}

      {error && <p className="np-error">{error}</p>}

      {result !== null && (
        <AnalysisResultView result={result} visibleKeys={selectedVisualizations} />
      )}
    </div>
  );
}
