"use client";

import type React from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Loader2,
  Download,
  Save,
  Trash2,
  Layers,
  Video,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getSupabase, type Model, type Outfit } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

type ClothingLayer = {
  type: "top" | "bottom" | "outerwear" | "accessories";
  image: string;
  label: string;
};

const STUDIO_PRESETS = [
  {
    name: "E-Ticaret Klasik",
    pose: "front-straight",
    angle: "eye-level",
    lighting: "soft-even",
    environment: "white-backdrop",
  },
  {
    name: "Editorial Lookbook",
    pose: "casual-confident",
    angle: "slightly-above",
    lighting: "dramatic-side",
    environment: "minimal-studio",
  },
  {
    name: "Sosyal Medya",
    pose: "dynamic-movement",
    angle: "eye-level",
    lighting: "natural-bright",
    environment: "urban-lifestyle",
  },
];

export default function MixMatchPage() {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [savedModels, setSavedModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [layers, setLayers] = useState<ClothingLayer[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [outfitName, setOutfitName] = useState("");
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);

  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [pose, setPose] = useState<string>("front-straight");
  const [angle, setAngle] = useState<string>("eye-level");
  const [lighting, setLighting] = useState<string>("soft-even");
  const [environment, setEnvironment] = useState<string>("white-backdrop");

  const topInputRef = useRef<HTMLInputElement>(null);
  const bottomInputRef = useRef<HTMLInputElement>(null);
  const outerwearInputRef = useRef<HTMLInputElement>(null);
  const accessoriesInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadSavedModels();
    loadSavedOutfits();
  }, []);

  const loadSavedModels = async () => {
    setIsLoadingModels(true);
    console.log("[v0] Starting to load saved models...");
    try {
      const supabase = getSupabase();
      console.log("[v0] Supabase client created, fetching models...");
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("[v0] Supabase response:", { data, error });
      if (error) throw error;
      console.log("[v0] Successfully loaded models:", data?.length || 0);
      setSavedModels(data || []);
    } catch (error) {
      console.error("[v0] Error loading models:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[v0] Error details:", errorMessage);
      setSavedModels([]);
    } finally {
      console.log("[v0] Finished loading models, setting loading to false");
      setIsLoadingModels(false);
    }
  };

  const loadSavedOutfits = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("outfits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedOutfits(data || []);
    } catch (error) {
      console.error("Error loading outfits:", error);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: ClothingLayer["type"]
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      setLayers((prev) => {
        const filtered = prev.filter((l) => l.type !== type);
        return [
          ...filtered,
          {
            type,
            image: imageData,
            label: file.name,
          },
        ];
      });
    };
    reader.readAsDataURL(file);
  };

  const removeLayer = (type: ClothingLayer["type"]) => {
    setLayers((prev) => prev.filter((l) => l.type !== type));
  };

  const handlePresetChange = (presetName: string) => {
    const preset = STUDIO_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setSelectedPreset(presetName);
      setPose(preset.pose);
      setAngle(preset.angle);
      setLighting(preset.lighting);
      setEnvironment(preset.environment);
    }
  };

  const handleGenerate = async () => {
    if (!selectedModel || layers.length === 0) {
      alert("Lütfen bir manken ve en az bir kıyafet seçin");
      return;
    }

    setIsProcessing(true);
    // REMOVED: setResult(null); - Keeping the image to prevent unmounting and provide continuity

    try {
      const response = await fetch("/api/mix-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelImage: selectedModel.image_url,
          modelContext: selectedModel.context_prompt,
          layers: layers,
          studioSettings: {
            pose,
            angle,
            lighting,
            environment,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Mix & Match failed";
        throw new Error(errorMessage);
      }

      setResult(data.resultImage);
    } catch (error) {
      console.error("Mix & Match error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
      alert(`Kombin oluşturulamadı: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveOutfit = async () => {
    if (!result || !outfitName.trim()) {
      alert("Lütfen kombin oluşturun ve bir isim verin");
      return;
    }

    try {
      const supabase = getSupabase();
      const topLayer = layers.find((l) => l.type === "top");
      const bottomLayer = layers.find((l) => l.type === "bottom");
      const outerwearLayer = layers.find((l) => l.type === "outerwear");
      const accessoriesLayer = layers.find((l) => l.type === "accessories");

      const { error } = await supabase.from("outfits").insert({
        name: outfitName,
        model_id: selectedModel?.id || null,
        top_clothing_url: topLayer?.image || null,
        bottom_clothing_url: bottomLayer?.image || null,
        outerwear_clothing_url: outerwearLayer?.image || null,
        accessories_clothing_url: accessoriesLayer?.image || null,
        result_image_url: result,
        studio_settings: { pose, angle, lighting, environment },
      });

      if (error) throw error;

      alert("Kombin kaydedildi!");
      setOutfitName("");
      loadSavedOutfits();
    } catch (error) {
      console.error("Error saving outfit:", error);
      alert("Kombin kaydedilemedi");
    }
  };

  const handleLoadOutfit = (outfit: Outfit) => {
    const newLayers: ClothingLayer[] = [];

    if (outfit.top_clothing_url) {
      newLayers.push({
        type: "top",
        image: outfit.top_clothing_url,
        label: "Üst",
      });
    }
    if (outfit.bottom_clothing_url) {
      newLayers.push({
        type: "bottom",
        image: outfit.bottom_clothing_url,
        label: "Alt",
      });
    }
    if (outfit.outerwear_clothing_url) {
      newLayers.push({
        type: "outerwear",
        image: outfit.outerwear_clothing_url,
        label: "Dış Giyim",
      });
    }
    if (outfit.accessories_clothing_url) {
      newLayers.push({
        type: "accessories",
        image: outfit.accessories_clothing_url,
        label: "Aksesuar",
      });
    }

    setLayers(newLayers);
    setResult(outfit.result_image_url);
    setOutfitName(outfit.name);

    if (outfit.studio_settings) {
      setPose(outfit.studio_settings.pose || "front-straight");
      setAngle(outfit.studio_settings.angle || "eye-level");
      setLighting(outfit.studio_settings.lighting || "soft-even");
      setEnvironment(outfit.studio_settings.environment || "white-backdrop");
    }
  };

  const handleDeleteOutfit = async (id: string) => {
    if (!confirm("Bu kombini silmek istediğinize emin misiniz?")) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("outfits").delete().eq("id", id);

      if (error) throw error;
      loadSavedOutfits();
    } catch (error) {
      console.error("Error deleting outfit:", error);
      alert("Kombin silinemedi");
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const link = document.createElement("a");
    link.href = result;
    link.download = `stylescape-outfit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateVideo = () => {
    if (!result) return;
    sessionStorage.setItem("tryOnResult", result);
    router.push("/create-video");
  };

  const getLayerLabel = (type: ClothingLayer["type"]) => {
    const labels = {
      top: "Üst Giyim",
      bottom: "Alt Giyim",
      outerwear: "Dış Giyim",
      accessories: "Aksesuar",
    };
    return labels[type];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold">
            Mix & Match Kombin Builder
          </h1>
          <p className="text-muted-foreground">
            Birden fazla kıyafeti aynı anda deneyin ve kombin oluşturun
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Manken Seç</CardTitle>
                <CardDescription>
                  Daha önce oluşturduğunuz bir mankeni seçin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="saved">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="saved">
                      Kaydedilmiş Mankenler
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="saved" className="mt-4">
                    {isLoadingModels ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : savedModels.length === 0 ? (
                      <p className="text-center text-muted-foreground">
                        Henüz kaydedilmiş manken yok
                      </p>
                    ) : (
                      <ScrollArea className="h-[300px]">
                        <div className="grid gap-3">
                          {savedModels.map((model) => (
                            <Card
                              key={model.id}
                              className={`cursor-pointer transition-all ${
                                selectedModel?.id === model.id
                                  ? "ring-2 ring-primary"
                                  : ""
                              }`}
                              onClick={() => setSelectedModel(model)}
                            >
                              <CardContent className="flex items-center gap-4 p-4">
                                <img
                                  src={
                                    model.image_url ||
                                    "/placeholder.svg?height=80&width=80"
                                  }
                                  alt={model.name}
                                  className="h-20 w-20 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                  <h3 className="font-semibold">
                                    {model.name}
                                  </h3>
                                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                                    {model.gender && (
                                      <span>{model.gender}</span>
                                    )}
                                    {model.clothing_size && (
                                      <span>
                                        • Beden: {model.clothing_size}
                                      </span>
                                    )}
                                    {model.height && (
                                      <span>• Boy: {model.height}</span>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Kıyafet Katmanları</CardTitle>
                <CardDescription>
                  İstediğiniz katmanları ekleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(["top", "bottom", "outerwear", "accessories"] as const).map(
                  (type) => {
                    const layer = layers.find((l) => l.type === type);
                    const inputRef = {
                      top: topInputRef,
                      bottom: bottomInputRef,
                      outerwear: outerwearInputRef,
                      accessories: accessoriesInputRef,
                    }[type];

                    return (
                      <div key={type} className="space-y-2">
                        <Label>{getLayerLabel(type)}</Label>
                        <div className="flex gap-2">
                          <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, type)}
                          />
                          <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => inputRef.current?.click()}
                            disabled={isProcessing}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {layer ? "Değiştir" : "Yükle"}
                          </Button>
                          {layer && (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removeLayer(type)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {layer && (
                          <div className="relative mt-2 overflow-hidden rounded-lg border">
                            <img
                              src={layer.image || "/placeholder.svg"}
                              alt={layer.label}
                              className="h-24 w-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white">
                              {layer.label}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Stüdyo Ayarları</CardTitle>
                <CardDescription>
                  Çekim stilleri ve ortam ayarları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hazır Preset</Label>
                  <Select
                    value={selectedPreset}
                    onValueChange={handlePresetChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Preset seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDIO_PRESETS.map((preset) => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Poz</Label>
                    <Select value={pose} onValueChange={setPose}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="front-straight">Düz Ön</SelectItem>
                        <SelectItem value="casual-confident">
                          Rahat & Kendinden Emin
                        </SelectItem>
                        <SelectItem value="dynamic-movement">
                          Dinamik Hareket
                        </SelectItem>
                        <SelectItem value="elegant-poised">
                          Zarif & Duruşlu
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Çekim Açısı</Label>
                    <Select value={angle} onValueChange={setAngle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eye-level">Göz Hizası</SelectItem>
                        <SelectItem value="slightly-above">
                          Hafif Yukarıdan
                        </SelectItem>
                        <SelectItem value="slightly-below">
                          Hafif Aşağıdan
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Işıklandırma</Label>
                    <Select value={lighting} onValueChange={setLighting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soft-even">
                          Yumuşak & Dengeli
                        </SelectItem>
                        <SelectItem value="dramatic-side">
                          Dramatik Yan Işık
                        </SelectItem>
                        <SelectItem value="natural-bright">
                          Doğal Parlak
                        </SelectItem>
                        <SelectItem value="soft-glamour">
                          Yumuşak Glamour
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ortam</Label>
                    <Select value={environment} onValueChange={setEnvironment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="white-backdrop">
                          Beyaz Fon
                        </SelectItem>
                        <SelectItem value="minimal-studio">
                          Minimal Stüdyo
                        </SelectItem>
                        <SelectItem value="urban-lifestyle">
                          Urban Lifestyle
                        </SelectItem>
                        <SelectItem value="elegant-backdrop">
                          Zarif Fon
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={!selectedModel || layers.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Kombin Oluşturuluyor (AI ile)...
                </>
              ) : (
                <>
                  <Layers className="mr-2 h-5 w-5" />
                  Kombin Oluştur
                </>
              )}
            </Button>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sonuç</CardTitle>
                <CardDescription>Oluşturulan kombininiz</CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-lg border">
                      <img
                        src={result || "/placeholder.svg"}
                        alt="Kombin sonucu"
                        className={`w-full transition-opacity duration-300 ${
                          isProcessing ? "opacity-50" : "opacity-100"
                        }`}
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                            <p className="text-xs font-medium text-white drop-shadow-md">
                              AI ile kombin oluşturuluyor...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="outfit-name">Kombin Adı</Label>
                      <Input
                        id="outfit-name"
                        value={outfitName}
                        onChange={(e) => setOutfitName(e.target.value)}
                        placeholder="Örn: Yaz Kombini 2024"
                      />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <Button variant="outline" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        İndir
                      </Button>
                      <Button variant="outline" onClick={handleSaveOutfit}>
                        <Save className="mr-2 h-4 w-4" />
                        Kaydet
                      </Button>
                      <Button variant="outline" onClick={handleCreateVideo}>
                        <Video className="mr-2 h-4 w-4" />
                        Video Yap
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center rounded-lg border-2 border-dashed">
                    <div className="text-center">
                      <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Kombin oluşturmak için yukarıdaki formu doldurun
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kaydedilmiş Kombinler</CardTitle>
                <CardDescription>
                  Daha önce oluşturduğunuz kombinler
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedOutfits.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    Henüz kaydedilmiş kombin yok
                  </p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="grid gap-3">
                      {savedOutfits.map((outfit) => (
                        <Card key={outfit.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex gap-3">
                              {outfit.result_image_url && (
                                <img
                                  src={
                                    outfit.result_image_url ||
                                    "/placeholder.svg"
                                  }
                                  alt={outfit.name}
                                  className="h-32 w-24 object-cover"
                                />
                              )}
                              <div className="flex flex-1 flex-col justify-between p-3">
                                <div>
                                  <h3 className="font-semibold">
                                    {outfit.name}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(
                                      outfit.created_at
                                    ).toLocaleDateString("tr-TR")}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleLoadOutfit(outfit)}
                                  >
                                    Yükle
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleDeleteOutfit(outfit.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
