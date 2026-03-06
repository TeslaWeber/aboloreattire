import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const themeMap: Record<string, Record<string, string>> = {
  gold: { "--primary": "38 70% 50%", "--accent": "38 70% 50%", "--ring": "38 70% 50%", "--gold-light": "38 80% 65%", "--gold-dark": "38 60% 35%", "--rose-gold": "15 50% 55%", "--sidebar-primary": "38 70% 50%", "--sidebar-ring": "38 70% 50%" },
  purple: { "--primary": "270 60% 55%", "--accent": "270 60% 55%", "--ring": "270 60% 55%", "--gold-light": "270 70% 70%", "--gold-dark": "270 50% 40%", "--rose-gold": "290 50% 55%", "--sidebar-primary": "270 60% 55%", "--sidebar-ring": "270 60% 55%" },
  blue: { "--primary": "215 70% 50%", "--accent": "215 70% 50%", "--ring": "215 70% 50%", "--gold-light": "215 80% 65%", "--gold-dark": "215 60% 35%", "--rose-gold": "200 50% 55%", "--sidebar-primary": "215 70% 50%", "--sidebar-ring": "215 70% 50%" },
  emerald: { "--primary": "160 60% 45%", "--accent": "160 60% 45%", "--ring": "160 60% 45%", "--gold-light": "160 70% 60%", "--gold-dark": "160 50% 30%", "--rose-gold": "140 50% 50%", "--sidebar-primary": "160 60% 45%", "--sidebar-ring": "160 60% 45%" },
  rose: { "--primary": "340 65% 55%", "--accent": "340 65% 55%", "--ring": "340 65% 55%", "--gold-light": "340 75% 70%", "--gold-dark": "340 55% 40%", "--rose-gold": "350 50% 55%", "--sidebar-primary": "340 65% 55%", "--sidebar-ring": "340 65% 55%" },
  amber: { "--primary": "25 85% 55%", "--accent": "25 85% 55%", "--ring": "25 85% 55%", "--gold-light": "25 90% 65%", "--gold-dark": "25 70% 40%", "--rose-gold": "15 60% 55%", "--sidebar-primary": "25 85% 55%", "--sidebar-ring": "25 85% 55%" },
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
