"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Lock, Filter, Heart } from "lucide-react";
import Image from "next/image";
import { femaleModels, maleModels } from "./models-data";

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
    if (!isFree) return;

    if (selectedModels.includes(id)) {
      setSelectedModels(selectedModels.filter((m) => m !== id));
    } else if (!isLimitReached) {
      setSelectedModels([...selectedModels, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Models Gallery</h1>
        <p className="text-gray-500 text-sm">Select up to 4 models</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab("women")}
            className={cn(
              "px-6 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "women"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            Women
          </button>
          <button
            onClick={() => setActiveTab("men")}
            className={cn(
              "px-6 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "men"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            Men
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50">
            <Heart className="w-4 h-4" />
            Favorites
          </button>
        </div>

        {/* Selection Counter */}
        <div className="ml-auto flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-8 rounded-lg border-2 flex items-center justify-center overflow-hidden bg-gray-50",
                i < selectedModels.length ? "border-black" : "border-gray-200",
              )}
            >
              {i < selectedModels.length ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Check className="w-4 h-4 text-black" />
                </div>
              ) : null}
            </div>
          ))}
          <div className="flex items-center text-sm font-medium ml-2">
            {selectedModels.length} / 4
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {models.map((model) => {
          const isSelected = selectedModels.includes(model.id);
          const isDisabled = !model.isFree || (isLimitReached && !isSelected);

          return (
            <div key={model.id} className="group space-y-3">
              <div
                onClick={() => toggleModel(model.id, model.isFree)}
                className={cn(
                  "relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ring-2 ring-transparent",
                  isSelected ? "ring-black" : "hover:ring-gray-200",
                  !model.isFree && "opacity-80",
                )}
              >
                <Image
                  src={model.image}
                  alt={model.name}
                  fill
                  className={cn(
                    "object-cover transition-transform duration-500 group-hover:scale-105",
                    !model.isFree && "grayscale-[0.5]",
                  )}
                />

                {/* Selection Overlay */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-black rounded-full flex items-center justify-center z-10">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                {/* Lock Overlay for Paid */}
                {!model.isFree && (
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-[#8b5cf6] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg">
                      <Lock className="w-3 h-3" />
                      Upgrade
                    </div>
                  </div>
                )}

                {/* Hover UI for Free */}
                {model.isFree && !isSelected && (
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div className="flex gap-2 w-full">
                      <button className="flex-1 bg-white/90 backdrop-blur py-2 rounded-lg text-xs font-bold hover:bg-white">
                        Preview
                      </button>
                      <button className="p-2 bg-white/90 backdrop-blur rounded-lg hover:bg-white">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">
                    {model.name}
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">
                    18-25
                  </span>
                </div>
                {!model.isFree && (
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Updating
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
