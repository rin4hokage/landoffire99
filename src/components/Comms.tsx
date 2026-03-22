import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { initialThreads, type Thread, type Message } from "@/data/mockData";
import { Input } from "@/components/ui/input";

const Comms = () => {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [activeThread, setActiveThread] = useState(threads[0].id);
  const [input, setInput] = useState("");

  const active = threads.find((t) => t.id === activeThread)!;

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: `m-${Date.now()}`,
      from: "You",
      fromEmoji: "👤",
      to: active.name,
      text: input,
      timestamp: "Just now",
      read: true,
    };
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread ? { ...t, messages: [...t.messages, msg] } : t))
    );
    setInput("");
  };

  return (
    <div className="flex h-[60vh] gap-4">
      {/* Thread list */}
      <div className="w-full sm:w-64 glass-card p-3 space-y-1 overflow-y-auto flex-shrink-0">
        {threads.map((t) => (
          <div
            key={t.id}
            onClick={() => setActiveThread(t.id)}
            className={`p-2.5 rounded-md cursor-pointer transition-colors ${
              t.id === activeThread ? "bg-muted/50 border-l-2 border-l-primary" : "hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{t.emoji}</span>
                <span className="text-sm font-semibold">{t.name}</span>
              </div>
              {t.unreadCount > 0 && (
                <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-mono">
                  {t.unreadCount}
                </span>
              )}
            </div>
            {t.messages.length > 0 && (
              <p className="text-[10px] text-muted-foreground truncate mt-1 pl-6">
                {t.messages[t.messages.length - 1].text}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Message thread */}
      <div className="flex-1 glass-card flex flex-col hidden sm:flex">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <span>{active.emoji}</span>
          <span className="text-sm font-semibold">{active.name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{active.type}</span>
        </div>

        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {active.messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex gap-2 ${msg.from === "You" ? "justify-end" : ""}`}
            >
              <div className={`max-w-[75%] ${msg.from === "You" ? "order-1" : ""}`}>
                <div className={`rounded-lg p-2.5 text-xs ${msg.from === "You" ? "bg-primary/20 text-foreground" : "bg-muted/50 text-foreground"}`}>
                  {msg.from !== "You" && (
                    <span className="text-[10px] font-semibold text-primary block mb-1">{msg.fromEmoji} {msg.from}</span>
                  )}
                  {msg.text}
                </div>
                <span className="text-[9px] text-muted-foreground font-mono mt-0.5 block">{msg.timestamp}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-3 border-t border-border flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="bg-muted/30 border-border text-sm"
          />
          <button onClick={sendMessage} className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Comms;
