import type { Data } from "plotly.js";
import Plot from "react-plotly.js";

type BandMetrics = {
  galia?: number;
  "santykine_galia_%"?: number;
  vidurine_amplitude?: number;
  nuokrypis?: number;
  max_amplitude?: number;
};

export interface MLSleepResult {
  type: "ml_sleep";
  time_hours: number[];
  stages: number[];
  stage_percentages: Record<number, number>;
  eeg_fpz: number[];
  eeg_pf: number[];
  eeg_ch_names: [string, string];
  stage_stats?: Record<string, Record<string, BandMetrics>>;
}

export function isMLSleepResult(result: unknown): result is MLSleepResult {
  return (
    typeof result === "object" &&
    result !== null &&
    (result as Record<string, unknown>).type === "ml_sleep" &&
    Array.isArray((result as Record<string, unknown>).stages) &&
    Array.isArray((result as Record<string, unknown>).time_hours)
  );
}

// ── These keys must match what the night page passes in visibleKeys ─────────
export const ML_SLEEP_PLOT_KEYS = {
  classic:      "classic",
  heatmap:      "heatmap",
  scatter:      "scatter",
  distribution: "stages",
  eeg:          "eeg",
} as const;

const STAGE_NAMES: Record<number, string> = {
  0: "Budrumas",
  1: "Lengvas miegas N1",
  2: "Lengvas miegas N2",
  3: "Gilus miegas N3",
  4: "REM miegas",
};

const STAGE_COLORS: Record<string, string> = {
  "Budrumas":          "#FF6347",
  "Lengvas miegas N1": "#FFD700",
  "Lengvas miegas N2": "#87CEFA",
  "Gilus miegas N3":   "#1E90FF",
  "REM miegas":        "#32CD32",
};

const STAGE_ORDER = Object.values(STAGE_NAMES);

const sharedLayout = {
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: { color: "#333" },
  margin: { t: 40, r: 20, b: 60, l: 160 },
};

// Helper — true if the plot should be shown
function isVisible(key: string, visibleKeys?: string[]) {
  return !visibleKeys || visibleKeys.length === 0 || visibleKeys.includes(key);
}

function buildPowerBar(value: number | undefined, width = 20) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "░".repeat(width);
  }
  const filled = Math.max(0, Math.min(width, Math.round((value / 100) * width)));
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

