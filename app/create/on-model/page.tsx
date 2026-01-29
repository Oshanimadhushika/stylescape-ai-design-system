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
import SummaryView from "@/components/on-model/summary-view";
import { cn } from "@/lib/utils";

const steps = [
  { id: "products", label: "Select Products" },
  { id: "models", label: "Select Models" },
  { id: "background", label: "Select Background" },
  { id: "summary", label: "Summary" },
];

export default function OnModelPage() {
  const [currentStep, setCurrentStep] = useState(0); // 4 Top-level Tabs
  const [subStep, setSubStep] = useState(0); // gallery (0), customization (1), poses (2)
  const [uploadedProducts, setUploadedProducts] = useState<string[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [modelCustoms, setModelCustoms] = useState<
    Record<string, { bodySize?: string; expression?: string }>
  >({});
  const [selectedPoses, setSelectedPoses] = useState<string[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNext = () => {
    // Logic to move between internal sub-steps of Tab 1 (Select Models)
    if (currentStep === 1) {
      if (subStep < 2) {
        setSubStep(subStep + 1);
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSubStep(0); // Reset sub-step when moving between top-level tabs
    }
  };

  const handleStepClick = (index: number) => {
    // Basic guards
    if (index > currentStep) {
      if (currentStep === 0 && uploadedProducts.length === 0) return;
      if (currentStep === 1) {
        if (subStep === 0 && selectedModelIds.length === 0) return;
        if (
          subStep === 1 &&
          selectedModelIds.some(
            (id) =>
              !modelCustoms[id]?.bodySize || !modelCustoms[id]?.expression,
          )
        )
          return;
        if (subStep === 2 && selectedPoses.length === 0) return;
      }
    }
    setCurrentStep(index);
    setSubStep(0);
  };

  const isNextDisabled = () => {
    if (currentStep === 0) return uploadedProducts.length === 0;
    if (currentStep === 1) {
      if (subStep === 0) return selectedModelIds.length === 0;
      if (subStep === 1)
        return selectedModelIds.some(
          (id) => !modelCustoms[id]?.bodySize || !modelCustoms[id]?.expression,
        );
      if (subStep === 2) return selectedPoses.length === 0;
    }
    if (currentStep === 2) return !selectedBackground;
    return false;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
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

            {/* Hide Standard Next Button on Summary Step, as it has its own Generate button */}
            {currentStep !== 3 && (
              <Button
                size="sm"
                className="bg-[#1a1b1e] hover:bg-[#2c2d31] text-white rounded-lg h-10 px-6 gap-2 hidden md:flex"
                onClick={handleNext}
                disabled={isNextDisabled()}
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            {currentStep === 3 && (
              <Button
                size="sm"
                className="bg-[#1a1b1e] hover:bg-[#2c2d31] text-white rounded-lg h-10 px-6 gap-2 hidden md:flex"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                Generate
              </Button>
            )}
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
          <>
            {subStep === 0 && (
              <ModelGallery
                selectedModels={selectedModelIds}
                setSelectedModels={setSelectedModelIds}
              />
            )}
            {subStep === 1 && (
              <ModelCustomization
                selectedModelIds={selectedModelIds}
                modelCustoms={modelCustoms}
                setModelCustoms={setModelCustoms}
              />
            )}
            {subStep === 2 && (
              <PoseSelection
                selectedPoses={selectedPoses}
                setSelectedPoses={setSelectedPoses}
              />
            )}
          </>
        )}

        {currentStep === 2 && (
          <BackgroundSelection
            selectedBackground={selectedBackground}
            setSelectedBackground={setSelectedBackground}
          />
        )}

        {currentStep === 3 && (
          <SummaryView
            uploadedProducts={uploadedProducts}
            selectedModelIds={selectedModelIds}
            selectedBackgroundId={selectedBackground}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}
      </main>

      {/* Mobile Footer Action */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 border-t border-gray-100 bg-white/80 backdrop-blur-md z-40">
        <Button
          className="w-full bg-[#1a1b1e] hover:bg-[#2c2d31] text-white rounded-xl h-12 text-lg font-medium"
          onClick={currentStep === 3 ? handleGenerate : handleNext}
          disabled={currentStep === 3 ? isGenerating : isNextDisabled()}
        >
          {currentStep === 3 ? "Generate" : "Next Step"}
        </Button>
      </div>
    </div>
  );
}
