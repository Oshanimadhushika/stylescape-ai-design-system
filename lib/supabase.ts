import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return supabaseClient
}

export type Model = {
  id: string
  name: string
  description: string
  gender: string | null
  style: string | null
  height: string | null
  body_type: string | null
  skin_tone: string | null
  hair_color: string | null
  hair_style: string | null
  age_range: string | null
  pose: string | null
  environment: string | null
  context_prompt: string | null
  clothing_size: string | null
  image_url: string
  created_at: string
}
