"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { backgrounds } from "./assets-data";

interface BackgroundSelectionProps {
  selectedBackground: string | null;
  setSelectedBackground: (id: string | null) => void;
}

const categories = ["All", "Studio", "Indoor", "Outdoor"];

export default function BackgroundSelection({
  selectedBackground,
  setSelectedBackground,
}: BackgroundSelectionProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredBackgrounds =
    activeCategory === "All"
      ? backgrounds
      : backgrounds.filter((b) => b.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Select Background</h1>
        <p className="text-gray-500 text-sm">
          Choose a background for your photo.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap",
              activeCategory === cat
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredBackgrounds.map((bg) => {
          const isSelected = selectedBackground === bg.id;
          return (
            <div
              key={bg.id}
              onClick={() => setSelectedBackground(bg.id)}
              className={cn(
                "group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all border-2",
                isSelected
                  ? "border-black"
                  : "border-transparent hover:border-gray-200",
              )}
            >
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-300">
                {/* Placeholder visual */}
                <span className="text-xs">{bg.category}</span>
              </div>

              {/* Overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-10">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center animate-in zoom-in-50">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <div className="absolute botton-2 left-2 right-2 text-center pointer-events-none">
                {/* Optional Label */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
