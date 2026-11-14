"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Download,
  Calendar,
  X,
  Check,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Clock,
  ChevronDown,
  RefreshCw,
  Info,
} from "lucide-react";

import { CreatorProfile, DEFAULT_CREATOR } from "./InsTrackCreatorCard";
import {
  getUserTimezone,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  getDateRangeBounds,
  getTimezoneAbbreviation,
} from "@/lib/dateUtils";
import { getProfileSnapshots } from "@/utils/supabase/snapshots";

export interface HistoricalObservation {
  id: string;
  date: string; // ISO string instant
  followers: number;
  followers_delta: number | null;
  following: number;
  following_delta: number | null;
  media_count: number;
  media_delta: number | null;
  engagement_rate: number | null;
  engagement_delta: number | null;
  source?: string;
}

interface InsTrackHistoricalTableProps {
  creator?: CreatorProfile;
}

const DATE_RANGE_PRESETS = [
  "All Time",
  "Last 30 Days",
  "Last 7 Days",
  "Today",
  "Last 90 Days",
] as const;

type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number];

export function InsTrackHistoricalTable({
  creator = DEFAULT_CREATOR,
}: InsTrackHistoricalTableProps = {}) {
  const [historyRows, setHistoryRows] = useState<HistoricalObservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastCollectedAt, setLastCollectedAt] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<DateRangePreset>("All Time");
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [userTz, setUserTz] = useState<string>("UTC");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Synchronize active timezone
  useEffect(() => {
    setUserTz(getUserTimezone());
    const handleTzChange = () => setUserTz(getUserTimezone());
    window.addEventListener("sociotrack_timezone_change", handleTzChange);
    return () => window.removeEventListener("sociotrack_timezone_change", handleTzChange);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRangeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch real observation history for the selected creator
  const fetchCreatorHistory = async () => {
    const clean = creator.handle.toLowerCase().replace(/^@/, "").trim();
    if (!clean) return;

    setIsLoading(true);
    setFetchError(null);

    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      (isHttps ? "https://sociotrack-api.onrender.com" : "http://localhost:8000");

    try {
      const res = await fetch(`${apiBase}/api/creators/${encodeURIComponent(clean)}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryRows(data.history || []);
        setLastCollectedAt(data.last_collected_at || null);
        return;
      }
      throw new Error(`API returned ${res.status}`);
    } catch {
      // Fallback: check Supabase / local profile snapshots if direct FastAPI call fails
      try {
        const localSnaps = await getProfileSnapshots(clean);
        if (localSnaps && localSnaps.length > 0) {
          // Sort chronological to calculate consecutive deltas
          const sorted = [...localSnaps].sort(
            (a, b) =>
              new Date(a.demographics?.recorded_at || a.created_at || 0).getTime() -
              new Date(b.demographics?.recorded_at || b.created_at || 0).getTime()
          );

          const computed: HistoricalObservation[] = sorted.map((curr, idx) => {
            const dateStr = curr.demographics?.recorded_at || curr.created_at || new Date().toISOString();
            if (idx === 0) {
              return {
                id: curr.id || `snap_${idx}`,
                date: dateStr,
                followers: curr.followers,
                followers_delta: null,
                following: curr.following,
                following_delta: null,
                media_count: curr.posts,
                media_delta: null,
                engagement_rate: curr.engagement_rate || null,
                engagement_delta: null,
                source: curr.demographics?.source || "meta_opengraph_verified",
              };
            }
            const prev = sorted[idx - 1];
            return {
              id: curr.id || `snap_${idx}`,
              date: dateStr,
              followers: curr.followers,
              followers_delta: curr.followers - prev.followers,
              following: curr.following,
              following_delta: curr.following - prev.following,
              media_count: curr.posts,
              media_delta: curr.posts - prev.posts,
              engagement_rate: curr.engagement_rate || null,
              engagement_delta:
                curr.engagement_rate && prev.engagement_rate
                  ? Number((curr.engagement_rate - prev.engagement_rate).toFixed(2))
                  : null,
              source: curr.demographics?.source || "meta_opengraph_verified",
            };
          });

          const descRows = [...computed].reverse();
          setHistoryRows(descRows);
          setLastCollectedAt(descRows[0]?.date || null);
          return;
        }
      } catch {}

      // If no history exists and creator has live fetched metrics, provide the initial observation row
      const creatorMeta = creator as CreatorProfile & { lastFetchedAt?: string | number };
      if (creatorMeta.lastFetchedAt && creator.followers > 0) {
        const obsDate =
          typeof creatorMeta.lastFetchedAt === "number"
            ? new Date(
                creatorMeta.lastFetchedAt < 1e11
                  ? creatorMeta.lastFetchedAt * 1000
                  : creatorMeta.lastFetchedAt
              ).toISOString()
            : String(creatorMeta.lastFetchedAt);

        setHistoryRows([
          {
            id: "live_observation",
            date: obsDate,
            followers: creator.followers,
            followers_delta: null,
            following: creator.following,
            following_delta: null,
            media_count: creator.posts,
            media_delta: null,
            engagement_rate: null,
            engagement_delta: null,
            source: creator.dataSource || "meta_opengraph_verified",
          },
        ]);
        setLastCollectedAt(obsDate);
      } else {
        setHistoryRows([]);
        setLastCollectedAt(null);
      }

      if ((creator as any).lastFetchFailed) {
        setFetchError("Refresh failed to connect to live provider.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatorHistory();
  }, [creator.handle, (creator as any).lastFetchedAt]);

  // Filter rows using the app's timezone behavior and calendar bounds
  const filteredRows = useMemo(() => {
    if (selectedRange === "All Time") {
      return historyRows;
    }

    const { startIso, endIso } = getDateRangeBounds(selectedRange, userTz);
    if (!startIso) return historyRows;

    const startTs = new Date(startIso).getTime();
    const endTs = new Date(endIso).getTime();

    return historyRows.filter((row) => {
      const rowTs = new Date(row.date).getTime();
      return rowTs >= startTs && rowTs <= endTs;
    });
  }, [historyRows, selectedRange, userTz]);

  // Summary figures for the filtered dataset
  const summaryStats = useMemo(() => {
    if (filteredRows.length === 0) return null;
    const latest = filteredRows[0];
    const oldest = filteredRows[filteredRows.length - 1];

    const netFollowerChange =
      filteredRows.length > 1 ? latest.followers - oldest.followers : latest.followers_delta ?? 0;

    const netFollowingChange =
      filteredRows.length > 1 ? latest.following - oldest.following : latest.following_delta ?? 0;

    const netMediaChange =
      filteredRows.length > 1 ? latest.media_count - oldest.media_count : latest.media_delta ?? 0;

    return {
      latestFollowers: latest.followers,
      netFollowerChange,
      latestFollowing: latest.following,
      netFollowingChange,
      latestMedia: latest.media_count,
      netMediaChange,
    };
  }, [filteredRows]);

  // Export CSV using the exact filtered dataset
  const handleDownloadCsv = () => {
    if (filteredRows.length === 0) {
      setExportNotice(
        `No verified historical records available to export for @${creator.handle} in ${selectedRange}.`
      );
      setTimeout(() => setExportNotice(null), 4000);
      return;
    }

    const cleanHandle = creator.handle.toLowerCase().replace(/^@/, "").trim();
    const rangeSlug = selectedRange.toLowerCase().replace(/\s+/g, "_");
    const filename = `${cleanHandle}_historical_stats_${rangeSlug}.csv`;

    const metaComments = [
      `# SocioTrack Verified Historical Stats Report`,
      `# Creator: @${cleanHandle}`,
      `# Date Range: ${selectedRange}`,
      `# Applicable Timezone: ${userTz} (${getTimezoneAbbreviation(new Date(), userTz)})`,
      `# Exported At: ${new Date().toISOString()}`,
      `# Total Records: ${filteredRows.length}`,
      ``,
    ].join("\n");

    const headers =
      "Date,Observation Time (UTC),Followers,Followers Delta,Following,FollowingDelta,Media Count,Media Delta,Engagement Rate,Engagement Delta (pp),Source\n";

    const rows = filteredRows
      .map((r) => {
        const dateStr = formatDate(
          r.date,
          { month: "short", day: "numeric", year: "numeric" },
          userTz
        );
        const folDelta =
          r.followers_delta !== null
            ? r.followers_delta > 0
              ? `+${r.followers_delta}`
              : `${r.followers_delta}`
            : "—";

        const focDelta =
          r.following_delta !== null
            ? r.following_delta > 0
              ? `+${r.following_delta}`
              : `${r.following_delta}`
            : "—";

        const medDelta =
          r.media_delta !== null
            ? r.media_delta > 0
              ? `+${r.media_delta}`
              : `${r.media_delta}`
            : "—";

        const engRate = r.engagement_rate !== null ? `${r.engagement_rate.toFixed(2)}%` : "—";
        const engDelta =
          r.engagement_delta !== null
            ? `${r.engagement_delta > 0 ? `+${r.engagement_delta.toFixed(2)}` : r.engagement_delta.toFixed(2)} pp`
            : "—";

        return `"${dateStr}","${r.date}",${r.followers},${folDelta},${r.following},${focDelta},${r.media_count},${medDelta},${engRate},${engDelta},"${r.source || "meta_opengraph_verified"}"`;
      })
      .join("\n");

    const blob = new Blob([metaComments + headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenPdf = () => {
    setShowPdfModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Historical Stats Table Card */}
      <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm relative">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243048] gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Historical Stats
              </h3>

              {historyRows.length > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="w-3 h-3 mr-1" /> Verified Telemetry Ledger
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                  <Clock className="w-3 h-3 mr-1" /> Awaiting Live Telemetry
                </span>
              )}
            </div>

            {/* Last Collected / Error Status Subtext */}
            <div className="flex flex-wrap items-center text-[11px] text-slate-500 dark:text-slate-400 gap-2 font-mono">
              {lastCollectedAt && (
                <span>
                  Last collected:{" "}
                  <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                    {formatRelativeTime(lastCollectedAt, new Date(), userTz)}
                  </strong>{" "}
                  ({formatTime(lastCollectedAt, userTz)})
                </span>
              )}

              {(creator as any).lastFetchFailed && (
                <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-medium">
                  <AlertCircle className="w-3 h-3 mr-1 text-amber-500" />
                  Refresh failed — displaying last verified records
                </span>
              )}
            </div>
          </div>

          {/* Action Controls: Calendar Date Range Dropdown, CSV, PDF */}
          <div className="flex items-center space-x-2 text-[#6366F1]">
            {/* Calendar Range Filter Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#1E2638] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors"
                title="Filter by Date Range"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{selectedRange}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRangeDropdown && (
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#243048] rounded-xl shadow-xl z-20 py-1 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-[#243048]">
                    Filter Telemetry ({getTimezoneAbbreviation(new Date(), userTz)})
                  </div>
                  {DATE_RANGE_PRESETS.map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setSelectedRange(range);
                        setShowRangeDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#1E2638] transition-colors ${
                        selectedRange === range
                          ? "font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{range}</span>
                      {selectedRange === range && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Header CSV Button */}
            <button
              onClick={handleDownloadCsv}
              title={`Download CSV (${selectedRange})`}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E2638] transition-colors text-slate-600 dark:text-slate-300 hover:text-emerald-600"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Header PDF Button */}
            <button
              onClick={handleOpenPdf}
              title="View White-Label PDF Report"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E2638] transition-colors text-slate-600 dark:text-slate-300 hover:text-rose-600"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Temporary Export Notification Toast */}
        {exportNotice && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center space-x-2 animate-fade-in">
            <Info className="w-4 h-4 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Ledger Table */}
        <div className="overflow-x-auto mt-2">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs">Loading verified creator ledger...</span>
            </div>
          ) : filteredRows.length === 0 ? (
            /* Clear Empty State */
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-[#1E2638] flex items-center justify-center text-slate-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  No verified observation history yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {historyRows.length === 0
                    ? `Real telemetry is recorded automatically upon each live lookup and scheduled sync for @${creator.handle}. Subsequent observations will calculate consecutive follower, following, and post deltas.`
                    : `No observations found within ${selectedRange} for @${creator.handle}. Try selecting "All Time".`}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#243048] text-[10px] font-semibold uppercase text-slate-400">
                  <th className="py-3 px-3">Date & Time ({getTimezoneAbbreviation(new Date(), userTz)})</th>
                  <th className="py-3 px-3">Followers Count</th>
                  <th className="py-3 px-3">Following Count</th>
                  <th className="py-3 px-3">Media Count</th>
                  <th className="py-3 px-3">Engagement Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#243048] font-mono">
                {filteredRows.map((row) => {
                  const formattedDate = formatDate(
                    row.date,
                    { month: "short", day: "numeric", year: "numeric" },
                    userTz
                  );
                  const formattedTimeStr = formatTime(row.date, userTz);

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#1E2638]/50 transition-colors text-slate-700 dark:text-slate-300"
                    >
                      {/* Date & Observation Time */}
                      <td className="py-3.5 px-3 font-sans">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {formattedDate}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formattedTimeStr}
                        </div>
                      </td>

                      {/* Followers + Consecutive Delta */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">
                            {row.followers.toLocaleString()}
                          </span>

                          {row.followers_delta === null ? (
                            <span className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              —
                            </span>
                          ) : row.followers_delta === 0 ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              0
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                row.followers_delta > 0
                                  ? "bg-[#D1FAE5] dark:bg-[#064E3B]/80 text-[#059669] dark:text-[#34D399]"
                                  : "bg-[#FFE4E6] dark:bg-[#881337]/80 text-[#E11D48] dark:text-[#FB7185]"
                              }`}
                            >
                              {row.followers_delta > 0
                                ? `+${row.followers_delta.toLocaleString()}`
                                : row.followers_delta.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Following + Consecutive Delta */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-2">
                          <span>{row.following.toLocaleString()}</span>

                          {row.following_delta === null ? (
                            <span className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              —
                            </span>
                          ) : row.following_delta === 0 ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              0
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                row.following_delta > 0
                                  ? "bg-[#D1FAE5] dark:bg-[#064E3B]/80 text-[#059669] dark:text-[#34D399]"
                                  : "bg-[#FFE4E6] dark:bg-[#881337]/80 text-[#E11D48] dark:text-[#FB7185]"
                              }`}
                            >
                              {row.following_delta > 0
                                ? `+${row.following_delta.toLocaleString()}`
                                : row.following_delta.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Media Count + Consecutive Delta */}
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center space-x-2">
                          <span>{row.media_count.toLocaleString()}</span>

                          {row.media_delta === null ? (
                            <span className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              —
                            </span>
                          ) : row.media_delta === 0 ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              0
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                row.media_delta > 0
                                  ? "bg-[#D1FAE5] dark:bg-[#064E3B]/80 text-[#059669] dark:text-[#34D399]"
                                  : "bg-[#FFE4E6] dark:bg-[#881337]/80 text-[#E11D48] dark:text-[#FB7185]"
                              }`}
                            >
                              {row.media_delta > 0
                                ? `+${row.media_delta.toLocaleString()}`
                                : row.media_delta.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Engagement Rate (with percentage point deltas) */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">
                            {row.engagement_rate !== null
                              ? `${row.engagement_rate.toFixed(2)}%`
                              : "—"}
                          </span>

                          {row.engagement_delta !== null && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                row.engagement_delta > 0
                                  ? "bg-[#D1FAE5] dark:bg-[#064E3B]/80 text-[#059669] dark:text-[#34D399]"
                                  : row.engagement_delta < 0
                                  ? "bg-[#FFE4E6] dark:bg-[#881337]/80 text-[#E11D48] dark:text-[#FB7185]"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              {row.engagement_delta > 0
                                ? `+${row.engagement_delta.toFixed(2)} pp`
                                : `${row.engagement_delta.toFixed(2)} pp`}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
          <span className="text-[10px] text-slate-400">
            {filteredRows.length > 0
              ? `${filteredRows.length} record${filteredRows.length === 1 ? "" : "s"} (${selectedRange})`
              : "No records to export"}
          </span>
        </div>

        {/* Big Red PDF File Graphic */}
        <div
          onClick={handleOpenPdf}
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
          <span className="text-[10px] text-slate-400">
            Preview & Print ({selectedRange})
          </span>
        </div>
      </div>

      {/* PDF Report Modal Preview */}
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
            <div className="p-8 space-y-6 bg-white dark:bg-[#0B0F19] text-xs max-h-[75vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    SocioTrack Instagram Performance Report
                  </h3>
                  <p className="text-slate-500">
                    Account: <strong className="text-slate-800 dark:text-slate-200">@{creator.handle}</strong>
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-400 space-y-0.5">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Range: {selectedRange}
                  </div>
                  <div className="font-mono text-[10px] text-indigo-500">
                    Timezone: {userTz} ({getTimezoneAbbreviation(new Date(), userTz)})
                  </div>
                </div>
              </div>

              {filteredRows.length === 0 ? (
                /* Empty Report Explanation */
                <div className="py-8 text-center space-y-2">
                  <p className="text-slate-600 dark:text-slate-300 font-semibold">
                    No verified observation history available to report for @{creator.handle}.
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Live telemetry will automatically populate this report upon initial and subsequent profile observations.
                  </p>
                </div>
              ) : (
                <>
                  {/* Key Stats Grid matching exact filtered figures */}
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-50 dark:bg-[#161F30] p-3 rounded-lg border border-slate-200 dark:border-[#243048]">
                      <div className="text-[10px] text-slate-400">Followers</div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {summaryStats?.latestFollowers.toLocaleString()}
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          (summaryStats?.netFollowerChange ?? 0) >= 0
                            ? "text-emerald-500"
                            : "text-rose-500"
                        }`}
                      >
                        {(summaryStats?.netFollowerChange ?? 0) >= 0
                          ? `+${summaryStats?.netFollowerChange.toLocaleString()}`
                          : summaryStats?.netFollowerChange.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#161F30] p-3 rounded-lg border border-slate-200 dark:border-[#243048]">
                      <div className="text-[10px] text-slate-400">Following</div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {summaryStats?.latestFollowing.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {(summaryStats?.netFollowingChange ?? 0) >= 0
                          ? `+${summaryStats?.netFollowingChange.toLocaleString()}`
                          : summaryStats?.netFollowingChange.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#161F30] p-3 rounded-lg border border-slate-200 dark:border-[#243048]">
                      <div className="text-[10px] text-slate-400">Posts</div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {summaryStats?.latestMedia.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-500 font-bold">
                        {(summaryStats?.netMediaChange ?? 0) >= 0
                          ? `+${summaryStats?.netMediaChange.toLocaleString()}`
                          : summaryStats?.netMediaChange.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#161F30] p-3 rounded-lg border border-slate-200 dark:border-[#243048]">
                      <div className="text-[10px] text-slate-400">SocioTrack Score</div>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        {creator.score}%
                      </div>
                      <div className="text-[10px] text-emerald-500 font-bold">
                        Grade {creator.score >= 90 ? "A+" : creator.score >= 80 ? "A" : "B"}
                      </div>
                    </div>
                  </div>

                  {/* Historical Table in PDF */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Observation Ledger ({filteredRows.length} entries)
                    </div>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 dark:bg-[#1E2638] text-[10px] uppercase text-slate-400">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Time</th>
                            <th className="py-2 px-3">Followers</th>
                            <th className="py-2 px-3">Delta</th>
                            <th className="py-2 px-3">Following</th>
                            <th className="py-2 px-3">Posts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {filteredRows.slice(0, 10).map((r) => (
                            <tr key={r.id}>
                              <td className="py-1.5 px-3 font-sans font-medium">
                                {formatDate(r.date, { month: "short", day: "numeric", year: "numeric" }, userTz)}
                              </td>
                              <td className="py-1.5 px-3 text-slate-400">
                                {formatTime(r.date, userTz)}
                              </td>
                              <td className="py-1.5 px-3 font-bold">
                                {r.followers.toLocaleString()}
                              </td>
                              <td className="py-1.5 px-3">
                                {r.followers_delta !== null ? (
                                  r.followers_delta >= 0 ? `+${r.followers_delta}` : `${r.followers_delta}`
                                ) : "—"}
                              </td>
                              <td className="py-1.5 px-3">
                                {r.following.toLocaleString()}
                              </td>
                              <td className="py-1.5 px-3">
                                {r.media_count.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              <div className="text-[10px] text-slate-400 text-center italic pt-2">
                Official Report powered by SocioTrack Autonomous Analytics Engine • {formatDateTime(new Date(), userTz)}
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
                disabled={filteredRows.length === 0}
                onClick={() => window.print()}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  filteredRows.length === 0
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
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
