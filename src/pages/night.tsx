import { useState } from "react";
import "./style.css";

const VIZ_OPTIONS = [
  { id: "scatter", label: "Taškinė hipnograma" },
  { id: "classic", label: "Klasikinė hipnograma" },
  { id: "heatmap", label: "Heatmap" },
  { id: "stages", label: "Stadijų pasiskirstymas" },
];

export default function NightPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
  const [plots, setPlots] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const toggleChart = (id: string) => {
    setSelectedCharts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(dropped);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  };

  const startAnalysis = async () => {
    if (!files.length) return;

    setAnalyzing(true);
    setPlots(null);

    // fake loading
    setTimeout(() => {
      setPlots({
        scatter: "hypnogram_scatter.png",
        classic: "hypnogram_classic.png",
        heatmap: "hypnogram_heatmap.png",
        stages: "stages.png"
      });
      setAnalyzing(false);
    }, 2000);
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
              onChange={() => toggleChart(opt.id)}
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
          <div className="spinner" />
          <p>Analizuojamas miegas...</p>
        </div>
      )}

      {/* RESULTS */}
      {plots && (
        <div className="np-results">
          {VIZ_OPTIONS.filter(v => selectedCharts.includes(v.id)).map(v => (
            <div key={v.id} className="np-card">
              <h4>{v.label}</h4>
              <img src={`/api/plots/${plots[v.id]}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}