"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Sparkles, Trophy, Share2, ThumbsUp, MessageSquare, AlertCircle, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { MockPostVariation, MockSelectedPost } from "@/mocks/mockData";
import { formatScheduledTime } from "@/lib/dateUtils";

export interface DraftQueueProps {
  drafts: MockPostVariation[];
  selectedPost: MockSelectedPost | null;
  onApprove: (postContent: string, format: string) => Promise<void>;
  onSelectForSimulation: (postContent: string) => void;
  isGenerating?: boolean;
}

export function DraftQueue({
  drafts,
  selectedPost,
  onApprove,
  onSelectForSimulation,
  isGenerating,
}: DraftQueueProps) {
  const [approvingPostId, setApprovingPostId] = useState<string | null>(null);
  const [approvedPostId, setApprovedPostId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ format: string; text: string; score: number } | null>(null);

  const handleApproveClick = async (draft: MockPostVariation) => {
    setApprovingPostId(draft.id);
    await onApprove(draft.full_text, draft.format);
    setApprovingPostId(null);
    setApprovedPostId(draft.id);
  };

  const openPreview = (draft: MockPostVariation, score: number) => {
    setModalData({ format: draft.format, text: draft.full_text, score });
    setModalOpen(true);
  };

  return (
    <div className="flex-1 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Generated Post Variations</span>
            <Badge variant="purple">3 Formats</Badge>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Synthesized from brand guidelines and retrieved memory patterns.
          </p>
        </div>
        {selectedPost && (
          <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg text-xs text-emerald-300">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Winner Selected:</span>
            <span>{selectedPost.draft.format.split(":")[1]?.trim()}</span>
            <span className="font-bold text-emerald-400">({selectedPost.match_score}/10)</span>
          </div>
        )}
      </div>

      {/* Selected Winner Banner */}
      {selectedPost && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Brand Voice Critique Winner: {selectedPost.draft.format}
              </h3>
              <Badge variant="success">Match Score: {selectedPost.match_score}/10</Badge>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-blue-300">
              <Clock className="w-3.5 h-3.5" />
              <span suppressHydrationWarning>{formatScheduledTime(selectedPost.scheduled_time)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed italic">
            "{selectedPost.evaluation_summary}"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="bg-gray-900/60 rounded p-2 border border-gray-800">
              <span className="font-semibold text-emerald-400 block mb-1">Brand Dos Matched:</span>
              <ul className="space-y-0.5 text-gray-300">
                {selectedPost.dos_matched.slice(0, 3).map((d, i) => (
                  <li key={i} className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-900/60 rounded p-2 border border-gray-800">
              <span className="font-semibold text-blue-400 block mb-1">Constraints Respected:</span>
              <ul className="space-y-0.5 text-gray-300">
                {selectedPost.donts_avoided.slice(0, 2).map((d, i) => (
                  <li key={i} className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cards Queue */}
      <div className="space-y-4">
        {drafts.map((draft, idx) => {
          const isWinner = selectedPost?.draft.format === draft.format;
          const isApproved = approvedPostId === draft.id;
          const score = draft.match_score || (isWinner ? selectedPost?.match_score : 9.0);

          return (
            <Card
              key={draft.id || idx}
              className={`transition-all duration-200 ${
                isWinner
                  ? "border-blue-500/50 bg-[#162137] shadow-lg shadow-blue-900/10"
                  : "hover:border-gray-700"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        draft.format.includes("Data-first")
                          ? "default"
                          : draft.format.includes("Hot take")
                          ? "warning"
                          : "purple"
                      }
                    >
                      {draft.format}
                    </Badge>
                    {isWinner && (
                      <span className="text-[11px] font-semibold text-amber-400 flex items-center space-x-1">
                        <Trophy className="w-3 h-3" />
                        <span>Best Match</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Score: {score}/10
                    </span>
                  </div>
                </div>
                <CardTitle className="text-sm font-semibold text-blue-200 mt-2">
                  Hook: "{draft.hook}"
                </CardTitle>
                <CardDescription className="text-gray-400 text-xs mt-1">
                  Rationale: {draft.rationale}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="rounded-lg bg-gray-950/60 p-3.5 border border-gray-800/80 font-sans text-xs text-gray-200 leading-relaxed whitespace-pre-line">
                  {draft.full_text}
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between pt-3">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPreview(draft, score as number)}
                  >
                    View Full Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectForSimulation(draft.full_text)}
                    className="text-xs text-purple-300 border-purple-800/50 hover:bg-purple-950/30"
                  >
                    Load into Simulator
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant={isApproved ? "success" : isWinner ? "default" : "secondary"}
                  disabled={approvingPostId === draft.id || isApproved}
                  onClick={() => handleApproveClick(draft)}
                  className="flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isApproved
                      ? "Approved & Scheduled"
                      : approvingPostId === draft.id
                      ? "Scheduling..."
                      : "Approve Post"}
                  </span>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData?.format || "Post Preview"}
        description={`Match Score: ${modalData?.score}/10`}
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-950 p-4 border border-gray-800 text-xs text-gray-200 whitespace-pre-line leading-relaxed font-sans max-h-96 overflow-y-auto">
            {modalData?.text}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (modalData) onSelectForSimulation(modalData.text);
                setModalOpen(false);
              }}
            >
              Test with Simulator
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
