export interface Pose {
  id: string;
  name: string;
  category: "Full Body" | "Half Body" | "Full Body Back" | "Half Body Back";
  image: string;
}

export interface Background {
  id: string;
  name: string;
  category: "Studio" | "Indoor" | "Outdoor";
  image: string;
}

// 20 Poses
export const poses: Pose[] = [
  // Full Body (8)
  ...Array.from({ length: 8 }).map((_, i) => ({
    id: `pose-full-${i + 1}`,
    name: `Full Body ${i + 1}`,
    category: "Full Body" as const,
    image: "/placeholder-pose.jpg",
  })),
  // Half Body (7)
  ...Array.from({ length: 7 }).map((_, i) => ({
    id: `pose-half-${i + 1}`,
    name: `Half Body ${i + 1}`,
    category: "Half Body" as const,
    image: "/placeholder-pose.jpg",
  })),
  // Full Body Back (2)
  ...Array.from({ length: 2 }).map((_, i) => ({
    id: `pose-full-back-${i + 1}`,
    name: `Full Back ${i + 1}`,
    category: "Full Body Back" as const,
    image: "/placeholder-pose.jpg",
  })),
  // Half Body Back (3)
  ...Array.from({ length: 3 }).map((_, i) => ({
    id: `pose-half-back-${i + 1}`,
    name: `Half Back ${i + 1}`,
    category: "Half Body Back" as const,
    image: "/placeholder-pose.jpg",
  })),
];

// 38 Backgrounds
export const backgrounds: Background[] = [
  // Studio (16)
  ...Array.from({ length: 16 }).map((_, i) => ({
    id: `bg-studio-${i + 1}`,
    name: `Studio ${i + 1}`,
    category: "Studio" as const,
    image: "/placeholder-bg.jpg",
  })),
  // Indoor (6)
  ...Array.from({ length: 6 }).map((_, i) => ({
    id: `bg-indoor-${i + 1}`,
    name: `Indoor ${i + 1}`,
    category: "Indoor" as const,
    image: "/placeholder-bg.jpg",
  })),
  // Outdoor (16)
  ...Array.from({ length: 16 }).map((_, i) => ({
    id: `bg-outdoor-${i + 1}`,
    name: `Outdoor ${i + 1}`,
    category: "Outdoor" as const,
    image: "/placeholder-bg.jpg",
  })),
];
