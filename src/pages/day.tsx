import 'bootstrap/dist/css/bootstrap.min.css';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { useState } from "react";
import AnalysisResultView from "../components/analysis-result";
import "./style.css";

const adhdRe = [
  { id: "adhd-re1", label: "Theta ↑ (frontalinis)" },
  { id: "adhd-re2", label: "Beta ↓ (impulsyvumas)" },
  { id: "adhd-re3", label: "Theta/Beta santykis ↑" },
  { id: "adhd-re4", label: "Alpha ↓ (dėmesys)" },
];

const depresijaRe = [
  { id: "depresija-re1", label: "Alpha ↑ (kairė frontalis)" },
  { id: "depresija-re2", label: "Theta ↑ (kognicija ↓)" },
  { id: "depresija-re3", label: "Beta ↓ (energija ↓)" },
  { id: "depresija-re4", label: "Delta ↑ (poilsio disfunkcija)" },
];

const epilepsijaRe = [
  { id: "epilepsija-re1", label: "Delta ↑ (fokusinė)" },
  { id: "epilepsija-re2", label: "Gamma ↑ (epileptiforminis)" },
  { id: "epilepsija-re3", label: "Beta ↑ (priepuolio parengtis)" },
  { id: "epilepsija-re4", label: "Theta ↑ (lėtinė)" },
];

const migrenaRe = [
  { id: "migrena-re1", label: "Alpha ↓ (hiperaktyvumas)" },
  { id: "migrena-re2", label: "Delta ↑ (depoliarizacija)" },
  { id: "migrena-re3", label: "Gamma ↑ (skausmo apdorojimas)" },
  { id: "migrena-re4", label: "Beta ↑ (jaudrumas ↑)" },
];

const all = [
  { title: "ADHD",      data: adhdRe,      id: "adhd"      },
  { title: "Depresija", data: depresijaRe, id: "depresija" },
  { title: "Epilepsija",data: epilepsijaRe,id: "epilepsija"},
  { title: "Migrena",   data: migrenaRe,   id: "migrena"   },
];

function BasicButtonExample({
  toggleChart,
  selectedCharts,
}: {
  toggleChart: (id: string) => void;
  selectedCharts: string[];
}) {
  return (
    <div className="dropdownn" style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
      {all.map(group => (
        <DropdownButton
          key={group.id}
          id={group.id}
          title={group.title}
          autoClose={true}
          className="custom-dropdown"
        >
          {group.data.map(opt => (
            <Dropdown.Item as="div" key={opt.id}>
              <input
                type="checkbox"
                checked={selectedCharts.includes(opt.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleChart(opt.id)}
              />
              {opt.label}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      ))}
    </div>
  );
}

export default function DayPage() {
  const [files, setFiles]               = useState<File[]>([]);
  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
  const [result, setResult]             = useState<unknown>(null);
  const [analyzing, setAnalyzing]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const toggleChart = (id: string) => {
    setSelectedCharts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
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
        const statusRes  = await fetch(`http://localhost:8000/analysis-jobs/${jobId}/result`);
        if (!statusRes.ok) {
          throw new Error(`Failed to fetch analysis result: ${statusRes.status}`);
        }
        const statusData = await statusRes.json();

        console.log("Job status:", statusData);

        if (statusData.result && statusData.result.result_json) {
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
    } catch (err) {
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

        <label className="np-upload-btn" style={{ background: "#149A85" }}>
          Pasirink failus
          <input type="file" multiple onChange={handleSelect} />
        </label>

        {files.length > 0 && (
          <div className="np-files">
            {files.map((f, i) => <p key={i}>{f.name}</p>)}
          </div>
        )}
      </div>

      {/* DROPDOWN */}
      <BasicButtonExample toggleChart={toggleChart} selectedCharts={selectedCharts} />

      {/* BUTTON */}
      <button
        onClick={startAnalysis}
        disabled={!files.length || analyzing}
        style={{ background: "#149A85" }}
      >
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
        " stroke="#149A85" strokeWidth="2" fill="transparent"/>
      </svg>
    </div>
          <p>Analizuojamas EEG įrašas...</p>
        </div>
      )}

      {error && <p className="np-error">{error}</p>}

      {result !== null && <AnalysisResultView result={result} />}
    </div>
  );
}
