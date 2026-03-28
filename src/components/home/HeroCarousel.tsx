import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, PanInfo, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroStreet1 from "@/assets/hero-street-1.jpg";
import heroStreet2 from "@/assets/hero-street-2.jpg";
import heroStreet3 from "@/assets/hero-street-3.jpg";
import heroStreet4 from "@/assets/hero-street-4.jpg";
import heroStreet5 from "@/assets/hero-street-5.jpg";
import heroStreet6 from "@/assets/hero-street-6.jpg";
import heroStreet7 from "@/assets/hero-street-7.jpg";
import heroStreet8 from "@/assets/hero-street-8.jpg";
import heroStreet9 from "@/assets/hero-street-9.jpg";
import heroStreet10 from "@/assets/hero-street-10.jpg";
import heroStreet11 from "@/assets/hero-street-11.jpg";
import heroStreet12 from "@/assets/hero-street-12.jpg";
import heroStreet13 from "@/assets/hero-street-13.jpg";
import heroStreet14 from "@/assets/hero-street-14.jpg";
import heroStreet15 from "@/assets/hero-street-15.jpg";
import heroShoes1 from "@/assets/hero-shoes-1.jpg";
import heroShoes2 from "@/assets/hero-shoes-2.jpg";
import heroShoes3 from "@/assets/hero-shoes-3.jpg";
import heroShoes4 from "@/assets/hero-shoes-4.jpg";
import heroShoes5 from "@/assets/hero-shoes-5.jpg";
import heroShoes6 from "@/assets/hero-shoes-6.jpg";
import heroShoes7 from "@/assets/hero-shoes-7.jpg";
import heroShoes8 from "@/assets/hero-shoes-8.jpg";
import heroShoes9 from "@/assets/hero-shoes-9.jpg";
import heroShoes10 from "@/assets/hero-shoes-10.jpg";
import heroBags1 from "@/assets/hero-bags-1.jpg";
import heroBags2 from "@/assets/hero-bags-2.jpg";
import heroBags3 from "@/assets/hero-bags-3.jpg";
import heroBags4 from "@/assets/hero-bags-4.jpg";
import heroBags5 from "@/assets/hero-bags-5.jpg";
import heroBags6 from "@/assets/hero-bags-6.jpg";
import heroBags7 from "@/assets/hero-bags-7.jpg";
import heroBags8 from "@/assets/hero-bags-8.jpg";
import heroBags9 from "@/assets/hero-bags-9.jpg";
import heroBags10 from "@/assets/hero-bags-10.jpg";
import heroKids1 from "@/assets/hero-kids-1.jpg";
import heroKids2 from "@/assets/hero-kids-2.jpg";
import heroKids3 from "@/assets/hero-kids-3.jpg";
import heroKids4 from "@/assets/hero-kids-4.jpg";
import heroKids5 from "@/assets/hero-kids-5.jpg";
import heroKids6 from "@/assets/hero-kids-6.jpg";
import heroKids7 from "@/assets/hero-kids-7.jpg";
import heroKids8 from "@/assets/hero-kids-8.jpg";
import heroKids9 from "@/assets/hero-kids-9.jpg";
import heroKids10 from "@/assets/hero-kids-10.jpg";

// Interleave all categories for variety
const heroImages = [
  heroStreet1, heroShoes1, heroBags1, heroKids1,
  heroStreet2, heroShoes2, heroBags2, heroKids2,
  heroStreet3, heroShoes3, heroBags3, heroKids3,
  heroStreet4, heroShoes4, heroBags4, heroKids4,
  heroStreet5, heroShoes5, heroBags5, heroKids5,
  heroStreet6, heroShoes6, heroBags6, heroKids6,
  heroStreet7, heroShoes7, heroBags7, heroKids7,
  heroStreet8, heroShoes8, heroBags8, heroKids8,
  heroStreet9, heroShoes9, heroBags9, heroKids9,
  heroStreet10, heroShoes10, heroBags10, heroKids10,
  heroStreet11, heroStreet12, heroStreet13, heroStreet14, heroStreet15,
];

// Ken Burns effect presets — each gives a different slow zoom/pan direction
const kenBurnsVariants = [
  { scale: [1, 1.15], x: ["0%", "-3%"], y: ["0%", "-2%"] },   // zoom in, drift top-left
  { scale: [1.1, 1], x: ["-2%", "2%"], y: ["-1%", "1%"] },    // zoom out, drift right
  { scale: [1, 1.12], x: ["0%", "3%"], y: ["0%", "-3%"] },     // zoom in, drift top-right
  { scale: [1.08, 1], x: ["2%", "-2%"], y: ["2%", "0%"] },     // zoom out, drift left
  { scale: [1, 1.1], x: ["0%", "0%"], y: ["0%", "-4%"] },      // zoom in, pan up
];

const SWIPE_THRESHOLD = 50;

const HeroCarousel = () => {
  const randomStart = useMemo(() => Math.floor(Math.random() * heroImages.length), []);
  const [currentIndex, setCurrentIndex] = useState(randomStart);
  const [direction, setDirection] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax: translate image down as user scrolls
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 600], [0, 120]);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
  }, []);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    startAutoPlay(); // reset timer after manual interaction
  }, [startAutoPlay]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    startAutoPlay();
  }, [startAutoPlay]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoPlay]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      goToNext();
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      goToPrev();
    }
  };

  const kenBurns = kenBurnsVariants[currentIndex % kenBurnsVariants.length];

  return (
    <motion.div ref={containerRef} className="absolute inset-0 overflow-hidden" style={{ y: parallaxY }}>
      {/* Swipe overlay — captures drag gestures */}
      <motion.div
        className="absolute inset-0 z-[5] cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
      />

      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={currentIndex}
          src={heroImages[currentIndex]}
          alt="Fashion Collection"
          custom={direction}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            scale: kenBurns.scale,
            x: kenBurns.x,
            y: kenBurns.y,
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1, ease: "easeInOut" },
            scale: { duration: 8, ease: "linear" },
            x: { duration: 8, ease: "linear" },
            y: { duration: 8, ease: "linear" },
          }}
          className="absolute inset-0 w-full h-full object-cover object-top"
          draggable={false}
        />
      </AnimatePresence>

      {/* Desktop arrow buttons */}
      <button
        onClick={goToPrev}
        className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-background/40 backdrop-blur-sm text-foreground/80 hover:bg-background/70 transition-colors"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={goToNext}
        className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-background/40 backdrop-blur-sm text-foreground/80 hover:bg-background/70 transition-colors"
        aria-label="Next image"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-1">
        {Array.from({ length: Math.min(10, heroImages.length) }).map((_, i) => {
          const groupIndex = Math.floor(currentIndex / Math.ceil(heroImages.length / 10));
          return (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-700 ${
                i === groupIndex
                  ? "bg-primary w-5"
                  : "bg-foreground/20 w-1.5"
              }`}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

export default HeroCarousel;
