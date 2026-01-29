"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight, Check } from "lucide-react";
import ModelGallery from "@/components/on-model/model-gallery";
import ProductSelection from "@/components/on-model/product-selection";
import ModelCustomization from "../../../components/on-model/model-customization";
import PoseSelection from "@/components/on-model/pose-selection";
import BackgroundSelection from "@/components/on-model/background-selection";
import { cn } from "@/lib/utils";

const steps = [
  { id: "products", label: "Select Products" },
  { id: "models", label: "Select Models" },
  { id: "customization", label: "Customization" },
  { id: "poses", label: "Select Poses" },
  { id: "background", label: "Select Background" },
  { id: "summary", label: "Summary" },
];

export default function OnModelPage() {
  const [currentStep, setCurrentStep] = useState(0); // Start at Select Products
  const [uploadedProducts, setUploadedProducts] = useState<string[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [modelCustoms, setModelCustoms] = useState<
    Record<string, { bodySize?: string; expression?: string }>
  >({});
  const [selectedPoses, setSelectedPoses] = useState<string[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(
    null,
  );

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepClick = (index: number) => {
    // Basic guards
    if (index > currentStep) {
      if (currentStep === 0 && uploadedProducts.length === 0) return;
      if (currentStep === 1 && selectedModelIds.length === 0) return;
      if (
        currentStep === 2 &&
        selectedModelIds.some(
          (id) => !modelCustoms[id]?.bodySize || !modelCustoms[id]?.expression,
        )
      )
        return;
      if (currentStep === 3 && selectedPoses.length === 0) return;
      if (currentStep === 4 && !selectedBackground) return;
    }
    setCurrentStep(index);
  };

  const isNextDisabled = () => {
    if (currentStep === 0) return uploadedProducts.length === 0;
    if (currentStep === 1) return selectedModelIds.length === 0;
    if (currentStep === 2) {
      return selectedModelIds.some(
        (id) => !modelCustoms[id]?.bodySize || !modelCustoms[id]?.expression,
      );
    }
    if (currentStep === 3) return selectedPoses.length === 0;
    if (currentStep === 4) return !selectedBackground;
    return false;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Wizard Header */}
      <div className="border-b border-gray-100 bg-white sticky top-0 md:top-16 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    currentStep === index
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-900",
                  )}
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs border shrink-0",
                      currentStep === index
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300",
                    )}
                  >
                    {index < currentStep ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {step.label}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              className="bg-[#1a1b1e] hover:bg-[#2c2d31] text-white rounded-lg h-10 px-6 gap-2 hidden md:flex"
              onClick={handleNext}
              disabled={isNextDisabled()}
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 pb-32 md:pb-8">
        {currentStep === 0 && (
          <ProductSelection
            uploadedProducts={uploadedProducts}
            setUploadedProducts={setUploadedProducts}
          />
        )}

        {currentStep === 1 && (
          <ModelGallery
            selectedModels={selectedModelIds}
            setSelectedModels={setSelectedModelIds}
          />
        )}

        {currentStep === 2 && (
          <ModelCustomization
            selectedModelIds={selectedModelIds}
            modelCustoms={modelCustoms}
            setModelCustoms={setModelCustoms}
          />
        )}

        {currentStep === 3 && (
          <PoseSelection
            selectedPoses={selectedPoses}
            setSelectedPoses={setSelectedPoses}
          />
        )}

        {currentStep === 4 && (
          <BackgroundSelection
            selectedBackground={selectedBackground}
            setSelectedBackground={setSelectedBackground}
          />
        )}

        {currentStep === 5 && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Summary Step</h2>
            <p className="text-gray-500 mt-2">
              Final generation summary will go here.
            </p>
          </div>
        )}
      </main>

      {/* Mobile Footer Action */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 border-t border-gray-100 bg-white/80 backdrop-blur-md z-40">
        <Button
          className="w-full bg-[#1a1b1e] hover:bg-[#2c2d31] text-white rounded-xl h-12 text-lg font-medium"
          onClick={handleNext}
          disabled={isNextDisabled()}
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
