export interface Model {
  id: string;
  name: string;
  age: string;
  image: string;
  isFree: boolean;
  gender: "female" | "male";
}

export const femaleModels: Model[] = [
  ...Array.from({ length: 6 }).map((_, i) => ({
    id: `f-free-${i + 1}`,
    name: ["Clara", "Anouk", "Erica", "Shawna", "Elena", "Maya"][i],
    age: "18-25",
    image: `/models/female-${i + 1}.png`,
    isFree: true,
    gender: "female" as const,
  })),
  ...Array.from({ length: 66 }).map((_, i) => ({
    id: `f-upd-${i + 1}`,
    name: "Updating",
    age: "??",
    image: "/models/placeholder.jpg", // Ensure this path exists or use a generic one
    isFree: false,
    gender: "female" as const,
  })),
];

export const maleModels: Model[] = [
  ...Array.from({ length: 3 }).map((_, i) => ({
    id: `m-free-${i + 1}`,
    name: ["Mark", "John", "Leo"][i],
    age: "25-30",
    image: `/models/male-${i + 1}.png`,
    isFree: true,
    gender: "male" as const,
  })),
  ...Array.from({ length: 17 }).map((_, i) => ({
    id: `m-upd-${i + 1}`,
    name: "Updating",
    age: "??",
    image: "/models/placeholder.jpg",
    isFree: false,
    gender: "male" as const,
  })),
];

export const allModels = [...femaleModels, ...maleModels];
