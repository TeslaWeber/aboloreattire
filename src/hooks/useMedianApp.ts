import { useState, useEffect } from "react";

/**
 * Detects if the app is running inside a Median.co native wrapper.
 * Returns { isMedianApp, platform } where platform is 'ios' | 'android' | null.
 */
export const useMedianApp = () => {
  const [isMedianApp, setIsMedianApp] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    const checkMedian = () => {
      const win = window as any;

      // Median injects navigator.userAgent with "median" or "gonative"
      const ua = navigator.userAgent.toLowerCase();
      const isMedian =
        ua.includes("median") ||
        ua.includes("gonative") ||
        !!win.median ||
        !!win.gonative;

      setIsMedianApp(isMedian);

      if (isMedian) {
        if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) {
          setPlatform("ios");
        } else if (ua.includes("android")) {
          setPlatform("android");
        }
      }
    };

    // Check immediately and also after median_library_ready fires
    checkMedian();

    const origReady = (window as any).median_library_ready;
    (window as any).median_library_ready = () => {
      checkMedian();
      origReady?.();
    };

    return () => {
      (window as any).median_library_ready = origReady;
    };
  }, []);

  return { isMedianApp, platform };
};
