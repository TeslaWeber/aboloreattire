import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";

interface TickerBarProps {
  isCondensed: boolean;
}

const DEFAULT_MESSAGES = ["Welcome to ABOLORE COUTURE — Thank you for choosing us — Enjoy your shopping"];

const TickerBar = ({ isCondensed }: TickerBarProps) => {
  const [speed, setSpeed] = useState(60);
  const [messages, setMessages] = useState<string[]>(DEFAULT_MESSAGES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(8);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["ticker_speed", "ticker_messages", "ticker_message", "ticker_display_duration"]);
      if (data) {
        data.forEach((row) => {
          if (row.key === "ticker_speed") setSpeed(Number(row.value));
          if (row.key === "ticker_display_duration") setDisplayDuration(Number(row.value));
          if (row.key === "ticker_messages") {
            try {
              const parsed = JSON.parse(row.value);
              if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
            } catch {}
          }
        });
      }
    };
    fetchSettings();

    const channel = supabase
      .channel("ticker-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, (payload: any) => {
        if (payload.new?.key === "ticker_speed") setSpeed(Number(payload.new.value));
        if (payload.new?.key === "ticker_display_duration") setDisplayDuration(Number(payload.new.value));
        if (payload.new?.key === "ticker_messages") {
          try {
            const parsed = JSON.parse(payload.new.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed);
              setCurrentIndex(0);
            }
          } catch {}
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Rotate messages every 8 seconds when there are multiple
  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, displayDuration * 1000);
    return () => clearInterval(interval);
  }, [messages.length, displayDuration]);

  const currentMessage = messages[currentIndex] || messages[0];

  return (
    <div className={`bg-primary text-primary-foreground overflow-hidden transition-all duration-500 ease-in-out ${isCondensed ? 'opacity-70 py-0' : 'opacity-100'}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.5 }}
          className={`whitespace-nowrap text-[11px] tracking-widest uppercase font-light inline-flex transition-all duration-500 ${isCondensed ? 'py-1' : 'py-1.5'}`}
          style={{ animation: `marquee ${speed}s linear infinite` }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="mx-8">{currentMessage}</span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TickerBar;
