export type StreamHandlers = {
  onDelta: (text: string) => void;
  signal?: AbortSignal;
};

export async function streamChat(
  messages: { role: "user" | "assistant"; content: string }[],
  handlers: StreamHandlers,
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal: handlers.signal,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  if (!res.body) throw new Error("No response stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as { text?: string; error?: string };
        if (json.error) throw new Error(json.error);
        if (json.text) handlers.onDelta(json.text);
      } catch (err) {
        if (err instanceof Error && err.message !== "Unexpected end of JSON input") {
          if ((err as SyntaxError).name === "SyntaxError") continue;
          throw err;
        }
      }
    }
  }
}
