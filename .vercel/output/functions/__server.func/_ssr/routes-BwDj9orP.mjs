import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Square, c as MessageSquare, i as Sun, l as Menu, o as Plus, r as Trash2, s as Moon, t as X, u as ArrowUp } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BwDj9orP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GargantuaBg() {
	const canvasRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!canvasRef.current) return;
		let disposed = false;
		let engine = null;
		import("./engine-BeTGFpD6.mjs").then(({ GargantuaEngine }) => {
			if (disposed || !canvasRef.current) return;
			engine = new GargantuaEngine(canvasRef.current);
			engine.start();
		}).catch(() => {});
		return () => {
			disposed = true;
			engine?.dispose();
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-0 overflow-hidden bg-void",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "absolute inset-0 block h-full w-full",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bh-scanlines" })]
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid() {
	if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
var styles = {
	primary: "bg-fg text-bg hover:opacity-90 px-4 py-2.5 rounded-md text-sm font-medium",
	ghost: "bg-transparent text-muted hover:text-fg hover:bg-fg/6 px-3 py-2 rounded-md text-sm font-medium",
	icon: "grid size-11 place-items-center rounded-md text-muted hover:text-fg hover:bg-fg/8",
	chip: "rounded-full border border-border bg-glass px-3.5 py-2 text-sm text-fg hover:border-accent/50 hover:text-accent"
};
var Button = (0, import_react.forwardRef)(function Button({ className, variant = "ghost", staticScale, type = "button", ...props }, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		ref,
		type,
		className: cn("inline-flex items-center justify-center gap-2 transition-[transform,background-color,color,opacity,border-color] duration-150 ease-out disabled:pointer-events-none disabled:opacity-40", !staticScale && "active:not-disabled:scale-[0.96]", styles[variant], className),
		...props
	});
});
var SUGGESTIONS = [
	"How does gravitational lensing work?",
	"Help me think through a hard decision",
	"Write a short poem from the photon ring",
	"Explain Schwarzschild spacetime simply"
];
function emptyConversation() {
	return {
		id: uid(),
		title: "New orbit",
		messages: [],
		updatedAt: Date.now()
	};
}
var useChatStore = create()(persist((set, get) => ({
	conversations: [],
	activeId: null,
	sidebarOpen: false,
	theme: "dark",
	streaming: false,
	error: null,
	suggestions: SUGGESTIONS,
	setSidebarOpen: (open) => set({ sidebarOpen: open }),
	toggleTheme: () => set((s) => {
		const theme = s.theme === "dark" ? "light" : "dark";
		if (typeof document !== "undefined") document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
		return { theme };
	}),
	newChat: () => {
		const convo = emptyConversation();
		set((s) => ({
			conversations: [convo, ...s.conversations],
			activeId: convo.id,
			error: null,
			sidebarOpen: false
		}));
	},
	selectChat: (id) => set({
		activeId: id,
		sidebarOpen: false,
		error: null
	}),
	deleteChat: (id) => set((s) => {
		const conversations = s.conversations.filter((c) => c.id !== id);
		return {
			conversations,
			activeId: s.activeId === id ? conversations[0]?.id ?? null : s.activeId
		};
	}),
	active: () => get().conversations.find((c) => c.id === get().activeId),
	pushUser: (content) => {
		const trimmed = content.trim();
		let { conversations, activeId } = get();
		let convo = conversations.find((c) => c.id === activeId);
		if (!convo) {
			convo = emptyConversation();
			conversations = [convo, ...conversations];
			activeId = convo.id;
		}
		const msg = {
			id: uid(),
			role: "user",
			content: trimmed,
			createdAt: Date.now()
		};
		const next = {
			...convo,
			messages: [...convo.messages, msg],
			updatedAt: Date.now()
		};
		set({
			conversations: conversations.map((c) => c.id === next.id ? next : c),
			activeId: next.id,
			error: null
		});
		return {
			conversationId: next.id,
			messages: next.messages
		};
	},
	beginAssistant: (conversationId) => {
		const id = uid();
		set((s) => ({ conversations: s.conversations.map((c) => c.id === conversationId ? {
			...c,
			messages: [...c.messages, {
				id,
				role: "assistant",
				content: "",
				createdAt: Date.now()
			}],
			updatedAt: Date.now()
		} : c) }));
		return id;
	},
	appendAssistant: (conversationId, messageId, chunk) => {
		set((s) => ({ conversations: s.conversations.map((c) => c.id === conversationId ? {
			...c,
			messages: c.messages.map((m) => m.id === messageId ? {
				...m,
				content: m.content + chunk
			} : m),
			updatedAt: Date.now()
		} : c) }));
	},
	setStreaming: (v) => set({ streaming: v }),
	setError: (msg) => set({ error: msg }),
	renameIfNeeded: (conversationId, firstUser) => {
		set((s) => ({ conversations: s.conversations.map((c) => {
			if (c.id !== conversationId) return c;
			if (c.title !== "New orbit") return c;
			const title = firstUser.replace(/\s+/g, " ").slice(0, 42);
			return {
				...c,
				title: title || c.title
			};
		}) }));
	}
}), {
	name: "nexvon.chat.v1",
	partialize: (s) => ({
		conversations: s.conversations,
		activeId: s.activeId,
		theme: s.theme
	}),
	onRehydrateStorage: () => (state) => {
		if (!state) return;
		const theme = state.theme === "light" ? "light" : "dark";
		if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;
	}
}));
async function streamChat(messages, handlers) {
	const res = await fetch("/api/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ messages }),
		signal: handlers.signal
	});
	if (!res.ok) {
		let detail = `Request failed (${res.status})`;
		try {
			const body = await res.json();
			if (body.error) detail = body.error;
		} catch {}
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
				const json = JSON.parse(payload);
				if (json.error) throw new Error(json.error);
				if (json.text) handlers.onDelta(json.text);
			} catch (err) {
				if (err instanceof Error && err.message !== "Unexpected end of JSON input") {
					if (err.name === "SyntaxError") continue;
					throw err;
				}
			}
		}
	}
}
function Logo({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className,
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16",
				cy: "16",
				r: "14.5",
				stroke: "currentColor",
				strokeOpacity: "0.28",
				strokeWidth: "1"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16",
				cy: "16",
				r: "9.5",
				stroke: "currentColor",
				strokeOpacity: "0.55",
				strokeWidth: "1.2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "16",
				cy: "16",
				rx: "14",
				ry: "4.2",
				stroke: "currentColor",
				strokeWidth: "1.4",
				transform: "rotate(-18 16 16)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16",
				cy: "16",
				r: "3.2",
				fill: "currentColor"
			})
		]
	});
}
function Sidebar() {
	const conversations = useChatStore((s) => s.conversations);
	const activeId = useChatStore((s) => s.activeId);
	const sidebarOpen = useChatStore((s) => s.sidebarOpen);
	const selectChat = useChatStore((s) => s.selectChat);
	const deleteChat = useChatStore((s) => s.deleteChat);
	const newChat = useChatStore((s) => s.newChat);
	const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
	const panel = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: cn("nx-glass flex h-full w-sidebar shrink-0 flex-col border-r border-border", "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:shadow-2xl", "max-md:transition-transform max-md:duration-[250ms] max-md:ease-[cubic-bezier(0.22,1,0.36,1)]", sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2 px-4 pt-5 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2.5 text-fg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { className: "size-7 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-semibold tracking-tight",
						children: "Nexvon"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] tracking-[0.16em] text-faint uppercase",
						children: "AI"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "icon",
					className: "md:hidden size-11",
					"aria-label": "Close conversations",
					onClick: () => setSidebarOpen(false),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-3 pb-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "primary",
					className: "w-full rounded-md",
					onClick: newChat,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "New chat"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-2 pb-4",
				children: conversations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-3 py-6 text-sm text-faint",
					children: "No orbits yet."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-0.5",
					children: conversations.map((c) => {
						const active = c.id === activeId;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("group flex items-center gap-1 rounded-sm px-1 transition-colors duration-200", active ? "bg-fg/8" : "hover:bg-fg/5"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => selectChat(c.id),
								className: "flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2.5 text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: cn("size-4 shrink-0", active ? "text-accent" : "text-faint") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("truncate text-sm", active ? "text-fg" : "text-muted"),
									children: c.title
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": `Delete ${c.title}`,
								onClick: () => deleteChat(c.id),
								className: "grid size-10 shrink-0 place-items-center rounded-xs text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger max-md:opacity-100",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
							})]
						}) }, c.id);
					})
				})
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [sidebarOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": "Close conversations",
		className: "fixed inset-0 z-30 bg-void/50 md:hidden",
		style: { animation: "overlayFade 200ms ease-out" },
		onClick: () => setSidebarOpen(false)
	}) : null, panel] });
}
function EmptyState({ onPick }) {
	const suggestions = useChatStore((s) => s.suggestions);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col items-center justify-center px-5 pb-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "anim-fade max-w-xl text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-[11px] tracking-[0.28em] text-accent uppercase",
					children: "Real-time relativistic companion"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-5xl text-fg italic tracking-tight sm:text-6xl",
					children: "Nexvon"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto mt-4 max-w-md text-base leading-relaxed text-muted",
					children: "Ask anything. The Schwarzschild field stays behind the glass."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-10 flex max-w-xl flex-wrap justify-center gap-2",
			children: suggestions.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "chip",
				className: "anim-chip max-w-full",
				style: { animationDelay: `${120 + i * 70}ms` },
				onClick: () => onPick(s),
				children: s
			}, s))
		})]
	});
}
function inline(text, keyBase) {
	const parts = [];
	const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
	let last = 0;
	let m;
	while (m = re.exec(text)) {
		if (m.index > last) parts.push(text.slice(last, m.index));
		const token = m[0];
		if (token.startsWith("`")) parts.push({
			t: "code",
			v: token.slice(1, -1)
		});
		else parts.push({
			t: "strong",
			v: token.slice(2, -2)
		});
		last = m.index + token.length;
	}
	if (last < text.length) parts.push(text.slice(last));
	return parts.map((p, i) => {
		const key = `${keyBase}-${i}`;
		if (typeof p === "string") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p }, key);
		if (p.t === "code") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "rounded-xs bg-fg/8 px-1.5 py-0.5 font-mono text-[0.85em] text-accent",
			children: p.v
		}, key);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
			className: "font-medium text-fg",
			children: p.v
		}, key);
	});
}
function Markdown({ text, className }) {
	const blocks = text.split(/```/);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("space-y-3 text-pretty leading-relaxed", className),
		children: blocks.map((block, i) => {
			if (i % 2 === 1) {
				const nl = block.indexOf("\n");
				const code = nl === -1 ? block : block.slice(nl + 1);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "overflow-x-auto rounded-md bg-elevated/80 p-3 font-mono text-sm text-fg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: code.replace(/\n$/, "") })
				}, i);
			}
			return block.split("\n").map((line, j) => {
				if (!line.trim()) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2" }, `${i}-${j}`);
				const isBullet = /^[-*]\s+/.test(line);
				const isNum = /^\d+\.\s+/.test(line);
				const content = isBullet ? line.replace(/^[-*]\s+/, "") : isNum ? line.replace(/^\d+\.\s+/, "") : line;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: cn((isBullet || isNum) && "pl-4"),
					children: [isBullet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mr-2 text-faint",
						children: "·"
					}) : null, inline(content, `${i}-${j}`)]
				}, `${i}-${j}`);
			});
		})
	});
}
function Typing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center gap-1.5 px-1 py-1",
		"aria-label": "Nexvon is writing",
		children: [
			0,
			1,
			2
		].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "size-1.5 rounded-full bg-accent",
			style: {
				animation: "typingBounce 1.1s ease-in-out infinite",
				animationDelay: `${i * .14}s`
			}
		}, i))
	});
}
function MessageList({ messages, streaming }) {
	const endRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "end"
		});
	}, [messages, streaming]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-0 flex-1 overflow-y-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6",
			children: [messages.map((m, i) => {
				const isUser = m.role === "user";
				const isLast = i === messages.length - 1;
				const showTyping = streaming && isLast && !isUser && !m.content;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: cn("anim-msg flex gap-3", isUser ? "justify-end" : "justify-start"),
					children: [!isUser ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-glass-strong text-accent",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { className: "size-4" })
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("max-w-[min(100%,40rem)] rounded-lg px-4 py-3 text-sm", isUser ? "rounded-br-xs bg-fg text-bg" : "nx-glass-strong rounded-bl-xs text-fg"),
						children: showTyping ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Typing, {}) : isUser ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "whitespace-pre-wrap leading-relaxed",
							children: m.content
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, { text: m.content })
					})]
				}, m.id);
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })]
		})
	});
}
function Composer({ value, onChange, disabled, streaming, onSend, onStop }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = Math.min(el.scrollHeight, 160) + "px";
	}, [value]);
	function submit() {
		const text = value.trim();
		if (!text || disabled || streaming) return;
		onSend(text);
	}
	function onSubmit(e) {
		e.preventDefault();
		submit();
	}
	function onKey(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit,
		className: "mx-auto w-full max-w-2xl px-4 pb-5 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-glass-strong flex items-end gap-2 rounded-xl p-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "sr-only",
					htmlFor: "nexvon-input",
					children: "Message Nexvon"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					id: "nexvon-input",
					ref,
					rows: 1,
					value,
					disabled,
					onChange: (e) => onChange(e.target.value),
					onKeyDown: onKey,
					placeholder: "Ask Nexvon…",
					className: "min-h-11 max-h-40 flex-1 bg-transparent px-3 py-2.5 text-base text-fg placeholder:text-faint sm:text-sm"
				}),
				streaming ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onStop,
					"aria-label": "Stop generating",
					className: "mb-0.5 grid size-11 shrink-0 place-items-center rounded-md bg-fg text-bg transition-transform duration-150 active:scale-[0.96]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5 fill-current" })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					disabled: !value.trim() || disabled,
					"aria-label": "Send",
					className: cn("mb-0.5 grid size-11 shrink-0 place-items-center rounded-md bg-fg text-bg transition-[transform,opacity] duration-150 active:scale-[0.96]", !value.trim() && "opacity-35"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
						className: "size-5",
						strokeWidth: 2.25
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-center text-[11px] tracking-wide text-faint",
			children: "Enter to send · Shift+Enter for a new line"
		})]
	});
}
function ChatApp() {
	const conversations = useChatStore((s) => s.conversations);
	const activeId = useChatStore((s) => s.activeId);
	const streaming = useChatStore((s) => s.streaming);
	const error = useChatStore((s) => s.error);
	const theme = useChatStore((s) => s.theme);
	const pushUser = useChatStore((s) => s.pushUser);
	const beginAssistant = useChatStore((s) => s.beginAssistant);
	const appendAssistant = useChatStore((s) => s.appendAssistant);
	const setStreaming = useChatStore((s) => s.setStreaming);
	const setError = useChatStore((s) => s.setError);
	const renameIfNeeded = useChatStore((s) => s.renameIfNeeded);
	const newChat = useChatStore((s) => s.newChat);
	const toggleTheme = useChatStore((s) => s.toggleTheme);
	const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
	const [draft, setDraft] = (0, import_react.useState)("");
	const abortRef = (0, import_react.useRef)(null);
	const messages = conversations.find((c) => c.id === activeId)?.messages ?? [];
	(0, import_react.useEffect)(() => {
		document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
	}, [theme]);
	(0, import_react.useEffect)(() => {
		return () => abortRef.current?.abort();
	}, []);
	async function send(text) {
		const content = text.trim();
		if (!content || streaming) return;
		setDraft("");
		const { conversationId, messages: history } = pushUser(content);
		renameIfNeeded(conversationId, content);
		const assistantId = beginAssistant(conversationId);
		const ac = new AbortController();
		abortRef.current = ac;
		setStreaming(true);
		setError(null);
		let wrote = false;
		try {
			await streamChat(history.map((m) => ({
				role: m.role,
				content: m.content
			})), {
				signal: ac.signal,
				onDelta: (chunk) => {
					wrote = true;
					appendAssistant(conversationId, assistantId, chunk);
				}
			});
		} catch (err) {
			if (err instanceof DOMException && err.name === "AbortError") return;
			if (err instanceof Error && err.name === "AbortError") return;
			const msg = err instanceof Error ? err.message : "Signal lost.";
			setError(msg);
			if (!wrote) appendAssistant(conversationId, assistantId, `Could not reach Nexvon. ${msg}`);
		} finally {
			setStreaming(false);
			abortRef.current = null;
		}
	}
	function stop() {
		abortRef.current?.abort();
		setStreaming(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex h-full overflow-hidden bg-void text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GargantuaBg, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative z-10 flex min-h-0 min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 min-w-0 flex-1 flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex items-center justify-between gap-3 px-3 py-3 sm:px-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "icon",
								className: "md:hidden",
								"aria-label": "Open conversations",
								onClick: () => setSidebarOpen(true),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 md:hidden",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { className: "size-6 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-semibold",
									children: "Nexvon"
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "icon",
								"aria-label": "New chat",
								onClick: newChat,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "icon",
								"aria-label": theme === "light" ? "Switch to night" : "Switch to day",
								onClick: toggleTheme,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "relative grid size-5 place-items-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: `absolute size-5 transition-[opacity,transform,filter] duration-300 ${theme === "light" ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: `size-5 transition-[opacity,transform,filter] duration-300 ${theme === "dark" ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]"}` })]
								})
							})]
						})]
					}),
					messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { onPick: (s) => {
						setDraft(s);
						requestAnimationFrame(() => {
							document.getElementById("nexvon-input")?.focus();
						});
					} }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageList, {
						messages,
						streaming
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-6 pb-2 text-center text-sm text-danger",
						role: "alert",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {
						value: draft,
						onChange: setDraft,
						streaming,
						onSend: send,
						onStop: stop
					})
				]
			})]
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatApp, {});
}
//#endregion
export { Home as component };
