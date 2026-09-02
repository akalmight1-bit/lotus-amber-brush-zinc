import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";
import { Logo } from "./logo";

function Typing() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1" aria-label="Nexvon is writing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-accent"
          style={{ animation: "typingBounce 1.1s ease-in-out infinite", animationDelay: `${i * 0.14}s` }}
        />
      ))}
    </div>
  );
}

export function MessageList({
  messages,
  streaming,
}: {
  messages: ChatMessage[];
  streaming: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6">
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const isLast = i === messages.length - 1;
          const showTyping = streaming && isLast && !isUser && !m.content;
          return (
            <article
              key={m.id}
              className={cn("anim-msg flex gap-3", isUser ? "justify-end" : "justify-start")}
            >
              {!isUser ? (
                <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-glass-strong text-accent">
                  <Logo className="size-4" />
                </div>
              ) : null}
              <div
                className={cn(
                  "max-w-[min(100%,40rem)] rounded-lg px-4 py-3 text-sm",
                  isUser
                    ? "rounded-br-xs bg-fg text-bg"
                    : "nx-glass-strong rounded-bl-xs text-fg",
                )}
              >
                {showTyping ? (
                  <Typing />
                ) : isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                ) : (
                  <Markdown text={m.content} />
                )}
              </div>
            </article>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
