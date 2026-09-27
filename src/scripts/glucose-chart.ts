/**
 * Hero glucose-band chart: an inline SVG AGP-style curve pair, drawn from
 * synthetic data (illustrative only, never patient measurements).
 *
 * Two people, the same breakfast, 07:00-11:00. Curve A stays in range by
 * construction of `heroChartConfig.a`; curve B rises above the range
 * (7.8 mmol/L) mid-morning and is drawn in the High colour only past that
 * point, via two clipPaths (no gradient, per the site's design direction).
 */

export type GlucosePoint = [minute: number, mmol: number];

export interface GlucoseChartColors {
  range: string;
  ink: string;
  high: string;
  grid: string;
  muted: string;
}

export interface GlucoseChartConfig {
  /** Y-axis domain, with headroom above/below the labelled range. */
  y: [number, number];
  /** The labelled in-range band, e.g. 3.9-7.8 mmol/L. */
  range: [number, number];
  /** Extra horizontal gridlines (mmol/L values), besides the range bounds. */
  grid: number[];
  /** Y-axis tick labels (mmol/L values). */
  labels: number[];
  /** Curve A's synthetic points: [minutesFromStart, mmol/L]. */
  a: GlucosePoint[];
  /** Curve B's synthetic points: [minutesFromStart, mmol/L]. */
  b: GlucosePoint[];
  colors: GlucoseChartColors;
}

/** The real hero chart data (SN-036 "f" config): the one shown to Sofija/the user. */
export const heroChartConfig: GlucoseChartConfig = {
  y: [3, 11],
  range: [3.9, 7.8],
  grid: [6, 10],
  labels: [3.9, 6, 7.8, 10],
  a: [
    [0, 5.0],
    [30, 5.1],
    [45, 5.8],
    [60, 6.7],
    [75, 7.2],
    [90, 7.1],
    [105, 6.6],
    [120, 6.0],
    [150, 5.3],
    [180, 5.0],
    [210, 4.9],
    [240, 5.0],
  ],
  b: [
    [0, 5.4],
    [30, 5.5],
    [45, 6.9],
    [60, 8.5],
    [75, 9.7],
    [90, 10.1],
    [105, 9.5],
    [120, 8.4],
    [150, 6.5],
    [180, 5.3],
    [210, 4.8],
    [240, 5.1],
  ],
  colors: {
    range: 'var(--color-range)',
    ink: 'var(--color-navy)',
    high: 'var(--color-high)',
    grid: 'var(--color-line)',
    muted: 'var(--color-slate)',
  },
};

/**
 * Monotone (Fritsch-Carlson) cubic interpolation through `points`, evaluated
 * at every integer step of the points' own domain. Unlike a plain Catmull-Rom
 * spline this never overshoots past the surrounding data — required so a flat
 * or falling stretch of the curve can't dip below zero or spike above a peak.
 */
export function monotoneCubic(points: GlucosePoint[]): number[] {
  const n = points.length;
  const start = points[0][0];
  const end = points[n - 1][0];

  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    slopes.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]));
  }

  const tangents: number[] = [];
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    tangents[i] = slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const alpha = tangents[i] / slopes[i];
    const beta = tangents[i + 1] / slopes[i];
    const sumSquares = alpha * alpha + beta * beta;
    if (sumSquares > 9) {
      const scale = 3 / Math.sqrt(sumSquares);
      tangents[i] = scale * alpha * slopes[i];
      tangents[i + 1] = scale * beta * slopes[i];
    }
  }

  const out: number[] = [];
  for (let t = start; t <= end; t++) {
    let segment = 0;
    while (segment < n - 2 && t > points[segment + 1][0]) segment++;
    const h = points[segment + 1][0] - points[segment][0];
    const u = (t - points[segment][0]) / h;
    const u2 = u * u;
    const u3 = u2 * u;
    out.push(
      (2 * u3 - 3 * u2 + 1) * points[segment][1] +
        (u3 - 2 * u2 + u) * h * tangents[segment] +
        (-2 * u3 + 3 * u2) * points[segment + 1][1] +
        (u3 - u2) * h * tangents[segment + 1]
    );
  }
  return out;
}

