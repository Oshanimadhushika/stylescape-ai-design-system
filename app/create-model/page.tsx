"use client";

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
import { Sparkles, Loader2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/supabase";

export default function CreateModelPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState("kadın");
  const [style, setStyle] = useState("modern");
  const [height, setHeight] = useState("orta");
  const [bodyType, setBodyType] = useState("atletik");
  const [clothingSize, setClothingSize] = useState("38-40");
  const [skinTone, setSkinTone] = useState("orta");
  const [hairColor, setHairColor] = useState("kahverengi");
  const [hairStyle, setHairStyle] = useState("uzun-dalgalı");
  const [ageRange, setAgeRange] = useState("25-30");
  const [pose, setPose] = useState("dik-duruş");
  const [environment, setEnvironment] = useState("stüdyo-beyaz");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [revisionInstructions, setRevisionInstructions] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    // REMOVED: setGeneratedImage(null); - Keeping the image to prevent unmounting and provide continuity

    try {
      const response = await fetch("/api/generate-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          gender,
          style,
          height,
          bodyType,
          clothingSize,
          skinTone,
          hairColor,
          hairStyle,
          ageRange,
          pose,
          environment,
          lastGeneratedImage: generatedImage,
          revisionInstructions: revisionInstructions.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      setGeneratedImage(data.image);
    } catch (error) {
      console.error("[v0] Generation error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Görsel oluşturulurken bir hata oluştu"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedImage || !name.trim()) {
      alert("Lütfen manken ismi girin");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = getSupabase();

      const contextPrompt = `Gender: ${gender}, Height: ${height}, Body: ${bodyType}, Size: ${clothingSize}, Skin: ${skinTone}, Hair: ${hairColor} ${hairStyle}, Age: ${ageRange}, Pose: ${pose}, Environment: ${environment}`;

      const { error } = await supabase.from("models").insert({
        name: name.trim(),
        description,
        gender,
        style,
        height,
        body_type: bodyType,
        clothing_size: clothingSize,
        skin_tone: skinTone,
        hair_color: hairColor,
        hair_style: hairStyle,
        age_range: ageRange,
        pose,
        environment,
        context_prompt: contextPrompt,
        image_url: generatedImage,
      });

      if (error) throw error;

      alert("Manken başarıyla kaydedildi!");
      // Reset form
      setName("");
      setDescription("");
      setGeneratedImage(null);
    } catch (error) {
      console.error("[v0] Save error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Manken kaydedilirken bir hata oluştu"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    // In real app, this would trigger actual download
    alert("İndirme özelliği yakında eklenecek!");
  };

  const examplePrompts = [
    "25 yaşında, uzun kumral saçlı, zarif duruşlu kadın model",
    "Atletik yapılı, kısa saçlı, modern erkek model",
    "Orta boylu, kahverengi gözlü, profesyonel görünümlü kadın",
    "Uzun boylu, koyu saçlı, karizmatik erkek model",
  ];

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12" suppressHydrationWarning>
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold">AI Manken Oluştur</h1>
          <p className="text-muted-foreground leading-relaxed">
            Detaylı özellikleriyle tutarlı AI mankenleri oluşturun
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
                <CardDescription>
                  Mankenin temel özelliklerini belirleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Manken İsmi *</Label>
                  <Input
                    id="name"
                    placeholder="Örn: Elif Model, Ahmet Manken..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Genel Açıklama</Label>
                  <Textarea
                    id="description"
                    placeholder="Örn: Profesyonel görünümlü, zarif duruşlu moda mankeni..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Cinsiyet</Label>
                    <Select
                      value={gender}
                      onValueChange={(val) => {
                        setGender(val);
                        // Reset clothing size when gender changes to avoid mismatch
                        if (val === "erkek") {
                          setClothingSize("L (52-54)");
                        } else {
                          setClothingSize("38-40");
                        }
                      }}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kadın">Kadın</SelectItem>
                        <SelectItem value="erkek">Erkek</SelectItem>
                        <SelectItem value="unisex">Unisex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ageRange">Yaş Aralığı</Label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger id="ageRange">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18-22">18-22</SelectItem>
                        <SelectItem value="23-27">23-27</SelectItem>
                        <SelectItem value="28-32">28-32</SelectItem>
                        <SelectItem value="33-40">33-40</SelectItem>
                        <SelectItem value="40+">40+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fiziksel Özellikler</CardTitle>
                <CardDescription>
                  Tutarlılık için detaylı fiziksel özellikleri belirleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="height">Boy</Label>
                    <Select value={height} onValueChange={setHeight}>
                      <SelectTrigger id="height">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kısa">Kısa (160cm altı)</SelectItem>
                        <SelectItem value="orta">Orta (160-175cm)</SelectItem>
                        <SelectItem value="uzun">Uzun (175cm+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bodyType">Vücut Tipi</Label>
                    <Select value={bodyType} onValueChange={setBodyType}>
                      <SelectTrigger id="bodyType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ince">İnce</SelectItem>
                        <SelectItem value="atletik">Atletik</SelectItem>
                        <SelectItem value="orta">Orta</SelectItem>
                        <SelectItem value="dolgun">Dolgun</SelectItem>
                        <SelectItem value="kaslı">Kaslı</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clothingSize">Beden</Label>
                    {gender === "erkek" ? (
                      <Select
                        key="male-size"
                        value={clothingSize}
                        onValueChange={setClothingSize}
                      >
                        <SelectTrigger id="clothingSize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S (46)">S (46)</SelectItem>
                          <SelectItem value="M (48-50)">M (48-50)</SelectItem>
                          <SelectItem value="L (52-54)">L (52-54)</SelectItem>
                          <SelectItem value="XL (56)">XL (56)</SelectItem>
                          <SelectItem value="XXL (58+)">XXL (58+)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select
                        key="female-size"
                        value={clothingSize}
                        onValueChange={setClothingSize}
                      >
                        <SelectTrigger id="clothingSize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="34-36">34-36 (XS-S)</SelectItem>
                          <SelectItem value="36-38">36-38 (S)</SelectItem>
                          <SelectItem value="38-40">38-40 (M)</SelectItem>
                          <SelectItem value="40-42">40-42 (L)</SelectItem>
                          <SelectItem value="42-44">42-44 (XL)</SelectItem>
                          <SelectItem value="44+">44+ (XXL)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skinTone">Ten Rengi</Label>
                    <Select value={skinTone} onValueChange={setSkinTone}>
                      <SelectTrigger id="skinTone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="açık">Açık</SelectItem>
                        <SelectItem value="orta">Orta</SelectItem>
                        <SelectItem value="esmer">Esmer</SelectItem>
                        <SelectItem value="koyu">Koyu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hairColor">Saç Rengi</Label>
                    <Select value={hairColor} onValueChange={setHairColor}>
                      <SelectTrigger id="hairColor">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="siyah">Siyah</SelectItem>
                        <SelectItem value="kahverengi">Kahverengi</SelectItem>
                        <SelectItem value="kumral">Kumral</SelectItem>
                        <SelectItem value="sarı">Sarı</SelectItem>
                        <SelectItem value="kızıl">Kızıl</SelectItem>
                        <SelectItem value="gri">Gri</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hairStyle">Saç Modeli</Label>
                    <Select value={hairStyle} onValueChange={setHairStyle}>
                      <SelectTrigger id="hairStyle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kısa-düz">Kısa Düz</SelectItem>
                        <SelectItem value="orta-düz">Orta Düz</SelectItem>
                        <SelectItem value="uzun-düz">Uzun Düz</SelectItem>
                        <SelectItem value="kısa-dalgalı">
                          Kısa Dalgalı
                        </SelectItem>
                        <SelectItem value="orta-dalgalı">
                          Orta Dalgalı
                        </SelectItem>
                        <SelectItem value="uzun-dalgalı">
                          Uzun Dalgalı
                        </SelectItem>
                        <SelectItem value="kıvırcık">Kıvırcık</SelectItem>
                        <SelectItem value="topuz">Topuz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style">Stil</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger id="style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="klasik">Klasik</SelectItem>
                        <SelectItem value="spor">Spor</SelectItem>
                        <SelectItem value="şık">Şık</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Çekim Ayarları</CardTitle>
                <CardDescription>
                  Poz ve ortam ayarlarını belirleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pose">Poz</Label>
                  <Select value={pose} onValueChange={setPose}>
                    <SelectTrigger id="pose">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dik-duruş">
                        Dik Duruş (Frontal)
                      </SelectItem>
                      <SelectItem value="yan-duruş">
                        Yan Duruş (Profile)
                      </SelectItem>
                      <SelectItem value="çeyrek-dönük">
                        Çeyrek Dönük (3/4)
                      </SelectItem>
                      <SelectItem value="yürüyüş">Yürüyüş Pozu</SelectItem>
                      <SelectItem value="oturma">Oturma Pozu</SelectItem>
                      <SelectItem value="dinamik">Dinamik Poz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Ortam</Label>
                  <Select value={environment} onValueChange={setEnvironment}>
                    <SelectTrigger id="environment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stüdyo-beyaz">
                        Stüdyo - Beyaz Arka Plan
                      </SelectItem>
                      <SelectItem value="stüdyo-gri">
                        Stüdyo - Gri Arka Plan
                      </SelectItem>
                      <SelectItem value="stüdyo-renkli">
                        Stüdyo - Renkli Arka Plan
                      </SelectItem>
                      <SelectItem value="şehir-sokak">Şehir Sokak</SelectItem>
                      <SelectItem value="modern-iç-mekan">
                        Modern İç Mekan
                      </SelectItem>
                      <SelectItem value="doğal-ışık">
                        Doğal Işık Ortamı
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={!description.trim() || isGenerating}
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
                  <Sparkles className="h-5 w-5" />
                  Manken Oluştur
                </>
              )}
            </Button>
          </div>

          {/* Preview Section */}
          <div>
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
                        className={`absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px] transition-all duration-300 ${
                          isGenerating
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none"
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
                        onClick={handleSave}
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
                      <Button
                        variant="outline"
                        onClick={() => {
                          setGeneratedImage(null);
                          setRevisionInstructions("");
                        }}
                        className="flex-1"
                      >
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
                          onChange={(e) =>
                            setRevisionInstructions(e.target.value)
                          }
                          disabled={isGenerating}
                        />
                        <Button
                          onClick={handleGenerate}
                          disabled={
                            !revisionInstructions.trim() || isGenerating
                          }
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
                        AI mevcut mankeni verdiğiniz talimatlara göre
                        güncelleyecektir.
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
          </div>
        </div>

        {/* Tips Section */}
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Tutarlılık İpuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>
                Tüm fiziksel özellikleri detaylı belirleyin - aynı mankeni
                tekrar oluşturmak için kullanılacak
              </li>
              <li>
                Poz ve ortam seçiminiz kıyafet denemelerinde tutarlılık sağlar
              </li>
              <li>
                Kaydedilen mankenler try-on işlemlerinde tekrar kullanılabilir
              </li>
              <li>Marka kimliğinize uygun mankenleri favori olarak kaydedin</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
