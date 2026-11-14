"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, Sparkles } from "lucide-react";

interface InsTrackGrowthChartsProps {
  creator?: {
    handle?: string;
    name?: string;
    followers?: number;
    following?: number;
  };
  followers?: number;
  following?: number;
}

type ChartMode = "target" | "following" | "daily";

export function InsTrackGrowthCharts({
  creator,
  followers: propFollowers,
  following: propFollowing,
}: InsTrackGrowthChartsProps = {}) {
  const currentFollowers = creator?.followers ?? propFollowers ?? 34820;
  const currentFollowing = creator?.following ?? propFollowing ?? 418;
  const handle = creator?.handle || "creator";

  const [activeMode, setActiveMode] = useState<ChartMode>("target");
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(3);

  // 7-day checkpoints
  const sevenDayDates = useMemo(
    () => ["06 Mar", "07 Mar", "08 Mar", "09 Mar", "10 Mar", "11 Mar", "12 Mar"],
    []
  );

  // 10 Checkpoints for 30-Day Daily view
  const dailyDates = useMemo(
    () => ["13 Feb", "16 Feb", "19 Feb", "22 Feb", "25 Feb", "28 Feb", "03 Mar", "06 Mar", "09 Mar", "12 Mar"],
    []
  );

  // 11 Months matching 90-day / macro timeline
  const months = useMemo(
    () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
    []
  );

  const activeDates = useMemo(() => {
    if (timeframe === "7d") return sevenDayDates;
    if (timeframe === "30d") return dailyDates;
    return months;
  }, [timeframe, sevenDayDates, dailyDates, months]);

  // Generate realistic data points based on current scale and timeframe
  const { curveTop, curveBottom, labelTop, labelBottom, maxVal } = useMemo(() => {
    if (activeMode === "following") {
      // Comparison: Followers (Purple Solid) vs Following (Green Dashed)
      const max = Math.max(currentFollowers, currentFollowing) * 1.15;
      const bottomMultipliers = [0.45, 0.50, 0.48, 0.55, 0.52, 0.64, 0.70, 0.78, 0.85, 0.95, 1.0];
      const topMultipliers = [0.85, 0.87, 0.89, 0.90, 0.92, 0.93, 0.95, 0.96, 0.98, 0.99, 1.0];

      const bottom = bottomMultipliers.map((m) => Math.max(1, Math.round(currentFollowers * m)));
      const top = topMultipliers.map((m) => Math.max(1, Math.round(currentFollowing * m)));

      return {
        curveTop: top,
        curveBottom: bottom,
        labelTop: "following",
        labelBottom: "followers",
        maxVal: max,
      };
    }

    if (timeframe === "7d") {
      // 7 Days view
      const targetMax = Math.round(currentFollowers * 1.03);
      const bottom = [0.975, 0.98, 0.983, 0.989, 0.992, 0.996, 1.0].map((m) =>
        Math.max(1, Math.round(currentFollowers * m))
      );
      const top = [0.985, 0.992, 1.0, 1.008, 1.015, 1.022, 1.03].map((m) =>
        Math.max(bottom[bottom.length - 1] + 1, Math.round(targetMax * m))
      );
      const max = Math.max(...top) * 1.08;
      return {
        curveTop: top,
        curveBottom: bottom,
        labelTop: "target",
        labelBottom: "followers",
        maxVal: max,
      };
    } else if (timeframe === "30d") {
      // 30-Day Daily view
      const targetMax = Math.round(currentFollowers * 1.08);
      const bottom = [0.92, 0.93, 0.94, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1.0].map((m) =>
        Math.max(1, Math.round(currentFollowers * m))
      );
      const top = [0.98, 0.99, 1.0, 1.01, 1.02, 1.04, 1.05, 1.06, 1.07, 1.08].map((m) =>
        Math.max(bottom[bottom.length - 1] + 1, Math.round(targetMax * m))
      );
      const max = Math.max(...top) * 1.1;
      return {
        curveTop: top,
        curveBottom: bottom,
        labelTop: "target",
        labelBottom: "followers",
        maxVal: max,
      };
    } else {
      // 90-Day / Long-term macro view
      const targetMax = Math.max(
        currentFollowers < 50 ? currentFollowers + 8 : Math.round(currentFollowers * 1.32),
        10
      );
      const bottomMultipliers = [0.42, 0.48, 0.46, 0.55, 0.51, 0.62, 0.68, 0.76, 0.84, 0.94, 1.0];
      const topMultipliers = [0.60, 0.60, 0.68, 0.78, 0.88, 0.95, 0.96, 0.96, 1.0, 1.0, 1.0];

      const bottom = bottomMultipliers.map((m) => Math.max(1, Math.round(currentFollowers * m)));
      const top = topMultipliers.map((m) => Math.max(bottom[bottom.length - 1] + 1, Math.round(targetMax * m)));

      const max = Math.max(...top, ...bottom) * 1.15;
      return {
        curveTop: top,
        curveBottom: bottom,
        labelTop: "target",
        labelBottom: "followers",
        maxVal: max,
      };
    }
  }, [activeMode, timeframe, currentFollowers, currentFollowing]);

  // Format axis and tooltip numbers cleanly without 0.0k bugs
  const formatChartValue = (val: number): string => {
    if (val === 0) return "0";
    if (val >= 1_000_000) {
      const v = (val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1);
      return `${v}M`;
    }
    if (val >= 10_000) {
      const v = (val / 1_000).toFixed(val % 1_000 === 0 ? 0 : 1);
      return `${v}k`;
    }
    if (val >= 1_000) {
      return `${(val / 1_000).toFixed(1)}k`;
    }
    return Math.round(val).toLocaleString();
  };

  const formatTooltipValue = (val: number): string => {
    return Math.round(val).toLocaleString();
  };

  // SVG Dimension Constants matching the wide aspect ratio from the video
  const svgWidth = 860;
  const svgHeight = 260;
  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // 5 Y-Axis Tick Levels
  const yTicks = useMemo(() => {
    return [
      { ratio: 1.0, val: maxVal },
      { ratio: 0.75, val: maxVal * 0.75 },
      { ratio: 0.5, val: maxVal * 0.5 },
      { ratio: 0.25, val: maxVal * 0.25 },
      { ratio: 0.0, val: 0 },
    ];
  }, [maxVal]);

  // Compute (x, y) coordinates for Curve 1 (Top / Green)
  const pointsTop = useMemo(() => {
    const len = curveTop.length;
    return curveTop.map((val, i) => {
      const x = paddingLeft + (i / (len - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (val / (maxVal || 1)) * chartHeight;
      return { x, y, val };
    });
  }, [curveTop, maxVal, chartWidth, chartHeight, paddingLeft, paddingTop]);

  // Compute (x, y) coordinates for Curve 2 (Bottom / Purple)
  const pointsBottom = useMemo(() => {
    const len = curveBottom.length;
    return curveBottom.map((val, i) => {
      const x = paddingLeft + (i / (len - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (val / (maxVal || 1)) * chartHeight;
      return { x, y, val };
    });
  }, [curveBottom, maxVal, chartWidth, chartHeight, paddingLeft, paddingTop]);

  // Catmull-Rom to Cubic Bezier path generator for smooth curves
  const getSplinePath = (pts: { x: number; y: number }[]): string => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const pathTop = useMemo(() => getSplinePath(pointsTop), [pointsTop]);
  const pathBottom = useMemo(() => getSplinePath(pointsBottom), [pointsBottom]);

  const baselineY = paddingTop + chartHeight;
  const areaTop = useMemo(() => {
    if (pointsTop.length === 0) return "";
    return `${pathTop} L ${pointsTop[pointsTop.length - 1].x.toFixed(1)} ${baselineY} L ${pointsTop[0].x.toFixed(1)} ${baselineY} Z`;
  }, [pathTop, pointsTop, baselineY]);

  const areaBottom = useMemo(() => {
    if (pointsBottom.length === 0) return "";
    return `${pathBottom} L ${pointsBottom[pointsBottom.length - 1].x.toFixed(1)} ${baselineY} L ${pointsBottom[0].x.toFixed(1)} ${baselineY} Z`;
  }, [pathBottom, pointsBottom, baselineY]);

  // Active hover point index
  const safeHoveredIndex = hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < activeDates.length ? hoveredIndex : null;
  const activePtTop = safeHoveredIndex !== null ? pointsTop[safeHoveredIndex] : null;
  const activePtBottom = safeHoveredIndex !== null ? pointsBottom[safeHoveredIndex] : null;

  // Handle cursor movement across the interactive chart
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratioX = (clientX / rect.width) * svgWidth;

    const relX = Math.max(0, Math.min(chartWidth, ratioX - paddingLeft));
    const closestIdx = Math.round((relX / chartWidth) * (activeDates.length - 1));
    setHoveredIndex(closestIdx);
  };

  return (
    <div className="w-full bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-[#1E293B] rounded-2xl p-5 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] text-slate-900 dark:text-slate-100 select-none transition-colors duration-200">
      {/* Header with full Light/Dark support */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Aggregate creator trajectory vs authorized growth benchmark</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Audience Growth Trajectory
            {handle !== "creator" && (
              <span className="text-indigo-600 dark:text-indigo-400 ml-2 font-mono text-base font-normal">
                @{handle}
              </span>
            )}
          </h3>
        </div>

        {/* Badges + Mode Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Green Legend Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-[#10B981]/10 border border-emerald-200 dark:border-[#10B981]/30 text-xs font-mono font-bold text-emerald-700 dark:text-[#34D399] transition-colors">
            <span className="w-2 h-2 rounded-full border-2 border-emerald-500 dark:border-[#10B981] bg-white dark:bg-white inline-block" />
            <span className="capitalize">{labelTop}</span>
            <span className="text-slate-500 dark:text-slate-400 font-normal">
              ({formatChartValue(curveTop[curveTop.length - 1])})
            </span>
          </div>

          {/* Purple Legend Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-[#8B5CF6]/10 border border-purple-200 dark:border-[#8B5CF6]/30 text-xs font-mono font-bold text-purple-700 dark:text-[#A78BFA] transition-colors">
            <span className="w-2 h-2 rounded-full border-2 border-purple-500 dark:border-[#8B5CF6] bg-white dark:bg-white inline-block" />
            <span className="capitalize">{labelBottom}</span>
            <span className="text-slate-500 dark:text-slate-400 font-normal">
              ({formatChartValue(curveBottom[curveBottom.length - 1])})
            </span>
          </div>

          {/* Simple Date Filters (7 Days, 30 Days, 90 Days) */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-[#1E293B] p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-colors">
            <button
              type="button"
              onClick={() => {
                setTimeframe("7d");
                if (activeMode === "following") setActiveMode("target");
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                timeframe === "7d" && activeMode !== "following"
                  ? "bg-[#6366F1] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeframe("30d");
                if (activeMode === "following") setActiveMode("target");
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                timeframe === "30d" && activeMode !== "following"
                  ? "bg-[#6366F1] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeframe("90d");
                if (activeMode === "following") setActiveMode("target");
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                timeframe === "90d" && activeMode !== "following"
                  ? "bg-[#6366F1] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              90 Days
            </button>
          </div>

          {/* Target vs Following Mode Pill */}
          <button
            type="button"
            onClick={() => setActiveMode(activeMode === "following" ? "target" : "following")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
              activeMode === "following"
                ? "bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                : "border-slate-200 dark:border-[#243048] bg-white dark:bg-[#161F30] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {activeMode === "following" ? "vs Following (Active)" : "Compare Following"}
          </button>
        </div>
      </div>

      {/* SVG Canvas Container with exact Video Tooltip & Crosshair */}
      <div className="relative pt-6 overflow-hidden">
        {/* Floating Tooltip Card matching the video */}
        {safeHoveredIndex !== null && activePtTop && activePtBottom && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-100 ease-out"
            style={{
              left:
                safeHoveredIndex <= Math.floor(activeDates.length / 2)
                  ? `${((activePtTop.x + 18) / svgWidth) * 100}%`
                  : undefined,
              right:
                safeHoveredIndex > Math.floor(activeDates.length / 2)
                  ? `${((svgWidth - activePtTop.x + 18) / svgWidth) * 100}%`
                  : undefined,
              top: "22%",
            }}
          >
            <div className="bg-white/95 dark:bg-[#0B0F19]/95 border border-slate-200 dark:border-slate-700/80 shadow-[0_12px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-xl p-3.5 min-w-[145px] space-y-1.5 animate-fade-in transition-colors">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wide border-b border-slate-100 dark:border-slate-800 pb-1">
                {activeDates[safeHoveredIndex]}
              </div>
              <div className="flex items-center justify-between space-x-3 text-xs font-mono font-semibold text-emerald-600 dark:text-[#34D399]">
                <span className="capitalize">{labelTop} :</span>
                <span>{formatTooltipValue(activePtTop.val)}</span>
              </div>
              <div className="flex items-center justify-between space-x-3 text-xs font-mono font-semibold text-purple-600 dark:text-[#A78BFA]">
                <span className="capitalize">{labelBottom} :</span>
                <span>{formatTooltipValue(activePtBottom.val)}</span>
              </div>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 sm:h-72 overflow-visible cursor-crosshair"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(3)} // Return to Apr on leave
        >
          <defs>
            {/* Green Area Gradient */}
            <linearGradient id="budgetGreenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
            </linearGradient>

            {/* Purple Area Gradient */}
            <linearGradient id="spendPurpleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines at each tick */}
          {yTicks.map((t, idx) => {
            const y = paddingTop + chartHeight - t.ratio * chartHeight;
            return (
              <g key={idx}>
                {/* Horizontal dotted grid line */}
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-[#1E293B]"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                {/* Y-Axis Label on left */}
                <text
                  x={paddingLeft - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] font-mono fill-slate-500 dark:fill-slate-400 select-none transition-colors"
                >
                  {formatChartValue(t.val)}
                </text>
              </g>
            );
          })}

          {/* Solid Left Y-Axis Line */}
          <line
            x1={paddingLeft}
            y1={paddingTop - 5}
            x2={paddingLeft}
            y2={baselineY}
            className="stroke-slate-300 dark:stroke-[#475569]"
            strokeWidth="1.5"
          />

          {/* Solid Bottom X-Axis Line */}
          <line
            x1={paddingLeft}
            y1={baselineY}
            x2={svgWidth - paddingRight}
            y2={baselineY}
            className="stroke-slate-300 dark:stroke-[#475569]"
            strokeWidth="1.5"
          />

          {/* Area Fill 1: Green Gradient (Target) */}
          <path d={areaTop} fill="url(#budgetGreenGradient)" />

          {/* Area Fill 2: Purple Gradient (Actual Followers) */}
          <path d={areaBottom} fill="url(#spendPurpleGradient)" />

          {/* Curve 1: Dotted Green Line (Target/Budget) */}
          <path
            d={pathTop}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.2"
            strokeDasharray="5 5"
            strokeLinecap="round"
          />

          {/* Curve 2: Solid Purple Line (Spend/Followers) */}
          <path
            d={pathBottom}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="3.0"
            strokeLinecap="round"
          />

          {/* Interactive Vertical Tracking Line (Follows Mouse Cursor) */}
          {activePtTop && (
            <line
              x1={activePtTop.x}
              y1={paddingTop - 5}
              x2={activePtTop.x}
              y2={baselineY}
              className="stroke-slate-600 dark:stroke-white"
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
          )}

          {/* Intersection Marker on Green Dotted Line */}
          {activePtTop && (
            <g>
              <circle
                cx={activePtTop.x}
                cy={activePtTop.y}
                r="6.5"
                fill="#10B981"
                className="stroke-white dark:stroke-[#0B0F19]"
                strokeWidth="2.5"
              />
              <circle cx={activePtTop.x} cy={activePtTop.y} r="2.5" fill="#FFFFFF" />
            </g>
          )}

          {/* Intersection Marker on Purple Solid Line */}
          {activePtBottom && (
            <g>
              <circle
                cx={activePtBottom.x}
                cy={activePtBottom.y}
                r="6.5"
                fill="#8B5CF6"
                className="stroke-white dark:stroke-[#0B0F19]"
                strokeWidth="2.5"
              />
              <circle cx={activePtBottom.x} cy={activePtBottom.y} r="2.5" fill="#FFFFFF" />
            </g>
          )}

          {/* X-Axis Month / Date Labels along bottom */}
          {activeDates.map((date, idx) => {
            const x = paddingLeft + (idx / (activeDates.length - 1)) * chartWidth;
            const isHovered = safeHoveredIndex === idx;
            return (
              <text
                key={date}
                x={x}
                y={baselineY + 22}
                textAnchor="middle"
                className={`text-[11px] font-mono select-none transition-colors ${
                  isHovered
                    ? "fill-slate-900 dark:fill-white font-bold"
                    : "fill-slate-500 dark:fill-slate-400"
                }`}
              >
                {date}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Footer Benchmark Insights Banner */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span>
            Pacing at <strong className="text-slate-900 dark:text-white">+8.4%</strong> above average niche retention rate over 11 months.
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
          Source: Meta Graph API Telemetry • Auto-calibrated daily
        </div>
      </div>
    </div>
  );
}