export default function MLSleepResultView({
  result,
  visibleKeys,
}: {
  result: MLSleepResult;
  visibleKeys?: string[];
}) {
  const stageStats = result.stage_stats;
  const classicTrace = {
    x: result.time_hours,
    y: result.stages.map((s) => 4 - s),
    type: "scatter" as const,
    mode: "lines" as const,
    line: { shape: "hv" as const, color: "#203d63", width: 2 },
    name: "Stadija",
  };

  const scatterTraces = Object.entries(STAGE_NAMES).map(([code, label]) => {
    const indices = result.stages.reduce<number[]>((acc, s, i) => {
      if (s === Number(code)) acc.push(i);
      return acc;
    }, []);
    return {
      x: indices.map((i) => result.time_hours[i]),
      y: indices.map(() => label),
      type: "scatter" as const,
      mode: "markers" as const,
      marker: { color: STAGE_COLORS[label], size: 6 },
      name: label,
    };
  });

  const heatmapTrace = {
    z: [result.stages],
    x: result.time_hours,
    type: "heatmap" as const,
    colorscale: Object.keys(STAGE_NAMES).map((code, i) => [
      i / (Object.keys(STAGE_NAMES).length - 1),
      STAGE_COLORS[STAGE_NAMES[Number(code)]],
    ]) as [number, string][],
    zmin: 0,
    zmax: 4,
    showscale: false,
    hovertemplate: "%{text}<extra></extra>",
    text: [result.stages.map((s) => STAGE_NAMES[s])],
  };

  const heatmapLegendTraces = Object.entries(STAGE_NAMES).map(([, label]) => ({
    x: [null as unknown as number],
    y: [null as unknown as number],
    type: "scatter" as const,
    mode: "markers" as const,
    marker: { color: STAGE_COLORS[label], size: 12, symbol: "square" as const },
    name: label,
    showlegend: true,
  }));

  const distLabels = Object.values(STAGE_NAMES);
  const distValues = Object.keys(STAGE_NAMES).map(
    (code) => result.stage_percentages[Number(code)] ?? 0
  );
  const distTrace = {
    x: distLabels,
    y: distValues,
    type: "bar" as const,
    marker: { color: distLabels.map((l) => STAGE_COLORS[l]) },
    name: "Pasiskirstymas",
  };

  return (
    <div className="np-results">

      {isVisible(ML_SLEEP_PLOT_KEYS.classic, visibleKeys) && (
        <div className="np-card">
          <h3>Klasikinė hipnograma</h3>
          <Plot
            data={[classicTrace]}
            layout={{
              ...sharedLayout,
              xaxis: { title: { text: "Laikas (valandos)" }, color: "#333" },
              yaxis: {
                tickvals: [4, 3, 2, 1, 0],
                ticktext: ["Budrumas", "Lengvas miegas N1", "Lengvas miegas N2", "Gilus miegas N3", "REM miegas"],
                color: "#333",
              },
              showlegend: false,
            }}
            style={{ width: "100%", height: 300 }}
            useResizeHandler
          />
        </div>
      )}

        {isVisible(ML_SLEEP_PLOT_KEYS.heatmap, visibleKeys) && (
        <div className="np-card">
            <h3>Hipnograma (heatmap)</h3>
            <Plot
            data={[heatmapTrace, ...heatmapLegendTraces]}
            layout={{
                ...sharedLayout,
                xaxis: { color: "#333" },
                yaxis: { visible: false },
                legend: {
                orientation: "h",
                x: 0,
                y: -0.3,
                font: { size: 11, color: "#333" },
                },
                margin: { t: 10, r: 20, b: 80, l: 20 },
            }}
            style={{ width: "100%", height: 180 }}
            useResizeHandler
            />
            <p style={{ textAlign: "center", color: "#333", fontSize: "13px", marginTop: "-66px", marginBottom: "40px", position: "relative", zIndex: 10 }}>
            Laikas (valandos)
            </p>
        </div>
        )}

      {isVisible(ML_SLEEP_PLOT_KEYS.scatter, visibleKeys) && (
        <div className="np-card">
          <h3>Hipnograma (taškai)</h3>
          <Plot
            data={scatterTraces}
            layout={{
              ...sharedLayout,
              showlegend: false,
              xaxis: { title: { text: "Laikas (valandos)" }, color: "#333" },
              yaxis: { categoryorder: "array", categoryarray: STAGE_ORDER, color: "#333" },
            }}
            style={{ width: "100%", height: 300 }}
            useResizeHandler
          />
        </div>
      )}

      {isVisible(ML_SLEEP_PLOT_KEYS.distribution, visibleKeys) && (
        <div className="np-card">
          <h3>Stadijų pasiskirstymas</h3>
          <Plot
            data={[distTrace]}
            layout={{
              ...sharedLayout,
              xaxis: { color: "#333", tickangle: -45, automargin: true },
              yaxis: { title: { text: "Procentai (%)" }, color: "#333" },
              showlegend: false,
              margin: { t: 40, r: 40, b: 100, l: 60 },
            }}
            style={{ width: "100%", height: 400 }}
            useResizeHandler
          />
        </div>
      )}

      {isVisible(ML_SLEEP_PLOT_KEYS.eeg, visibleKeys) && (
        <div className="np-card">
          <h3>EEG su miego stadijomis</h3>
          <Plot
            data={[
              {
                x: result.time_hours,
                y: result.eeg_fpz,
                type: "scatter",
                mode: "lines",
                line: { color: "#4a90d9", width: 1 },
                name: result.eeg_ch_names[0],
                yaxis: "y",
              },
              {
                x: result.time_hours,
                y: result.eeg_pf,
                type: "scatter",
                mode: "lines",
                line: { color: "#e8a838", width: 1 },
                name: result.eeg_ch_names[1],
                yaxis: "y2",
              },
              {
                z: [result.stages],
                x: result.time_hours,
                type: "heatmap",
                colorscale: Object.keys(STAGE_NAMES).map((code, i) => [
                  i / (Object.keys(STAGE_NAMES).length - 1),
                  STAGE_COLORS[STAGE_NAMES[Number(code)]],
                ]) as [number, string][],
                zmin: 0,
                zmax: 4,
                showscale: false,
                yaxis: "y3",
                text: result.stages.map((s) => STAGE_NAMES[s]) as unknown as string[][],
                hovertemplate: "%{text}<extra></extra>",
              },
              ...Object.entries(STAGE_NAMES).map(([, label]) => ({
                x: [null],
                y: [null],
                type: "scatter",
                mode: "markers",
                marker: { color: STAGE_COLORS[label], size: 12, symbol: "square" },
                name: label,
                yaxis: "y3",
                showlegend: true,
              })),
            ] as Data[]}
            layout={{
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#333" },
              grid: { rows: 3, columns: 1, subplots: [["xy"], ["xy2"], ["xy3"]] },
              xaxis:  { title: { text: "Laikas (valandos)" }, color: "#333" },
              yaxis:  { title: { text: `${result.eeg_ch_names[0]} (µV)` }, color: "#333", domain: [0.55, 1] },
              yaxis2: { title: { text: `${result.eeg_ch_names[1]} (µV)` }, color: "#333", domain: [0.1, 0.55] },
              yaxis3: { visible: false, domain: [0, 0.08] },
              legend: { orientation: "h", x: 0, y: -0.15, font: { size: 11, color: "#333" } },
              margin: { t: 40, r: 20, b: 100, l: 80 },
            }}
            style={{ width: "100%", height: 550 }}
            useResizeHandler
          />
        </div>
      )}

      {stageStats && (!visibleKeys || visibleKeys.includes("stage_stats")) && (
        <div className="np-card">
          <h3>Stadijų bangų analizė</h3>
          {Object.entries(stageStats).map(([stage, bands]) => (
            <div key={stage} style={{ marginBottom: "2rem" }}>
              <h4>{stage}</h4>
              <div className="np-table-wrap">
                <table className="np-table">
                  <thead>
                    <tr>
                      <th>Juosta</th>
                      <th>Galia (uV2)</th>
                      <th>Santykinė %</th>
                      <th>Vizualizacija</th>
                      <th>Z-balas (Nuokrypis)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(bands).map(([band, m]) => (
                      <tr key={band}>
                        <td>{band}</td>
                        <td>{typeof m.galia === "number" ? m.galia.toFixed(4) : "N/A"}</td>
                        <td>{typeof m["santykine_galia_%"] === "number" ? m["santykine_galia_%"].toFixed(2) : "N/A"} %</td>
                        <td className="np-power-cell">
                          <span className="np-power-bar">
                            {typeof m["santykine_galia_%"] === "number" ? buildPowerBar(m["santykine_galia_%"], 20) : "░".repeat(20)}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            color: Math.abs(m.nuokrypis || 0) > 2 ? "#FF6347" : 
                                   Math.abs(m.nuokrypis || 0) > 1 ? "#FFD700" : "inherit",
                            fontWeight: Math.abs(m.nuokrypis || 0) > 1 ? "bold" : "normal"
                          }}>
                            {typeof m.nuokrypis === "number" ? m.nuokrypis.toFixed(4) : "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}