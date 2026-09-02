import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `You are Nexvon, a precise cinematic AI assistant. Speak clearly, with warmth but without fluff or emoji. Help with anything — code, writing, reasoning, science, decisions. You may occasionally draw on gravity, light, and time as metaphors, but never force the black-hole theme. Structure answers with markdown when it helps. Be concise unless the user asks for depth.`;

type Incoming = {
  messages?: { role?: string; content?: string }[];
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "Nexvon is offline in this environment." },
            { status: 503 },
          );
        }

        let body: Incoming;
        try {
          body = (await request.json()) as Incoming;
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const raw = Array.isArray(body.messages) ? body.messages : [];
        const messages = raw
          .filter(
            (m) =>
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim().length > 0,
          )
          .slice(-32)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: String(m.content).slice(0, 8000),
          }));

        if (messages.length === 0 || messages.at(-1)?.role !== "user") {
          return Response.json({ error: "Send a message first." }, { status: 400 });
        }

        const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            stream: true,
            max_tokens: 2048,
            temperature: 0.7,
            messages: [{ role: "system", content: SYSTEM }, ...messages],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const status = upstream.status;
          let error = `Upstream error ${status}`;
          try {
            const j = (await upstream.json()) as { error?: { message?: string } };
            if (j.error?.message) error = j.error.message;
          } catch {
            /* ignore */
          }
          return Response.json({ error }, { status: status === 401 ? 503 : 502 });
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const reader = upstream.body.getReader();

        const stream = new ReadableStream({
          async start(controller) {
            let buffer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const payload = trimmed.slice(5).trim();
                  if (!payload || payload === "[DONE]") continue;
                  try {
                    const json = JSON.parse(payload) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const text = json.choices?.[0]?.delta?.content ?? "";
                    if (text) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
                      );
                    }
                  } catch {
                    /* skip malformed chunk */
                  }
                }
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (err) {
              const message = err instanceof Error ? err.message : "Stream failed";
              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
                );
                controller.close();
              } catch {
                /* already closed */
              }
            }
          },
          cancel() {
            reader.cancel().catch(() => undefined);
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
