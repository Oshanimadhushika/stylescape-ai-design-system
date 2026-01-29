"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Lock, Filter, Heart } from "lucide-react";
import Image from "next/image";
import { femaleModels, maleModels, allModels } from "./models-data";

interface ModelGalleryProps {
  selectedModels: string[];
  setSelectedModels: (ids: string[]) => void;
}

export default function ModelGallery({
  selectedModels,
  setSelectedModels,
}: ModelGalleryProps) {
  const [activeTab, setActiveTab] = useState<"women" | "men">("women");

  const models = activeTab === "women" ? femaleModels : maleModels;
  const isLimitReached = selectedModels.length >= 4;

  const toggleModel = (id: string, isFree: boolean) => {
    if (!isFree) return; // Disabled models

    if (selectedModels.includes(id)) {
      setSelectedModels(selectedModels.filter((m) => m !== id));
    } else {
      if (!isLimitReached) {
        setSelectedModels([...selectedModels, id]);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Select Models</h1>
        <p className="text-gray-500 text-sm">
          Select up to 4 models. Free models are selectable, others are
          updating.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-gray-100">
        <div className="flex gap-8">
          {(["women", "men"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-4 text-sm font-semibold transition-all relative capitalize",
                activeTab === tab
                  ? "text-gray-900"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <span className="flex items-center gap-2">
                {tab}
                <span className="bg-gray-100 text-[10px] px-1.5 py-0.5 rounded-full text-gray-500">
                  {tab === "women" ? femaleModels.length : maleModels.length}
                </span>
              </span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
            <span
              className={cn(
                "text-xs font-bold",
                selectedModels.length === 4
                  ? "text-green-600"
                  : "text-gray-900",
              )}
            >
              {selectedModels.length} / 4
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Selected
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {models.map((model) => {
          const isSelected = selectedModels.includes(model.id);
          const isDisabled = !model.isFree;
          const isAtLimit = isLimitReached && !isSelected;

          return (
            <div
              key={model.id}
              onClick={() => toggleModel(model.id, model.isFree)}
              className={cn(
                "group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all",
                isSelected
                  ? "border-black ring-2 ring-black/5"
                  : "border-transparent",
                isDisabled
                  ? "opacity-70 cursor-not-allowed bg-gray-50"
                  : "cursor-pointer hover:border-gray-200 shadow-sm",
                isAtLimit && !isDisabled && "opacity-50",
              )}
            >
              <Image
                src={model.image}
                alt={model.name}
                fill
                className={cn(
                  "object-cover transition-transform duration-500",
                  !isDisabled && "group-hover:scale-105",
                )}
              />

              {/* Overlay Indicators */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Status Badge */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {isDisabled && (
                  <div className="bg-black/80 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Updating
                  </div>
                )}
                {isSelected && (
                  <div className="bg-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in-50">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Paid Indicator / Lock */}
              {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-2xl">
                    <Lock className="w-5 h-5 text-gray-900" />
                  </div>
                </div>
              )}

              <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                <p className="text-xs font-bold truncate">{model.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[10px] opacity-80">{model.age} years</p>
                  {!isDisabled && !isSelected && !isAtLimit && (
                    <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                      <Heart className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
