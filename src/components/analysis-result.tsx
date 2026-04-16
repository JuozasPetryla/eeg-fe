type AnalysisMeta = {
  failas?: string;
  trukme_sek?: number;
  sfreq?: number;
};

type BandMetrics = {
  galia?: number;
  "santykine_galia_%"?: number;
  vidurine_amplitude?: number;
  nuokrypis?: number;
  max_amplitude?: number;
};

type StatisticalAnalysisResult = {
  informacija?: AnalysisMeta;
  rezultatai?: Record<string, BandMetrics>;
};

export type ExtraColumn = {
  title: string;    // e.g. "ADHD"
  items: string[];  // e.g. ["Theta ↑", "Beta ↓"]
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStatisticalAnalysisResult(value: unknown): value is StatisticalAnalysisResult {
  return isObject(value) && "rezultatai" in value;
}

function isImageMap(value: unknown): value is Record<string, string> {
  if (!isObject(value)) return false;
  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([, v]) => typeof v === "string");
}

function formatNumber(value: number | undefined, digits = 2, scientificThreshold?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  const abs = Math.abs(value);
  const roundedToZero = value !== 0 && Number(value.toFixed(digits)) === 0;
  const useScientific =
    scientificThreshold !== undefined ? abs < scientificThreshold : roundedToZero;
  if (useScientific) {
    return value
      .toExponential(Math.max(0, digits - 1))
      .replace(/(\.\d*?[1-9])0+e/, "$1e")
      .replace(/\.0+e/, "e");
  }
  return value.toFixed(digits);
}

function buildPowerBar(value: number | undefined, width = 20) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "░".repeat(width);
  }
  const filled = Math.max(0, Math.min(width, Math.round((value / 100) * width)));
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

/**
 * For a given band name (e.g. "Beta") and a list of selected arrow-labels
 * (e.g. ["Theta ↑", "Beta ↓"]), find the matching arrow indicator.
 * Matches by checking if the band name appears at the start of any item label.
 */
function getArrow(band: string, items: string[]): string {
  const match = items.find((item) =>
    item.toLowerCase().startsWith(band.toLowerCase())
  );
  if (!match) return "—";
  if (match.includes("↑")) return "↑";
  if (match.includes("↓")) return "↓";
  return "—";
}

export default function AnalysisResultView({
  result,
  visibleBands,
  visibleKeys,
  extraColumns = [],
}: {
  result: unknown;
  visibleBands?: string[];
  visibleKeys?: string[];
  extraColumns?: ExtraColumn[];
}) {
  if (isStatisticalAnalysisResult(result)) {
    const info = result.informacija ?? {};
    const bands = Object.entries(result.rezultatai ?? {}).filter(
      ([band]) =>
        !visibleBands || visibleBands.length === 0 ||
        visibleBands.includes(band.toLowerCase())
    );

    return (
      <div className="np-results">
        {/* Meta card */}
        <div className="np-card">
          <h3>EEG signalu analize</h3>
          <div className="np-meta-grid">
            <div><strong>Failas</strong><p>{info.failas ?? "N/A"}</p></div>
            <div><strong>Trukmė</strong><p>{formatNumber(info.trukme_sek)} s</p></div>
            <div><strong>Diskretizacija</strong><p>{formatNumber(info.sfreq)} Hz</p></div>
          </div>
        </div>

        {/* Band results table */}
        <div className="np-card">
          <h3>Dazniu juostu metrikos</h3>
          <div className="np-table-wrap">
            <table className="np-table">
              <thead>
                <tr>
                  <th>Juosta</th>
                  <th>Galia (uV2)</th>
                  <th>Santykinė %</th>
                  <th>Juosta</th>
                  <th>Vid. amp. (uV)</th>
                  <th>Nuokrypis</th>
                  <th>Max amp. (uV)</th>
                  {extraColumns.map((col) => (
                    <th key={col.title} className="np-table__extra-th">
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bands.map(([band, metrics]) => (
                  <tr key={band}>
                    <td>{band}</td>
                    <td>{formatNumber(metrics.galia, 4)}</td>
                    <td>{formatNumber(metrics["santykine_galia_%"], 2)} %</td>
                    <td className="np-power-cell">
                      <span className="np-power-bar">
                        {buildPowerBar(metrics["santykine_galia_%"])}
                      </span>
                    </td>
                    <td>{formatNumber(metrics.vidurine_amplitude, 4)}</td>
                    <td>{formatNumber(metrics.nuokrypis, 4)}</td>
                    <td>{formatNumber(metrics.max_amplitude, 4, 1e-2)}</td>
                    {extraColumns.map((col) => {
                      const arrow = getArrow(band, col.items);
                      return (
                        <td key={col.title} className="np-table__extra-td">
                          {arrow !== "—" ? (
                            <span className={`np-arrow np-arrow--${arrow === "↑" ? "up" : "down"}`}>
                              {arrow}
                            </span>
                          ) : (
                            <span className="np-arrow np-arrow--none">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (isImageMap(result)) {
    const entries = Object.entries(result).filter(
      ([key]) => !visibleKeys || visibleKeys.length === 0 || visibleKeys.includes(key)
    );
    return (
      <div className="np-results">
        {entries.map(([key, value]) => (
          <div key={key} className="np-card">
            <h4>{key}</h4>
            <img src={value} alt={key} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="np-results">
      <div className="np-card">
        <h3>Gauti rezultatai</h3>
        <pre className="np-json">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  );
}
