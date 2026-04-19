import { useRef, useEffect, useState, useMemo } from 'react';

// ─── Standard 10-20 electrode positions ──────────────────────────────────────
const ELECTRODE_POS: Record<string, [number, number]> = {
  FP1: [-0.18,  0.87], FP2: [ 0.18,  0.87], FPZ: [ 0.00,  0.88],
  AF7: [-0.54,  0.64], AF3: [-0.27,  0.70], AFZ: [ 0.00,  0.72],
  AF4: [ 0.27,  0.70], AF8: [ 0.54,  0.64],
  F7:  [-0.55,  0.54], F5:  [-0.44,  0.51], F3:  [-0.33,  0.50],
  F1:  [-0.17,  0.49], FZ:  [ 0.00,  0.49], F2:  [ 0.17,  0.49],
  F4:  [ 0.33,  0.50], F6:  [ 0.44,  0.51], F8:  [ 0.55,  0.54],
  FT7: [-0.65,  0.27], FC5: [-0.61,  0.27], FC3: [-0.36,  0.27],
  FC1: [-0.18,  0.27], FCZ: [ 0.00,  0.27], FC2: [ 0.18,  0.27],
  FC4: [ 0.36,  0.27], FC6: [ 0.61,  0.27], FT8: [ 0.65,  0.27],
  T7:  [-0.73,  0.00], T3:  [-0.73,  0.00],
  C5:  [-0.62,  0.00], C3:  [-0.46,  0.00], C1:  [-0.23,  0.00],
  CZ:  [ 0.00,  0.00],
  C2:  [ 0.23,  0.00], C4:  [ 0.46,  0.00], C6:  [ 0.62,  0.00],
  T4:  [ 0.73,  0.00], T8:  [ 0.73,  0.00],
  TP7: [-0.65, -0.27], CP5: [-0.61, -0.27], CP3: [-0.36, -0.27],
  CP1: [-0.18, -0.27], CPZ: [ 0.00, -0.27], CP2: [ 0.18, -0.27],
  CP4: [ 0.36, -0.27], CP6: [ 0.61, -0.27], TP8: [ 0.65, -0.27],
  T5:  [-0.55, -0.54], P7:  [-0.55, -0.54], P5:  [-0.44, -0.51],
  P3:  [-0.33, -0.50], P1:  [-0.17, -0.49], PZ:  [ 0.00, -0.49],
  P2:  [ 0.17, -0.49], P4:  [ 0.33, -0.50], P6:  [ 0.44, -0.51],
  P8:  [ 0.55, -0.54], T6:  [ 0.55, -0.54],
  PO7: [-0.54, -0.64], PO3: [-0.27, -0.70], POZ: [ 0.00, -0.72],
  PO4: [ 0.27, -0.70], PO8: [ 0.54, -0.64],
  O1:  [-0.18, -0.87], OZ:  [ 0.00, -0.87], O2:  [ 0.18, -0.87],
};

// Show labels only for classic landmark electrodes — keeps the map clean
const LABEL_SET = new Set([
  'FP1','FP2','F3','FZ','F4','T7','C3','CZ','C4','T8',
  'P3','PZ','P4','O1','OZ','O2',
]);

// ─── Diverging colormap ───────────────────────────────────────────────────────
// -1 → blue  0 → white  +1 → red  (saturates at ±2 SD)
function divergingColor(t: number): [number, number, number] {
  t = Math.max(-1, Math.min(1, t));
  if (t < 0) {
    const s = -t;
    return [1 - s * 0.80, 1 - s * 0.75, 1.0];
  }
  const s = t;
  return [1.0, 1 - s * 0.80, 1 - s * 0.82];
}

// ─── IDW interpolation ────────────────────────────────────────────────────────
function idwInterpolate(
  px: number, py: number,
  pts: Array<{ x: number; y: number; v: number }>,
  power = 3,
): number {
  let wSum = 0, vSum = 0;
  for (const p of pts) {
    const d2 = (px - p.x) ** 2 + (py - p.y) ** 2;
    if (d2 < 1e-12) return p.v;
    const w = 1 / d2 ** (power / 2);
    wSum += w; vSum += w * p.v;
  }
  return wSum > 0 ? vSum / wSum : 0;
}

// ─── Name normalisation ───────────────────────────────────────────────────────
function normalizeName(name: string): string {
  return name
    .toUpperCase().trim()
    .replace(/^EEG[\s_-]*/i, '')
    .replace(/[-_\s](REF|AVG|LE|RE|A[12]|M[12]|CLE|CRE|CE|CAR)$/i, '')
    .replace(/\s+/g, '');
}

// ─── Band colours ─────────────────────────────────────────────────────────────
const BAND_COLOR: Record<string, string> = {
  Delta: '#6366f1',
  Theta: '#0ea5e9',
  Alpha: '#149A85',
  Beta:  '#f59e0b',
  Gamma: '#ef4444',
};

const BAND_HZ: Record<string, string> = {
  Delta: '1–4 Hz', Theta: '4–8 Hz', Alpha: '8–13 Hz',
  Beta: '13–30 Hz', Gamma: '30–45 Hz',
};

