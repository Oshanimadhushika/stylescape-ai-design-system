"use client";

import type React from "react";
import { useRouter } from "next/navigation";

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
import {
  Upload,
  Loader2,
  Download,
  RefreshCw,
  ImageIcon,
  Video,
  Lightbulb,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getSupabase, type Model } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STUDIO_PRESETS = [
  {
    name: "E-Ticaret Klasik",
    pose: "front-straight",
    angle: "eye-level",
    lighting: "soft-even",
    environment: "white-backdrop",
    description: "Ürün odaklı, profesyonel katalog çekimi",
  },
  {
    name: "Editorial Lookbook",
    pose: "casual-confident",
    angle: "slightly-above",
    lighting: "dramatic-side",
    environment: "minimal-studio",
    description: "Moda dergisi tarzı, şık ve etkileyici",
  },
  {
    name: "Sosyal Medya Dinamik",
    pose: "dynamic-movement",
    angle: "eye-level",
    lighting: "natural-bright",
    environment: "urban-lifestyle",
    description: "Instagram ve TikTok için canlı içerik",
  },
  {
    name: "Lüks Premium",
    pose: "elegant-poised",
    angle: "slightly-below",
    lighting: "soft-glamour",
    environment: "elegant-backdrop",
    description: "Lüks marka imajı için sofistike görünüm",
  },
  {
    name: "Lifestyle Natural",
    pose: "relaxed-natural",
    angle: "eye-level",
    lighting: "natural-golden",
    environment: "outdoor-natural",
    description: "Doğal ve samimi, yaşam tarzı odaklı",
  },
];