/** "07:00" + minutesFromStart, wrapping hours as needed. */
export function formatTime(minutesFromStart: number, startHour = 7): string {
  let hour = startHour + Math.floor(minutesFromStart / 60);
  let minute = Math.round(minutesFromStart % 60);
  if (minute === 60) {
    hour += 1;
    minute = 0;
  }
  const pad = (value: number) => (value < 10 ? `0${value}` : String(value));
  return `${pad(hour)}:${pad(minute)}`;
}

/** LV/RU use a comma decimal separator; EN uses a dot. */
export function formatMmol(value: number, lang: string): string {
  const text = value.toFixed(1);
  return `${lang === 'en' ? text : text.replace('.', ',')} mmol/L`;
}

const BREAKFAST_LABEL: Record<string, string> = {
  lv: 'Brokastis',
  ru: 'Завтрак',
  en: 'Breakfast',
};

const TIME_IN_RANGE_SENTENCE: Record<string, (overMinutes: number, high: string) => string> = {
  lv: (overMinutes, high) => `A: visu laiku diapazonā. B: ${overMinutes} min virs ${high} mmol/L.`,
  ru: (overMinutes, high) => `A: всё время в норме. B: ${overMinutes} мин выше ${high} ммоль/л.`,
  en: (overMinutes, high) => `A: stays in range throughout. B: ${overMinutes} min above ${high} mmol/L.`,
};

/**
 * The figcaption's computed time-in-range sentence. Assumes curve A never
 * leaves the range (true by construction of `heroChartConfig.a`) and only
 * reports curve B's minutes above the range high, matching the source mockup.
 */
