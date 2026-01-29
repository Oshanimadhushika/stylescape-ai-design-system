"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import { poses } from "./assets-data";

interface PoseSelectionProps {
  selectedPoses: string[];
  setSelectedPoses: (ids: string[]) => void;
}

const categories = [
  "All",
  "Full Body",
  "Half Body",
  "Full Body Back",
  "Half Body Back",
];

export default function PoseSelection({
  selectedPoses,
  setSelectedPoses,
}: PoseSelectionProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPoses =
    activeCategory === "All"
      ? poses
      : poses.filter((p) => p.category === activeCategory);

  const togglePose = (id: string) => {
    if (selectedPoses.includes(id)) {
      setSelectedPoses(selectedPoses.filter((p) => p !== id));
    } else {
      if (selectedPoses.length < 4) {
        setSelectedPoses([...selectedPoses, id]);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Select Poses</h1>
        <p className="text-gray-500 text-sm">
          Select up to 4 poses for your generation.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
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

        {/* Counter */}
        <div className="flex items-center gap-2 font-medium text-sm">
          <span
            className={cn(
              selectedPoses.length === 4 ? "text-green-600" : "text-gray-900",
            )}
          >
            {selectedPoses.length} / 4
          </span>
          <span className="text-gray-400">selected</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredPoses.map((pose) => {
          const isSelected = selectedPoses.includes(pose.id);
          return (
            <div
              key={pose.id}
              onClick={() => togglePose(pose.id)}
              className={cn(
                "group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all border-2",
                isSelected
                  ? "border-black"
                  : "border-transparent hover:border-gray-200",
              )}
            >
              <div className="absolute inset-0 bg-gray-100">
                <Image
                  src={pose.image}
                  alt={pose.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-10 p-2">
                  <div className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="w-full h-full border-2 border-black rounded-lg" />
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-white text-xs font-bold truncate block shadow-sm">
                  {pose.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
