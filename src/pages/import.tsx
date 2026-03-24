import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import 'chart.js/auto';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
//pasirinkti ka nori matyti, galbut prideti daugiau indikatoriu, ar kitaip vizualizuoti rezultatus

export default function App() {

const [file, setFile] = useState<File | null>(null);
const [progress, setProgress] = useState<number>(0);
const [risk, setRisk] = useState<number>(0);
const [analyzing, setAnalyzing] = useState<boolean>(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files) return;
  setFile(e.target.files[0]);
};

  const startAnalysis = () => {
    if (!file) return;

    setAnalyzing(true);
    setProgress(0);

    // Fake progress
    let interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          finishAnalysis();
          return 100;
        }
        return prev + 10;
      });
    }, 400);
  };

  const finishAnalysis = () => {
    // Fake AI rezultatas
    const fakeRisk = Math.random();
    setRisk(fakeRisk);
  };

  const chartData = {
    labels: Array.from({ length: 50 }, (_, i) => i),
    datasets: [
      {
        label: "EEG signalas",
        data: Array.from({ length: 50 }, () => Math.random()),
        borderWidth: 2,
      },
    ],
  };

  const getRiskColor = () => {
    if (!risk) return "bg-secondary";
    if (risk < 0.4) return "bg-success";
    if (risk < 0.7) return "bg-warning";
    return "bg-danger";
  };

  return (
    <div className="d-flex">



      {/* Main */}
      <div className="container-fluid p-4">

        <div className="alert alert-warning">
          Demo versija – Python modelis imituojamas
        </div>

        <div className="row">

          {/* Upload */}
          <div className="col-4">
            <div className="card p-3">
              <h5>Duomenų šaltinis</h5>

              <input type="file" className="form-control my-3" onChange={handleUpload} />

              <button className="btn btn-success" onClick={startAnalysis}>
                Analizuoti
              </button>

              <div className="mt-3">
                <label>Analizės būsena</label>
                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                  >
                    {progress}%
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Indicators */}
          <div className="col-8">
            <div className="card p-3">
              <h5>Indikatoriai</h5>

              <p>Santykinė rizika</p>
              <div className="progress">
                <div
                  className={`progress-bar ${getRiskColor()}`}
                  style={{ width: `${(risk || 0) * 100}%` }}
                />
              </div>

              <p className="mt-4">Spektrograma (demo)</p>
              <Line data={chartData} />

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}