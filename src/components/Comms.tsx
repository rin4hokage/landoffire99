import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useTasks, useComms } from "@/hooks/useSupabaseData";
import { Input } from "@/components/ui/input";

const Comms = () => {
  const { tasks } = useTasks(5000);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const { messages, sendMessage } = useComms(activeTaskId, 3000);
  const [input, setInput] = useState("");

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const handleSend = async () => {
    if (!input.trim() || !activeTaskId) return;
    await sendMessage(input, activeTaskId);
    setInput("");
  };

  return (
    <div className="flex h-[60vh] gap-4">
      {/* Task list sidebar */}
      <div className="w-full sm:w-64 glass-card p-3 space-y-1 overflow-y-auto flex-shrink-0">
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-xs font-mono">No tasks yet. Create tasks in the Tasks tab.</div>
        )}
        {tasks.map((t) => (
          <div
            key={t.id}
            onClick={() => setActiveTaskId(t.id)}
            className={`p-2.5 rounded-md cursor-pointer transition-colors ${
              t.id === activeTaskId ? "bg-muted/50 border-l-2 border-l-primary" : "hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate">{t.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate mt-1">
              {t.status} · {t.assignee || "Unassigned"}
            </p>
          </div>
        ))}
      </div>

      {/* Message thread */}
      <div className="flex-1 glass-card flex flex-col hidden sm:flex">
        {activeTask ? (
          <>
            <div className="p-3 border-b border-border flex items-center gap-2">
              <span className="text-sm font-semibold">{activeTask.title}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{activeTask.status}</span>
            </div>

            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs font-mono">No messages yet.</div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex gap-2 ${msg.sender === "EJ" ? "justify-end" : ""}`}
                >
                  <div className={`max-w-[75%]`}>
                    <div className={`rounded-lg p-2.5 text-xs ${msg.sender === "EJ" ? "bg-primary/20 text-foreground" : "bg-muted/50 text-foreground"}`}>
                      {msg.sender !== "EJ" && (
                        <span className="text-[10px] font-semibold text-primary block mb-1">{msg.sender}</span>
                      )}
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono mt-0.5 block">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="bg-muted/30 border-border text-sm"
              />
              <button onClick={handleSend} className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Send size={14} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs font-mono">
            Select a task to view messages
          </div>
        )}
      </div>
    </div>
  );
};

export default Comms;
