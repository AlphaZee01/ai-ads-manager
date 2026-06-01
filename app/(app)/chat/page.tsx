"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatBubble } from "@/components/chat-bubble";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Greet on mount
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm AdBot. I'll help you create a high-performing Meta ad campaign.\n\nTo get started — what's the main goal of your campaign? For example:\n• Get more WhatsApp orders\n• Drive foot traffic to your shop\n• Promote a new product or service",
      },
    ]);
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: newMessages.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
      }),
    });

    if (!res.body) {
      setStreaming(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: accumulated };
        return updated;
      });
    }

    setStreaming(false);
  }

  async function handleUseCampaign(json: string) {
    setSaving(true);
    try {
      const campaign = JSON.parse(json);
      const name = `Campaign - ${new Date().toLocaleDateString("en-GH", { day: "numeric", month: "short" })}`;

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          objective: campaign.objective,
          audience_age_min: campaign.audience?.age_min ?? 18,
          audience_age_max: campaign.audience?.age_max ?? 45,
          audience_genders: campaign.audience?.genders ?? ["all"],
          audience_interests: campaign.audience?.interests ?? [],
          audience_locations: campaign.audience?.locations ?? [],
          budget_daily: campaign.budget_daily ?? 20,
          placements: campaign.placements ?? [],
          headline: campaign.headline ?? "",
          primary_text: campaign.primary_text ?? "",
          cta: campaign.cta ?? "LEARN_MORE",
        }),
      });

      const data = await res.json();
      if (res.ok && data.campaign?.id) {
        router.push(`/campaigns/${data.campaign.id}`);
      } else {
        alert(data.error ?? "Failed to save campaign");
      }
    } catch {
      alert("Failed to parse campaign");
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">AI Campaign Creator</h1>
        <p className="text-xs text-gray-500">Powered by Gemini</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <ChatBubble
            key={i}
            role={m.role}
            content={m.content}
            onUseCampaign={m.role === "assistant" ? handleUseCampaign : undefined}
          />
        ))}
        {streaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex items-center gap-1 text-gray-400">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        {saving && (
          <p className="text-xs text-blue-600 text-center mb-2">Saving campaign...</p>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Tell me about your business or goal..."
            disabled={streaming}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
