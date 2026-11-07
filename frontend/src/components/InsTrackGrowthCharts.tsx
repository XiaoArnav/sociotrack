"use client";

import React, { useState } from "react";
import { Calendar } from "lucide-react";

interface InsTrackGrowthChartsProps {
  followers?: number;
  following?: number;
}

export function InsTrackGrowthCharts({
  followers = 173435,
  following = 584,
}: InsTrackGrowthChartsProps = {}) {
  const [hoveredIndexA, setHoveredIndexA] = useState<number | null>(9);
  const [hoveredIndexB, setHoveredIndexB] = useState<number | null>(9);

  // 10 Date points matching Screenshot 2 & 4
  const dates = [
    "13 Feb",
    "16 Feb",
    "19 Feb",
    "22 Feb",
    "25 Feb",
    "28 Feb",
    "03 Mar",
    "06 Mar",
    "09 Mar",
    "12 Mar",
  ];

  // Scale followers data dynamically based on creator's follower count
  const scaleF = followers / 173435;
  const baseFollowersData = [168.2, 168.4, 168.6, 168.8, 169.5, 170.2, 171.4, 172.2, 172.8, 173.4];
  const followersData = baseFollowersData.map((val) => {
    const scaled = val * scaleF;
    return scaled >= 1000
      ? Number((scaled / 1000).toFixed(2))
      : Number(scaled.toFixed(1));
  });

  const isMillions = followers >= 1000000;
  const unitF = isMillions ? "M" : "k";
  const minF = Math.min(...followersData) * 0.998;
  const maxF = Math.max(...followersData) * 1.002;

  const followersYLabels = [
    `${maxF.toFixed(isMillions ? 2 : 1)}${unitF}`,
    `${((maxF * 5 + minF) / 6).toFixed(isMillions ? 2 : 1)}${unitF}`,
    `${((maxF * 4 + minF * 2) / 6).toFixed(isMillions ? 2 : 1)}${unitF}`,
    `${((maxF * 3 + minF * 3) / 6).toFixed(isMillions ? 2 : 1)}${unitF}`,
    `${((maxF * 2 + minF * 4) / 6).toFixed(isMillions ? 2 : 1)}${unitF}`,
    `${((maxF + minF * 5) / 6).toFixed(isMillions ? 2 : 1)}${unitF}`,
    `${minF.toFixed(isMillions ? 2 : 1)}${unitF}`,
  ];

  // Scale following data dynamically based on creator's following count
  const scaleFol = following / 584;
  const baseFollowingData = [545, 552, 553, 560, 558, 565, 568, 575, 580, 584];
  const followingData = baseFollowingData.map((val) => Math.round(val * scaleFol));
  const minFol = Math.min(...followingData) - 5;
  const maxFol = Math.max(...followingData) + 5;

  const followingYLabels = [
    `${maxFol}`,
    `${Math.round((maxFol * 4 + minFol) / 5)}`,
    `${Math.round((maxFol * 3 + minFol * 2) / 5)}`,
    `${Math.round((maxFol * 2 + minFol * 3) / 5)}`,
    `${Math.round((maxFol + minFol * 4) / 5)}`,
    `${minFol}`,
  ];

  const svgWidth = 480;
  const svgHeight = 160;

  // Compute followers curve points
  const pointsA = followersData.map((val, idx) => {
    const x = (idx / (followersData.length - 1)) * svgWidth;
    const y = svgHeight - ((val - minF) / (maxF - minF)) * (svgHeight - 16) - 8;
    return { x, y, val };
  });

  const pathA = pointsA.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  const areaA = `${pathA} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  // Compute following curve points
  const pointsB = followingData.map((val, idx) => {
    const x = (idx / (followingData.length - 1)) * svgWidth;
    const y = svgHeight - ((val - minFol) / (maxFol - minFol)) * (svgHeight - 16) - 8;
    return { x, y, val };
  });

  const pathB = pointsB.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  const areaB = `${pathB} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Followers Area Chart (Neon Green) */}
      <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm flex flex-col justify-between">
        {/* Header matching Screenshot 2: "Followers" on left, calendar icon on right */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243048]">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Followers
          </h3>
          <button className="text-[#6366F1] hover:opacity-80 transition-opacity">
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        {/* Chart area with Y-axis labels + SVG */}
        <div className="pt-4 flex items-stretch space-x-2">
          {/* Y-Axis scale */}
          <div className="flex flex-col justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 py-1 pr-1 text-right select-none w-10">
            {followersYLabels.map((lbl) => (
              <span key={lbl}>{lbl}</span>
            ))}
          </div>

          {/* SVG Canvas Container */}
          <div className="relative flex-1">
            {/* Tooltip Pill */}
            {hoveredIndexA !== null && (
              <div
                className="absolute z-10 transform -translate-x-1/2 -top-3 pointer-events-none transition-all"
                style={{
                  left: `${(hoveredIndexA / (dates.length - 1)) * 100}%`,
                }}
              >
                <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#243048] rounded-md shadow-md text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>Followers: {followersData[hoveredIndexA]}{unitF}</span>
                </div>
              </div>
            )}

            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-40 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="neonGreenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                const y = (idx / 6) * (svgHeight - 16) + 8;
                return (
                  <line
                    key={idx}
                    x1="0"
                    y1={y}
                    x2={svgWidth}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeOpacity={0.4}
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* Area Fill */}
              <path d={areaA} fill="url(#neonGreenGradient)" />

              {/* Curved Line */}
              <path
                d={pathA}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Vertical Dashed Line on active point */}
              {hoveredIndexA !== null && (
                <line
                  x1={pointsA[hoveredIndexA].x}
                  y1={pointsA[hoveredIndexA].y}
                  x2={pointsA[hoveredIndexA].x}
                  y2={svgHeight}
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Data points */}
              {pointsA.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndexA === idx ? 4.5 : 2.5}
                  className="cursor-pointer transition-all"
                  fill={hoveredIndexA === idx ? "#10B981" : "#FFFFFF"}
                  stroke="#10B981"
                  strokeWidth={hoveredIndexA === idx ? "2.5" : "1.5"}
                  onMouseEnter={() => setHoveredIndexA(idx)}
                />
              ))}
            </svg>

            {/* X-Axis Date Labels Row */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-2">
              {dates.map((date, idx) => {
                const isSelected = hoveredIndexA === idx;
                return (
                  <span
                    key={date}
                    onClick={() => setHoveredIndexA(idx)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "px-1.5 py-0.5 rounded bg-white dark:bg-[#1E2638] border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-white shadow-xs"
                        : "hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {date}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chart 2: Following Area Chart (Cyan) */}
      <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm flex flex-col justify-between">
        {/* Header matching Screenshot 2: "Following" on left, calendar icon on right */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243048]">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Following
          </h3>
          <button className="text-[#6366F1] hover:opacity-80 transition-opacity">
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        {/* Chart area with Y-axis labels + SVG */}
        <div className="pt-4 flex items-stretch space-x-2">
          {/* Y-Axis scale */}
          <div className="flex flex-col justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 py-1 pr-1 text-right select-none w-8">
            {followingYLabels.map((lbl) => (
              <span key={lbl}>{lbl}</span>
            ))}
          </div>

          {/* SVG Canvas Container */}
          <div className="relative flex-1">
            {/* Tooltip Pill */}
            {hoveredIndexB !== null && (
              <div
                className="absolute z-10 transform -translate-x-1/2 -top-3 pointer-events-none transition-all"
                style={{
                  left: `${(hoveredIndexB / (dates.length - 1)) * 100}%`,
                }}
              >
                <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#243048] rounded-md shadow-md text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                  <span>Following: {followingData[hoveredIndexB]}</span>
                </div>
              </div>
            )}

            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-40 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const y = (idx / 5) * (svgHeight - 16) + 8;
                return (
                  <line
                    key={idx}
                    x1="0"
                    y1={y}
                    x2={svgWidth}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeOpacity={0.4}
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* Area Fill */}
              <path d={areaB} fill="url(#cyanGradient)" />

              {/* Curved Line */}
              <path
                d={pathB}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              {pointsB.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndexB === idx ? 4.5 : 2.5}
                  className="cursor-pointer transition-all"
                  fill={hoveredIndexB === idx ? "#06B6D4" : "#FFFFFF"}
                  stroke="#06B6D4"
                  strokeWidth={hoveredIndexB === idx ? "2.5" : "1.5"}
                  onMouseEnter={() => setHoveredIndexB(idx)}
                />
              ))}
            </svg>

            {/* X-Axis Date Labels Row */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-2">
              {dates.map((date, idx) => {
                const isSelected = hoveredIndexB === idx;
                return (
                  <span
                    key={date}
                    onClick={() => setHoveredIndexB(idx)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "px-1.5 py-0.5 rounded bg-white dark:bg-[#1E2638] border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-white shadow-xs"
                        : "hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {date}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
