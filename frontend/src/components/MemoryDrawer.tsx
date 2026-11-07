"use client";

import React from "react";
import { Database, TrendingUp, Lightbulb, Compass, Award, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MockMemoryInsights } from "@/mocks/mockData";
import { formatNumber } from "@/lib/utils";

export interface MemoryDrawerProps {
  memoryData: MockMemoryInsights | null;
  onSelectTopic?: (topic: string) => void;
}

export function MemoryDrawer({ memoryData, onSelectTopic }: MemoryDrawerProps) {
  if (!memoryData) {
    return (
      <div className="w-80 shrink-0 p-4 rounded-xl border border-gray-800 bg-[#161f30] text-center text-xs text-gray-400">
        Loading memory insights...
      </div>
    );
  }

  const { current_sentiment, top_winning_posts, learned_lessons } = memoryData;

  return (
    <div className="w-80 lg:w-96 shrink-0 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Learned Brand Memory</h2>
        </div>
        <Badge variant="purple">Vector Store</Badge>
      </div>

      {/* 1. Live Audience Sentiment Signal */}
      <Card className="border-purple-900/40 bg-[#171b30]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Audience Sentiment Signal</span>
            </span>
            <Badge variant="warning">
              Score: {(current_sentiment.sentiment_score * 100).toFixed(0)}%
            </Badge>
          </div>
          <CardTitle className="text-xs font-bold text-white capitalize mt-1">
            {current_sentiment.sentiment_label.replace(/_/g, " ")}
          </CardTitle>
          <CardDescription className="text-[11px] text-gray-300">
            {current_sentiment.summary}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {current_sentiment.keywords.map((kw, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-gray-900/80 text-gray-300 border border-gray-800"
              >
                #{kw}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. Top Past Winning Posts (Retrieved Styles) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Top Winning Styles (Top 5)</span>
            </CardTitle>
            <span className="text-[10px] text-gray-400">
              {top_winning_posts.length} indexed
            </span>
          </div>
          <CardDescription className="text-[11px]">
            Posts driving highest composite engagement rates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {top_winning_posts.map((post, idx) => (
            <div
              key={post.id || idx}
              className="p-2.5 rounded-lg bg-gray-900/70 border border-gray-800/80 space-y-1.5 text-xs hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-blue-300 font-semibold truncate max-w-[170px]">
                  {post.topic}
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                  ★ {post.composite_score.toFixed(1)}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 line-clamp-2 italic">
                "{post.hook}"
              </p>
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800/50">
                <span>{formatNumber(post.impressions)} views</span>
                <span className="text-purple-300">{post.shares} shares</span>
                <span className="text-blue-300">{post.replies} replies</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 3. Learned Strategic Lessons (Score > 5.0) */}
      <Card className="border-emerald-900/30 bg-[#14222a]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <span>Learned Strategic Lessons</span>
            </CardTitle>
            <Badge variant="success">Score &gt; 5.0</Badge>
          </div>
          <CardDescription className="text-[11px] text-gray-300">
            Vectorized rules distilled automatically from high-engagement outcomes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {learned_lessons.map((lesson, idx) => (
            <div
              key={lesson.id || idx}
              className="p-2 rounded bg-gray-950/70 border border-emerald-900/40 text-[11px] text-gray-200 leading-snug space-y-1"
            >
              <div className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold">
                <span>Lesson #{idx + 1}</span>
                <span className="font-mono">Score {lesson.composite_score.toFixed(1)}</span>
              </div>
              <p className="text-gray-300">{lesson.key_lesson}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
