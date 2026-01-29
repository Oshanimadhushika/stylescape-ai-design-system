"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { allModels } from "./models-data";
import { ChevronDown } from "lucide-react";

interface ModelCustomizationProps {
  selectedModelIds: string[];
  modelCustoms: Record<string, { bodySize?: string; expression?: string }>;
  setModelCustoms: (
    customs: Record<string, { bodySize?: string; expression?: string }>,
  ) => void;
}

const bodySizes = ["Petite", "Standard", "Curvy", "Plus Size", "Athletic"];
const expressions = [
  { id: "neutral", label: "Neutral", active: true },
  { id: "smiling", label: "Smiling", active: true },
  { id: "happy", label: "Happy", active: true },
  { id: "surprised", label: "Surprised", active: false },
  { id: "serious", label: "Serious", active: false },
  { id: "laughing", label: "Laughing", active: false },
];

export default function ModelCustomization({
  selectedModelIds,
  modelCustoms,
  setModelCustoms,
}: ModelCustomizationProps) {
  const selectedModels = allModels.filter((m) =>
    selectedModelIds.includes(m.id),
  );

  const handleUpdate = (
    modelId: string,
    type: "bodySize" | "expression",
    value: string,
  ) => {
    setModelCustoms({
      ...modelCustoms,
      [modelId]: {
        ...modelCustoms[modelId],
        [type]: value,
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Customization</h1>
        <p className="text-gray-500 text-sm">
          Select body size and facial expression for each model.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {selectedModels.map((model) => {
          const customs = modelCustoms[model.id] || {};

          return (
            <div
              key={model.id}
              className="flex gap-6 p-4 border border-gray-100 rounded-2xl bg-white shadow-sm"
            >
              <div className="relative w-32 aspect-[3/4] rounded-lg overflow-hidden shrink-0">
                <Image
                  src={model.image}
                  alt={model.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 space-y-6 py-2 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <h3 className="font-semibold text-gray-900">{model.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {model.gender}
                  </p>
                </div>

                {/* Body Size Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Body Size <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {bodySizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleUpdate(model.id, "bodySize", size)}
                        className={cn(
                          "px-2 py-2 text-xs font-medium rounded-lg border transition-all truncate",
                          customs.bodySize === size
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Facial Expression Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Expression <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {expressions.map((exp) => (
                      <button
                        key={exp.id}
                        disabled={!exp.active}
                        onClick={() =>
                          handleUpdate(model.id, "expression", exp.id)
                        }
                        className={cn(
                          "px-2 py-2 text-xs font-medium rounded-lg border transition-all relative overflow-hidden",
                          !exp.active &&
                            "opacity-50 cursor-not-allowed bg-gray-50",
                          exp.active && customs.expression === exp.id
                            ? "bg-black text-white border-black"
                            : exp.active
                            ? "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                            : "border-gray-100 text-gray-300",
                        )}
                      >
                        {exp.label}
                        {!exp.active && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 text-[8px] font-bold text-gray-400 uppercase">
                            Soon
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
