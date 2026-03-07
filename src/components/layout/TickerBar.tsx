import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TickerBarProps {
  isCondensed: boolean;
}

const DEFAULT_MESSAGE = "Welcome to ABOLORE COUTURE — Thank you for choosing us — Enjoy your shopping";

const TickerBar = ({ isCondensed }: TickerBarProps) => {
  const [speed, setSpeed] = useState(60);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["ticker_speed", "ticker_message"]);
      if (data) {
        data.forEach((row) => {
          if (row.key === "ticker_speed") setSpeed(Number(row.value));
          if (row.key === "ticker_message") setMessage(row.value);
        });
      }
    };
    fetchSettings();

    const channel = supabase
      .channel("ticker-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, (payload: any) => {
        if (payload.new?.key === "ticker_speed") setSpeed(Number(payload.new.value));
        if (payload.new?.key === "ticker_message") setMessage(payload.new.value);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className={`bg-primary text-primary-foreground overflow-hidden transition-all duration-500 ease-in-out ${isCondensed ? 'opacity-70 py-0' : 'opacity-100'}`}>
      <div
        className={`whitespace-nowrap text-[11px] tracking-widest uppercase font-light inline-flex transition-all duration-500 ${isCondensed ? 'py-1' : 'py-1.5'}`}
        style={{ animation: `marquee ${speed}s linear infinite` }}
      >
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="mx-8">{message}</span>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
