-- Create the models table if it doesn't exist
create table if not exists models (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  gender text,
  style text,
  height text,
  body_type text,
  skin_tone text,
  hair_color text,
  hair_style text,
  age_range text,
  pose text,
  environment text,
  context_prompt text,
  clothing_size text,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table models enable row level security;

-- Create policies to allow public access (adjust as needed for production)
-- Policy for selecting (reading) models
create policy "Enable read access for all users" on models 
  for select using (true);

-- Policy for inserting (uploading) models
create policy "Enable insert access for all users" on models 
  for insert with check (true);
