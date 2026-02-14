import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, ArrowRight } from "lucide-react";

interface ImageTransformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onTransformed: (newUrl: string) => void;
}

const PRESET_PROMPTS = [
  "Place this clothing item on a mannequin in a professional studio with a clean white background",
  "Show this clothing worn on a mannequin with a grass carpet wall and floor background, elegant studio lighting",
  "Display this garment on a mannequin in a modern boutique setting with warm ambient lighting",
  "Transform this into a flat-lay product photo on a marble surface with accessories",
];

const ImageTransformDialog = ({
  open,
  onOpenChange,
  imageUrl,
  onTransformed,
}: ImageTransformDialogProps) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState(PRESET_PROMPTS[1]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleTransform = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setPreviewUrl(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transform-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageUrl, prompt }),
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "Transformation failed");
      }

      setPreviewUrl(data.transformedImageUrl);
      toast({ title: "Success", description: "Image transformed! Review and apply." });
    } catch (err: any) {
      console.error("Transform error:", err);
      toast({
        title: "Transformation failed",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (previewUrl) {
      onTransformed(previewUrl);
      onOpenChange(false);
      setPreviewUrl(null);
      toast({ title: "Applied", description: "Transformed image added to product." });
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Original</Label>
              <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                <img src={imageUrl} alt="Original" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Transformed</Label>
              <div className="aspect-square rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                {loading ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm">Transforming with Grok...</p>
                  </div>
                ) : previewUrl ? (
                  <img src={previewUrl} alt="Transformed" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-sm text-muted-foreground text-center px-4">
                    Click "Transform" to generate
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    prompt === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted hover:bg-accent border-border"
                  }`}
                >
                  {p.length > 50 ? p.substring(0, 50) + "..." : p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="transform-prompt">Transformation Prompt</Label>
            <Textarea
              id="transform-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe how you want the image transformed..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleTransform} disabled={loading || !prompt.trim()} className="flex-1">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Transforming...</>
              ) : (
                <><Wand2 className="h-4 w-4" /> Transform</>
              )}
            </Button>
            {previewUrl && (
              <Button type="button" onClick={handleApply} className="flex-1 luxury-gradient text-primary-foreground">
                <ArrowRight className="h-4 w-4" /> Apply
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageTransformDialog;
