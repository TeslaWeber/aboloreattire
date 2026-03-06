import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const heroImages = [
  heroStreet1, heroStreet2, heroStreet3,
  heroStreet4, heroStreet5, heroStreet6,
  heroStreet7, heroStreet8, heroStreet9,
  heroStreet10, heroStreet11, heroStreet12,
  heroStreet13, heroStreet14, heroStreet15,
];

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(goToNext, 4000);
    return () => clearInterval(interval);
  }, [goToNext]);

  const goToSlide = (i: number) => {
    setDirection(i > currentIndex ? 1 : -1);
    setCurrentIndex(i);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.img
          key={currentIndex}
          src={heroImages[currentIndex]}
          alt="Streetwear Fashion"
          custom={direction}
          initial={{ opacity: 0, scale: 1.08, x: direction * 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 1.03, x: direction * -40 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
        {heroImages.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex
                ? "bg-primary w-6"
                : "bg-foreground/30 w-1.5 hover:bg-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
