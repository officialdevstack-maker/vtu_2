import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SimpleChartPoint = {
  label: string;
  [key: string]: string | number;
};

export type SimpleChartSeries = {
  key: string;
  label: string;
  color: string;
  fill?: boolean;
};

type SimpleChartProps = {
  data: SimpleChartPoint[];
  series: SimpleChartSeries[];
  valueFormatter?: (value: number) => string;
  height?: number;
  showLegend?: boolean;
  ariaLabel: string;
};

const DEFAULT_WIDTH = 720;
const PADDING = { top: 14, right: 12, bottom: 30, left: 60 };
const GRID_LINES = 4;

const compactNumber = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

type PlotPoint = { x: number; y: number };

const smoothPath = (points: PlotPoint[]): string => {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.slice(0, -1).reduce((path, point, index) => {
    const previous = points[index - 1] ?? point;
    const next = points[index + 1];
    const following = points[index + 2] ?? next;
    const controlOneX = point.x + (next.x - previous.x) / 6;
    const controlOneY = point.y + (next.y - previous.y) / 6;
    const controlTwoX = next.x - (following.x - point.x) / 6;
    const controlTwoY = next.y - (following.y - point.y) / 6;

    return `${path} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${next.x} ${next.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
};

export default function SimpleChart({
  data,
  series,
  valueFormatter = compactNumber,
  height = 200,
  showLegend = false,
  ariaLabel,
}: SimpleChartProps) {
  const rawId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const gradientId = `chart-gradient-${rawId.replace(/:/g, "")}`;
  const chartHeight = height - (showLegend ? 24 : 0);
  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = chartHeight - PADDING.top - PADDING.bottom;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const updateWidth = () => {
      const nextWidth = Math.round(container.getBoundingClientRect().width);
      if (nextWidth > 0) setWidth(nextWidth);
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const { maxValue, paths, labelIndexes } = useMemo(() => {
    const values = data.flatMap((point) =>
      series.map((item) => Number(point[item.key] ?? 0)),
    );
    const max = Math.max(1, ...values);
    const roundedMax = Math.ceil(max / GRID_LINES) * GRID_LINES;
    const xAt = (index: number) =>
      PADDING.left +
      (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
    const yAt = (value: number) =>
      PADDING.top + plotHeight - (value / roundedMax) * plotHeight;

    const chartPaths = series.map((item) => {
      const points = data.map((point, index) => ({
        x: xAt(index),
        y: yAt(Number(point[item.key] ?? 0)),
        value: Number(point[item.key] ?? 0),
        label: String(point.label),
      }));
      const line = smoothPath(points);
      const curvedSegments = line.replace(/^M [^C]+/, "");
      return {
        ...item,
        points,
        line,
        area:
          points.length > 0
            ? `M ${points[0].x} ${PADDING.top + plotHeight} L ${points[0].x} ${points[0].y} ${curvedSegments} L ${points.at(-1)!.x} ${PADDING.top + plotHeight} Z`
            : "",
      };
    });

    const labelStep = Math.max(1, Math.ceil(data.length / 7));
    const indexes = data
      .map((_, index) => index)
      .filter(
        (index) =>
          index === 0 || index === data.length - 1 || index % labelStep === 0,
      );

    return { maxValue: roundedMax, paths: chartPaths, labelIndexes: indexes };
  }, [data, plotHeight, plotWidth, series]);

  if (data.length === 0) return null;

  return (
    <div ref={containerRef} className="flex h-full w-full min-w-0 flex-col">
      <svg
        viewBox={`0 0 ${width} ${chartHeight}`}
        className="min-h-0 w-full flex-1 overflow-visible"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={series[0]?.color} stopOpacity="0.16" />
            <stop offset="95%" stopColor={series[0]?.color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: GRID_LINES + 1 }, (_, index) => {
          const y = PADDING.top + (index / GRID_LINES) * plotHeight;
          const value = maxValue * (1 - index / GRID_LINES);
          return (
            <g key={index}>
              <line
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text
                x={PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="11"
              >
                {valueFormatter(value)}
              </text>
            </g>
          );
        })}

        {labelIndexes.map((index) => {
          const x =
            PADDING.left +
            (data.length <= 1
              ? plotWidth / 2
              : (index / (data.length - 1)) * plotWidth);
          return (
            <text
              key={`${data[index].label}-${index}`}
              x={x}
              y={chartHeight - 7}
              textAnchor={
                index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"
              }
              fill="#94a3b8"
              fontSize="11"
            >
              {data[index].label}
            </text>
          );
        })}

        {paths.map((path, seriesIndex) => (
          <g key={path.key}>
            {path.fill && path.area && (
              <path d={path.area} fill={`url(#${gradientId})`} />
            )}
            <path
              d={path.line}
              fill="none"
              stroke={path.color}
              strokeWidth="2.25"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {path.points.map((point, index) => (
              <circle
                key={`${path.key}-${index}`}
                cx={point.x}
                cy={point.y}
                r="7"
                fill="transparent"
                tabIndex={0}
                aria-label={`${point.label}, ${path.label}: ${valueFormatter(point.value)}`}
              >
                <title>
                  {point.label}: {path.label} {valueFormatter(point.value)}
                </title>
              </circle>
            ))}
            {seriesIndex === 0 && path.points.length === 1 && (
              <circle
                cx={path.points[0].x}
                cy={path.points[0].y}
                r="3"
                fill={path.color}
              />
            )}
          </g>
        ))}
      </svg>

      {showLegend && (
        <div className="mt-1 flex flex-wrap justify-center gap-4 text-[11px] text-slate-500">
          {series.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1.5">
              <span
                className="h-0.5 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
