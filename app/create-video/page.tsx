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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Video,
  Upload,
  Loader2,
  Download,
  Play,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export default function CreateVideoPage() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState([5]);
  const [motion, setMotion] = useState("orta");
  const [style, setStyle] = useState("profesyonel");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tryOnResult = sessionStorage.getItem("tryOnResult");
    if (tryOnResult) {
      setModelImage(tryOnResult);
      sessionStorage.removeItem("tryOnResult");
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModelImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!modelImage) return;

    setIsGenerating(true);
    // REMOVED: setGeneratedVideo(null) - Keeping the previous video to prevent unmounting crash

    try {
      console.log("[v0] Starting video generation request...");

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelImage,
          prompt,
          duration: duration[0],
          motion,
          style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[v0] Video generation failed:", data);
        throw new Error(data.error || "Bir hata oluştu");
      }

      console.log("[v0] Video generated successfully:", data);
      setGeneratedVideo(data.video);
    } catch (error) {
      console.error("[v0] Video generation error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Video oluşturulurken bir hata oluştu"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedVideo) return;

    try {
      const response = await fetch(generatedVideo);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stylescape-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("[v0] Download error:", error);
      alert("Video indirilemedi. Lütfen tekrar deneyin.");
    }
  };

  const brandPrompts = [
    {
      category: "E-Ticaret",
      prompts: [
        "Model 360 derece dönüyor, ürün detayları net görünüyor",
        "Model farklı açılardan poz veriyor, profesyonel ışıklandırma",
        "Yakın çekim ve tam boy çekim kombinasyonu, stüdyo ortamı",
      ],
    },
    {
      category: "Sosyal Medya",
      prompts: [
        "Model dinamik hareketlerle kıyafeti tanıtıyor, modern ve trendy",
        "Model yavaş hareketlerle ürünü gösteriyor, minimal arka plan",
        "Hızlı geçişlerle farklı pozlar, Instagram Reels stili",
      ],
    },
    {
      category: "Lookbook",
      prompts: [
        "Model podyumda yürüyor, fashion show havası",
        "Model zarif hareketlerle poz veriyor, high fashion",
        "Sinematik kamera hareketleri, lüks marka estetiği",
      ],
    },
    {
      category: "Reklam",
      prompts: [
        "Model ürünü vurgulayan hareketler yapıyor, reklam kampanyası tarzı",
        "Dramatik ışıklandırma ile model poz veriyor, billboard kalitesi",
        "Model ürünle etkileşimde, lifestyle content",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <Badge variant="outline" className="border-primary/50 text-primary">
              AI Powered Studio
            </Badge>
          </div>
          <h1 className="mb-2 text-4xl font-bold">
            Profesyonel Video Stüdyosu
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Markanız için profesyonel kalitede ürün tanıtım videoları oluşturun
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Görseli</CardTitle>
                <CardDescription>
                  Try-on sonucu veya oluşturduğunuz model görselini yükleyin
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
                          Model görseli yükleyin
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Label htmlFor="image-upload">
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent"
                    onClick={() => imageInputRef.current?.click()}
                    type="button"
                  >
                    <Upload className="h-4 w-4" />
                    Görsel Yükle
                  </Button>
                </Label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Video Ayarları</CardTitle>
                <CardDescription>
                  Kamera hareketi ve video özelliklerini belirleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Kamera Hareketi & Senaryo</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Örn: Model 360 derece dönüyor, ürün detayları net görünüyor..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="duration">Video Süresi</Label>
                    <span className="text-sm text-muted-foreground">
                      {duration[0]} saniye
                    </span>
                  </div>
                  <Slider
                    id="duration"
                    min={3}
                    max={15}
                    step={1}
                    value={duration}
                    onValueChange={setDuration}
                    className="w-full"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="motion">Hareket Hızı</Label>
                    <Select value={motion} onValueChange={setMotion}>
                      <SelectTrigger id="motion">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yavas">Yavaş - Zarif</SelectItem>
                        <SelectItem value="orta">Orta - Dengeli</SelectItem>
                        <SelectItem value="hizli">Hızlı - Dinamik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style">Video Stili</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger id="style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profesyonel">
                          Profesyonel Stüdyo
                        </SelectItem>
                        <SelectItem value="dinamik">
                          Dinamik - Enerji
                        </SelectItem>
                        <SelectItem value="minimal">Minimal - Şık</SelectItem>
                        <SelectItem value="yaratici">
                          Yaratıcı - Sanatsal
                        </SelectItem>
                        <SelectItem value="lux">Lüks - Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!modelImage || isGenerating}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Video className="h-5 w-5" />
                      Video Oluştur
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Marka İçin Hazır Senaryolar
                </CardTitle>
                <CardDescription>
                  Kullanım senaryonuza göre hazır promptlar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {brandPrompts.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {section.category}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {section.prompts.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => setPrompt(example)}
                          className="w-full rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-accent"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Video Önizleme</CardTitle>
                <CardDescription>
                  Oluşturulan profesyonel video içeriğiniz
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedVideo ? (
                  <div className="space-y-4">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-lg border-2 border-border bg-muted">
                      <video
                        src={generatedVideo}
                        controls
                        className={`h-full w-full object-cover transition-opacity duration-300 ${
                          isGenerating ? "opacity-50" : "opacity-100"
                        }`}
                      >
                        Tarayıcınız video etiketini desteklemiyor.
                      </video>
                      {isGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                            <p className="text-xs font-medium text-white drop-shadow-md">
                              Video güncelleniyor...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleDownload} className="flex-1 gap-2">
                        <Download className="h-4 w-4" />
                        İndir
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setGeneratedVideo(null)}
                        className="flex-1"
                      >
                        Yeni Video
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50">
                    <div className="text-center">
                      {isGenerating ? (
                        <>
                          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
                          <p className="font-medium text-muted-foreground">
                            Video üretiliyor...
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Bu işlem 1-2 dakika sürebilir
                          </p>
                        </>
                      ) : (
                        <>
                          <Play className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Görsel yükleyin ve video oluştur butonuna tıklayın
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Profesyonel Sonuçlar İçin İpuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  Yüksek çözünürlüklü model görseli kullanın
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  Kamera hareketini detaylı tanımlayın
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  E-ticaret için 5-10 saniye idealdir
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  Sosyal medya için hızlı ve dinamik tercih edin
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  Lookbook için sinematik ve yavaş hareketler
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">
                  Farklı stiller deneyerek markanıza uygun olanı bulun
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
