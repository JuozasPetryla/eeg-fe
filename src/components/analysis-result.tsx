import BrainTopoMap from './BrainTopoMap';

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
  // Per-channel relative powers for the topographic scalp map
  kanalu_galia?: Record<string, Record<string, number>>;
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
    const info   = result.informacija ?? {};
    const kanalu = result.kanalu_galia;
    const bands  = Object.entries(result.rezultatai ?? {}).filter(
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

        {/* Topographic brain map */}
        {kanalu && Object.keys(kanalu).length > 0 && (
          <div className="np-card">
            <h3>Smegenų aktyvumo topografinis žemėlapis</h3>
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px' }}>
              Kiekvieno elektrodo nuokrypis nuo šio paciento erdvinio vidurkio (10–20 sistema).
              Mėlyna = žemiau vidurkio, balta = vidurkis, raudona = aukščiau vidurkio. Spalva sočiausia ties ±2σ.
            </p>
            <BrainTopoMap channelData={kanalu} />
          </div>
        )}

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

  // Handle Night Analysis (Mixed: Images + stage_stats)
  if (isObject(result)) {
    const stageStats = result.stage_stats as Record<string, Record<string, BandMetrics>> | undefined;
    const entries = Object.entries(result).filter(
      ([key]) => key !== "stage_stats" && (!visibleKeys || visibleKeys.length === 0 || visibleKeys.includes(key))
    );

    return (
      <div className="np-results">
        {entries.map(([key, value]) => (
          typeof value === "string" && (
            <div key={key} className="np-card">
              <h4>{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
              <img src={value} alt={key} style={{ width: "100%" }} />
            </div>
          )
        ))}

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
                          <td>{formatNumber(m.galia, 4)}</td>
                          <td>{formatNumber(m["santykine_galia_%"], 2)} %</td>
                          <td className="np-power-cell">
                            <span className="np-power-bar">
                              {buildPowerBar(m["santykine_galia_%"])}
                            </span>
                          </td>
                          <td>
                            <span style={{ 
                              color: Math.abs(m.nuokrypis || 0) > 2 ? "#FF6347" : 
                                     Math.abs(m.nuokrypis || 0) > 1 ? "#FFD700" : "inherit",
                              fontWeight: Math.abs(m.nuokrypis || 0) > 1 ? "bold" : "normal"
                            }}>
                              {formatNumber(m.nuokrypis, 4)}
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

  return (
    <div className="np-results">
      <div className="np-card">
        <h3>Gauti rezultatai</h3>
        <pre className="np-json">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  );
}
