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
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Loader2,
  Download,
  RefreshCw,
  ImageIcon,
  Video,
  Lightbulb,
  Sparkles,
  Shirt,
  Camera,
  Wand2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Info,
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

  // Revision state
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionInstruction, setRevisionInstruction] = useState("");
  const [versionHistory, setVersionHistory] = useState<
    Array<{ version: number; image: string; instruction: string }>
  >([]);
  const [currentVersion, setCurrentVersion] = useState(0);

  // Gemini Fallback State
  const [fallbackDescription, setFallbackDescription] = useState<string | null>(
    null
  );

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
        console.error(
          "[v0] Supabase error detail:",
          JSON.stringify(error, null, 2)
        );
        throw error;
      }

      console.log("[v0] Successfully loaded models:", data?.length || 0);
      setSavedModels(data || []);
    } catch (error: any) {
      console.error("[v0] Load models error:", error);
      console.error("[v0] Error message:", error.message);
      console.error("[v0] Error hint:", error.hint);
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
    setResult(null);
    setFallbackDescription(null);

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

      if (data.isFallback) {
        setFallbackDescription(data.description);
        // Do not throw, just show fallback UI
      } else {
        setResult(data.image);
        // Initialize version history with first result
        setVersionHistory([
          { version: 1, image: data.image, instruction: "Initial generation" },
        ]);
        setCurrentVersion(1);
      }
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

  const handleRevise = async () => {
    if ((!result && !fallbackDescription) || !revisionInstruction.trim())
      return;

    setIsProcessing(true);

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
          previousResult: result || "fallback_placeholder_desc", // Send something if in fallback mode
          revisionInstructions: revisionInstruction,
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

      if (data.isFallback) {
        setFallbackDescription(data.description);
        alert(data.info || "Görüntü oluşturulamadı, ancak prompt güncellendi.");
      } else {
        const newVersion = currentVersion + 1;
        setResult(data.image);
        setVersionHistory([
          ...versionHistory,
          {
            version: newVersion,
            image: data.image,
            instruction: revisionInstruction,
          },
        ]);
        setCurrentVersion(newVersion);
        setRevisionInstruction("");
        setRevisionMode(false);
      }
    } catch (error) {
      console.error("[v0] Revision error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Revizyon sırasında bir hata oluştu"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFallbackDescription(null);
    setVersionHistory([]);
    setCurrentVersion(0);
    setRevisionMode(false);
    setRevisionInstruction("");
    // Immediately regenerate with the same inputs
    handleTryOn();
  };

  const navigateToVersion = (version: number) => {
    const versionData = versionHistory.find((v) => v.version === version);
    if (versionData) {
      setResult(versionData.image);
      setCurrentVersion(version);
    }
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main
        className="container mx-auto px-4 py-8 md:py-12"
        suppressHydrationWarning
      >
        <div className="mb-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-2 rounded-full bg-primary/10 mb-4">
            <Wand2 className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">
              Virtual Try-On Studio
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-primary to-gray-600 dark:from-white dark:via-primary dark:to-gray-300 bg-clip-text text-transparent">
            Sanal Kıyafet Deneme
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mankeniniz üzerinde kıyafetlerinizi profesyonel bir stüdyo
            kalitesinde deneyin.
          </p>
        </div>

        {/* Quick Presets */}
        <Card className="mb-8 border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800">
          <div className="h-1 bg-gradient-to-r from-primary/50 to-purple-600/50" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lightbulb className="h-5 w-5 text-primary" />
              Hızlı Stüdyo Ayarları
            </CardTitle>
            <CardDescription>
              Tek tıkla profesyonel çekim senaryosu seçin
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
                  className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                    selectedPreset === preset.name
                      ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/20"
                      : "border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 hover:border-primary/50"
                  }`}
                >
                  <h4 className="mb-1 font-semibold text-sm">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* 1. Model Selection */}
          <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-gray-200 dark:ring-gray-800 flex flex-col h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center mr-2 text-primary text-sm font-bold">
                  1
                </div>
                Manken Seçimi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="aspect-[3/4] overflow-hidden rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950/50 relative group">
                {modelImage ? (
                  <img
                    src={modelImage || "/placeholder.svg"}
                    alt="Model"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                      <ImageIcon className="h-8 w-8 text-primary/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Manken görseli bekleniyor
                    </p>
                  </div>
                )}
              </div>

              <Tabs defaultValue="saved" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="saved">Kaydedilenler</TabsTrigger>
                  <TabsTrigger value="upload">Yükle</TabsTrigger>
                </TabsList>

                <TabsContent value="saved" className="mt-0">
                  {isLoadingModels ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : savedModels.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Henüz kaydedilmiş manken yok
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[220px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white/40 dark:bg-gray-950/40">
                      <div className="space-y-2 p-2">
                        {savedModels.map((model) => (
                          <div
                            key={model.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectSavedModel(model)}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-2 text-left transition-all ${
                              selectedModel?.id === model.id
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            <img
                              src={model.image_url || "/placeholder.svg"}
                              alt={model.name}
                              className="h-12 w-12 rounded-md object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                            />
                            <div className="flex-1 overflow-hidden min-w-0">
                              <p className="truncate font-medium text-sm">
                                {model.name}
                              </p>
                              <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground mt-0.5">
                                <span>{model.gender}</span>
                                {model.clothing_size && (
                                  <span>• {model.clothing_size}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                <TabsContent value="upload" className="mt-0">
                  <input
                    ref={modelInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setModelImage)}
                    className="hidden"
                    id="model-upload"
                  />
                  <Label htmlFor="model-upload" className="block">
                    <div className="flex flex-col items-center justify-center h-[220px] rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                      <span className="text-sm font-medium">
                        Yeni Resim Seç
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        JPG, PNG (Max 10MB)
                      </span>
                    </div>
                  </Label>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 2. Clothing Upload */}
          <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-gray-200 dark:ring-gray-800 flex flex-col h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center mr-2 text-primary text-sm font-bold">
                  2
                </div>
                Kıyafet Yükle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="aspect-[3/4] overflow-hidden rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950/50 relative group">
                {clothingImage ? (
                  <img
                    src={clothingImage || "/placeholder.svg"}
                    alt="Clothing"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                      <Shirt className="h-8 w-8 text-primary/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Kıyafet görseli bekleniyor
                    </p>
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
              <Label htmlFor="clothing-upload" className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-dashed border-2 hover:border-primary hover:text-primary hover:bg-primary/5"
                  onClick={() => clothingInputRef.current?.click()}
                  type="button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Kıyafet Seç veya Sürükle
                </Button>
              </Label>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-xs leading-relaxed text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                <strong>İpucu:</strong> En iyi sonuç için kıyafetin düz bir
                zeminde veya askıda çekilmiş net bir fotoğrafını kullanın.
              </div>
            </CardContent>
          </Card>

          {/* 3. Result */}
          <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-gray-200 dark:ring-gray-800 flex flex-col h-full lg:row-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center mr-2 text-primary text-sm font-bold">
                  3
                </div>
                Sonuç
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black shadow-inner flex-1">
                {result ? (
                  <>
                    <img
                      src={result || "/placeholder.svg"}
                      alt="Try-on Result"
                      className={`h-full w-full object-cover transition-all duration-500 ${
                        isProcessing
                          ? "opacity-50 scale-105 blur-sm"
                          : "opacity-100 scale-100 blur-0"
                      }`}
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 rounded-full bg-white/90 shadow-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                          <p className="text-sm font-medium text-white drop-shadow-md bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                            Yapay Zeka İşliyor...
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : fallbackDescription ? (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground bg-amber-50 dark:bg-amber-900/20">
                    <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-800/30 mb-4">
                      <Info className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                      Image Generation requires Billing
                    </p>
                    <p className="text-sm mb-4">
                      Here is the detailed prompt that would be used:
                    </p>
                    <div className="w-full p-3 bg-white dark:bg-gray-950 rounded border border-amber-200 dark:border-amber-800 text-xs text-left overflow-auto max-h-[200px]">
                      {fallbackDescription}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p>Sihirli dokunuş uygulanıyor...</p>
                      </div>
                    ) : (
                      <>
                        <Sparkles className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-700" />
                        <p>Sonuç burada görünecek</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 mt-auto">
                {/* Action Button */}
                <Button
                  onClick={handleTryOn}
                  disabled={!modelImage || !clothingImage || isProcessing}
                  size="lg"
                  className="w-full h-14 text-lg font-medium shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all rounded-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-2" />
                      Try-On Başlat
                    </>
                  )}
                </Button>

                {!modelImage || !clothingImage ? (
                  <p className="text-xs text-center text-muted-foreground">
                    Başlamak için manken ve kıyafet seçin
                  </p>
                ) : null}

                {(result || fallbackDescription) && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Version Navigator */}
                    {versionHistory.length > 1 && (
                      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateToVersion(currentVersion - 1)}
                          disabled={currentVersion <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                          v{currentVersion} / {versionHistory.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateToVersion(currentVersion + 1)}
                          disabled={currentVersion >= versionHistory.length}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Revision Panel */}
                    {revisionMode ? (
                      <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Label
                          htmlFor="revision-instruction"
                          className="text-sm font-medium"
                        >
                          Revizyon Talimatı
                        </Label>
                        <Textarea
                          id="revision-instruction"
                          value={revisionInstruction}
                          onChange={(e) =>
                            setRevisionInstruction(e.target.value)
                          }
                          placeholder="Örn: 'make hair blonde', 'better lighting', 'brighter colors'"
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleRevise}
                            disabled={isProcessing}
                            className="flex-1"
                          >
                            <Wand2 className="h-4 w-4 mr-2" />
                            Revize Et
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRevisionMode(false);
                              setRevisionInstruction("");
                            }}
                          >
                            İptal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setRevisionMode(true)}
                        variant="outline"
                        className="w-full h-11"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Revize Et (v{currentVersion})
                      </Button>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="h-11"
                        disabled={!result}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        İndir
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        className="h-11"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Yeniden
                      </Button>
                      <Button
                        onClick={handleCreateVideo}
                        disabled={!result}
                        className="col-span-2 h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Video Oluştur
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Controls - Takes up 2 cols width under Model/Clothing */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Profesyonel Stüdyo Kontrolleri
                </CardTitle>
                <CardDescription>
                  Çekiminizi özelleştirin ve marka kimliğinize uygun sonuçlar
                  elde edin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-medium">Poz</Label>
                    <Select value={pose} onValueChange={setPose}>
                      <SelectTrigger className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700">
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
                        <SelectItem value="three-quarter">
                          3/4 Yan Duruş
                        </SelectItem>
                        <SelectItem value="walking-stride">
                          Yürüyüş Adımı
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">Çekim Açısı</Label>
                    <Select value={angle} onValueChange={setAngle}>
                      <SelectTrigger className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700">
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
                    <Label className="font-medium">Işıklandırma</Label>
                    <Select value={lighting} onValueChange={setLighting}>
                      <SelectTrigger className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700">
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
                        <SelectItem value="backlit-rim">
                          Arkadan Işıklı
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">Ortam</Label>
                    <Select value={environment} onValueChange={setEnvironment}>
                      <SelectTrigger className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700">
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
                          Şehir Yaşamı
                        </SelectItem>
                        <SelectItem value="elegant-backdrop">
                          Zarif Fon
                        </SelectItem>
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

            {/* Tips Section */}
            <Card className="mt-8 border-primary/20 bg-primary/5 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Profesyonel Sonuçlar İçin İpuçları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-xs text-muted-foreground">
                  <li className="flex gap-2 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                    Yüksek çözünürlüklü resimler kullanın (min 1080p)
                  </li>
                  <li className="flex gap-2 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                    Manken tam vücut veya üst gövde görünümünde olsun
                  </li>
                  <li className="flex gap-2 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                    Kıyafet resmi düz, iyi ışıklandırılmış ve net olmalı
                  </li>
                  <li className="flex gap-2 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                    Stüdyo ayarlarını marka kimliğinize göre seçin
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
