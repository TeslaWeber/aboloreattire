import { useEffect } from "react";
import { useMedianApp } from "./useMedianApp";

/**
 * Configures Median.co native features when running inside the native wrapper.
 * - Status bar styling (dark style with app background color)
 * - OneSignal push notification registration
 * - Screen mode (dark to match app theme)
 */
export const useMedianNativeFeatures = () => {
  const { isMedianApp } = useMedianApp();

  useEffect(() => {
    if (!isMedianApp) return;

    const win = window as any;
    const median = win.median;
    if (!median) return;

    // Configure status bar to match the luxury dark theme
    try {
      if (median.statusbar?.set) {
        median.statusbar.set({
          style: "light", // light text on dark background
          color: "#0F0F12", // matches --background: 240 10% 6%
          overlay: false,
          blur: false,
        });
      }
    } catch (e) {
      console.warn("Median statusbar config failed:", e);
    }

    // Set screen mode to dark
    try {
      if (median.screen?.setMode) {
        median.screen.setMode({ mode: "dark" });
      }
    } catch (e) {
      console.warn("Median screen mode config failed:", e);
    }

    // Register device for push notifications via OneSignal (if configured in Median App Studio)
    try {
      if (median.onesignal?.register) {
        median.onesignal.register();
      }
    } catch (e) {
      console.warn("Median push notification registration failed:", e);
    }
  }, [isMedianApp]);

  return { isMedianApp };
};

/**
 * Share the current page or a specific URL using the native share sheet.
 */
export const useMedianShare = () => {
  const { isMedianApp } = useMedianApp();

  const sharePage = (url: string, text?: string) => {
    if (!isMedianApp) return false;
    const win = window as any;
    try {
      win.median?.share?.sharePage({ url, text });
      return true;
    } catch {
      return false;
    }
  };

  const downloadFile = (url: string, filename?: string) => {
    if (!isMedianApp) return false;
    const win = window as any;
    try {
      win.median?.share?.downloadFile({ url, filename, open: true });
      return true;
    } catch {
      return false;
    }
  };

  return { isMedianApp, sharePage, downloadFile };
};
