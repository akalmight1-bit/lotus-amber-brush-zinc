import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/lib/chat/store";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

export function Sidebar() {
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const selectChat = useChatStore((s) => s.selectChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const newChat = useChatStore((s) => s.newChat);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);

  const panel = (
    <aside
      className={cn(
        "nx-glass flex h-full w-sidebar shrink-0 flex-col border-r border-border",
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:shadow-2xl",
        "max-md:transition-transform max-md:duration-[250ms] max-md:ease-[cubic-bezier(0.22,1,0.36,1)]",
        sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5 text-fg">
          <Logo className="size-7 text-accent" />
          <div>
            <div className="text-sm font-semibold tracking-tight">Nexvon</div>
            <div className="text-[11px] tracking-[0.16em] text-faint uppercase">AI</div>
          </div>
        </div>
        <Button
          variant="icon"
          className="md:hidden size-11"
          aria-label="Close conversations"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="size-5" />
        </Button>
      </div>

      <div className="px-3 pb-3">
        <Button
          variant="primary"
          className="w-full rounded-md"
          onClick={newChat}
        >
          <Plus className="size-4" />
          New chat
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-sm text-faint">No orbits yet.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id}>
                  <div
                    className={cn(
                      "group flex items-center gap-1 rounded-sm px-1 transition-colors duration-200",
                      active ? "bg-fg/8" : "hover:bg-fg/5",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => selectChat(c.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2.5 text-left"
                    >
                      <MessageSquare
                        className={cn("size-4 shrink-0", active ? "text-accent" : "text-faint")}
                      />
                      <span
                        className={cn(
                          "truncate text-sm",
                          active ? "text-fg" : "text-muted",
                        )}
                      >
                        {c.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${c.title}`}
                      onClick={() => deleteChat(c.id)}
                      className="grid size-10 shrink-0 place-items-center rounded-xs text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger max-md:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close conversations"
          className="fixed inset-0 z-30 bg-void/50 md:hidden"
          style={{ animation: "overlayFade 200ms ease-out" }}
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      {panel}
    </>
  );
}
