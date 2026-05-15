-- Sessions: one per ticker analysis
create table sessions (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  quarter text not null,
  title text not null,
  provider text not null,
  model text not null,
  analysis_result jsonb not null,
  report_md text,
  report_generated_at timestamptz,
  user_session_id text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages: chat history per session
create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  provider text,
  created_at timestamptz default now()
);

create index idx_sessions_user_session_id on sessions(user_session_id);
create index idx_sessions_created_at on sessions(created_at desc);
create index idx_messages_session_id on messages(session_id);

alter table sessions enable row level security;
alter table messages enable row level security;

create policy "sessions: own rows only"
  on sessions for all
  using (user_session_id = current_setting('app.user_session_id', true));

create policy "messages: own sessions only"
  on messages for all
  using (
    session_id in (
      select id from sessions
      where user_session_id = current_setting('app.user_session_id', true)
    )
  );
