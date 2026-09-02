import { useChatStore } from "@/lib/chat/store";
import { Button } from "@/components/ui/button";

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  const suggestions = useChatStore((s) => s.suggestions);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 pb-8">
      <div className="anim-fade max-w-xl text-center">
        <p className="mb-3 text-[11px] tracking-[0.28em] text-accent uppercase">
          Real-time relativistic companion
        </p>
        <h1 className="font-display text-5xl text-fg italic tracking-tight sm:text-6xl">
          Nexvon
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted">
          Ask anything. The Schwarzschild field stays behind the glass.
        </p>
      </div>
      <div className="mt-10 flex max-w-xl flex-wrap justify-center gap-2">
        {suggestions.map((s, i) => (
          <Button
            key={s}
            variant="chip"
            className="anim-chip max-w-full"
            style={{ animationDelay: `${120 + i * 70}ms` }}
            onClick={() => onPick(s)}
          >
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}
