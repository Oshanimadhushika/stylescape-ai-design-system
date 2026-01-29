"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Check, X, ImageIcon, Info } from "lucide-react";
import Image from "next/image";

interface ProductSelectionProps {
  uploadedProducts: string[];
  setUploadedProducts: (urls: string[]) => void;
}

export default function ProductSelection({
  uploadedProducts,
  setUploadedProducts,
}: ProductSelectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(Array.from(files));
    }
  };

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedProducts([...uploadedProducts, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeProduct = (index: number) => {
    setUploadedProducts(uploadedProducts.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setUploadedProducts([]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
      {/* Main Content */}
      <div className="flex-1">
        {/* Gallery Mode */}
        {uploadedProducts.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Upload Images
                </h2>
                <div className="bg-gray-100 px-4 py-1.5 rounded-full text-xs font-bold text-gray-900 border border-gray-200">
                  On-Model Photos
                </div>
              </div>
              <button
                onClick={clearAll}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-gray-300 bg-white transition-all"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                  <Plus className="w-6 h-6" />
                </div>
              </div>

              {uploadedProducts.map((url, index) => (
                <div
                  key={index}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50"
                >
                  <Image
                    src={url}
                    alt={`Product ${index}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => removeProduct(index)}
                      className="p-2 bg-white rounded-full text-gray-900 hover:bg-gray-100 hover:scale-110 transition-all shadow-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-[10px] text-white/80 truncate font-medium">
                      product-{index + 1}.jpg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Initial Upload Mode */
          <div className="flex flex-col items-center justify-center h-full space-y-12 py-12">
            <div className="relative w-full max-w-lg h-64 flex items-center justify-center">
              {/* Visual Card Stack */}
              <div className="absolute transform -translate-x-32 rotate-[-12deg] w-48 h-64 bg-gray-100 rounded-2xl shadow-sm border border-gray-200/50" />
              <div className="absolute transform translate-x-32 rotate-[12deg] w-48 h-64 bg-gray-100 rounded-2xl shadow-sm border border-gray-200/50" />
              <div className="absolute w-48 h-64 bg-white rounded-2xl shadow-xl border border-gray-200 flex items-center justify-center overflow-hidden z-10">
                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-300" />
                </div>
              </div>
              <div className="absolute top-0 transform -translate-y-4 bg-gray-100 px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-500 border border-gray-200 z-20">
                On-Model Photos
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Upload On-Model Photos to Begin
                </h2>
                <p className="text-gray-400 text-sm">
                  Drag and drop images here - PNG, JPG, WebP, AVIF or HEIC
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#1a1b1e] hover:bg-black text-white px-10 py-4 rounded-xl font-bold flex items-center gap-3 mx-auto transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                Upload all your images
                <Plus className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}
      </div>

      {/* Guidelines Sidebar */}
      <div className="w-full lg:w-80 bg-gray-50/50 rounded-3xl p-6 border border-gray-100 overflow-y-auto max-h-[calc(100vh-200px)] sticky top-32">
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-center text-sm font-bold text-gray-900">
              What Works Best
            </h3>
            <p className="text-center text-xs text-gray-500 px-4">
              Clear face or headless shots, full body, medium shots, and complex
              poses
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-200"
                >
                  <Image
                    src={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60`}
                    alt="Good Example"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-center text-sm font-bold text-gray-900">
              What to Avoid
            </h3>
            <p className="text-center text-xs text-gray-500 px-4">
              Covered face, flat lay, group images, accessories, and bad
              lighting
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-200 opacity-60"
                >
                  <Image
                    src={`https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60`}
                    alt="Bad Example"
                    fill
                    className="object-cover grayscale"
                  />
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#ef4444] rounded-full flex items-center justify-center shadow-sm">
                    <X className="w-3 h-3 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
