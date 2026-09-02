import { cn } from "@/lib/utils";

function inline(text: string, keyBase: string) {
  const parts: (string | { t: "code" | "strong"; v: string })[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("`")) parts.push({ t: "code", v: token.slice(1, -1) });
    else parts.push({ t: "strong", v: token.slice(2, -2) });
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) => {
    const key = `${keyBase}-${i}`;
    if (typeof p === "string") return <span key={key}>{p}</span>;
    if (p.t === "code") {
      return (
        <code
          key={key}
          className="rounded-xs bg-fg/8 px-1.5 py-0.5 font-mono text-[0.85em] text-accent"
        >
          {p.v}
        </code>
      );
    }
    return (
      <strong key={key} className="font-medium text-fg">
        {p.v}
      </strong>
    );
  });
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = text.split(/```/);
  return (
    <div className={cn("space-y-3 text-pretty leading-relaxed", className)}>
      {blocks.map((block, i) => {
        if (i % 2 === 1) {
          const nl = block.indexOf("\n");
          const code = nl === -1 ? block : block.slice(nl + 1);
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-md bg-elevated/80 p-3 font-mono text-sm text-fg"
            >
              <code>{code.replace(/\n$/, "")}</code>
            </pre>
          );
        }
        return block.split("\n").map((line, j) => {
          if (!line.trim()) return <div key={`${i}-${j}`} className="h-2" />;
          const isBullet = /^[-*]\s+/.test(line);
          const isNum = /^\d+\.\s+/.test(line);
          const content = isBullet ? line.replace(/^[-*]\s+/, "") : isNum ? line.replace(/^\d+\.\s+/, "") : line;
          return (
            <p key={`${i}-${j}`} className={cn((isBullet || isNum) && "pl-4")}>
              {isBullet ? <span className="mr-2 text-faint">·</span> : null}
              {inline(content, `${i}-${j}`)}
            </p>
          );
        });
      })}
    </div>
  );
}
