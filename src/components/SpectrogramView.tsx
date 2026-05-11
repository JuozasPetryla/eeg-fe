import type { Data, Layout, Shape } from "plotly.js";
import Plot from "react-plotly.js";
import { useMemo } from "react";

export type SpectrogramData = {
  freqs_hz: number[];
  times_sec: number[];
  power_db: number[][];
  vmin_db: number;
  vmax_db: number;
};

const BAND_COLOR: Record<string, string> = {
  Delta: "#6366f1",
  Theta: "#0ea5e9",
  Alpha: "#149A85",
  Beta: "#f59e0b",
  Gamma: "#ef4444",
};

const BAND_LIMITS: Array<{ name: string; hz: number }> = [
  { name: "Delta–Theta", hz: 4 },
  { name: "Theta–Alpha", hz: 8 },
  { name: "Alpha–Beta", hz: 13 },
  { name: "Beta–Gamma", hz: 30 },
];

const BAND_LINE_COLOR: Record<string, string> = {
  "Delta–Theta": BAND_COLOR.Theta,
  "Theta–Alpha": BAND_COLOR.Alpha,
  "Alpha–Beta": BAND_COLOR.Beta,
  "Beta–Gamma": BAND_COLOR.Gamma,
};

export default function SpectrogramView({ data }: { data: SpectrogramData }) {
  const traces = useMemo<Data[]>(
    () => [
      {
        type: "heatmap",
        x: data.times_sec,
        y: data.freqs_hz,
        z: data.power_db,
        colorscale: "Jet",
        zmin: data.vmin_db,
        zmax: data.vmax_db,
        colorbar: {
          title: { text: "dB", font: { size: 11, color: "#475569" } },
          thickness: 10,
          len: 0.85,
          tickfont: { size: 10, color: "#64748b" },
          outlinewidth: 0,
        },
        hovertemplate:
          "Laikas: %{x:.1f} s<br>Dažnis: %{y:.1f} Hz<br>Galia: %{z:.1f} dB<extra></extra>",
      },
    ],
    [data],
  );

  const xMax = data.times_sec.length ? data.times_sec[data.times_sec.length - 1] : 1;
  const yMax = data.freqs_hz.length ? data.freqs_hz[data.freqs_hz.length - 1] : 45;

  const bandShapes: Partial<Shape>[] = BAND_LIMITS.filter((b) => b.hz <= yMax).map(
    (b) => ({
      type: "line",
      xref: "x",
      yref: "y",
      x0: 0,
      x1: xMax,
      y0: b.hz,
      y1: b.hz,
      line: {
        color: BAND_LINE_COLOR[b.name],
        width: 1,
        dash: "dot",
      },
      opacity: 0.55,
    }),
  );

  const layout: Partial<Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#333", family: "system-ui, -apple-system, sans-serif", size: 11 },
    margin: { t: 8, r: 8, b: 44, l: 56 },
    xaxis: {
      title: { text: "Laikas (s)", font: { size: 12, color: "#475569" } },
      color: "#64748b",
      gridcolor: "rgba(148,163,184,0.15)",
      zeroline: false,
    },
    yaxis: {
      title: { text: "Dažnis (Hz)", font: { size: 12, color: "#475569" } },
      color: "#64748b",
      gridcolor: "rgba(148,163,184,0.15)",
      zeroline: false,
    },
    shapes: bandShapes,
  };

  return (
    <div>
      <Plot
        data={traces}
        layout={layout}
        config={{
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: [
            "select2d",
            "lasso2d",
            "autoScale2d",
            "toggleSpikelines",
          ],
          responsive: true,
        }}
        style={{ width: "100%", height: 300 }}
        useResizeHandler
      />
      <div className="np-spectrogram__legend">
        {Object.entries(BAND_COLOR).map(([band, color]) => (
          <span key={band} className="np-spectrogram__chip">
            <span
              className="np-spectrogram__chip-dot"
              style={{ background: color }}
            />
            {band}
          </span>
        ))}
        <span className="np-spectrogram__hint">
          punktyrinės linijos žymi juostų ribas
        </span>
      </div>
    </div>
  );
}
