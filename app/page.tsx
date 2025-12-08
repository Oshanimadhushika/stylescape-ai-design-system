import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ImageIcon, Video, Zap, Shield, Palette } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-8 py-12 text-center lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            AI Destekli Sanal Stüdyo
          </div>

          <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Markanız İçin AI Fotoğraf Stüdyosu
          </h1>

          <p className="max-w-2xl text-balance text-lg text-muted-foreground leading-relaxed">
            Özel AI mankenlerinizi oluşturun, ürünlerinizi profesyonel şekilde görselleştirin ve etkileyici marka
            içerikleri üretin. Fotoğraf stüdyosuna gerek yok.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/create-model">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Hemen Başla
              </Button>
            </Link>
            <Link href="/try-on">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                <ImageIcon className="h-5 w-5" />
                Try-On Yap
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI Manken Oluşturma</CardTitle>
              <CardDescription>
                Açıklamalarla özel AI mankenleri oluşturun. İstediğiniz özellikleri tanımlayın.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/create-model">
                <Button variant="ghost" className="w-full">
                  Keşfet →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Sanal Giyim Deneme</CardTitle>
              <CardDescription>
                Kıyafet resimlerini yükleyin ve mankenleriniz üzerinde görün. Gerçekçi sonuçlar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/try-on">
                <Button variant="ghost" className="w-full">
                  Keşfet →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Video Üretimi</CardTitle>
              <CardDescription>
                Mankenlerinizle dinamik videolar oluşturun. Ürünlerinizi canlı gösterin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/create-video">
                <Button variant="ghost" className="w-full">
                  Keşfet →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="py-12">
          <h2 className="mb-8 text-center text-3xl font-bold">Neden StyleScape?</h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Hızlı ve Kolay</h3>
              <p className="text-muted-foreground leading-relaxed">
                Karmaşık fotoğraf çekimleri yerine AI ile dakikalar içinde profesyonel görseller.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Palette className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Sınırsız Yaratıcılık</h3>
              <p className="text-muted-foreground leading-relaxed">
                İstediğiniz kadar manken oluşturun, farklı kıyafetleri deneyin, çeşitli videolar üretin.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Güvenli ve Özel</h3>
              <p className="text-muted-foreground leading-relaxed">
                Verileriniz güvende. Tüm işlemler gizli ve güvenli sunucularda gerçekleşir.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-6 rounded-2xl border-2 border-primary/20 bg-primary/5 px-6 py-12 text-center lg:py-16">
          <h2 className="max-w-2xl text-balance text-3xl font-bold lg:text-4xl">
            İlk AI Mankeninizi Oluşturmaya Hazır mısınız?
          </h2>
          <p className="max-w-xl text-balance text-muted-foreground leading-relaxed">
            Sadece birkaç kelime ile başlayın ve AI'ın gücünü keşfedin.
          </p>
          <Link href="/create-model">
            <Button size="lg" className="gap-2">
              <Sparkles className="h-5 w-5" />
              Ücretsiz Dene
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 StyleScape. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  )
}
