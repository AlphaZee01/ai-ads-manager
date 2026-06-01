"use client";

import { cn } from "@/lib/utils";

type ChatBubbleProps = {
  role: "user" | "assistant";
  content: string;
  onUseCampaign?: (json: string) => void;
};

function extractCampaignBlock(text: string): { before: string; json: string; after: string } | null {
  const match = text.match(/```campaign\n([\s\S]*?)\n```/);
  if (!match) return null;
  const idx = text.indexOf(match[0]);
  return {
    before: text.slice(0, idx),
    json: match[1],
    after: text.slice(idx + match[0].length),
  };
}

export function ChatBubble({ role, content, onUseCampaign }: ChatBubbleProps) {
  const isUser = role === "user";
  const block = !isUser ? extractCampaignBlock(content) : null;

  if (block && onUseCampaign) {
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(block.json);
    } catch {
      // ignore
    }

    return (
      <div className="flex flex-col gap-1 items-start">
        {block.before && (
          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[80%] whitespace-pre-wrap">
            {block.before.trim()}
          </div>
        )}
        {parsed && (
          <div className="bg-white border border-blue-200 rounded-xl p-4 max-w-[80%] w-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Campaign Ready</span>
            </div>
            <div className="space-y-1 text-xs text-gray-700 mb-3">
              <p><span className="font-medium">Objective:</span> {String(parsed.objective)}</p>
              <p><span className="font-medium">Daily Budget:</span> GHS {String(parsed.budget_daily)}</p>
              <p><span className="font-medium">Headline:</span> {String(parsed.headline)}</p>
            </div>
            <button
              onClick={() => onUseCampaign(block.json)}
              className="w-full bg-blue-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Campaign →
            </button>
          </div>
        )}
        {block.after && (
          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[80%] whitespace-pre-wrap">
            {block.after.trim()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-sm max-w-[80%] whitespace-pre-wrap",
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-800 rounded-tl-sm"
        )}
      >
        {content}
      </div>
    </div>
  );
}
