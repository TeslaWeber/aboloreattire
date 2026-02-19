import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, ArrowRight, AlertTriangle } from "lucide-react";

interface MannequinPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  garmentImageUrl: string;
  onSelectImage: (url: string) => void;
}

const PRESET_OPTIONS = [
  { id: "mannequin_grass", label: "🌿 Grass Carpet", description: "Mannequin with grass carpet background" },
  { id: "mannequin_white", label: "⬜ White Studio", description: "Clean white studio background" },
  { id: "mannequin_boutique", label: "🏪 Boutique", description: "Modern boutique setting" },
  { id: "mannequin_marble", label: "💎 Luxury Marble", description: "Marble floor with golden lighting" },
  { id: "flat_lay", label: "📸 Flat Lay", description: "Top-down flat lay on marble" },
];

const MannequinPreviewDialog = ({
  open,
  onOpenChange,
  garmentImageUrl,
  onSelectImage,
}: MannequinPreviewDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("mannequin_grass");
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!garmentImageUrl) return;
    setLoading(true);
    setError(null);
    setResultImageUrl(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transform-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageUrl: garmentImageUrl, preset: selectedPreset }),
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "Transformation failed");
      }

      setResultImageUrl(data.transformedImageUrl);
      toast({ title: "Image transformed!", description: "Preview is ready." });
    } catch (err: any) {
      console.error("Transform error:", err);
      setError(err.message || "An error occurred. Please try again.");
      toast({
        title: "Transform failed",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTransformed = () => {
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
            <Wand2 className="h-5 w-5 text-primary" />
            AI Image Transform
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preset Selection */}
          <div>
            <Label className="text-sm mb-2 block">Choose Style</Label>
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
                  title={preset.description}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {PRESET_OPTIONS.find((p) => p.id === selectedPreset)?.description}
            </p>
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
              <Label className="text-xs text-muted-foreground mb-1 block">Transformed</Label>
              <div className="aspect-[3/4] rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-center">Generating with Gemini...</p>
                    <p className="text-xs text-muted-foreground">This may take 15-30 seconds</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="text-xs text-center">{error}</p>
                  </div>
                ) : resultImageUrl ? (
                  <img src={resultImageUrl} alt="Transformed" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                    <Wand2 className="h-8 w-8" />
                    <p className="text-sm text-center">Select a style and click "Transform"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleGenerate} disabled={loading} className="flex-1">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Transforming...</>
              ) : (
                <><Wand2 className="h-4 w-4" /> Transform</>
              )}
            </Button>
            {resultImageUrl && (
              <Button type="button" onClick={handleSelectTransformed} className="flex-1 luxury-gradient text-primary-foreground">
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
