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
            <div key={bg.id} className="group flex flex-col gap-2">
              <div
                onClick={() => setSelectedBackground(bg.id)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all",
                  isSelected
                    ? "ring-2 ring-black ring-offset-2"
                    : "hover:ring-2 hover:ring-gray-200 hover:ring-offset-1",
                )}
              >
                {/* Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${bg.image})` }}
                />

                {/* Overlay Checkmark */}
                {isSelected && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center animate-in zoom-in-50 shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-black transition-colors">
                {bg.name}
              </h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}
