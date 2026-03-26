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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStatisticalAnalysisResult(value: unknown): value is StatisticalAnalysisResult {
  return isObject(value) && "rezultatai" in value;
}

function isImageMap(value: unknown): value is Record<string, string> {
  if (!isObject(value)) {
    return false;
  }

  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([, entryValue]) => typeof entryValue === "string");
}

function formatNumber(value: number | undefined, digits = 2, scientificThreshold?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  const absoluteValue = Math.abs(value);
  const roundedToZero = value !== 0 && Number(value.toFixed(digits)) === 0;
  const shouldUseScientific =
    scientificThreshold !== undefined
      ? absoluteValue < scientificThreshold
      : roundedToZero;

  if (shouldUseScientific) {
    return value
      .toExponential(Math.max(0, digits - 1))
      .replace(/(\.\d*?[1-9])0+e/, "$1e")
      .replace(/\.0+e/, "e");
  }

  return value.toFixed(digits);
}

export default function AnalysisResultView({
  result,
  visibleBands,
  visibleKeys,
}: {
  result: unknown;
  visibleBands?: string[];
  visibleKeys?: string[];
}) {
  if (isStatisticalAnalysisResult(result)) {
    const info = result.informacija ?? {};
    const bands = Object.entries(result.rezultatai ?? {}).filter(([band]) =>
      !visibleBands || visibleBands.length === 0 || visibleBands.includes(band.toLowerCase())
    );

    return (
      <div className="np-results">
        <div className="np-card">
          <h3>Analizės informacija</h3>
          <div className="np-meta-grid">
            <div>
              <strong>Failas</strong>
              <p>{info.failas ?? "N/A"}</p>
            </div>
            <div>
              <strong>Trukmė</strong>
              <p>{formatNumber(info.trukme_sek)} s</p>
            </div>
            <div>
              <strong>Diskretizacija</strong>
              <p>{formatNumber(info.sfreq)} Hz</p>
            </div>
          </div>
        </div>

        <div className="np-card">
          <h3>Dažnių juostų rezultatai</h3>
          <div className="np-table-wrap">
            <table className="np-table">
              <thead>
                <tr>
                  <th>Juosta</th>
                  <th>Galia</th>
                  <th>Santykinė galia %</th>
                  <th>Vid. amplitudė</th>
                  <th>Nuokrypis</th>
                  <th>Max amplitudė</th>
                </tr>
              </thead>
              <tbody>
                {bands.map(([band, metrics]) => (
                  <tr key={band}>
                    <td>{band}</td>
                    <td>{formatNumber(metrics.galia, 4)}</td>
                    <td>{formatNumber(metrics["santykine_galia_%"], 2)}</td>
                    <td>{formatNumber(metrics.vidurine_amplitude, 4)}</td>
                    <td>{formatNumber(metrics.nuokrypis, 4)}</td>
                    <td>{formatNumber(metrics.max_amplitude, 4, 1e-2)}</td>
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
    const entries = Object.entries(result).filter(([key]) =>
      !visibleKeys || visibleKeys.length === 0 || visibleKeys.includes(key)
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
