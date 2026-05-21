import { useState } from 'react';
import BrainTopoMap from './BrainTopoMap';
import SpectrogramView, { type SpectrogramData } from './SpectrogramView';
import BandTimeseriesView, { type BandTimeseries } from './BandTimeseriesView';

import MLSleepResultView, { isMLSleepResult } from "./ml-sleep-result";


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

type ChannelBandTimeseries = {
  times_sec: number[];
  channels: Record<string, Record<string, number[]>>;
};

type StatisticalAnalysisResult = {
  informacija?: AnalysisMeta;
  rezultatai?: Record<string, BandMetrics>;
  // Per-channel relative powers for the topographic scalp map
  kanalu_galia?: Record<string, Record<string, number>>;
  spektrograma?: SpectrogramData;
  juostu_dinamika?: BandTimeseries;
  kanalu_dinamika?: ChannelBandTimeseries;
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
 * (e.g. ["Theta ↑ (explanation)", "Beta ↓ (another explanation)"]), 
 * find the matching item and extract arrow + explanation.
 * Returns { arrow: "↑" | "↓" | "—", explanation: "(text)" | "" }
 */
function getArrowAndExplanation(band: string, items: string[]): { arrow: string; explanation: string } {
  const match = items.find((item) =>
    item.toLowerCase().startsWith(band.toLowerCase())
  );
  if (!match) return { arrow: "—", explanation: "" };
  
  let arrow = "—";
  if (match.includes("↑")) arrow = "↑";
  else if (match.includes("↓")) arrow = "↓";
  
  // Extract explanation in parentheses, e.g. "(hiperaktyvumas)"
  const explanationMatch = match.match(/\([^)]*\)/);
  const explanation = explanationMatch ? explanationMatch[0] : "";
  
  return { arrow, explanation };
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
    return (
      <StatisticalAnalysisView
        result={result}
        visibleBands={visibleBands}
        extraColumns={extraColumns}
      />
    );
  }

  if (isMLSleepResult(result)) {
    return <MLSleepResultView result={result} visibleKeys={visibleKeys} />;
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
                        <th>Galia <span className="np-unit">(µV²)</span></th>
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

function StatisticalAnalysisView({
  result,
  visibleBands,
  extraColumns,
}: {
  result: StatisticalAnalysisResult;
  visibleBands?: string[];
  extraColumns: ExtraColumn[];
}) {
  const info = result.informacija ?? {};
  const kanalu = result.kanalu_galia;
  const bands = Object.entries(result.rezultatai ?? {}).filter(
    ([band]) =>
      !visibleBands ||
      visibleBands.length === 0 ||
      visibleBands.includes(band.toLowerCase()),
  );

  const [expandedBand, setExpandedBand] = useState<string | null>(null);
  const dynamics = result.juostu_dinamika;
  const canDrillBand =
    dynamics && Array.isArray(dynamics.times_sec) && dynamics.times_sec.length > 1;

  return (
    <div className="np-results">
      {/* Meta card */}
      <div className="np-card">
        <h3>EEG signalu analize</h3>
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

      {/* Spectrogram — bird's-eye view of full recording */}
      {result.spektrograma && result.spektrograma.times_sec?.length > 0 && (
        <div className="np-card">
          <h3>Spektrograma</h3>
          <p className="np-card__sub">
            Laiko ir dažnio žemėlapis — šilta spalva žymi didesnę galią (dB). Skirta
            iš karto pamatyti anomalijas (pvz., epilepsinę iškrovą) per visą įrašą.
          </p>
          <SpectrogramView data={result.spektrograma} />
        </div>
      )}

      {/* Topographic brain map */}
      {kanalu && Object.keys(kanalu).length > 0 && (
        <div className="np-card">
          <h3>Smegenų aktyvumo topografinis žemėlapis</h3>
          <p className="np-card__sub">
            Kiekvieno elektrodo nuokrypis nuo šio paciento erdvinio vidurkio (10–20
            sistema). Mėlyna = žemiau vidurkio, balta = vidurkis, raudona = aukščiau
            vidurkio. Spalva sočiausia ties ±2σ.
          </p>
          <BrainTopoMap
            channelData={kanalu}
            channelTimeseries={result.kanalu_dinamika}
          />
        </div>
      )}

      {/* Band results table */}
      {bands.length > 0 && (
        <div className="np-card">
          <h3>Dazniu juostu metrikos</h3>
          {canDrillBand && (
            <p className="np-card__sub">
              Spustelėkite eilutę, kad pamatytumėte tos juostos galios kitimą laike.
            </p>
          )}
          <div className="np-table-wrap">
            <table className="np-table np-table--clickable">
              <thead>
                <tr>
                  <th>Juosta</th>
                  <th>Galia <span className="np-unit">(µV²)</span></th>
                  <th>Santykinė %</th>
                  <th>Juosta</th>
                  <th>Vid. amp. <span className="np-unit">(µV)</span></th>
                  <th>Nuokrypis</th>
                  <th>Max amp. <span className="np-unit">(µV)</span></th>
                  {extraColumns.map((col) => (
                    <th key={col.title} className="np-table__extra-th">
                      {col.title}
                    </th>
                  ))}
                  {canDrillBand && <th className="np-table__drill-th" aria-label="" />}
                </tr>
              </thead>
              <tbody>
                {bands.map(([band, metrics]) => {
                  const isActive = expandedBand === band;
                  return (
                    <tr
                      key={band}
                      className={
                        isActive ? "np-table__row np-table__row--active" : "np-table__row"
                      }
                      onClick={
                        canDrillBand
                          ? () => setExpandedBand(isActive ? null : band)
                          : undefined
                      }
                      style={canDrillBand ? { cursor: "pointer" } : undefined}
                    >
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
                        const { arrow, explanation } = getArrowAndExplanation(band, col.items);
                        return (
                          <td key={col.title} className="np-table__extra-td">
                            {arrow !== "—" ? (
                              <span
                                className={`np-arrow np-arrow--${arrow === "↑" ? "up" : "down"}`}
                              >
                                <div>{arrow} </div>
                                <div className="np-explanation">{explanation}</div>
                              </span>
                            ) : (
                              <span className="np-arrow np-arrow--none">—</span>
                            )}
                          </td>
                        );
                      })}
                      {canDrillBand && (
                        <td className="np-table__drill-td">
                          <span
                            className={`np-table__drill-icon${isActive ? " np-table__drill-icon--open" : ""}`}
                            aria-hidden
                          >
                            ▾
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {canDrillBand && expandedBand && (
            <div className="np-band-detail">
              <div className="np-band-detail__header">
                <span className="np-band-detail__title">
                  {expandedBand}{" "}
                  <span className="np-band-detail__sub">galios kitimas per įrašą</span>
                </span>
                <button
                  type="button"
                  className="np-band-detail__close"
                  onClick={() => setExpandedBand(null)}
                  aria-label="Uždaryti"
                >
                  ×
                </button>
              </div>
              <BandTimeseriesView band={expandedBand} data={dynamics!} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
