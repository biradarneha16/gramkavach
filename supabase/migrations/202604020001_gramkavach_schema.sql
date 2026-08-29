create extension if not exists "pgcrypto";

create table if not exists public.citizen_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  full_name text not null,
  phone text not null,
  aadhaar_id text not null,
  village text,
  bank_alias text,
  trusted_device text,
  guardian_pin_hash text not null,
  face_template_ref text,
  emergency_contact text,
  cyber_crime_number text,
  offline_sms_bridge_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists citizen_profiles_owner_user_id_idx
  on public.citizen_profiles (owner_user_id);

create index if not exists citizen_profiles_phone_idx
  on public.citizen_profiles (phone);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.citizen_profiles (id) on delete cascade,
  attempt_type text not null check (attempt_type in ('account-access', 'bank-link', 'device-login')),
  severity text not null check (severity in ('high', 'critical')),
  status text not null check (status in ('pending', 'verified', 'blocked', 'escalated')),
  network_mode text not null check (network_mode in ('online', 'offline')),
  delivery_mode text not null check (delivery_mode in ('server-api', 'device-sms-bridge', 'queued-offline')),
  source text not null,
  location text,
  sms_note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists security_events_profile_status_created_idx
  on public.security_events (profile_id, status, created_at desc);

create table if not exists public.verification_sessions (
  id uuid primary key default gen_random_uuid(),
  security_event_id uuid not null references public.security_events (id) on delete cascade,
  decision text not null check (decision in ('authorised', 'fraud', 'unsure')),
  sign_status text not null check (sign_status in ('right-sign', 'wrong-sign', 'pending')),
  pin_validated boolean not null default false,
  note text,
  reviewed_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists verification_sessions_security_event_id_idx
  on public.verification_sessions (security_event_id);

create table if not exists public.sms_dispatches (
  id uuid primary key default gen_random_uuid(),
  security_event_id uuid references public.security_events (id) on delete set null,
  dispatch_type text not null check (dispatch_type in ('user-alert', 'cybercrime-escalation')),
  destination_phone text not null,
  delivery_mode text not null check (delivery_mode in ('server-api', 'device-sms-bridge', 'queued-offline')),
  provider_status text not null default 'queued',
  provider_reference text,
  payload_hash text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sms_dispatches_security_event_idx
  on public.sms_dispatches (security_event_id, dispatch_type, created_at desc);

alter table public.citizen_profiles enable row level security;
alter table public.security_events enable row level security;
alter table public.verification_sessions enable row level security;
alter table public.sms_dispatches enable row level security;

create policy "profiles owned by authenticated user"
  on public.citizen_profiles
  for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

create policy "events readable through profile owner"
  on public.security_events
  for all
  using (
    exists (
      select 1
      from public.citizen_profiles profiles
      where profiles.id = profile_id
        and profiles.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.citizen_profiles profiles
      where profiles.id = profile_id
        and profiles.owner_user_id = auth.uid()
    )
  );

create policy "verification readable through event owner"
  on public.verification_sessions
  for all
  using (
    exists (
      select 1
      from public.security_events events
      join public.citizen_profiles profiles on profiles.id = events.profile_id
      where events.id = security_event_id
        and profiles.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.security_events events
      join public.citizen_profiles profiles on profiles.id = events.profile_id
      where events.id = security_event_id
        and profiles.owner_user_id = auth.uid()
    )
  );

create policy "sms dispatch readable through event owner"
  on public.sms_dispatches
  for all
  using (
    security_event_id is null
    or exists (
      select 1
      from public.security_events events
      join public.citizen_profiles profiles on profiles.id = events.profile_id
      where events.id = security_event_id
        and profiles.owner_user_id = auth.uid()
    )
  )
  with check (
    security_event_id is null
    or exists (
      select 1
      from public.security_events events
      join public.citizen_profiles profiles on profiles.id = events.profile_id
      where events.id = security_event_id
        and profiles.owner_user_id = auth.uid()
    )
  );