export default function TryOnPage() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedModels, setSavedModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [pose, setPose] = useState<string>("front-straight");
  const [angle, setAngle] = useState<string>("eye-level");
  const [lighting, setLighting] = useState<string>("soft-even");
  const [environment, setEnvironment] = useState<string>("white-backdrop");

  const modelInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadSavedModels();
  }, []);

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

  const loadSavedModels = async () => {
    console.log("[v0] Starting to load saved models...");
    setIsLoadingModels(true);
    try {
      const supabase = getSupabase();
      console.log("[v0] Supabase client created, fetching models...");

      const { data, error } = await supabase
        .from("models")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("[v0] Supabase response:", { data, error });

      if (error) {
        console.error("[v0] Supabase error:", error);
        throw error;
      }

      console.log("[v0] Successfully loaded models:", data?.length || 0);
      setSavedModels(data || []);
    } catch (error) {
      console.error("[v0] Load models error:", error);
      setSavedModels([]);
    } finally {
      console.log("[v0] Finished loading models, setting loading to false");
      setIsLoadingModels(false);
    }
  };

  const handleSelectSavedModel = (model: Model) => {
    setSelectedModel(model);
    setModelImage(model.image_url);
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setSelectedModel(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = async () => {
    if (!modelImage || !clothingImage) return;

    setIsProcessing(true);
    // REMOVED: setResult(null); - Keeping the previous result to prevent unmounting crash

    try {
      const modelContext = selectedModel?.context_prompt || null;

      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelImage,
          clothingImage,
          modelContext,
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
        throw new Error(data.error || "Bir hata oluştu");
      }

      setResult(data.result);
    } catch (error) {
      console.error("[v0] Try-on error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Try-on işlemi sırasında bir hata oluştu"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setModelImage(null);
    setClothingImage(null);
    setResult(null);
    setSelectedModel(null);
    setSelectedPreset("");
    setPose("front-straight");
    setAngle("eye-level");
    setLighting("soft-even");
    setEnvironment("white-backdrop");
    if (modelInputRef.current) modelInputRef.current.value = "";
    if (clothingInputRef.current) clothingInputRef.current.value = "";
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result;
    link.download = `stylescape-tryon-${Date.now()}.png`;
    link.click();
  };

  const handleCreateVideo = () => {
    if (!result) return;
    sessionStorage.setItem("tryOnResult", result);
    router.push("/create-video");
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold">Virtual Try-On Studio</h1>
          <p className="text-muted-foreground leading-relaxed">
            Profesyonel çekim kontrolleri ile marka kalitesinde görsel üretin
          </p>
        </div>

        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Hızlı Stüdyo Ayarları
            </CardTitle>
            <CardDescription>
              Kullanım senaryonuza göre önceden hazırlanmış profesyonel ayarlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {STUDIO_PRESETS.map((preset) => (
                <div
                  key={preset.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => handlePresetChange(preset.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handlePresetChange(preset.name);
                    }
                  }}
                  className={`cursor-pointer rounded-lg border p-4 text-left transition-all hover:border-primary hover:shadow-md ${
                    selectedPreset === preset.name
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-background"
                  }`}
                >
                  <h4 className="mb-1 font-semibold">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Model Upload/Select */}
          <Card>
            <CardHeader>
              <CardTitle>1. Manken Seç</CardTitle>
              <CardDescription>
                Kaydedilmiş manken seçin veya yeni resim yükleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[2/3] overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted">
                {modelImage ? (
                  <img
                    src={modelImage || "/placeholder.svg"}
                    alt="Model"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Manken seçin veya yükleyin
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Tabs defaultValue="saved" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="saved">Kaydedilenler</TabsTrigger>
                  <TabsTrigger value="upload">Yükle</TabsTrigger>
                </TabsList>

                <TabsContent value="saved" className="space-y-2">
                  {isLoadingModels ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : savedModels.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Henüz kaydedilmiş manken yok
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px] rounded-md border border-border">
                      <div className="space-y-2 p-2">
                        {savedModels.map((model) => (
                          <div
                            key={model.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectSavedModel(model)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleSelectSavedModel(model);
                              }
                            }}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                              selectedModel?.id === model.id
                                ? "border-primary bg-accent"
                                : "border-border"
                            }`}
                          >
                            <img
                              src={model.image_url || "/placeholder.svg"}
                              alt={model.name}
                              className="h-16 w-12 rounded object-cover"
                            />
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate font-medium">
                                {model.name}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                                <span>{model.gender}</span>
                                {model.clothing_size && (
                                  <>
                                    <span>•</span>
                                    <span>Beden: {model.clothing_size}</span>
                                  </>
                                )}
                                {model.height && (
                                  <>
                                    <span>•</span>
                                    <span>Boy: {model.height}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                <TabsContent value="upload">
                  <input
                    ref={modelInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setModelImage)}
                    className="hidden"
                    id="model-upload"
                  />
                  <Label htmlFor="model-upload">
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-transparent"
                      onClick={() => modelInputRef.current?.click()}
                      type="button"
                    >
                      <Upload className="h-4 w-4" />
                      Manken Yükle
                    </Button>
                  </Label>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Clothing Upload */}
          <Card>
            <CardHeader>
              <CardTitle>2. Kıyafet Yükle</CardTitle>
              <CardDescription>
                Denemek istediğiniz kıyafet resmini yükleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[2/3] overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted">
                {clothingImage ? (
                  <img
                    src={clothingImage || "/placeholder.svg"}
                    alt="Clothing"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Kıyafet resmi yükleyin
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={clothingInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, setClothingImage)}
                className="hidden"
                id="clothing-upload"
              />
              <Label htmlFor="clothing-upload">
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                  onClick={() => clothingInputRef.current?.click()}
                  type="button"
                >
                  <Upload className="h-4 w-4" />
                  Kıyafet Yükle
                </Button>
              </Label>
            </CardContent>
          </Card>

          {/* Result */}
          <Card>
            <CardHeader>
              <CardTitle>3. Sonuç</CardTitle>
              <CardDescription>
                Try-on sonucunuz burada görünecek
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border-2 border-border bg-muted">
                {result ? (
                  <>
                    <img
                      src={result || "/placeholder.svg"}
                      alt="Try-on Result"
                      className={`h-full w-full object-cover transition-opacity duration-300 ${
                        isProcessing ? "opacity-50" : "opacity-100"
                      }`}
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                          <p className="text-xs font-medium text-white drop-shadow-md">
                            Güncelleniyor...
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {isProcessing
                          ? "İşleniyor..."
                          : "Sonuç burada görünecek"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {result && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="flex-1 gap-2 bg-transparent"
                    >
                      <Download className="h-4 w-4" />
                      İndir
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="flex-1 gap-2 bg-transparent"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Yeniden
                    </Button>
                  </div>
                  <Button
                    onClick={handleCreateVideo}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Video className="h-5 w-5" />
                    Video Oluştur
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Profesyonel Stüdyo Kontrolleri</CardTitle>
            <CardDescription>
              Çekiminizi özelleştirin ve marka kimliğinize uygun sonuçlar elde
              edin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Poz</Label>
                <Select value={pose} onValueChange={setPose}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front-straight">Ön Düz</SelectItem>
                    <SelectItem value="casual-confident">
                      Rahat & Özgüvenli
                    </SelectItem>
                    <SelectItem value="dynamic-movement">
                      Dinamik Hareket
                    </SelectItem>
                    <SelectItem value="elegant-poised">
                      Zarif & Duruşlu
                    </SelectItem>
                    <SelectItem value="relaxed-natural">
                      Rahat & Doğal
                    </SelectItem>
                    <SelectItem value="three-quarter">3/4 Yan Duruş</SelectItem>
                    <SelectItem value="walking-stride">
                      Yürüyüş Adımı
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
                    <SelectItem value="high-angle">Yüksek Açı</SelectItem>
                    <SelectItem value="low-angle">Alçak Açı</SelectItem>
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
                    <SelectItem value="soft-even">Yumuşak & Dengeli</SelectItem>
                    <SelectItem value="dramatic-side">
                      Dramatik Yan Işık
                    </SelectItem>
                    <SelectItem value="natural-bright">
                      Doğal & Parlak
                    </SelectItem>
                    <SelectItem value="soft-glamour">
                      Yumuşak Glamour
                    </SelectItem>
                    <SelectItem value="natural-golden">
                      Doğal Altın Saat
                    </SelectItem>
                    <SelectItem value="studio-professional">
                      Stüdyo Profesyonel
                    </SelectItem>
                    <SelectItem value="backlit-rim">Arkadan Işıklı</SelectItem>
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
                    <SelectItem value="white-backdrop">Beyaz Fon</SelectItem>
                    <SelectItem value="minimal-studio">
                      Minimal Stüdyo
                    </SelectItem>
                    <SelectItem value="urban-lifestyle">
                      Şehir Yaşamı
                    </SelectItem>
                    <SelectItem value="elegant-backdrop">Zarif Fon</SelectItem>
                    <SelectItem value="outdoor-natural">
                      Açık Hava Doğal
                    </SelectItem>
                    <SelectItem value="neutral-gray">Nötr Gri</SelectItem>
                    <SelectItem value="luxury-interior">
                      Lüks İç Mekan
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            onClick={handleTryOn}
            disabled={!modelImage || !clothingImage || isProcessing}
            size="lg"
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5" />
                Try-On Uygula
              </>
            )}
          </Button>

          {!modelImage || !clothingImage ? (
            <p className="text-sm text-muted-foreground">
              Devam etmek için hem manken hem de kıyafet resmi yükleyin
            </p>
          ) : null}
        </div>

        {/* Tips Section */}
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Profesyonel Sonuçlar İçin İpuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  Yüksek çözünürlüklü resimler kullanın (min 1080p)
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  Manken tam vücut veya üst gövde görünümünde olsun
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  Kıyafet resmi düz, iyi ışıklandırılmış ve net olmalı
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  Stüdyo ayarlarını marka kimliğinize göre seçin
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  Tutarlılık için kaydedilmiş mankenleri tercih edin
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  Hızlı başlangıç için hazır preset'leri kullanın
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
