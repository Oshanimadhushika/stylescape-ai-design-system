import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Sparkles } from "lucide-react";

interface ModelPreviewProps {
  generatedImage: string | null;
  isGenerating: boolean;
  name: string;
  isSaving: boolean;
  revisionInstructions: string;
  onSave: () => void;
  onGenerate: () => void;
  onReset: () => void;
  onRevisionChange: (value: string) => void;
}

export default function ModelPreview({
  generatedImage,
  isGenerating,
  name,
  isSaving,
  revisionInstructions,
  onSave,
  onGenerate,
  onReset,
  onRevisionChange,
}: ModelPreviewProps) {
  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Önizleme</CardTitle>
        <CardDescription>
          Oluşturulan mankeniniz burada görünecek
        </CardDescription>
      </CardHeader>
      <CardContent>
        {generatedImage ? (
          <div className="space-y-4">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg border-2 border-border bg-muted">
              <img
                src={generatedImage || "/placeholder.svg"}
                alt="Generated AI Model"
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  isGenerating ? "opacity-50" : "opacity-100"
                }`}
              />
              <div
                className={`absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px] transition-all duration-150 ${
                  isGenerating ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  <span className="text-xs font-medium text-white drop-shadow-md">
                    Revize ediliyor...
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onSave}
                className="flex-1 gap-2"
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Kaydet
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onReset} className="flex-1">
                Yeni Manken
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label htmlFor="revision">Mankeni Revize Et</Label>
              <div className="flex gap-2">
                <Input
                  id="revision"
                  placeholder="Örn: Daha zayıf yap, saçını sarı yap..."
                  value={revisionInstructions}
                  onChange={(e) => onRevisionChange(e.target.value)}
                  disabled={isGenerating}
                />
                <Button
                  onClick={onGenerate}
                  disabled={!revisionInstructions.trim() || isGenerating}
                  variant="secondary"
                >
                  <span className={isGenerating ? "" : "hidden"}>
                    Revize Ediliyor...
                  </span>
                  <span className={isGenerating ? "hidden" : ""}>
                    Revize Et
                  </span>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground italic">
                AI mevcut mankeni verdiğiniz talimatlara göre güncelleyecektir.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50">
            <div className="text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isGenerating
                  ? "AI mankeniniz oluşturuluyor..."
                  : "Manken özellikleri girin ve oluştur butonuna tıklayın"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
