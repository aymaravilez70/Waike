-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  display_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  constraint username_length check (char_length(display_name) >= 3)
);

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. SONGS (Cache metadata to avoid repeated API calls)
create table public.songs (
  id text primary key, -- Deezer ID or Provider ID
  title text not null,
  artist text not null,
  album text,
  cover_url text,
  duration int,
  provider text default 'deezer', -- 'deezer', 'youtube', etc.
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.songs enable row level security;
create policy "Songs are viewable by everyone" on songs for select using (true);
create policy "Authenticated users can insert songs" on songs for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update songs" on songs for update using (auth.role() = 'authenticated');

-- 3. PLAYLISTS
create table public.playlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  cover_url text,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.playlists enable row level security;

create policy "Public playlists are viewable by everyone" 
  on playlists for select 
  using ( is_public = true );

create policy "Users can view their own playlists" 
  on playlists for select 
  using ( auth.uid() = user_id );

create policy "Users can create their own playlists" 
  on playlists for insert 
  with check ( auth.uid() = user_id );

create policy "Users can update their own playlists" 
  on playlists for update 
  using ( auth.uid() = user_id );

create policy "Users can delete their own playlists" 
  on playlists for delete 
  using ( auth.uid() = user_id );

-- 4. PLAYLIST_SONGS (Junction table)
create table public.playlist_songs (
  id uuid default uuid_generate_v4() primary key,
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  song_id text references public.songs(id) not null,
  added_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.playlist_songs enable row level security;

create policy "View playlist songs" 
  on playlist_songs for select 
  using ( exists (
    select 1 from playlists p 
    where p.id = playlist_songs.playlist_id 
    and (p.is_public = true or p.user_id = auth.uid())
  ));

create policy "Add songs to own playlist" 
  on playlist_songs for insert 
  with check ( exists (
    select 1 from playlists p 
    where p.id = playlist_songs.playlist_id 
    and p.user_id = auth.uid()
  ));

create policy "Remove songs from own playlist" 
  on playlist_songs for delete 
  using ( exists (
    select 1 from playlists p 
    where p.id = playlist_songs.playlist_id 
    and p.user_id = auth.uid()
  ));

-- 5. FAVORITES (Liked Songs)
create table public.favorites (
  user_id uuid references public.profiles(id) not null,
  song_id text references public.songs(id) not null,
  liked_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, song_id)
);

alter table public.favorites enable row level security;

create policy "Users can view their own favorites" 
  on favorites for select 
  using ( auth.uid() = user_id );

create policy "Users can add favorites" 
  on favorites for insert 
  with check ( auth.uid() = user_id );

create policy "Users can remove favorites" 
  on favorites for delete 
  using ( auth.uid() = user_id );
