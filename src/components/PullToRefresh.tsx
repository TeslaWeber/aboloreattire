import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const PullToRefresh = ({ children }: { children: React.ReactNode }) => {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, currentY - startY.current);
    setPullDistance(Math.min(diff * 0.5, 120));
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(50);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      setPullDistance(0);
    }
    setPulling(false);
  }, [pullDistance, refreshing]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all bg-background"
          style={{ height: pullDistance }}
        >
          <RefreshCw
            className={`h-6 w-6 text-primary transition-transform ${refreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}
      {children}
    </div>
  );
};

export default PullToRefresh;
