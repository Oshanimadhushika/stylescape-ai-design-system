export interface Model {
  id: string;
  name: string;
  age: string;
  image: string;
  isFree: boolean;
  gender: "female" | "male";
}

const femalePlaceholders = [
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60", // Clara
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60", // Anouk
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60", // Erica
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=60", // Shawna
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=60", // Elena (Fixed)
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60", // Maya (Fixed)
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1524250502761-1ac6f2e5382b?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1496675550997-c0e8f3b96859?w=500&auto=format&fit=crop&q=60",
];

const malePlaceholders = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1615109398623-88346a601842?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1506634572416-48cdfe530110?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=60",
];

export const femaleModels: Model[] = [
  ...Array.from({ length: 6 }).map((_, i) => ({
    id: `f-free-${i + 1}`,
    name: ["Clara", "Anouk", "Erica", "Shawna", "Elena", "Maya"][i],
    age: "18-25",
    image: femalePlaceholders[i % 10],
    isFree: true,
    gender: "female" as const,
  })),
  ...Array.from({ length: 66 }).map((_, i) => ({
    id: `f-upd-${i + 1}`,
    name: `Model ${i + 7}`,
    age: "20-30",
    image: femalePlaceholders[(i + 6) % 10],
    isFree: false,
    gender: "female" as const,
  })),
];

export const maleModels: Model[] = [
  ...Array.from({ length: 3 }).map((_, i) => ({
    id: `m-free-${i + 1}`,
    name: ["James", "David", "Robert"][i],
    age: "25-35",
    image: malePlaceholders[i % 10],
    isFree: true,
    gender: "male" as const,
  })),
  ...Array.from({ length: 17 }).map((_, i) => ({
    id: `m-upd-${i + 1}`,
    name: `Model ${i + 4}`,
    age: "25-35",
    image: malePlaceholders[(i + 3) % 10],
    isFree: false,
    gender: "male" as const,
  })),
];

export const allModels = [...femaleModels, ...maleModels];
