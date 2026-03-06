import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const buildTheme = (p: string, gl: string, gd: string, rg: string) => ({
  "--primary": p, "--accent": p, "--ring": p, "--gold-light": gl, "--gold-dark": gd, "--rose-gold": rg, "--sidebar-primary": p, "--sidebar-ring": p,
});

const themeMap: Record<string, Record<string, string>> = {
  gold: buildTheme("38 70% 50%", "38 80% 65%", "38 60% 35%", "15 50% 55%"),
  purple: buildTheme("270 60% 55%", "270 70% 70%", "270 50% 40%", "290 50% 55%"),
  blue: buildTheme("215 70% 50%", "215 80% 65%", "215 60% 35%", "200 50% 55%"),
  emerald: buildTheme("160 60% 45%", "160 70% 60%", "160 50% 30%", "140 50% 50%"),
  rose: buildTheme("340 65% 55%", "340 75% 70%", "340 55% 40%", "350 50% 55%"),
  amber: buildTheme("25 85% 55%", "25 90% 65%", "25 70% 40%", "15 60% 55%"),
  teal: buildTheme("185 60% 45%", "185 70% 60%", "185 50% 30%", "175 50% 50%"),
  crimson: buildTheme("0 70% 50%", "0 80% 65%", "0 60% 35%", "10 55% 55%"),
  indigo: buildTheme("240 55% 55%", "240 65% 70%", "240 45% 40%", "250 50% 55%"),
  coral: buildTheme("16 80% 60%", "16 85% 72%", "16 65% 45%", "8 60% 58%"),
  slate: buildTheme("210 15% 45%", "210 20% 60%", "210 12% 30%", "200 15% 50%"),
  magenta: buildTheme("300 60% 50%", "300 70% 65%", "300 50% 35%", "310 55% 55%"),
};

export const useThemeLoader = () => {
  useEffect(() => {
    const loadTheme = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "site_theme")
        .maybeSingle();
      if (data?.value && themeMap[data.value]) {
        const root = document.documentElement;
        Object.entries(themeMap[data.value]).forEach(([prop, val]) => {
          root.style.setProperty(prop, val);
        });
      }
    };
    loadTheme();
  }, []);
};
