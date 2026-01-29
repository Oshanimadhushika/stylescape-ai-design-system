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

// Realistic Poses based on typical e-commerce shots
const fullBodyPoses = [
  {
    name: "Standing Straight",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Walking Motion",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60", // Reuse standing or similar for now if specific one fails, but trying a robust one
  },
  {
    name: "Leaning",
    url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=60", // Reuse hands in pocket style which is reliable
  },
  {
    name: "Hands in Pockets",
    url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Crossed Legs",
    url: "https://images.unsplash.com/photo-1495385794356-15371f348c31?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Side Profile",
    url: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Sitting",
    url: "https://images.unsplash.com/photo-1534180477871-5d6cc81f3920?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Action Shot",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60", // Reuse valid image
  },
];

const halfBodyPoses = [
  {
    name: "Arms Crossed",
    url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Hands on Hips",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Touching Hair",
    url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Close Portrait",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Looking Away",
    url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Smiling",
    url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Serious",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60",
  },
];

// 20 Poses
export const poses: Pose[] = [
  // Full Body (8)
  ...fullBodyPoses.map((p, i) => ({
    id: `pose-full-${i + 1}`,
    name: p.name,
    category: "Full Body" as const,
    image: p.url,
  })),
  // Half Body (7)
  ...halfBodyPoses.map((p, i) => ({
    id: `pose-half-${i + 1}`,
    name: p.name,
    category: "Half Body" as const,
    image: p.url,
  })),
  // Full Body Back (2)
  ...Array.from({ length: 2 }).map((_, i) => ({
    id: `pose-full-back-${i + 1}`,
    name: `Full Back ${i + 1}`,
    category: "Full Body Back" as const,
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60", // Reuse standing
  })),
  // Half Body Back (3)
  ...Array.from({ length: 3 }).map((_, i) => ({
    id: `pose-half-back-${i + 1}`,
    name: `Half Back ${i + 1}`,
    category: "Half Body Back" as const,
    image:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=60", // Reuse half
  })),
];

// 38 Backgrounds
const studioBgs = [
  {
    name: "Studio",
    url: "https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=500&auto=format&fit=crop&q=60", // White studio
  },
  {
    name: "Stucco Wall",
    url: "https://images.unsplash.com/photo-1533630654593-b26a111b24bf?w=500&auto=format&fit=crop&q=60", // Visible grey stucco
  },
  {
    name: "Studio Caramel",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=60", // Warm light
  },
  {
    name: "Subtle Serenity",
    url: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=500&auto=format&fit=crop&q=60", // Soft minimalist
  },
  {
    name: "Valentine's Day",
    url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Urban Chic",
    url: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Classic Blue",
    url: "https://images.unsplash.com/photo-1557683311-eac922347aa1?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Warm Beige",
    url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=500&auto=format&fit=crop&q=60",
  },
];

export const backgrounds: Background[] = [
  // Studio (8)
  ...studioBgs.map((bg, i) => ({
    id: `bg-studio-${i + 1}`,
    name: bg.name,
    category: "Studio" as const,
    image: bg.url,
  })),
  // Indoor (6)
  ...Array.from({ length: 6 }).map((_, i) => ({
    id: `bg-indoor-${i + 1}`,
    name: `Indoor Space ${i + 1}`,
    category: "Indoor" as const,
    image:
      "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=500&auto=format&fit=crop&q=60",
  })),
  // Outdoor (6)
  ...Array.from({ length: 6 }).map((_, i) => ({
    id: `bg-outdoor-${i + 1}`,
    name: `Outdoor Scene ${i + 1}`,
    category: "Outdoor" as const,
    image:
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=500&auto=format&fit=crop&q=60",
  })),
];
