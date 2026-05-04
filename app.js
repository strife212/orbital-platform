/* ============================================================
   OPV-9 // ORBITAL WEAPONS PLATFORM // CLIENT FCS
   All telemetry is simulated for demonstration.
   ============================================================ */

(() => {
  'use strict';

  // --------------------------------------------------------
  // Utility
  // --------------------------------------------------------
  const $  = (id) => document.getElementById(id);
  const rand    = (a, b) => a + Math.random() * (b - a);
  const wrap360 = (x) => ((x % 360) + 360) % 360;
  const pad     = (n, w = 2) => String(n).padStart(w, '0');
  const fmtSci  = (x, d = 3) => x.toExponential(d).replace('e', 'e');

  // --------------------------------------------------------
  // Mission clock + UTC
  // --------------------------------------------------------
  const t0 = Date.now() - 86400_000 * 17 - 3600_000 * 4 - 60_000 * 22; // T+17d ish
  const fmtClock = (ms) => {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${pad(d, 3)}:${pad(h)}:${pad(m)}:${pad(ss)}`;
  };
  const fmtUTC = (d) => {
    const iso = d.toISOString();
    return `UTC ${iso.slice(0, 10)} ${iso.slice(11, 23)}`;
  };

  // --------------------------------------------------------
  // Geodetic / orbital simulation (simplified)
  // --------------------------------------------------------
  const orbit = {
    inc: 51.6394,            // deg
    raan: 142.778,           // deg, drifts slightly with J2
    argp: 87.412,
    a: 6786.4,               // km, semi-major
    period: 92.9 * 60,       // s
    t: 0,
  };

  const updateGeodetic = (dt) => {
    orbit.t += dt;
    const n = (2 * Math.PI) / orbit.period;            // mean motion
    const nu = wrap360((n * orbit.t) * (180 / Math.PI));
    const u  = (orbit.argp + nu) * Math.PI / 180;      // arg of latitude
    const inc = orbit.inc * Math.PI / 180;

    const lat = Math.asin(Math.sin(inc) * Math.sin(u)) * 180 / Math.PI;
    const lon = wrap360(orbit.raan + Math.atan2(
      Math.cos(inc) * Math.sin(u),
      Math.cos(u)
    ) * 180 / Math.PI - (orbit.t * 360 / 86164)) - 180;
    const alt = (orbit.a - 6378.137) + Math.sin(orbit.t * 0.01) * 0.4;
    const vel = 7.660 + Math.sin(orbit.t * 0.013) * 0.004;

    $('lat').textContent  = `${lat >= 0 ? '+' : ''}${lat.toFixed(6)}°`;
    $('lon').textContent  = `${lon >= 0 ? '+' : ''}${lon.toFixed(6)}°`;
    $('alt').textContent  = `${alt.toFixed(2)} km`;
    $('vel').textContent  = `${vel.toFixed(3)} km/s`;
    $('nu').textContent   = `${nu.toFixed(3)}°`;
    $('raan').textContent = `${(orbit.raan + orbit.t * 7.5e-5).toFixed(3)}°`;
    $('argp').textContent = `${(orbit.argp + orbit.t * 4.1e-5).toFixed(3)}°`;

    // Lense-Thirring frame dragging — wobble in a tiny range
    const lt = 3.142e-14 + Math.sin(orbit.t * 0.07) * 1.1e-15;
    $('lense-thirring').textContent = `${lt.toExponential(3)} rad·s⁻¹`;
  };

  // --------------------------------------------------------
  // Spacetime diagnostics
  // --------------------------------------------------------
  const updateSpacetime = (now) => {
    const r = 8.412e-26 + Math.sin(now * 0.0011) * 1.2e-27;
    $('ricci').textContent = `${r.toExponential(3)} m⁻²`;
    const k = 1.137e-44 + Math.cos(now * 0.0009) * 8.0e-46;
    $('kretsch').textContent = `${k.toExponential(3)} m⁻⁴`;
    const adm = 28470 + Math.sin(now * 0.0007) * 12;
    $('adm').textContent = `${adm.toExponential(3)} kg`;

    // jiggle the metric tensor near identity
    const cell = (base) => {
      const v = base + (Math.random() - 0.5) * 0.0002;
      return (v >= 0 ? '+' : '') + v.toFixed(5);
    };
    const T = $('tensor');
    T.textContent =
      ` ${cell(-0.99988)}   ${cell(0.00004)}   ${cell(-0.00001)}   ${cell(0.00000)}\n` +
      ` ${cell(0.00004)}   ${cell(1.00012)}   ${cell(0.00002)}   ${cell(-0.00001)}\n` +
      ` ${cell(-0.00001)}   ${cell(0.00002)}   ${cell(1.00009)}   ${cell(0.00003)}\n` +
      ` ${cell(0.00000)}   ${cell(-0.00001)}   ${cell(0.00003)}   ${cell(1.00007)}`;
  };

  // --------------------------------------------------------
  // Causality / chronology
  // --------------------------------------------------------
  const updateCausality = (now) => {
    const tilt = 0.00027 + Math.abs(Math.sin(now * 0.0005)) * 0.00018;
    $('cone-state').textContent = `${tilt.toFixed(5)} rad`;

    const tach = 2.4 + Math.sin(now * 0.0017) * 0.6;
    const el = $('tachyon');
    el.textContent = `${tach.toFixed(2)} σ ABOVE BG`;
    el.classList.toggle('warn', tach > 2.0 && tach < 3.5);
    el.classList.toggle('bad', tach >= 3.5);

    const tD = (10 ** -13) * (1 + Math.sin(now * 0.0009) * 0.05);
    $('decohere').textContent = `τ_D = ${tD.toExponential(2)} s`;
  };

  // --------------------------------------------------------
  // Power systems
  // --------------------------------------------------------
  const updatePower = (now) => {
    const flux = 2.847 + Math.sin(now * 0.00041) * 0.092;
    $('core-flux').textContent = `${flux.toFixed(3)} GW`;
    $('core-bar').style.width  = `${(flux / 3.5 * 100).toFixed(1)}%`;

    const cap = 94.2 + Math.sin(now * 0.00058) * 3.1;
    $('cap-bank').textContent = `${cap.toFixed(1)}%`;
    $('cap-bar').style.width  = `${cap.toFixed(1)}%`;

    const zpe = 3.7e-9 + Math.sin(now * 0.00077) * 4.0e-10;
    $('zpe').textContent = `${zpe.toExponential(2)} J·m⁻³`;
    $('zpe-bar').style.width = `${(zpe / 6e-9 * 100).toFixed(1)}%`;

    const radT = 2140 + Math.sin(now * 0.00033) * 60;
    $('radiator').textContent = `+${radT.toFixed(0)} K`;
  };

  // --------------------------------------------------------
  // Targeting solution
  // --------------------------------------------------------
  const updateTargeting = (now) => {
    const drift = (b) => b + (Math.random() - 0.5) * 0.4;
    const x = drift(4218.412), y = -drift(3914.083), z = drift(3221.770);
    $('ecef').textContent =
      `${x >= 0 ? '+' : ''}${x.toFixed(3)}, ${y >= 0 ? '+' : ''}${y.toFixed(3)}, ${z >= 0 ? '+' : ''}${z.toFixed(3)} km`;

    const sh = 412 + Math.sin(now * 0.0012) * 18;
    $('shapiro').textContent = `+${sh.toFixed(0)} µs`;

    const lt = 0.00468 + Math.sin(now * 0.0008) * 0.00007;
    $('ltlag').textContent = `${lt.toFixed(5)} s`;
  };

  // --------------------------------------------------------
  // GRB charging bar — climbs, fires, recharges
  // --------------------------------------------------------
  let grbPct = 34;
  const updateGRB = () => {
    grbPct += rand(0.4, 1.1);
    if (grbPct >= 100) {
      grbPct = 0;
      log('CRIT', 'GRB EMITTER // FIRING SOLUTION DISCHARGED');
    }
    $('grb-bar').style.width = `${grbPct.toFixed(1)}%`;
  };

  // --------------------------------------------------------
  // Event log (ring buffer)
  // --------------------------------------------------------
  const LOG_MAX = 6;
  const logEl   = $('log-list');
  const logBuf  = [];

  const log = (level, msg) => {
    const ts = new Date();
    const t  = `${pad(ts.getUTCHours())}:${pad(ts.getUTCMinutes())}:${pad(ts.getUTCSeconds())}.${pad(ts.getUTCMilliseconds(), 3)}`;
    logBuf.push({ t, level, msg });
    if (logBuf.length > LOG_MAX) logBuf.shift();
    renderLog();
  };

  const renderLog = () => {
    logEl.innerHTML = '';
    // newest at top → reverse iteration into list rendered column-reverse
    for (const e of logBuf) {
      const li = document.createElement('li');
      li.className = 'fresh';
      li.innerHTML =
        `<span class="ts">${e.t}</span>` +
        `<span class="lvl ${e.level.toLowerCase()}">${e.level}</span>` +
        `<span class="msg">${e.msg}</span>`;
      logEl.appendChild(li);
    }
  };

  const LOG_MESSAGES = [
    ['INFO', 'Geodesic integrator step δλ refined to 1.0e-9'],
    ['INFO', 'Schwarzschild correction applied to fire-control loop'],
    ['INFO', 'Lense–Thirring precession nominal; ω_LT bounded'],
    ['INFO', 'QKD key rotation complete — uplink resealed'],
    ['INFO', 'Capacitor bank topped from D-³He primary'],
    ['INFO', 'ADM mass reconciliation Δ < 1 ppm'],
    ['INFO', 'Stress-energy T_μν: dominant energy condition holds'],
    ['INFO', 'Sweep complete — sector Δ light-cone clear'],
    ['INFO', 'Frame-drag compensator engaged // gyroscope drift cancelled'],
    ['INFO', 'Vacuum metastability inspection scheduled at T+19:00'],
    ['INFO', 'Targeting handoff: ASSET-X9 reacquired on geodesic'],
    ['WARN', 'Tachyonic flux 2.4σ above background — monitoring'],
    ['WARN', 'Radiator ΔT trending warm; passive bleed engaged'],
    ['WARN', 'GRB collimator alignment drift +0.0007 rad'],
    ['WARN', 'Local Ricci scalar departed nominal envelope (Δ < 3σ)'],
    ['WARN', 'Coriolis residual in inertial frame — recalibrating'],
    ['CRIT', 'CHRONOLOGY MONITOR: candidate CTC dismissed (false +)'],
    ['CRIT', 'False-vacuum seed Ψ-7 LOCKOUT confirmed by 2-of-3 vote'],
    ['CRIT', 'KERR–NEWMAN warhead arming key inserted // double-bolt'],
  ];

  const tickLog = () => {
    const [lvl, msg] = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
    log(lvl, msg);
  };

  // seed log
  log('INFO', 'OPV-9 fire-control bus online // v6.2.41');
  log('INFO', 'GR-corrected solver loaded — Kerr metric, a=0.998');
  log('INFO', 'Operator CMDR. R. VOSS authenticated // CLR-Ω');
  log('WARN', 'Weapons platform armed — DEFCON-2 in effect');

  // --------------------------------------------------------
  // Radar canvas — Minkowski-style sweep with worldlines
  // --------------------------------------------------------
  const radar = $('radar-canvas');
  const rctx  = radar.getContext('2d');

  const contacts = [];
  const seedContacts = (n) => {
    for (let i = 0; i < n; i++) {
      contacts.push({
        a: Math.random() * Math.PI * 2,            // angular pos
        r: 0.2 + Math.random() * 0.8,              // radial
        va: (Math.random() - 0.5) * 0.004,         // angular vel
        vr: (Math.random() - 0.5) * 0.0007,        // radial vel
        kind: Math.random() < 0.15 ? 'hostile' :
              Math.random() < 0.4  ? 'neutral'  : 'unknown',
        id: 'CTC-' + Math.floor(Math.random() * 9999).toString(16).toUpperCase().padStart(4, '0'),
      });
    }
  };
  seedContacts(9);

  let sweepAngle = 0;

  const fitCanvas = (cv) => {
    const r = cv.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cv.width  = r.width * dpr;
    cv.height = r.height * dpr;
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawRadar = (dt) => {
    const w = radar.clientWidth, h = radar.clientHeight;
    const cx = w / 2, cy = h / 2;
    const R  = Math.min(w, h) * 0.46;

    // bg trails
    rctx.fillStyle = 'rgba(1, 2, 8, 0.22)';
    rctx.fillRect(0, 0, w, h);

    // grid rings
    rctx.strokeStyle = 'rgba(0, 50, 180, 0.45)';
    rctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      rctx.beginPath();
      rctx.arc(cx, cy, (R / 5) * i, 0, Math.PI * 2);
      rctx.stroke();
    }
    // crosshairs
    rctx.beginPath();
    rctx.moveTo(cx - R, cy); rctx.lineTo(cx + R, cy);
    rctx.moveTo(cx, cy - R); rctx.lineTo(cx, cy + R);
    rctx.stroke();
    // diagonals (light cone projection lines)
    rctx.strokeStyle = 'rgba(20, 80, 220, 0.35)';
    rctx.setLineDash([4, 4]);
    rctx.beginPath();
    rctx.moveTo(cx - R, cy - R); rctx.lineTo(cx + R, cy + R);
    rctx.moveTo(cx - R, cy + R); rctx.lineTo(cx + R, cy - R);
    rctx.stroke();
    rctx.setLineDash([]);

    // bearing ticks
    rctx.fillStyle = 'rgba(106, 173, 255, 0.7)';
    rctx.font = '9px Cascadia Mono, Consolas, monospace';
    for (let deg = 0; deg < 360; deg += 30) {
      const a = (deg - 90) * Math.PI / 180;
      const tx = cx + Math.cos(a) * (R + 10);
      const ty = cy + Math.sin(a) * (R + 10);
      rctx.fillText(String(deg).padStart(3, '0'), tx - 8, ty + 3);
    }

    // sweep
    sweepAngle += dt * 0.0011;
    const a0 = sweepAngle;
    const arc = Math.PI / 3;
    const grad = rctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    grad.addColorStop(0, 'rgba(0, 100, 255, 0.0)');
    grad.addColorStop(0.7, 'rgba(0, 100, 255, 0.18)');
    grad.addColorStop(1, 'rgba(0, 100, 255, 0.0)');
    rctx.fillStyle = grad;
    rctx.beginPath();
    rctx.moveTo(cx, cy);
    rctx.arc(cx, cy, R, a0 - arc, a0);
    rctx.closePath();
    rctx.fill();

    // sweep edge
    rctx.strokeStyle = 'rgba(26, 128, 255, 0.85)';
    rctx.lineWidth = 1.3;
    rctx.beginPath();
    rctx.moveTo(cx, cy);
    rctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
    rctx.stroke();

    // contacts — hostile stays red as a danger indicator
    let visible = 0;
    for (const c of contacts) {
      c.a += c.va * dt;
      c.r += c.vr * dt;
      if (c.r > 0.95 || c.r < 0.1) c.vr *= -1;

      const x = cx + Math.cos(c.a) * c.r * R;
      const y = cy + Math.sin(c.a) * c.r * R;

      let da = ((c.a - a0) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const fade = Math.max(0.15, 1 - da / (Math.PI * 0.9));

      const color =
        c.kind === 'hostile' ? `rgba(255, 36, 0, ${fade})` :
        c.kind === 'neutral' ? `rgba(179, 212, 255, ${fade * 0.7})` :
                               `rgba(20, 100, 220, ${fade})`;

      rctx.fillStyle = color;
      rctx.strokeStyle = color;

      if (c.kind === 'hostile') {
        rctx.beginPath();
        rctx.moveTo(x, y - 6); rctx.lineTo(x + 5, y + 4); rctx.lineTo(x - 5, y + 4); rctx.closePath();
        rctx.fill();
      } else {
        rctx.beginPath();
        rctx.arc(x, y, 3, 0, Math.PI * 2);
        rctx.fill();
      }

      // label for tracked
      if (fade > 0.7) {
        rctx.fillStyle = `rgba(179, 212, 255, ${fade})`;
        rctx.fillText(c.id, x + 6, y + 3);
        visible++;
      }
    }

    $('contact-count').textContent = String(contacts.length);

    // center mark (own platform)
    rctx.fillStyle = 'rgba(106, 173, 255, 1)';
    rctx.beginPath();
    rctx.arc(cx, cy, 3, 0, Math.PI * 2);
    rctx.fill();
    rctx.strokeStyle = 'rgba(106, 173, 255, 0.7)';
    rctx.beginPath();
    rctx.arc(cx, cy, 8, 0, Math.PI * 2);
    rctx.stroke();
  };

  // --------------------------------------------------------
  // View toggle: radar ↔ installation
  // --------------------------------------------------------
  let currentView = 'radar';

  const SECTION_INFO = {
    rail: {
      name: 'PRIMARY RAIL ASSEMBLY',
      stats: 'Length: 4,200 m  ·  Rail separation: 0.80 m  ·  Material: μ-crystal tungsten composite  ·  Max current: 8.4 MA  ·  Muzzle velocity: 12.4 km/s',
      highlight: [0.18, 0.38, 0.64, 0.26],   // [x, y, w, h] normalized
    },
    coils: {
      name: 'EM ACCELERATOR COILS ×24',
      stats: 'Coil pitch: 175 m  ·  Peak B-field: 42 T  ·  Conductor: REBCO HTS tape  ·  Quench protection: active cryogenic shunt  ·  Stored energy: 14.2 GJ',
      highlight: [0.18, 0.44, 0.64, 0.14],
    },
    sensor: {
      name: 'TARGETING SENSOR ARRAY',
      stats: 'Aperture: 3.2 m  ·  Bands: X/Ka/optical  ·  Angular resolution: 0.04 µrad  ·  Geodetic pointing: Schwarzschild-corrected  ·  Lock range: 8,000 km',
      highlight: [0.78, 0.22, 0.16, 0.18],
    },
    caps: {
      name: 'CAPACITOR BANK CLUSTER',
      stats: 'Capacity: 14.2 GJ  ·  Charge time: 48 s  ·  Discharge: 2.1 ms  ·  Peak power: 6.76 TW  ·  Dielectric: nano-laminate aerogel  ·  Redundancy: 3-of-4',
      highlight: [0.60, 0.52, 0.22, 0.22],
    },
    tanks: {
      name: 'REACTION MASS TANKS',
      stats: 'Propellant: liquid Xe  ·  Mass: 4,200 kg  ·  ΔV budget: 680 m/s  ·  Thruster Isp: 3,100 s  ·  MMOD shield: 20 cm Al-Whipple',
      highlight: [0.04, 0.54, 0.14, 0.20],
    },
    command: {
      name: 'FIRE CONTROL MODULE',
      stats: 'CPU: 3× fault-tolerant RISC-V cluster  ·  GR solver: 6th-order Runge-Kutta  ·  Targeting latency: 1.2 ms  ·  Auth: 2-of-3 bio-key  ·  Shielding: 8 cm polyethylene + B₄C',
      highlight: [0.04, 0.22, 0.14, 0.22],
    },
  };

  let activeSection = null;
  let rgPulse = 0;

  window.setRadarView = (view) => {
    currentView = view;
    $('btn-radar').classList.toggle('active', view === 'radar');
    $('btn-install').classList.toggle('active', view === 'install');
    $('radar-canvas-wrap').classList.toggle('hidden', view !== 'radar');
    $('railgun-view').classList.toggle('visible', view === 'install');
    if (view === 'install') {
      $('radar-title').textContent = 'HMSS "HER ANNUNCIATOR" // INSTALLATION SCHEMATIC';
      $('radar-subtitle').textContent = 'PNL-002 / STRUCTURAL DIAGNOSTIC';
      fitCanvas($('railgun-canvas'));
    } else {
      $('radar-title').textContent = 'MINKOWSKI THREAT TRACE // SECTOR Δ';
      $('radar-subtitle').textContent = 'PNL-002 / LIGHT-CONE PROJECTION';
    }
  };

  // section label click handlers
  document.querySelectorAll('.rg-label').forEach((el) => {
    el.addEventListener('click', () => {
      const sec = el.dataset.section;
      activeSection = activeSection === sec ? null : sec;
      document.querySelectorAll('.rg-label').forEach(l => l.classList.remove('active'));
      if (activeSection) {
        el.classList.add('active');
        const info = SECTION_INFO[activeSection];
        $('rg-info').innerHTML =
          `<span class="si-name">${info.name}</span><span class="si-stats">${info.stats}</span>`;
      } else {
        $('rg-info').innerHTML =
          `<span class="si-name">SELECT A SECTION</span><span class="si-stats">Click any labeled subsystem to view diagnostic readout.</span>`;
      }
    });
  });

  // --------------------------------------------------------
  // Railgun canvas drawing
  // --------------------------------------------------------
  const rgcv  = $('railgun-canvas');
  const rgctx = rgcv.getContext('2d');

  const drawRailgun = (dt) => {
    if (currentView !== 'install') return;
    rgPulse += dt * 0.002;

    const w = rgcv.clientWidth, h = rgcv.clientHeight;
    rgctx.clearRect(0, 0, w, h);
    rgctx.fillStyle = '#050102';
    rgctx.fillRect(0, 0, w, h);

    // star field
    rgctx.fillStyle = 'rgba(179,210,255,0.25)';
    for (let i = 0; i < 80; i++) {
      const sx = ((i * 137 + 41) % 1000) / 1000 * w;
      const sy = ((i * 271 + 83) % 1000) / 1000 * h;
      const sr = 0.6 + ((i * 53) % 10) / 10 * 0.8;
      rgctx.beginPath();
      rgctx.arc(sx, sy, sr, 0, Math.PI * 2);
      rgctx.fill();
    }

    const hl = activeSection ? SECTION_INFO[activeSection].highlight : null;

    // helper: highlight overlay for a section
    const drawHighlight = (nx, ny, nw, nh, pulse) => {
      const x = nx * w, y = ny * h, bw = nw * w, bh = nh * h;
      const alpha = 0.12 + Math.abs(Math.sin(pulse)) * 0.12;
      rgctx.fillStyle = `rgba(0, 100, 255, ${alpha})`;
      rgctx.fillRect(x, y, bw, bh);
      rgctx.strokeStyle = `rgba(0, 128, 255, ${0.5 + Math.abs(Math.sin(pulse)) * 0.45})`;
      rgctx.lineWidth = 1.5;
      rgctx.strokeRect(x, y, bw, bh);
    };

    // ---- structural layout (normalized to canvas) ----
    const cx = w * 0.5, cy = h * 0.5;

    // === SPINE / BACKBONE ===
    const spineY = cy + h * 0.02;
    rgctx.strokeStyle = 'rgba(20, 60, 180, 0.9)';
    rgctx.lineWidth = h * 0.025;
    rgctx.beginPath();
    rgctx.moveTo(w * 0.04, spineY);
    rgctx.lineTo(w * 0.96, spineY);
    rgctx.stroke();

    // spine detail line
    rgctx.strokeStyle = 'rgba(60, 120, 255, 0.3)';
    rgctx.lineWidth = 1;
    rgctx.beginPath();
    rgctx.moveTo(w * 0.04, spineY);
    rgctx.lineTo(w * 0.96, spineY);
    rgctx.stroke();

    // === RAIL TRACKS (two parallel rails) ===
    const railOff = h * 0.065;
    for (let sign of [-1, 1]) {
      const ry = spineY + sign * railOff;
      rgctx.strokeStyle = 'rgba(20, 80, 220, 0.85)';
      rgctx.lineWidth = h * 0.012;
      rgctx.beginPath();
      rgctx.moveTo(w * 0.18, ry);
      rgctx.lineTo(w * 0.82, ry);
      rgctx.stroke();

      // rail glow
      rgctx.strokeStyle = `rgba(26, 128, 255, ${0.3 + Math.abs(Math.sin(rgPulse * 1.3)) * 0.25})`;
      rgctx.lineWidth = 1;
      rgctx.beginPath();
      rgctx.moveTo(w * 0.18, ry);
      rgctx.lineTo(w * 0.82, ry);
      rgctx.stroke();
    }

    // === EM ACCELERATOR COILS ===
    const nCoils = 16;
    for (let i = 0; i < nCoils; i++) {
      const cx2 = w * (0.19 + i * (0.62 / (nCoils - 1)));
      const coilPulse = rgPulse + i * 0.4;
      const alpha = 0.45 + Math.abs(Math.sin(coilPulse)) * 0.45;
      rgctx.strokeStyle = `rgba(26, 128, 255, ${alpha})`;
      rgctx.lineWidth = 2;
      rgctx.beginPath();
      rgctx.moveTo(cx2, spineY - h * 0.12);
      rgctx.lineTo(cx2, spineY + h * 0.12);
      rgctx.stroke();

      // coil ring
      rgctx.strokeStyle = `rgba(20, 80, 200, ${alpha * 0.7})`;
      rgctx.lineWidth = 1;
      rgctx.beginPath();
      rgctx.ellipse(cx2, spineY, w * 0.008, h * 0.11, 0, 0, Math.PI * 2);
      rgctx.stroke();
    }

    // === CAPACITOR BANK CLUSTER (right-of-center, below spine) ===
    const capCx = w * 0.72, capCy = spineY + h * 0.2;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 5; col++) {
        const bx = capCx + (col - 2) * w * 0.036;
        const by = capCy + row * h * 0.08;
        const bpulse = 0.25 + Math.abs(Math.sin(rgPulse * 1.8 + col * 0.7 + row)) * 0.35;
        rgctx.fillStyle = `rgba(0, 30, 100, ${bpulse})`;
        rgctx.strokeStyle = 'rgba(20, 80, 220, 0.7)';
        rgctx.lineWidth = 1;
        rgctx.beginPath();
        rgctx.rect(bx - w * 0.013, by - h * 0.028, w * 0.026, h * 0.056);
        rgctx.fill();
        rgctx.stroke();
      }
    }
    // conduit from spine to caps
    rgctx.strokeStyle = 'rgba(20, 60, 180, 0.5)';
    rgctx.lineWidth = 2;
    rgctx.setLineDash([4, 3]);
    rgctx.beginPath();
    rgctx.moveTo(capCx, spineY + h * 0.03);
    rgctx.lineTo(capCx, capCy - h * 0.03);
    rgctx.stroke();
    rgctx.setLineDash([]);

    // === REACTION MASS TANKS (left end) ===
    for (let i = 0; i < 2; i++) {
      const tx2 = w * 0.08, ty2 = spineY + (i === 0 ? -h * 0.17 : h * 0.17);
      rgctx.fillStyle = 'rgba(5, 15, 60, 0.85)';
      rgctx.strokeStyle = 'rgba(20, 60, 180, 0.85)';
      rgctx.lineWidth = 1.5;
      rgctx.beginPath();
      rgctx.ellipse(tx2, ty2, w * 0.035, h * 0.065, 0, 0, Math.PI * 2);
      rgctx.fill();
      rgctx.stroke();
      // valve connector
      rgctx.strokeStyle = 'rgba(15, 50, 150, 0.6)';
      rgctx.lineWidth = 2;
      rgctx.beginPath();
      rgctx.moveTo(tx2 + w * 0.035, ty2);
      rgctx.lineTo(w * 0.14, spineY);
      rgctx.stroke();
    }

    // === FIRE CONTROL MODULE (left, above spine) ===
    const fcx = w * 0.08, fcy = spineY - h * 0.24;
    rgctx.fillStyle = 'rgba(4, 10, 50, 0.9)';
    rgctx.strokeStyle = 'rgba(20, 80, 220, 0.85)';
    rgctx.lineWidth = 1.5;
    rgctx.beginPath();
    rgctx.rect(fcx - w * 0.055, fcy - h * 0.08, w * 0.11, h * 0.16);
    rgctx.fill();
    rgctx.stroke();
    // antenna dish
    rgctx.strokeStyle = 'rgba(106, 173, 255, 0.7)';
    rgctx.lineWidth = 1;
    rgctx.beginPath();
    rgctx.arc(fcx, fcy - h * 0.08, w * 0.025, Math.PI, 0);
    rgctx.stroke();
    // uplink flash
    const uplinkA = 0.4 + Math.abs(Math.sin(rgPulse * 2.5)) * 0.6;
    rgctx.strokeStyle = `rgba(26, 128, 255, ${uplinkA})`;
    rgctx.beginPath();
    rgctx.moveTo(fcx, fcy - h * 0.08 - h * 0.025);
    rgctx.lineTo(fcx, fcy - h * 0.16);
    rgctx.stroke();
    // connect to spine
    rgctx.strokeStyle = 'rgba(15, 50, 150, 0.55)';
    rgctx.lineWidth = 2;
    rgctx.setLineDash([3, 4]);
    rgctx.beginPath();
    rgctx.moveTo(fcx, fcy + h * 0.08);
    rgctx.lineTo(fcx, spineY - h * 0.012);
    rgctx.stroke();
    rgctx.setLineDash([]);

    // === TARGETING SENSOR ARRAY (right end, above) ===
    const tsx = w * 0.88, tsy = spineY - h * 0.22;
    // sensor aperture dish
    rgctx.strokeStyle = 'rgba(106, 173, 255, 0.9)';
    rgctx.lineWidth = 2;
    rgctx.beginPath();
    rgctx.arc(tsx, tsy, w * 0.04, 0.2, Math.PI - 0.2);
    rgctx.stroke();
    // secondary ring (optical)
    rgctx.strokeStyle = `rgba(60, 140, 255, ${0.4 + Math.abs(Math.sin(rgPulse)) * 0.4})`;
    rgctx.lineWidth = 1;
    rgctx.beginPath();
    rgctx.arc(tsx, tsy, w * 0.025, 0, Math.PI * 2);
    rgctx.stroke();
    // mast
    rgctx.strokeStyle = 'rgba(20, 60, 180, 0.75)';
    rgctx.lineWidth = 2;
    rgctx.beginPath();
    rgctx.moveTo(tsx, tsy + w * 0.04);
    rgctx.lineTo(tsx, spineY - h * 0.012);
    rgctx.stroke();

    // === SOLAR PANELS (radiator fins, top + bottom of spine mid-section) ===
    for (let side of [-1, 1]) {
      for (let pos = 0; pos < 3; pos++) {
        const px = w * (0.38 + pos * 0.09);
        const py = spineY + side * h * 0.26;
        const ph = h * 0.10, pw = w * 0.06;
        rgctx.fillStyle = 'rgba(3, 8, 30, 0.8)';
        rgctx.strokeStyle = 'rgba(0, 50, 139, 0.7)';
        rgctx.lineWidth = 1;
        rgctx.beginPath();
        rgctx.rect(px - pw / 2, py - ph / 2, pw, ph);
        rgctx.fill();
        rgctx.stroke();
        // panel grid lines
        rgctx.strokeStyle = 'rgba(5, 40, 100, 0.5)';
        for (let g = 1; g < 4; g++) {
          rgctx.beginPath();
          rgctx.moveTo(px - pw / 2 + g * pw / 4, py - ph / 2);
          rgctx.lineTo(px - pw / 2 + g * pw / 4, py + ph / 2);
          rgctx.stroke();
        }
        // strut
        rgctx.strokeStyle = 'rgba(10, 50, 150, 0.55)';
        rgctx.lineWidth = 1.5;
        rgctx.beginPath();
        rgctx.moveTo(px, py + (side > 0 ? -ph / 2 : ph / 2));
        rgctx.lineTo(px, spineY + side * h * 0.025);
        rgctx.stroke();
      }
    }

    // === NOSE CONE / MUZZLE ===
    rgctx.fillStyle = 'rgba(10, 20, 80, 0.9)';
    rgctx.strokeStyle = 'rgba(26, 128, 255, 0.9)';
    rgctx.lineWidth = 1.5;
    rgctx.beginPath();
    rgctx.moveTo(w * 0.82, spineY - h * 0.07);
    rgctx.lineTo(w * 0.97, spineY);
    rgctx.lineTo(w * 0.82, spineY + h * 0.07);
    rgctx.closePath();
    rgctx.fill();
    rgctx.stroke();

    // muzzle flash glow (live fire simulation)
    const muzzleA = Math.max(0, Math.sin(rgPulse * 0.22)) * 0.7;
    if (muzzleA > 0.05) {
      const mg = rgctx.createRadialGradient(w * 0.97, spineY, 0, w * 0.97, spineY, w * 0.08);
      mg.addColorStop(0, `rgba(200, 230, 255, ${muzzleA})`);
      mg.addColorStop(0.4, `rgba(26, 128, 255, ${muzzleA * 0.5})`);
      mg.addColorStop(1, 'rgba(0,80,255,0)');
      rgctx.fillStyle = mg;
      rgctx.beginPath();
      rgctx.arc(w * 0.97, spineY, w * 0.08, 0, Math.PI * 2);
      rgctx.fill();
    }

    // === ACTIVE SECTION HIGHLIGHT ===
    if (hl) drawHighlight(...hl, rgPulse * 2.2);

    // === DIMENSION CALLOUT LINES ===
    rgctx.strokeStyle = 'rgba(0, 50, 139, 0.4)';
    rgctx.lineWidth = 1;
    rgctx.setLineDash([2, 3]);
    rgctx.beginPath();
    rgctx.moveTo(w * 0.18, h * 0.88); rgctx.lineTo(w * 0.82, h * 0.88);
    rgctx.stroke();
    rgctx.setLineDash([]);
    rgctx.fillStyle = 'rgba(94, 130, 170, 0.85)';
    rgctx.font = `${Math.max(9, h * 0.028)}px Cascadia Mono, Consolas, monospace`;
    rgctx.textAlign = 'center';
    rgctx.fillText('◄────── RAIL ASSEMBLY  4,200 m ──────►', cx, h * 0.91);
    rgctx.textAlign = 'left';

    // classification watermark
    rgctx.fillStyle = 'rgba(0, 50, 139, 0.12)';
    rgctx.font = `bold ${h * 0.09}px Cascadia Mono, Consolas, monospace`;
    rgctx.textAlign = 'center';
    rgctx.fillText('TS // SCI // COMPARTMENTED', cx, cy + h * 0.04);
    rgctx.textAlign = 'left';
  };

  // --------------------------------------------------------
  // Targeting canvas — earth-limb + tracked target
  // --------------------------------------------------------
  const tcv = $('target-canvas');
  const tctx = tcv.getContext('2d');
  let tphase = 0;

  const drawTarget = (dt) => {
    const w = tcv.clientWidth, h = tcv.clientHeight;
    tctx.fillStyle = 'rgba(1, 2, 8, 0.35)';
    tctx.fillRect(0, 0, w, h);

    tphase += dt * 0.0006;

    // earth limb arc at the bottom
    const cx = w / 2, cy = h * 1.65;
    const R = h * 1.4;
    tctx.strokeStyle = 'rgba(20, 80, 220, 0.7)';
    tctx.lineWidth = 1.4;
    tctx.beginPath();
    tctx.arc(cx, cy, R, Math.PI, 0, false);
    tctx.stroke();

    // atmospheric haze
    const grad = tctx.createLinearGradient(0, h * 0.55, 0, h);
    grad.addColorStop(0, 'rgba(0, 80, 255, 0.0)');
    grad.addColorStop(1, 'rgba(0, 80, 255, 0.12)');
    tctx.fillStyle = grad;
    tctx.fillRect(0, h * 0.55, w, h * 0.45);

    // grid (mercator-ish)
    tctx.strokeStyle = 'rgba(0, 50, 180, 0.35)';
    tctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      const offset = ((i * 60 + tphase * 30) % w + w) % w;
      tctx.beginPath();
      tctx.moveTo(offset, h * 0.6);
      tctx.lineTo(offset - 30, h);
      tctx.stroke();
    }

    // target glyph — hostile diamond stays red
    const tx = w / 2 + Math.sin(tphase * 1.7) * 8;
    const ty = h / 2 + Math.cos(tphase * 1.3) * 4;
    tctx.strokeStyle = 'rgba(255, 36, 0, 0.95)';
    tctx.lineWidth = 1.5;
    tctx.beginPath();
    tctx.moveTo(tx, ty - 14); tctx.lineTo(tx + 14, ty);
    tctx.lineTo(tx, ty + 14); tctx.lineTo(tx - 14, ty); tctx.closePath();
    tctx.stroke();
    tctx.fillStyle = 'rgba(255, 36, 0, 0.4)';
    tctx.fill();

    // small vector trace (our system)
    tctx.strokeStyle = 'rgba(106, 173, 255, 0.7)';
    tctx.beginPath();
    tctx.moveTo(tx, ty);
    tctx.lineTo(tx + 26, ty - 18);
    tctx.stroke();
  };

  // --------------------------------------------------------
  // Launch control
  // --------------------------------------------------------
  const PKG_NAMES = {
    kn:     'KERR–NEWMAN WARHEAD',
    exotic: 'EXOTIC-MATTER LANCE',
    grb:    'COLLIMATED GRB EMITTER',
    rkv:    'RELATIVISTIC KINETIC SLUG',
    vac:    'FALSE-VACUUM SEED Ψ-7',
  };

  let selectedPkg   = 'kn';
  let launchState   = 'idle';   // idle | armed | countdown | fired
  let countdownVal  = 0;
  let countdownInterval = null;

  const armBtn      = $('arm-btn');
  const disarmBtn   = $('disarm-btn');
  const launchBtnEl = $('launch-btn');
  const launchLabel = $('launch-btn-label');
  const launchStatus = $('launch-status');
  const launchCountdown = $('launch-countdown');
  const authC       = $('auth-c');

  // weapon selector
  document.querySelectorAll('.ws-item').forEach((el) => {
    el.addEventListener('click', () => {
      if (el.classList.contains('disabled') || launchState !== 'idle') return;
      document.querySelectorAll('.ws-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      selectedPkg = el.dataset.pkg;
      $('launch-pkg-name').textContent = PKG_NAMES[selectedPkg];
      launchStatus.textContent = 'SYSTEM READY // AWAITING ARM';
      launchStatus.className   = 'launch-status';
    });
  });

  const resetLaunch = () => {
    launchState = 'idle';
    armBtn.style.display    = '';
    disarmBtn.style.display = 'none';
    launchBtnEl.style.display = 'none';
    launchBtnEl.classList.remove('firing-anim');
    launchLabel.textContent = 'INITIATE\nLAUNCH\nSEQUENCE';
    launchLabel.style.whiteSpace = 'pre';
    launchStatus.textContent = 'SYSTEM READY // AWAITING ARM';
    launchStatus.className   = 'launch-status';
    launchCountdown.textContent = '';
    authC.classList.remove('active');
    document.querySelectorAll('.ws-item').forEach(i => i.style.pointerEvents = '');
  };

  window.launchArm = () => {
    if (launchState === 'idle') {
      launchState = 'armed';
      armBtn.style.display    = 'none';
      launchBtnEl.style.display = '';
      disarmBtn.style.display = '';
      launchStatus.textContent = '⚠ ARMED — LAUNCH ENABLED';
      launchStatus.className   = 'launch-status armed';
      authC.classList.add('active');
      document.querySelectorAll('.ws-item').forEach(i => i.style.pointerEvents = 'none');
      log('CRIT', `PHYSICS PACKAGE ARMED // ${PKG_NAMES[selectedPkg]}`);
    } else if (launchState === 'armed') {
      resetLaunch();
      log('WARN', 'LAUNCH SEQUENCE ABORTED // DISARMED BY OPERATOR');
    }
  };

  window.launchFire = () => {
    if (launchState !== 'armed') return;
    launchState = 'countdown';
    armBtn.disabled = true;
    launchBtnEl.disabled = true;
    launchStatus.className = 'launch-status firing';
    countdownVal = 10;

    launchBtnEl.style.display = 'none';
    disarmBtn.style.display   = 'none';

    const tick2 = () => {
      if (countdownVal > 0) {
        launchCountdown.textContent = `T− ${String(countdownVal).padStart(2,'0')}`;
        launchStatus.textContent = 'COUNTDOWN IN PROGRESS';
        log('CRIT', `LAUNCH T-${countdownVal} // ${PKG_NAMES[selectedPkg]}`);
        countdownVal--;
        countdownInterval = setTimeout(tick2, 1000);
      } else {
        // FIRE
        launchState = 'fired';
        launchCountdown.textContent = 'LAUNCHED';
        launchStatus.textContent    = '🔴 PACKAGE AWAY';
        launchBtnEl.classList.add('firing-anim');
        launchLabel.style.whiteSpace = 'normal';
        launchLabel.textContent = 'PACKAGE AWAY';
        log('CRIT', `*** ${PKG_NAMES[selectedPkg]} // PACKAGE AWAY ***`);
        log('CRIT', 'GEODESIC INTERCEPT SOLUTION COMMITTED');

        // auto-reset after 4s
        setTimeout(() => {
          launchBtnEl.classList.remove('firing-anim');
          armBtn.disabled = false;
          launchCountdown.textContent = '';
          resetLaunch();
          log('INFO', 'LAUNCH SYSTEM RESET // READY FOR NEXT SEQUENCE');
        }, 4000);
      }
    };
    tick2();
  };

  // --------------------------------------------------------
  // Master loop
  // --------------------------------------------------------
  let last = performance.now();
  let logTimer = 0;
  let grbTimer = 0;

  const tick = (now) => {
    const dt = now - last;
    last = now;

    $('mission-clock').textContent = fmtClock(Date.now() - t0);
    $('utc').textContent           = fmtUTC(new Date());

    updateGeodetic(dt / 1000);
    updateSpacetime(now);
    updateCausality(now);
    updatePower(now);
    updateTargeting(now);

    drawRadar(dt);
    drawRailgun(dt);
    drawTarget(dt);

    grbTimer += dt;
    if (grbTimer > 250) { updateGRB(); grbTimer = 0; }

    logTimer += dt;
    if (logTimer > 6000 + Math.random() * 4000) {
      tickLog();
      logTimer = 0;
    }

    requestAnimationFrame(tick);
  };

  // --------------------------------------------------------
  // Resize handling
  // --------------------------------------------------------
  const refit = () => { fitCanvas(radar); fitCanvas(tcv); fitCanvas(rgcv); };
  window.addEventListener('resize', refit);

  // --------------------------------------------------------
  // Boot sequence
  // --------------------------------------------------------
  const BOOT_LINES = [
    { text: 'Initializing WGS-84 geodetic reference frame',              tag: 'OK',   ms: 270 },
    { text: 'Loading Kerr–Newman metric solver (a=0.998, Q=0.043)',      tag: 'OK',   ms: 315 },
    { text: 'Calibrating Lense–Thirring frame-drag compensators',        tag: 'OK',   ms: 240 },
    { text: 'Verifying physics package safety interlocks',               tag: 'OK',   ms: 360 },
    { text: 'Running Kretschmann invariant self-test',                   tag: 'OK',   ms: 285 },
    { text: 'Establishing 256-qubit QKD uplink to ground station',       tag: 'OK',   ms: 465 },
    { text: 'Authenticating operator CMDR. R. VOSS // CLR-Ω',           tag: 'OK',   ms: 300 },
    { text: 'Loading geodesic fire-control integrator (6th-order RK)',   tag: 'OK',   ms: 265 },
    { text: 'Initializing Minkowski threat-detection array',             tag: 'OK',   ms: 330 },
    { text: 'Chronology protection diagnostic — CTC scan',               tag: 'OK',   ms: 390 },
    { text: 'Tachyonic flux monitor: 2.4σ above background',             tag: 'WARN', ms: 450 },
    { text: 'All systems nominal — entering operational mode',           tag: 'OK',   ms: 600 },
  ];

  const loginScreen = $('login-screen');
  const bootScreen  = $('boot-screen');
  const bootList    = $('boot-lines');
  const bootBarWrap = $('boot-bar-wrap');
  const bootBarEl   = $('boot-bar');

  window.loginSubmit = () => {
    loginScreen.classList.add('fade-out');
    setTimeout(() => {
      loginScreen.remove();
      runBoot();
    }, 700);
  };

  const runBoot = () => {
    let delay = 450;
    BOOT_LINES.forEach((entry, i) => {
      delay += entry.ms;
      setTimeout(() => {
        const li = document.createElement('li');
        li.className = 'boot-line';
        const tagClass = entry.tag === 'OK' ? 'ok' : entry.tag === 'WARN' ? 'warn' : 'fail';
        li.innerHTML =
          `<span class="bl-text">${entry.text}</span>` +
          `<span class="bl-tag ${tagClass}">[ ${entry.tag} ]</span>`;
        bootList.appendChild(li);

        // progress bar
        if (i === 0) {
          bootBarWrap.style.display = '';
        }
        bootBarEl.style.width = `${((i + 1) / BOOT_LINES.length) * 100}%`;

        // after last line, pause then dismiss
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => {
            bootScreen.classList.add('fade-out');
            setTimeout(() => bootScreen.remove(), 850);
          }, 1050);
        }
      }, delay);
    });
  };

  refit();
  requestAnimationFrame((t) => { last = t; tick(t); });
})();
