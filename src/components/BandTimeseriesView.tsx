import type { Data, Layout } from "plotly.js";
import Plot from "react-plotly.js";
import { useMemo } from "react";

export type BandTimeseries = {
  times_sec: number[];
  bands: Record<string, number[]>;
};

const BAND_COLOR: Record<string, string> = {
  Delta: "#6366f1",
  Theta: "#0ea5e9",
  Alpha: "#149A85",
  Beta: "#f59e0b",
  Gamma: "#ef4444",
};

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function BandTimeseriesView({
  band,
  data,
}: {
  band: string;
  data: BandTimeseries;
}) {
  const series = data.bands[band] ?? [];
  const color = BAND_COLOR[band] ?? "#149A85";

  const traces = useMemo<Data[]>(
    () => [
      {
        type: "scatter",
        mode: "lines",
        x: data.times_sec,
        y: series,
        line: { color, width: 2, shape: "spline", smoothing: 0.6 },
        fill: "tozeroy",
        fillcolor: hexToRgba(color, 0.18),
        hovertemplate: `Laikas: %{x:.1f} s<br>${band}: %{y:.2f} %<extra></extra>`,
        name: band,
      },
    ],
    [data, band, color, series],
  );

  const avg = series.length ? series.reduce((a, b) => a + b, 0) / series.length : 0;
  const variance = series.length
    ? series.reduce((acc, v) => acc + (v - avg) ** 2, 0) / series.length
    : 0;
  const std = Math.sqrt(variance);

  const plus1 = avg + std;
  const minus1 = Math.max(0, avg - std);
  const plus2 = avg + 2 * std;
  const minus2 = Math.max(0, avg - 2 * std);

  const seriesMax = series.length ? Math.max(...series) : 0;
  const yMax = Math.max(seriesMax, plus2) * 1.12 || 100;

  const sigmaLine = (
    y: number,
    color: string,
    dash: "dash" | "dot" | "longdash",
    width = 1,
  ): Partial<Layout["shapes"] extends (infer S)[] | undefined ? S : never> => ({
    type: "line",
    xref: "paper",
    yref: "y",
    x0: 0,
    x1: 1,
    y0: y,
    y1: y,
    line: { color, width, dash },
  });

  const SIGMA1_COLOR = "rgba(245, 158, 11, 0.55)";  // amber for ±1σ
  const SIGMA2_COLOR = "rgba(239, 68, 68, 0.55)";   // red for ±2σ

  const sigmaAnnotation = (
    y: number,
    text: string,
    color: string,
  ): Partial<Layout["annotations"] extends (infer A)[] | undefined ? A : never> => ({
    xref: "paper",
    yref: "y",
    x: 1,
    xanchor: "right",
    y,
    yanchor: "bottom",
    text,
    showarrow: false,
    font: { size: 9, color },
  });

  const layout: Partial<Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#333", family: "system-ui, -apple-system, sans-serif", size: 11 },
    margin: { t: 8, r: 16, b: 42, l: 52 },
    xaxis: {
      title: { text: "Laikas (s)", font: { size: 12, color: "#475569" } },
      color: "#64748b",
      gridcolor: "rgba(148,163,184,0.15)",
      zeroline: false,
    },
    yaxis: {
      title: { text: "Santykinė galia (%)", font: { size: 12, color: "#475569" } },
      color: "#64748b",
      gridcolor: "rgba(148,163,184,0.15)",
      zeroline: false,
      range: [0, yMax],
    },
    shapes: [
      sigmaLine(plus2, SIGMA2_COLOR, "dash"),
      sigmaLine(minus2, SIGMA2_COLOR, "dash"),
      sigmaLine(plus1, SIGMA1_COLOR, "dot"),
      sigmaLine(minus1, SIGMA1_COLOR, "dot"),
      sigmaLine(avg, "#94a3b8", "dot", 1),
    ],
    annotations: [
      sigmaAnnotation(avg, `vid. ${avg.toFixed(1)} %`, "#94a3b8"),
      sigmaAnnotation(plus1, `+1σ · ${plus1.toFixed(1)} %`, "#b45309"),
      sigmaAnnotation(plus2, `+2σ · ${plus2.toFixed(1)} %`, "#b91c1c"),
      ...(minus1 > 0
        ? [sigmaAnnotation(minus1, `−1σ · ${minus1.toFixed(1)} %`, "#b45309")]
        : []),
      ...(minus2 > 0
        ? [sigmaAnnotation(minus2, `−2σ · ${minus2.toFixed(1)} %`, "#b91c1c")]
        : []),
    ],
  };

  return (
    <div>
      <Plot
        data={traces}
        layout={layout}
        config={{
          displayModeBar: false,
          responsive: true,
        }}
        style={{ width: "100%", height: 240 }}
        useResizeHandler
      />
      <div className="np-band-detail__legend">
        <span className="np-band-detail__legend-item">
          <span
            className="np-band-detail__legend-line"
            style={{ background: "#94a3b8" }}
          />
          vidurkis
        </span>
        <span className="np-band-detail__legend-item">
          <span
            className="np-band-detail__legend-line np-band-detail__legend-line--dot"
            style={{ background: "rgba(245,158,11,0.7)" }}
          />
          ±1σ
        </span>
        <span className="np-band-detail__legend-item">
          <span
            className="np-band-detail__legend-line np-band-detail__legend-line--dash"
            style={{ background: "rgba(239,68,68,0.7)" }}
          />
          ±2σ
        </span>
        <span className="np-band-detail__legend-hint">
          σ — standartinis nuokrypis pagal šio įrašo dinamiką
        </span>
      </div>
    </div>
  );
}
