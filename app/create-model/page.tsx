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
import {
  Sparkles,
  Loader2,
  Download,
  Upload,
  X,
  ImagePlus,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import Image from "next/image";

const ModelPreview = dynamic(() => import("@/components/model-preview"), {
  ssr: false,
});

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
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [revisionInstructions, setRevisionInstructions] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("Dosya boyutu 5MB'dan küçük olmalıdır");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!description.trim() && !referenceImage) {
      if (!description.trim()) return;
    }

    setIsGenerating(true);

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
          referenceImage,
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
          : "Görsel oluşturulurken bir hata oluştu",
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

    console.log("[v0] Saving mannequin...");
    console.log("[v0] Image Data URI length:", generatedImage.length);

    setIsSaving(true);

    try {
      const supabase = getSupabase();

      const contextPrompt = `Gender: ${gender}, Height: ${height}, Body: ${bodyType}, Size: ${clothingSize}, Skin: ${skinTone}, Hair: ${hairColor} ${hairStyle}, Age: ${ageRange}, Pose: ${pose}, Environment: ${environment}`;

      const { error, data } = await supabase
        .from("models")
        .insert({
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
        })
        .select();

      if (error) {
        console.error("[v0] Supabase insert error:", error);
        throw error;
      }

      console.log("[v0] Saved successfully:", data);
      alert("Manken başarıyla kaydedildi!");
      setName("");
      setDescription("");
      setGeneratedImage(null);
      setReferenceImage(null);
    } catch (error: any) {
      console.error("[v0] Save error object:", error);
      
      // Extract a readable error message
      let errorMessage = "Manken kaydedilirken bir hata oluştu";
      
      if (error.message) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === 'object') {
        errorMessage += `: ${JSON.stringify(error)}`;
      } else {
        errorMessage += `: ${String(error)}`;
      }

      alert(errorMessage);
      
      if (generatedImage.length > 2 * 1024 * 1024) {
        console.warn("[v0] Warning: Image size is large (" + Math.round(generatedImage.length/1024) + " KB). This might exceed database limits.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    alert("İndirme özelliği yakında eklenecek!");
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <main
        className="container mx-auto px-4 py-8 md:py-12"
        suppressHydrationWarning
      >
        <div className="mb-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-2 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">
              AI Powered Fashion Studio
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-primary to-gray-600 dark:from-white dark:via-primary dark:to-gray-300 bg-clip-text text-transparent">
            Yeni Nesil Manken Oluşturucu
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hayalinizdeki moda mankenini saniyeler içinde tasarlayın. Detaylı
            özelleştirme ve referans görsel desteği ile profesyonel sonuçlar
            alın.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Input Section - Spans 7 cols on large screens */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Configuration Card */}
            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800">
              <div className="h-2 bg-gradient-to-r from-primary to-purple-600" />
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 text-primary">
                    1
                  </div>
                  Temel Bilgiler & Referans
                </CardTitle>
                <CardDescription>
                  Mankeninizin kimliğini ve ilham kaynağını belirleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold">
                    Manken İsmi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Örn: Koleksiyon Yüzü - Elif"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 border-gray-200 dark:border-gray-700 focus:ring-primary/20 bg-white dark:bg-gray-950 text-lg w-full"
                  />
                </div>

                {/* Reference Image Upload Area */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex justify-between">
                    <span>Referans Görsel (Opsiyonel)</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      JPG, PNG - Max 5MB
                    </span>
                  </Label>
                  <div
                    className={`relative group flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer overflow-hidden w-full
                       ${
                         dragActive
                           ? "border-primary bg-primary/10 scale-[1.01]"
                           : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 hover:border-primary/50 hover:bg-white dark:hover:bg-gray-800"
                       }
                     `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() =>
                      !referenceImage && fileInputRef.current?.click()
                    }
                  >
                    {referenceImage ? (
                      <div className="relative w-full aspect-video max-h-[250px] flex justify-center group-hover:scale-[1.02] transition-transform duration-500">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-10" />
                        <img
                          src={referenceImage}
                          alt="Reference"
                          className="h-full object-contain rounded-lg shadow-sm"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md z-20 hover:scale-110 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeReferenceImage();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-3 left-4 text-white text-sm font-medium z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                          Referans Görsel Yüklendi
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div
                          className={`p-4 rounded-full inline-block shadow-sm transition-transform duration-300 ${
                            dragActive
                              ? "bg-primary text-white scale-110"
                              : "bg-white dark:bg-gray-800 text-primary group-hover:scale-110 group-hover:text-primary"
                          }`}
                        >
                          {dragActive ? (
                            <Upload className="h-8 w-8" />
                          ) : (
                            <ImagePlus className="h-8 w-8" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            Görseli buraya sürükleyin
                          </p>
                          <p className="text-sm text-muted-foreground">
                            veya dosya seçmek için{" "}
                            <span className="text-primary hover:underline font-medium">
                              tıklayın
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * Yüklediğiniz referans görsel, mankenin stili ve pozunu
                    etkileyecektir.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="description"
                    className="text-base font-semibold"
                  >
                    Detaylı Açıklama
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Örn: 28 yaşında, modern şehir tarzına sahip, özgüvenli duruşu olan, üzerinde şık bir ceket bulunan manken..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="min-h-[120px] resize-none border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-primary/20 transition-all font-light text-base w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attributes Card */}
            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 text-primary">
                    2
                  </div>
                  Fiziksel Özellikler & Stil
                </CardTitle>
                <CardDescription>
                  Her detay önemlidir. Mankeninizi özelleştirin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="font-medium">
                      Cinsiyet
                    </Label>
                    <Select
                      value={gender}
                      onValueChange={(val) => {
                        setGender(val);
                        if (val === "erkek") setClothingSize("L (52-54)");
                        else setClothingSize("38-40");
                      }}
                    >
                      <SelectTrigger
                        id="gender"
                        className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                      >
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
                    <Label htmlFor="ageRange" className="font-medium">
                      Yaş Aralığı
                    </Label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger
                        id="ageRange"
                        className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                      >
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

                  <div className="space-y-2">
                    <Label htmlFor="bodyType" className="font-medium">
                      Vücut Tipi
                    </Label>
                    <Select value={bodyType} onValueChange={setBodyType}>
                      <SelectTrigger
                        id="bodyType"
                        className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                      >
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
                    <Label htmlFor="clothingSize" className="font-medium">
                      Beden
                    </Label>
                    {gender === "erkek" ? (
                      <Select
                        key="male-size"
                        value={clothingSize}
                        onValueChange={setClothingSize}
                      >
                        <SelectTrigger
                          id="clothingSize"
                          className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                        >
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
                        <SelectTrigger
                          id="clothingSize"
                          className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                        >
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
                    <Label htmlFor="skinTone" className="font-medium">
                      Ten Rengi
                    </Label>
                    <Select value={skinTone} onValueChange={setSkinTone}>
                      <SelectTrigger
                        id="skinTone"
                        className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                      >
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
                    <Label htmlFor="height" className="font-medium">
                      Boy
                    </Label>
                    <Select value={height} onValueChange={setHeight}>
                      <SelectTrigger
                        id="height"
                        className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                      >
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
                    <Label htmlFor="hairColor" className="font-medium">
                      Saç Rengi
                    </Label>
                    <Select value={hairColor} onValueChange={setHairColor}>
                      <SelectTrigger
                        id="hairColor"
                        className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                      >
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
                    <Label htmlFor="hairStyle" className="font-medium">
                      Saç Modeli
                    </Label>
                    <Select value={hairStyle} onValueChange={setHairStyle}>
                      <SelectTrigger
                        id="hairStyle"
                        className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                      >
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
                    <Label htmlFor="style" className="font-medium">
                      Stil
                    </Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger
                        id="style"
                        className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                      >
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

                  <div className="space-y-2">
                    <Label htmlFor="environment" className="font-medium">
                      Ortam
                    </Label>
                    <Select value={environment} onValueChange={setEnvironment}>
                      <SelectTrigger
                        id="environment"
                        className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stüdyo-beyaz">
                          Stüdyo - Beyaz
                        </SelectItem>
                        <SelectItem value="stüdyo-gri">Stüdyo - Gri</SelectItem>
                        <SelectItem value="stüdyo-renkli">
                          Stüdyo - Renkli
                        </SelectItem>
                        <SelectItem value="şehir-sokak">
                          Dış Çekim - Şehir
                        </SelectItem>
                        <SelectItem value="modern-iç-mekan">
                          İç Mekan
                        </SelectItem>
                        <SelectItem value="doğal-ışık">Doğal Işık</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="pose" className="font-medium">
                      Poz
                    </Label>
                    <Select value={pose} onValueChange={setPose}>
                      <SelectTrigger
                        id="pose"
                        className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 transition-colors w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dik-duruş">Dik Duruş</SelectItem>
                        <SelectItem value="yan-duruş">Yan Profil</SelectItem>
                        <SelectItem value="çeyrek-dönük">3/4 Poz</SelectItem>
                        <SelectItem value="yürüyüş">Yürüyüş</SelectItem>
                        <SelectItem value="oturma">Oturma</SelectItem>
                        <SelectItem value="dinamik">Dinamik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={
                (!description.trim() && !referenceImage) || isGenerating
              }
              className="w-full h-14 text-lg font-medium shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all rounded-xl mt-4"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Manken Tasarlanıyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Sihirli Dokunuşla Oluştur
                </>
              )}
            </Button>

            <Card className="mt-8 border-primary/20 bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
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
                    Poz ve ortam seçiminiz kıyafet denemelerinde tutarlılık
                    sağlar
                  </li>
                  <li>
                    Kaydedilen mankenler try-on işlemlerinde tekrar
                    kullanılabilir
                  </li>
                  <li>
                    Marka kimliğinize uygun mankenleri favori olarak kaydedin
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section - Spans 5 cols */}
          <div className="lg:col-span-5 sticky top-8">
            <ModelPreview
              generatedImage={generatedImage}
              isGenerating={isGenerating}
              name={name}
              isSaving={isSaving}
              revisionInstructions={revisionInstructions}
              onSave={handleSave}
              onGenerate={handleGenerate}
              onReset={() => {
                setGeneratedImage(null);
                setRevisionInstructions("");
                setReferenceImage(null);
              }}
              onRevisionChange={setRevisionInstructions}
            />

            {/* Quick Tips */}
            <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-primary/5 dark:from-purple-900/10 dark:to-primary/10 rounded-xl border border-primary/10">
              <h3 className="font-semibold text-primary flex items-center mb-3">
                <Sparkles className="h-4 w-4 mr-2" />
                Pro İpucu
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                En gerçekçi sonuçlar için referans görsel yükleyin. Yapay zeka,
                referans görseldeki ışık, poz ve vücut stilini koruyarak yeni
                mankeninizi oluşturacaktır.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
