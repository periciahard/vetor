-- ============================================================
-- ETE Professor José Luiz de Mendonça
-- Diagnóstico Pedagógico ETE - Consolidação Supabase V66.5
-- Execute no SQL Editor do Supabase.
-- Seguro para bancos já criados: usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- ============================================================

create extension if not exists "pgcrypto";

-- 1) Tabelas-base compatíveis com a plataforma V66.5
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  perfil text not null default 'professor',
  disciplina text,
  serie text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table if not exists public.turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  serie text,
  turno text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table if not exists public.alunos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  matricula text,
  turma_id uuid references public.turmas(id) on delete cascade,
  criado_em timestamptz default now()
);

create table if not exists public.descritores (
  id uuid primary key default gen_random_uuid(),
  disciplina text not null,
  codigo text not null,
  descricao text not null,
  criado_em timestamptz default now()
);

create table if not exists public.questoes (
  id uuid primary key default gen_random_uuid(),
  disciplina text not null,
  serie text,
  descritor_id uuid references public.descritores(id),
  descritor text,
  enunciado text,
  alternativa_a text,
  alternativa_b text,
  alternativa_c text,
  alternativa_d text,
  alternativa_e text,
  gabarito text,
  criado_em timestamptz default now()
);

create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  nome text,
  titulo text,
  tipo text default 'diagnostica',
  disciplina text not null,
  turma_id uuid references public.turmas(id) on delete cascade,
  professor_id uuid references auth.users(id),
  data_aplicacao date,
  data_avaliacao date,
  questoes_json jsonb default '[]'::jsonb,
  descritores_json jsonb default '[]'::jsonb,
  gabarito_json jsonb default '[]'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists public.respostas (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid references public.avaliacoes(id) on delete cascade,
  aluno_id uuid references public.alunos(id) on delete cascade,
  questao_id uuid references public.questoes(id),
  resposta text,
  acertou boolean,
  criado_em timestamptz default now()
);

create table if not exists public.resultados_alunos (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid references public.avaliacoes(id) on delete cascade,
  aluno_id uuid references public.alunos(id) on delete cascade,
  aluno_nome text not null,
  respostas_json jsonb default '[]'::jsonb,
  acertos integer default 0,
  total integer default 0,
  percentual numeric default 0,
  descritores_criticos jsonb default '[]'::jsonb,
  relatorio_individual text,
  mapa_da_mina jsonb,
  ficha_exercicios jsonb,
  criado_em timestamptz default now()
);

-- 2) Complementos para bancos que vieram de versões anteriores
alter table public.perfis add column if not exists disciplina text;
alter table public.perfis add column if not exists serie text;
alter table public.perfis add column if not exists ativo boolean default true;

alter table public.turmas add column if not exists turno text;
alter table public.turmas add column if not exists ativo boolean default true;

alter table public.alunos add column if not exists matricula text;
alter table public.alunos add column if not exists turma_id uuid references public.turmas(id) on delete cascade;

alter table public.questoes add column if not exists serie text;
alter table public.questoes add column if not exists descritor text;
alter table public.questoes add column if not exists alternativa_a text;
alter table public.questoes add column if not exists alternativa_b text;
alter table public.questoes add column if not exists alternativa_c text;
alter table public.questoes add column if not exists alternativa_d text;
alter table public.questoes add column if not exists alternativa_e text;

alter table public.avaliacoes add column if not exists nome text;
alter table public.avaliacoes add column if not exists titulo text;
alter table public.avaliacoes add column if not exists tipo text default 'diagnostica';
alter table public.avaliacoes add column if not exists data_aplicacao date;
alter table public.avaliacoes add column if not exists data_avaliacao date;
alter table public.avaliacoes add column if not exists questoes_json jsonb default '[]'::jsonb;
alter table public.avaliacoes add column if not exists descritores_json jsonb default '[]'::jsonb;
alter table public.avaliacoes add column if not exists gabarito_json jsonb default '[]'::jsonb;

alter table public.resultados_alunos add column if not exists aluno_id uuid references public.alunos(id) on delete cascade;
alter table public.resultados_alunos add column if not exists respostas_json jsonb default '[]'::jsonb;
alter table public.resultados_alunos add column if not exists mapa_da_mina jsonb;
alter table public.resultados_alunos add column if not exists ficha_exercicios jsonb;

update public.avaliacoes set titulo = coalesce(titulo, nome, 'Avaliação') where titulo is null;
update public.avaliacoes set nome = coalesce(nome, titulo, 'Avaliação') where nome is null;
update public.avaliacoes set data_avaliacao = coalesce(data_avaliacao, data_aplicacao, current_date) where data_avaliacao is null;
update public.avaliacoes set data_aplicacao = coalesce(data_aplicacao, data_avaliacao, current_date) where data_aplicacao is null;

-- 3) RLS
alter table public.perfis enable row level security;
alter table public.turmas enable row level security;
alter table public.alunos enable row level security;
alter table public.descritores enable row level security;
alter table public.questoes enable row level security;
alter table public.avaliacoes enable row level security;
alter table public.respostas enable row level security;
alter table public.resultados_alunos enable row level security;

-- 4) Políticas institucionais simples e compatíveis com a fase atual
-- Para endurecer permissões posteriormente, substitua estas políticas por regras por perfil/turma.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='perfis' and policyname='v665_autenticados_perfis_select') then
    create policy "v665_autenticados_perfis_select" on public.perfis for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='perfis' and policyname='v665_autenticados_perfis_write') then
    create policy "v665_autenticados_perfis_write" on public.perfis for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='turmas' and policyname='v665_autenticados_turmas_all') then
    create policy "v665_autenticados_turmas_all" on public.turmas for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='alunos' and policyname='v665_autenticados_alunos_all') then
    create policy "v665_autenticados_alunos_all" on public.alunos for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='descritores' and policyname='v665_autenticados_descritores_all') then
    create policy "v665_autenticados_descritores_all" on public.descritores for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='questoes' and policyname='v665_autenticados_questoes_all') then
    create policy "v665_autenticados_questoes_all" on public.questoes for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='avaliacoes' and policyname='v665_autenticados_avaliacoes_all') then
    create policy "v665_autenticados_avaliacoes_all" on public.avaliacoes for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='respostas' and policyname='v665_autenticados_respostas_all') then
    create policy "v665_autenticados_respostas_all" on public.respostas for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='resultados_alunos' and policyname='v665_autenticados_resultados_all') then
    create policy "v665_autenticados_resultados_all" on public.resultados_alunos for all to authenticated using (true) with check (true);
  end if;
end $$;

-- 5) Índices úteis para histórico/evolução
create index if not exists idx_alunos_turma_nome on public.alunos(turma_id, nome);
create index if not exists idx_avaliacoes_turma_data on public.avaliacoes(turma_id, data_avaliacao, criado_em);
create index if not exists idx_resultados_avaliacao on public.resultados_alunos(avaliacao_id);
create index if not exists idx_respostas_avaliacao on public.respostas(avaliacao_id);

-- 6) Verificação rápida
select
  'V66.5 Supabase consolidado' as status,
  (select count(*) from public.turmas) as turmas,
  (select count(*) from public.alunos) as alunos,
  (select count(*) from public.avaliacoes) as avaliacoes,
  (select count(*) from public.resultados_alunos) as resultados_alunos;
