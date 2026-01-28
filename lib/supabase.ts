import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (typeof window !== "undefined") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error("[v0] Supabase environment variables missing");
      throw new Error("Supabase URL and API key are required");
    }
  }

  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return supabaseClient;
}

export type Model = {
  id: string;
  name: string;
  description: string;
  gender: string | null;
  style: string | null;
  height: string | null;
  body_type: string | null;
  skin_tone: string | null;
  hair_color: string | null;
  hair_style: string | null;
  age_range: string | null;
  pose: string | null;
  environment: string | null;
  context_prompt: string | null;
  clothing_size: string | null;
  image_url: string;
  created_at: string;
};

export type Outfit = {
  id: string;
  name: string;
  model_id: string | null;
  top_clothing_url: string | null;
  bottom_clothing_url: string | null;
  outerwear_clothing_url: string | null;
  accessories_clothing_url: string | null;
  result_image_url: string | null;
  studio_settings: any;
  created_at: string;
};
