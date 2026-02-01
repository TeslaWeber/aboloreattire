import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, X } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const [activeImage, setActiveImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isZoomed) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
    setZoomPosition({ x: 50, y: 50 });
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <motion.div
        ref={imageRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted cursor-zoom-in group"
        onClick={toggleZoom}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => !isZoomed && setZoomPosition({ x: 50, y: 50 })}
      >
        <img
          src={images[activeImage]}
          alt={productName}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isZoomed ? "scale-150" : "scale-100"
          }`}
          style={
            isZoomed
              ? {
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }
              : undefined
          }
        />
        
        {/* Zoom indicator */}
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isZoomed ? (
            <ZoomOut className="h-5 w-5 text-foreground" />
          ) : (
            <ZoomIn className="h-5 w-5 text-foreground" />
          )}
        </div>

        {/* Zoom hint */}
        {!isZoomed && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-foreground">Click to zoom</span>
          </div>
        )}
      </motion.div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveImage(i);
                setIsZoomed(false);
              }}
              className={`relative shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                activeImage === i
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              <img
                src={img}
                alt={`${productName} view ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex items-center justify-center"
            onClick={toggleZoom}
          >
            <button
              className="absolute top-6 right-6 p-3 bg-muted rounded-full hover:bg-muted/80 transition-colors"
              onClick={toggleZoom}
            >
              <X className="h-6 w-6" />
            </button>
            
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={images[activeImage]}
              alt={productName}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />

            {/* Thumbnail navigation in modal */}
            {images.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-background/80 backdrop-blur-sm rounded-full p-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage(i);
                    }}
                    className={`w-12 h-14 rounded overflow-hidden border-2 transition-all ${
                      activeImage === i ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGallery;
