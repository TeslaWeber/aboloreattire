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

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(goToNext, 4000);
    return () => clearInterval(interval);
  }, [goToNext]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={heroImages[currentIndex]}
          alt="Fashion Collection"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            opacity: { duration: 1.2, ease: "easeInOut" },
            scale: { duration: 6, ease: "easeOut" }
          }}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      </AnimatePresence>

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
    </div>
  );
};

export default HeroCarousel;
