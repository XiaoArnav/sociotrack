"use client";

import React, { useState } from "react";
import {
  Download,
  Calendar,
  X,
  Check,
  TrendingUp,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import { CreatorProfile, DEFAULT_CREATOR } from "./InsTrackCreatorCard";

interface HistoricalRow {
  date: string;
  followers: number;
  followersDelta: number;
  following: number;
  followingDelta: number;
  mediaCount: number;
  engagementRate: number;
  engagementDelta: number;
}

const HISTORICAL_DATA: HistoricalRow[] = [
  {
    date: "Mar 29 2022",
    followers: 176668,
    followersDelta: 121,
    following: 336,
    followingDelta: 3,
    mediaCount: 361,
    engagementRate: 1.08,
    engagementDelta: -0.07,
  },
  {
    date: "Mar 28 2022",
    followers: 176547,
    followersDelta: 188,
    following: 333,
    followingDelta: 2,
    mediaCount: 360,
    engagementRate: 1.15,
    engagementDelta: 0.04,
  },
  {
    date: "Mar 27 2022",
    followers: 176359,
    followersDelta: 261,
    following: 331,
    followingDelta: 4,
    mediaCount: 359,
    engagementRate: 1.11,
    engagementDelta: 0.02,
  },
  {
    date: "Mar 26 2022",
    followers: 176098,
    followersDelta: 221,
    following: 327,
    followingDelta: -1,
    mediaCount: 358,
    engagementRate: 1.09,
    engagementDelta: 0.05,
  },
  {
    date: "Mar 25 2022",
    followers: 175877,
    followersDelta: 162,
    following: 328,
    followingDelta: 1,
    mediaCount: 357,
    engagementRate: 1.04,
    engagementDelta: -0.02,
  },
  {
    date: "Mar 24 2022",
    followers: 175715,
    followersDelta: 140,
    following: 327,
    followingDelta: 3,
    mediaCount: 356,
    engagementRate: 1.06,
    engagementDelta: 0.01,
  },
  {
    date: "Mar 23 2022",
    followers: 175575,
    followersDelta: 216,
    following: 324,
    followingDelta: 5,
    mediaCount: 355,
    engagementRate: 1.05,
    engagementDelta: 0.03,
  },
];

interface InsTrackHistoricalTableProps {
  creator?: CreatorProfile;
}

export function InsTrackHistoricalTable({ creator = DEFAULT_CREATOR }: InsTrackHistoricalTableProps = {}) {
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Scale data dynamically if creator changes
  const scaleF = creator.followers / 173435;
  const scaleFol = creator.following / 584;
  const scaleM = creator.posts / 353;

  const displayData = HISTORICAL_DATA.map((r) => ({
    ...r,
    followers: Math.round(r.followers * scaleF),
    followersDelta: Math.round(r.followersDelta * scaleF) || 1,
    following: Math.round(r.following * scaleFol),
    mediaCount: Math.round(r.mediaCount * scaleM),
  }));

  // Trigger Client-Side CSV Download
  const handleDownloadCsv = () => {
    const headers = "Date,Followers,FollowersDelta,Following,FollowingDelta,MediaCount,EngagementRate,EngagementDelta\n";
    const rows = displayData.map(
      (r) =>
        `"${r.date}",${r.followers},${r.followersDelta},${r.following},${r.followingDelta},${r.mediaCount},${r.engagementRate}%,${r.engagementDelta}%`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${creator.handle}_historical_stats.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Historical Stats Table Card */}
      <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm relative">
        {/* Table Header Controls matching Screenshot 7 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243048] gap-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Historical Stats
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Sample Historical Telemetry (Archived Benchmark Dataset)
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#6366F1]">
            <button
              onClick={handleDownloadCsv}
              title="Download CSV"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E2638] transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPdfModal(true)}
              title="View PDF Report"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E2638] transition-colors"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#243048] text-[10px] font-semibold uppercase text-slate-400">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Followers Count</th>
                <th className="py-3 px-3">Following Count</th>
                <th className="py-3 px-3">Media Count</th>
                <th className="py-3 px-3">Engagement Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#243048] font-mono">
              {displayData.map((row) => (
                <tr
                  key={row.date}
                  className="hover:bg-slate-50/70 dark:hover:bg-[#1E2638]/50 transition-colors text-slate-700 dark:text-slate-300"
                >
                  {/* Date */}
                  <td className="py-3.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                    {row.date}
                  </td>

                  {/* Followers + Green Delta Pill */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{row.followers.toLocaleString()}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#D1FAE5] dark:bg-[#064E3B]/80 text-[#059669] dark:text-[#34D399]">
                        +{row.followersDelta}
                      </span>
                    </div>
                  </td>

                  {/* Following + Delta Pill */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2">
                      <span>{row.following}</span>
                      {row.followingDelta !== 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            row.followingDelta > 0
                              ? "bg-[#D1FAE5] dark:bg-[#064E3B]/80 text-[#059669] dark:text-[#34D399]"
                              : "bg-[#FFE4E6] dark:bg-[#881337]/80 text-[#E11D48] dark:text-[#FB7185]"
                          }`}
                        >
                          {row.followingDelta > 0 ? `+${row.followingDelta}` : row.followingDelta}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Media Count */}
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                    {row.mediaCount}
                  </td>

                  {/* Engagement Rate */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{row.engagementRate.toFixed(2)}%</span>
                      {row.engagementDelta !== 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            row.engagementDelta > 0
                              ? "bg-[#D1FAE5] dark:bg-[#064E3B]/80 text-[#059669] dark:text-[#34D399]"
                              : "bg-[#FFE4E6] dark:bg-[#881337]/80 text-[#E11D48] dark:text-[#FB7185]"
                          }`}
                        >
                          {row.engagementDelta > 0 ? `+${row.engagementDelta.toFixed(2)}` : row.engagementDelta.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating CSV & PDF Graphic Presentation Section (Matching Screenshot 7 & 8) */}
      <div className="pt-2 flex flex-col md:flex-row items-center justify-center gap-8 py-4">
        {/* Big Green CSV File Graphic */}
        <div
          onClick={handleDownloadCsv}
          className="cursor-pointer group flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#243048] hover:border-emerald-500 shadow-md transition-all hover:scale-105"
        >
          <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-5 h-5 bg-emerald-700/60 rounded-bl" />
            <FileSpreadsheet className="w-6 h-6 mb-1" />
            <span className="text-[11px] font-black tracking-wider">CSV</span>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500">
            Export .CSV Stats
          </span>
        </div>

        {/* Big Red PDF File Graphic */}
        <div
          onClick={() => setShowPdfModal(true)}
          className="cursor-pointer group flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#243048] hover:border-rose-500 shadow-md transition-all hover:scale-105"
        >
          <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex flex-col items-center justify-center text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-5 h-5 bg-rose-700/60 rounded-bl" />
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-[11px] font-black tracking-wider">PDF</span>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-rose-500">
            White-Label PDF Report
          </span>
        </div>
      </div>

      {/* PDF Report Modal Preview (Matching Screenshot 7) */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#243048] bg-slate-50 dark:bg-[#1E2638]">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  White-label PDF Report Preview
                </h4>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Sheet */}
            <div className="p-8 space-y-6 bg-white dark:bg-[#0B0F19] text-xs">
              <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    SocioTrack Instagram Report
                  </h3>
                  <p className="text-slate-500">Account: @{creator.handle}</p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>Last 30 Days Telemetry</span>
                  <div className="font-mono text-[10px] text-indigo-500">Page 1 of 4</div>
                </div>
              </div>

              {/* 4 Key PDF Stats */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 dark:bg-[#161F30] p-3 rounded-lg border border-slate-200 dark:border-[#243048]">
                  <div className="text-[10px] text-slate-400">Followers</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{creator.followers.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-500 font-bold">{creator.followersDelta}</div>
                </div>
                <div className="bg-slate-50 dark:bg-[#161F30] p-3 rounded-lg border border-slate-200 dark:border-[#243048]">
                  <div className="text-[10px] text-slate-400">Following</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{creator.following.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{creator.followingDelta}</div>
                </div>
                <div className="bg-slate-50 dark:bg-[#161F30] p-3 rounded-lg border border-slate-200 dark:border-[#243048]">
                  <div className="text-[10px] text-slate-400">Posts</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{creator.posts.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-500 font-bold">{creator.postsDelta}</div>
                </div>
                <div className="bg-slate-50 dark:bg-[#161F30] p-3 rounded-lg border border-slate-200 dark:border-[#243048]">
                  <div className="text-[10px] text-slate-400">SocioTrack Score</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{creator.score}%</div>
                  <div className="text-[10px] text-emerald-500 font-bold">Grade A+</div>
                </div>
              </div>

              {/* Simulated blue chart */}
              <div className="bg-slate-50 dark:bg-[#161F30] p-4 rounded-xl border border-slate-200 dark:border-[#243048] space-y-2">
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  Followers Growth Curve
                </div>
                <div className="h-32 w-full flex items-end justify-between gap-1 pt-4">
                  {[35, 42, 48, 55, 63, 72, 80, 89, 95, 100].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-[#0284C7] rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center italic">
                Official Report powered by SocioTrack Autonomous Analytics Engine
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-[#243048] flex justify-end space-x-3 bg-slate-50 dark:bg-[#1E2638]">
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