export function formatTimeInRangeSentence(overMinutesB: number, rangeHigh: number, lang: string): string {
  const sentence = TIME_IN_RANGE_SENTENCE[lang] ?? TIME_IN_RANGE_SENTENCE.lv;
  const highText = rangeHigh.toFixed(1);
  return sentence(overMinutesB, lang === 'en' ? highText : highText.replace('.', ','));
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEWBOX_WIDTH = 640;
const CHART_LEFT = 44;
const CHART_RIGHT = 600;
const CHART_TOP = 16;
const CHART_BOTTOM = 316;
const BREAKFAST_MINUTE = 30;
const POINTER_START_MINUTE = 90;
const ARROW_KEY_STEP_MINUTES = 5;

function currentLang(): string {
  return document.documentElement.lang || 'lv';
}

/**
 * Builds the inline SVG chart identified by `${idPrefix}-svg` and wires its
 * pointer/keyboard readout (`${idPrefix}-t/-va/-vb/-tir`). No-op if the SVG
 * isn't on the page.
 */
export function initGlucoseChart(idPrefix: string, cfg: GlucoseChartConfig): void {
  const svg = document.getElementById(`${idPrefix}-svg`);
  if (!(svg instanceof SVGSVGElement)) return;

  const [yMin, yMax] = cfg.y;
  const [rangeLow, rangeHigh] = cfg.range;
  const domainEnd = cfg.a[cfg.a.length - 1][0];

  const xScale = (minute: number) => CHART_LEFT + (minute / domainEnd) * (CHART_RIGHT - CHART_LEFT);
  const yScale = (value: number) =>
    CHART_BOTTOM - ((value - yMin) / (yMax - yMin)) * (CHART_BOTTOM - CHART_TOP);

  const curveA = monotoneCubic(cfg.a);
  const curveB = monotoneCubic(cfg.b);

  function el<K extends keyof SVGElementTagNameMap>(
    tag: K,
    attrs: Record<string, string | number>,
    parent: Element = svg as Element
  ): SVGElementTagNameMap[K] {
    const node = document.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    parent.appendChild(node);
    return node;
  }

  function pathFor(values: number[]): string {
    return values
      .map((value, minute) => `${minute ? 'L' : 'M'}${xScale(minute).toFixed(1)} ${yScale(value).toFixed(1)}`)
      .join('');
  }

  const defs = el('defs', {});
  const aboveClip = el('clipPath', { id: `${idPrefix}-above` }, defs);
  el('rect', { x: CHART_LEFT, y: 0, width: CHART_RIGHT - CHART_LEFT, height: yScale(rangeHigh) }, aboveClip);
  const belowClip = el('clipPath', { id: `${idPrefix}-below` }, defs);
  el(
    'rect',
    {
      x: CHART_LEFT,
      y: yScale(rangeHigh),
      width: CHART_RIGHT - CHART_LEFT,
      height: CHART_BOTTOM - yScale(rangeHigh) + 4,
    },
    belowClip
  );

  el('rect', {
    x: CHART_LEFT,
    y: yScale(rangeHigh),
    width: CHART_RIGHT - CHART_LEFT,
    height: yScale(rangeLow) - yScale(rangeHigh),
    fill: cfg.colors.range,
    'fill-opacity': '0.09',
  });

  cfg.grid.forEach((value) => {
    el('line', {
      x1: CHART_LEFT,
      x2: CHART_RIGHT,
      y1: yScale(value),
      y2: yScale(value),
      stroke: cfg.colors.grid,
      'stroke-width': 1,
    });
  });

  [rangeLow, rangeHigh].forEach((value) => {
    el('line', {
      x1: CHART_LEFT,
      x2: CHART_RIGHT,
      y1: yScale(value),
      y2: yScale(value),
      stroke: cfg.colors.range,
      'stroke-width': 1,
      'stroke-opacity': '0.55',
    });
  });

  cfg.labels.forEach((value) => {
    const label = el('text', { x: CHART_LEFT - 8, y: yScale(value) + 4, 'text-anchor': 'end' });
    label.textContent = String(value).replace('.', ',');
  });

  const unitLabel = el('text', { x: CHART_RIGHT, y: CHART_TOP + 10, 'text-anchor': 'end' });
  unitLabel.textContent = 'mmol/L';

  [0, 60, 120, 180, 240].forEach((minute) => {
    el('line', {
      x1: xScale(minute),
      x2: xScale(minute),
      y1: CHART_BOTTOM,
      y2: CHART_BOTTOM + 5,
      stroke: cfg.colors.muted,
      'stroke-width': 1,
    });
    const tick = el('text', {
      x: xScale(minute),
      y: CHART_BOTTOM + 20,
      'text-anchor': minute === 0 ? 'start' : minute === domainEnd ? 'end' : 'middle',
    });
    tick.textContent = formatTime(minute);
  });

  el('line', {
    x1: CHART_LEFT,
    x2: CHART_RIGHT,
    y1: CHART_BOTTOM,
    y2: CHART_BOTTOM,
    stroke: cfg.colors.muted,
    'stroke-width': 1,
  });

  const breakfastX = xScale(BREAKFAST_MINUTE);
  el('line', {
    x1: breakfastX,
    x2: breakfastX,
    y1: CHART_TOP + 18,
    y2: CHART_BOTTOM,
    stroke: cfg.colors.muted,
    'stroke-width': 1,
    'stroke-dasharray': '2 4',
  });
  const breakfastLabel = el('text', { x: breakfastX + 6, y: CHART_TOP + 30 });
  breakfastLabel.setAttribute('style', `fill:${cfg.colors.muted}`);

  el('path', {
    d: pathFor(curveA),
    fill: 'none',
    stroke: cfg.colors.range,
    'stroke-width': 2.25,
    'stroke-linejoin': 'round',
  });
  el('path', {
    d: pathFor(curveB),
    fill: 'none',
    stroke: cfg.colors.ink,
    'stroke-width': 2.25,
    'stroke-linejoin': 'round',
    'clip-path': `url(#${idPrefix}-below)`,
  });
  el('path', {
    d: pathFor(curveB),
    fill: 'none',
    stroke: cfg.colors.high,
    'stroke-width': 2.75,
    'stroke-linejoin': 'round',
    'clip-path': `url(#${idPrefix}-above)`,
  });

  const cursor = el('line', {
    y1: CHART_TOP,
    y2: CHART_BOTTOM,
    stroke: cfg.colors.muted,
    'stroke-width': 1,
    'stroke-opacity': '0.35',
  });
  const dotA = el('circle', { r: 4.5, fill: '#fff', stroke: cfg.colors.range, 'stroke-width': 2 });
  const dotB = el('circle', { r: 4.5, fill: '#fff', stroke: cfg.colors.ink, 'stroke-width': 2 });
  const hit = el('rect', {
    x: CHART_LEFT,
    y: CHART_TOP,
    width: CHART_RIGHT - CHART_LEFT,
    height: CHART_BOTTOM - CHART_TOP,
    fill: 'transparent',
  });

  const timeEl = document.getElementById(`${idPrefix}-t`);
  const valueAEl = document.getElementById(`${idPrefix}-va`);
  const valueBEl = document.getElementById(`${idPrefix}-vb`);
  const tirEl = document.getElementById(`${idPrefix}-tir`);

  let currentMinute = POINTER_START_MINUTE;

  function renderBreakfastLabel(): void {
    const lang = currentLang();
    breakfastLabel.textContent = `${BREAKFAST_LABEL[lang] ?? BREAKFAST_LABEL.lv} ${formatTime(BREAKFAST_MINUTE)}`;
  }

  function renderTimeInRange(): void {
    if (!tirEl) return;
    const overMinutesB = curveB.filter((value) => value > rangeHigh).length;
    tirEl.textContent = formatTimeInRangeSentence(overMinutesB, rangeHigh, currentLang());
  }

  function set(minute: number): void {
    currentMinute = Math.max(0, Math.min(domainEnd, Math.round(minute)));
    const x = xScale(currentMinute);
    const valueA = curveA[currentMinute];
    const valueB = curveB[currentMinute];
    cursor.setAttribute('x1', String(x));
    cursor.setAttribute('x2', String(x));
    dotA.setAttribute('cx', String(x));
    dotA.setAttribute('cy', String(yScale(valueA)));
    dotB.setAttribute('cx', String(x));
    dotB.setAttribute('cy', String(yScale(valueB)));
    dotB.setAttribute('stroke', valueB > rangeHigh ? cfg.colors.high : cfg.colors.ink);

    const lang = currentLang();
    if (timeEl) timeEl.textContent = formatTime(currentMinute);
    if (valueAEl) valueAEl.textContent = formatMmol(valueA, lang);
    if (valueBEl) valueBEl.textContent = formatMmol(valueB, lang);
  }

  function minutesFromPointer(event: PointerEvent): number {
    const bounds = svg.getBoundingClientRect();
    const scaledX = ((event.clientX - bounds.left) / bounds.width) * VIEWBOX_WIDTH;
    return ((scaledX - CHART_LEFT) / (CHART_RIGHT - CHART_LEFT)) * domainEnd;
  }

  hit.addEventListener('pointermove', (event) => set(minutesFromPointer(event)));
  hit.addEventListener('pointerdown', (event) => set(minutesFromPointer(event)));
  svg.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      set(currentMinute + ARROW_KEY_STEP_MINUTES);
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      set(currentMinute - ARROW_KEY_STEP_MINUTES);
      event.preventDefault();
    }
  });

  renderBreakfastLabel();
  set(POINTER_START_MINUTE);
  renderTimeInRange();

  // The readout and figcaption re-render on a language switch (main.js's
  // updateLanguage only touches [data-i18n] elements, never these computed ones).
  const langObserver = new MutationObserver(() => {
    renderBreakfastLabel();
    set(currentMinute);
    renderTimeInRange();
  });
  langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}