// ─── Canvas constants ─────────────────────────────────────────────────────────
const SIZE = 400;
const CTR  = SIZE / 2;
const R    = SIZE * 0.385;

// ─── Component ────────────────────────────────────────────────────────────────
interface BrainTopoMapProps {
  channelData: Record<string, Record<string, number>>;
}

export default function BrainTopoMap({ channelData }: BrainTopoMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bands = useMemo(() => {
    const first = Object.values(channelData)[0];
    return first ? Object.keys(first) : ['Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'];
  }, [channelData]);

  const [selectedBand, setSelectedBand] = useState<string>(() =>
    bands.includes('Alpha') ? 'Alpha' : (bands[0] ?? 'Alpha'),
  );

  useEffect(() => {
    if (!bands.includes(selectedBand)) setSelectedBand(bands[0]);
  }, [bands, selectedBand]);

  const electrodes = useMemo(() => {
    const out: Array<{ name: string; x: number; y: number; v: number }> = [];
    for (const [rawName, chData] of Object.entries(channelData)) {
      const norm = normalizeName(rawName);
      const pos  = ELECTRODE_POS[norm];
      if (!pos) continue;
      const v = chData[selectedBand];
      if (typeof v !== 'number') continue;
      out.push({ name: norm, x: pos[0], y: pos[1], v });
    }
    return out;
  }, [channelData, selectedBand]);

  // ── Canvas draw ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);

    if (electrodes.length < 2) {
      // Placeholder head outline
      ctx.beginPath();
      ctx.arc(CTR, CTR, R, 0, Math.PI * 2);
      ctx.fillStyle = '#f4f6f9';
      ctx.fill();
      ctx.strokeStyle = '#c8d0db';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#9aa5b4';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Elektrodų pozicijos neatpažintos', CTR, CTR - 12);
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#b0bcc8';
      const rawNames = Object.keys(channelData).slice(0, 5).join('  ·  ');
      ctx.fillText(rawNames, CTR, CTR + 12);
      return;
    }

    // ── Spatial deviation ───────────────────────────────────────────────────
    const vals     = electrodes.map(e => e.v);
    const mean     = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    const std      = Math.sqrt(variance) || 1;
    const devElectrodes = electrodes.map(e => ({ ...e, v: (e.v - mean) / std }));

    // ── Scalp heatmap ───────────────────────────────────────────────────────
    const imgData = ctx.createImageData(SIZE, SIZE);

    for (let cy = 0; cy < SIZE; cy++) {
      for (let cx = 0; cx < SIZE; cx++) {
        const nx =  (cx - CTR) / R;
        const ny = -(cy - CTR) / R;
        const r2 = nx * nx + ny * ny;
        if (r2 > 1.08) continue;

        const dev = idwInterpolate(nx, ny, devElectrodes);
        const t   = Math.max(-1, Math.min(1, dev / 2));
        const [rc, gc, bc] = divergingColor(t);

        // Three-zone alpha: full inside → smooth fade → transparent outside
        let alpha = 1;
        if (r2 > 1.0)       alpha = Math.max(0, 1 - (r2 - 1.0) * 12);
        else if (r2 > 0.94) alpha = 0.85 + (1 - r2) / (1 - 0.94) * 0.15;

        const idx = (cy * SIZE + cx) * 4;
        imgData.data[idx]     = rc * 255 | 0;
        imgData.data[idx + 1] = gc * 255 | 0;
        imgData.data[idx + 2] = bc * 255 | 0;
        imgData.data[idx + 3] = alpha * 255 | 0;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // ── Outer glow ring ─────────────────────────────────────────────────────
    const glow = ctx.createRadialGradient(CTR, CTR, R * 0.92, CTR, CTR, R * 1.12);
    glow.addColorStop(0, 'rgba(30,58,99,0.0)');
    glow.addColorStop(1, 'rgba(30,58,99,0.18)');
    ctx.beginPath();
    ctx.arc(CTR, CTR, R * 1.12, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // ── Head outline ────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(CTR, CTR, R, 0, Math.PI * 2);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Nose — smooth bezier curve
    const noseBaseY = CTR - R + 1;
    const noseTipY  = CTR - R - R * 0.11;
    const nw = R * 0.10;
    ctx.beginPath();
    ctx.moveTo(CTR - nw, noseBaseY);
    ctx.quadraticCurveTo(CTR - nw * 1.4, noseTipY + 4, CTR, noseTipY);
    ctx.quadraticCurveTo(CTR + nw * 1.4, noseTipY + 4, CTR + nw, noseBaseY);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ears — smooth rounded shape
    const earOffX = R * 0.055;
    const earW    = R * 0.075;
    const earH    = R * 0.195;

    for (const side of [-1, 1]) {
      const ex = CTR + side * (R + earOffX);
      ctx.beginPath();
      ctx.ellipse(ex, CTR, earW, earH, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.0)';
      ctx.fill();
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // ── Midline reference lines (very subtle) ───────────────────────────────
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = 'rgba(30,58,99,0.18)';
    // Coronal midline
    ctx.beginPath();
    ctx.moveTo(CTR, CTR - R); ctx.lineTo(CTR, CTR + R);
    ctx.stroke();
    // Sagittal midline
    ctx.beginPath();
    ctx.moveTo(CTR - R, CTR); ctx.lineTo(CTR + R, CTR);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Electrode markers ───────────────────────────────────────────────────
    for (const e of electrodes) {
      const ex = CTR + e.x * R;
      const ey = CTR - e.y * R;
      const isLandmark = LABEL_SET.has(e.name);

      // Drop shadow
      ctx.beginPath();
      ctx.arc(ex + 0.5, ey + 0.8, isLandmark ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fill();

      // Dot fill
      ctx.beginPath();
      ctx.arc(ex, ey, isLandmark ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle   = 'rgba(255,255,255,0.95)';
      ctx.fill();
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth   = isLandmark ? 1.8 : 1.2;
      ctx.stroke();

      // Label only for landmark electrodes
      if (isLandmark) {
        const labelY = ey + 8;
        ctx.font = '700 8.5px system-ui, sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.lineWidth    = 3;
        ctx.strokeStyle  = 'rgba(255,255,255,0.9)';
        ctx.strokeText(e.name, ex, labelY);
        ctx.fillStyle = '#152848';
        ctx.fillText(e.name, ex, labelY);
      }
    }
  }, [electrodes]);

  // ── Colorbar stats ──────────────────────────────────────────────────────────
  const vals  = electrodes.map(e => e.v);
  const mean  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const std   = vals.length
    ? Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1
    : 1;
  const accentColor = BAND_COLOR[selectedBand] ?? '#149A85';

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            16,
      padding:        '4px 0 8px',
    }}>

      {/* ── Band tabs ──────────────────────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        gap:            6,
        flexWrap:       'wrap',
        justifyContent: 'center',
        background:     '#f0f2f5',
        borderRadius:   24,
        padding:        '4px 6px',
      }}>
        {bands.map(band => {
          const active = band === selectedBand;
          const colour = BAND_COLOR[band] ?? '#149A85';
          return (
            <button
              key={band}
              onClick={() => setSelectedBand(band)}
              title={BAND_HZ[band]}
              style={{
                padding:      '5px 15px',
                borderRadius:  20,
                border:        'none',
                background:    active ? colour : 'transparent',
                color:         active ? 'white' : '#6b7280',
                fontWeight:    active ? '700' : '500',
                cursor:        'pointer',
                fontSize:      12,
                letterSpacing: '0.02em',
                transition:    'all 0.18s ease',
                boxShadow:     active ? `0 2px 8px ${colour}55` : 'none',
              }}
            >
              {band}
            </button>
          );
        })}
      </div>

      {/* ── Canvas wrapper ─────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: '50%',
        overflow:     'hidden',
        boxShadow:    '0 4px 24px rgba(20,40,80,0.13), 0 1px 4px rgba(20,40,80,0.08)',
        lineHeight:   0,
      }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{ maxWidth: '100%', display: 'block' }}
        />
      </div>

      {/* ── Colorbar ───────────────────────────────────────────────────────── */}
      <div style={{ width: Math.min(SIZE, 340), maxWidth: '100%' }}>
        <div style={{ position: 'relative', height: 18, borderRadius: 9, overflow: 'hidden',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)' }}>
          <div style={{
            position:   'absolute', inset: 0,
            background: 'linear-gradient(to right, #3344cc, #8899ee, #ffffff, #ee8866, #cc2200)',
          }} />
          {/* Centre tick */}
          <div style={{
            position:    'absolute', left: '50%', top: 2, bottom: 2,
            width:       1.5, background: 'rgba(0,0,0,0.25)',
            transform:   'translateX(-50%)',
          }} />
        </div>
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          marginTop:      5,
          fontSize:       10.5,
          color:          '#7a8499',
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span>−2σ · {(mean - 2 * std).toFixed(1)}%</span>
          <span style={{ color: '#9aa0ad' }}>vidurkis · {mean.toFixed(1)}%</span>
          <span>+2σ · {(mean + 2 * std).toFixed(1)}%</span>
        </div>

        <div style={{
          textAlign:    'center',
          marginTop:    6,
          fontSize:     11,
          color:        '#9aa0ad',
          letterSpacing: '0.01em',
        }}>
          Erdvinis nuokrypis nuo paciento vidurkio &mdash;{' '}
          <span style={{ color: accentColor, fontWeight: 700 }}>{selectedBand}</span>
          {BAND_HZ[selectedBand] ? (
            <span style={{ color: '#b0b8c4' }}> · {BAND_HZ[selectedBand]}</span>
          ) : null}
        </div>
      </div>

      {/* ── Electrode count ────────────────────────────────────────────────── */}
      <div style={{ fontSize: 10, color: '#c0c8d4', letterSpacing: '0.02em' }}>
        {electrodes.length} / {Object.keys(channelData).length} elektrodų atpažinta &nbsp;·&nbsp; 10–20 sistema
      </div>
    </div>
  );
}
