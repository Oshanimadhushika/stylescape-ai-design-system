"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { allModels } from "./models-data";
import { backgrounds } from "./assets-data";
import { Edit2, Sparkles } from "lucide-react";

interface SummaryViewProps {
  uploadedProducts: string[];
  selectedModelIds: string[];
  selectedBackgroundId: string | null;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export default function SummaryView({
  uploadedProducts,
  selectedModelIds,
  selectedBackgroundId,
  onGenerate,
  isGenerating = false,
}: SummaryViewProps) {
  const selectedModels = allModels.filter((m) =>
    selectedModelIds.includes(m.id),
  );
  const selectedBackground = backgrounds.find(
    (b) => b.id === selectedBackgroundId,
  );

  const totalCredits = uploadedProducts.length * selectedModels.length;

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      {/* Main Content - Product Preview */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 px-4 py-1.5 rounded-full text-xs font-bold text-gray-900 border border-gray-200">
            On-Model Photos
          </div>
        </div>

        <div className="flex items-center justify-center">
          {uploadedProducts.length > 0 && (
            <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <Image
                src={uploadedProducts[0]}
                alt="Product"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-[10px] text-white/80 truncate font-medium">
                  product-image.jpg
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Project Details */}
      <div className="w-full lg:w-[400px] space-y-8">
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Untitled Project
                </h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded">
              On-Model
            </span>
          </div>

          {/* Models List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Models
            </h3>
            <div className="space-y-3">
              {selectedModels.map((model) => (
                <div key={model.id} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={model.image}
                      alt={model.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {model.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Background */}
          {selectedBackground && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Background
              </h3>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={selectedBackground.image}
                    alt={selectedBackground.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {selectedBackground.name}
                </span>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-200 my-4" />

          {/* Credits */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>
                {uploadedProducts.length} image x {selectedModels.length} models
              </span>
              <span>{totalCredits} photos</span>
            </div>
            <div className="flex items-center justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>{totalCredits} credits</span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full bg-[#1a1b1e] hover:bg-black text-white px-4 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              "Generating..."
            ) : (
              <>
                Generate
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
