import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Shirt, ArrowRight, AlertTriangle } from "lucide-react";
import mannequinDefault from "@/assets/mannequin-default.jpg";

interface MannequinPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  garmentImageUrl: string;
  onSelectImage: (url: string) => void;
}

const PRESET_OPTIONS = [
  { id: "mannequin", label: "Studio Mannequin", description: "Clean white background" },
  { id: "elegant", label: "Elegant Display", description: "Professional studio lighting" },
  { id: "boutique", label: "Boutique Setting", description: "Modern retail display" },
];

const CACHE_PREFIX = "mannequin_preview_";

const MannequinPreviewDialog = ({
  open,
  onOpenChange,
  garmentImageUrl,
  onSelectImage,
}: MannequinPreviewDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("mannequin");
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Check localStorage cache on mount
  useEffect(() => {
    if (open && garmentImageUrl) {
      const cacheKey = CACHE_PREFIX + btoa(garmentImageUrl).slice(0, 32) + "_" + selectedPreset;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setResultImageUrl(cached);
        setError(null);
      } else {
        setResultImageUrl(null);
      }
    }
  }, [open, garmentImageUrl, selectedPreset]);

  const handleGenerate = async () => {
    if (!garmentImageUrl) return;
    setLoading(true);
    setError(null);
    setResultImageUrl(null);
    setProgress(0);

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 90));
    }, 1000);

    try {
      // Dynamic import to avoid loading the large package upfront
      const { Client, handle_file } = await import("@gradio/client");
      
      // Try primary space, then fallback
      const spaces = ["yisol/IDM-VTON", "cuup/IDM-VTON"];
      let lastError: Error | null = null;

      for (const space of spaces) {
        try {
          const app = await Client.connect(space);

          // Prepare the garment description based on preset
          const descriptions: Record<string, string> = {
            mannequin: "A clothing garment displayed on a mannequin",
            elegant: "An elegant clothing piece in professional studio",
            boutique: "A fashion garment in a boutique display",
          };

          const result = await app.predict("/tryon", [
            {
              background: handle_file(mannequinDefault),
              layers: [],
              composite: null,
            },
            handle_file(garmentImageUrl),
            descriptions[selectedPreset] || descriptions.mannequin,
            true, // auto-generate mask
            true, // auto-crop & resize
            30,   // denoise steps
            42,   // seed
          ]);

          // Extract the result image
          const data = result?.data as any;
          if (data && data[0]) {
            const outputUrl = typeof data[0] === "string" ? data[0] : data[0]?.url || data[0]?.path;
            if (outputUrl) {
              setResultImageUrl(outputUrl);
              // Cache the result
              const cacheKey = CACHE_PREFIX + btoa(garmentImageUrl).slice(0, 32) + "_" + selectedPreset;
              try {
                localStorage.setItem(cacheKey, outputUrl);
              } catch {
                // localStorage full, ignore
              }
              setProgress(100);
              toast({ title: "Preview generated!", description: "Mannequin preview is ready." });
              clearInterval(progressInterval);
              setLoading(false);
              return;
            }
          }
          throw new Error("No output image received");
        } catch (e: any) {
          lastError = e;
          console.warn(`Space ${space} failed:`, e.message);
          continue;
        }
      }

      throw lastError || new Error("All spaces unavailable");
    } catch (err: any) {
      console.error("Mannequin preview error:", err);
      setError(
        "The virtual try-on service is temporarily unavailable. This uses free public AI models that may have high traffic. Please try again later."
      );
      toast({
        title: "Service Unavailable",
        description: "Free AI model is busy. Please try again later.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setProgress(0);
    }
  };

  const handleSelectOriginal = () => {
    onSelectImage(garmentImageUrl);
    onOpenChange(false);
  };

  const handleSelectMannequin = () => {
    if (resultImageUrl) {
      onSelectImage(resultImageUrl);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Mannequin Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preset Selection */}
          <div>
            <Label className="text-sm mb-2 block">Display Style</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_OPTIONS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedPreset === preset.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted hover:bg-accent border-border"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Original</Label>
              <div className="aspect-[3/4] rounded-lg overflow-hidden border bg-muted">
                <img src={garmentImageUrl} alt="Original garment" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Mannequin Preview</Label>
              <div className="aspect-[3/4] rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-center">Generating preview...</p>
                    <div className="w-full bg-muted-foreground/20 rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">This may take 30-60 seconds</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="text-xs text-center">{error}</p>
                  </div>
                ) : resultImageUrl ? (
                  <img src={resultImageUrl} alt="Mannequin preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                    <Shirt className="h-8 w-8" />
                    <p className="text-sm text-center">Click "Generate" to create mannequin preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleSelectOriginal}>
              Use Original
            </Button>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Shirt className="h-4 w-4" /> Generate
                </>
              )}
            </Button>
            {resultImageUrl && (
              <Button
                type="button"
                onClick={handleSelectMannequin}
                className="flex-1 luxury-gradient text-primary-foreground"
              >
                <ArrowRight className="h-4 w-4" /> Use This
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MannequinPreviewDialog;
