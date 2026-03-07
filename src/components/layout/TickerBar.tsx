import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TickerBarProps {
  isCondensed: boolean;
}

const TickerBar = ({ isCondensed }: TickerBarProps) => {
  const [speed, setSpeed] = useState(60);

  useEffect(() => {
    const fetchSpeed = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "ticker_speed")
        .maybeSingle();
      if (data) setSpeed(Number(data.value));
    };
    fetchSpeed();

    const channel = supabase
      .channel("ticker-speed")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, (payload: any) => {
        if (payload.new?.key === "ticker_speed") {
          setSpeed(Number(payload.new.value));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const message = "Welcome to ABOLORE COUTURE — Thank you for choosing us — Enjoy your shopping";

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
