-- VETOR V68.7.1 - Produção Final
-- Estrutura, índices e políticas RLS institucionais.
-- Execute no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  perfil text not null check (perfil in ('admin','coordenacao','professor')),
  disciplina text,
  criado_em timestamp with time zone default now()
);

create table if not exists turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  serie text not null default 'Não informada',
  criado_em timestamp with time zone default now()
);

create table if not exists professor_turma (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid references auth.users(id) on delete cascade,
  turma_id uuid references turmas(id) on delete cascade,
  unique (professor_id, turma_id)
);

create table if not exists alunos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  matricula text,
  turma_id uuid references turmas(id) on delete cascade,
  criado_em timestamp with time zone default now()
);

create table if not exists descritores (
  id uuid primary key default gen_random_uuid(),
  disciplina text not null,
  codigo text not null,
  descricao text not null,
  unique (disciplina, codigo)
);

create table if not exists questoes (
  id uuid primary key default gen_random_uuid(),
  disciplina text not null,
  descritor_id uuid references descritores(id),
  enunciado text,
  gabarito text,
  criado_em timestamp with time zone default now()
);

create table if not exists avaliacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  disciplina text not null,
  turma_id uuid references turmas(id) on delete cascade,
  professor_id uuid references auth.users(id) on delete set null,
  data_aplicacao date,
  criado_em timestamp with time zone default now(),
  titulo text,
  tipo text default 'diagnostica'
);

create table if not exists respostas (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid references avaliacoes(id) on delete cascade,
  aluno_id uuid references alunos(id) on delete cascade,
  questao_id uuid references questoes(id),
  resposta text,
  acertou boolean,
  unique (avaliacao_id, aluno_id, questao_id)
);

create table if not exists resultados_alunos (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid references avaliacoes(id) on delete cascade,
  aluno_id uuid references alunos(id) on delete cascade,
  aluno_nome text,
  respostas_json jsonb default '[]'::jsonb,
  acertos int default 0,
  total int default 0,
  percentual numeric default 0,
  descritores_criticos jsonb default '[]'::jsonb,
  criado_em timestamp with time zone default now(),
  unique (avaliacao_id, aluno_id)
);

create index if not exists idx_alunos_turma on alunos(turma_id);
create index if not exists idx_avaliacoes_turma on avaliacoes(turma_id);
create index if not exists idx_avaliacoes_professor on avaliacoes(professor_id);
create index if not exists idx_respostas_avaliacao on respostas(avaliacao_id);
create index if not exists idx_resultados_avaliacao on resultados_alunos(avaliacao_id);
create index if not exists idx_resultados_aluno on resultados_alunos(aluno_id);

create or replace function public.vetor_meu_perfil()
returns text
language sql stable security definer
set search_path = public
as $$
  select perfil from perfis where id = auth.uid()
$$;

create or replace function public.vetor_is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select perfil in ('admin','coordenacao') from perfis where id = auth.uid()), false)
$$;

create or replace function public.vetor_pode_ver_turma(t uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.vetor_is_admin()
    or exists (select 1 from professor_turma pt where pt.professor_id = auth.uid() and pt.turma_id = t)
    or exists (select 1 from avaliacoes a where a.turma_id = t and a.professor_id = auth.uid())
$$;

alter table perfis enable row level security;
alter table turmas enable row level security;
alter table professor_turma enable row level security;
alter table alunos enable row level security;
alter table descritores enable row level security;
alter table questoes enable row level security;
alter table avaliacoes enable row level security;
alter table respostas enable row level security;
alter table resultados_alunos enable row level security;

drop policy if exists "vetor_perfis_select" on perfis;
create policy "vetor_perfis_select" on perfis for select to authenticated
using (id = auth.uid() or public.vetor_is_admin());

drop policy if exists "vetor_perfis_admin_all" on perfis;
create policy "vetor_perfis_admin_all" on perfis for all to authenticated
using (public.vetor_is_admin())
with check (public.vetor_is_admin());

drop policy if exists "vetor_turmas_select" on turmas;
create policy "vetor_turmas_select" on turmas for select to authenticated
using (public.vetor_is_admin() or public.vetor_pode_ver_turma(id));

drop policy if exists "vetor_turmas_write" on turmas;
create policy "vetor_turmas_write" on turmas for all to authenticated
using (public.vetor_is_admin())
with check (public.vetor_is_admin());

drop policy if exists "vetor_professor_turma_select" on professor_turma;
create policy "vetor_professor_turma_select" on professor_turma for select to authenticated
using (public.vetor_is_admin() or professor_id = auth.uid());

drop policy if exists "vetor_professor_turma_admin" on professor_turma;
create policy "vetor_professor_turma_admin" on professor_turma for all to authenticated
using (public.vetor_is_admin())
with check (public.vetor_is_admin());

drop policy if exists "vetor_alunos_select" on alunos;
create policy "vetor_alunos_select" on alunos for select to authenticated
using (public.vetor_pode_ver_turma(turma_id));

drop policy if exists "vetor_alunos_write" on alunos;
create policy "vetor_alunos_write" on alunos for all to authenticated
using (public.vetor_is_admin() or public.vetor_pode_ver_turma(turma_id))
with check (public.vetor_is_admin() or public.vetor_pode_ver_turma(turma_id));

drop policy if exists "vetor_descritores_select" on descritores;
create policy "vetor_descritores_select" on descritores for select to authenticated using (true);

drop policy if exists "vetor_questoes_select" on questoes;
create policy "vetor_questoes_select" on questoes for select to authenticated using (true);

drop policy if exists "vetor_questoes_admin" on questoes;
create policy "vetor_questoes_admin" on questoes for all to authenticated
using (public.vetor_is_admin()) with check (public.vetor_is_admin());

drop policy if exists "vetor_avaliacoes_select" on avaliacoes;
create policy "vetor_avaliacoes_select" on avaliacoes for select to authenticated
using (public.vetor_is_admin() or professor_id = auth.uid() or public.vetor_pode_ver_turma(turma_id));

drop policy if exists "vetor_avaliacoes_write" on avaliacoes;
create policy "vetor_avaliacoes_write" on avaliacoes for all to authenticated
using (public.vetor_is_admin() or professor_id = auth.uid())
with check (public.vetor_is_admin() or professor_id = auth.uid());

drop policy if exists "vetor_respostas_select" on respostas;
create policy "vetor_respostas_select" on respostas for select to authenticated
using (
  exists (
    select 1 from avaliacoes a
    where a.id = respostas.avaliacao_id
      and (public.vetor_is_admin() or a.professor_id = auth.uid() or public.vetor_pode_ver_turma(a.turma_id))
  )
);

drop policy if exists "vetor_respostas_write" on respostas;
create policy "vetor_respostas_write" on respostas for all to authenticated
using (
  exists (
    select 1 from avaliacoes a
    where a.id = respostas.avaliacao_id
      and (public.vetor_is_admin() or a.professor_id = auth.uid())
  )
)
with check (
  exists (
    select 1 from avaliacoes a
    where a.id = respostas.avaliacao_id
      and (public.vetor_is_admin() or a.professor_id = auth.uid())
  )
);

drop policy if exists "vetor_resultados_select" on resultados_alunos;
create policy "vetor_resultados_select" on resultados_alunos for select to authenticated
using (
  exists (
    select 1 from avaliacoes a
    where a.id = resultados_alunos.avaliacao_id
      and (public.vetor_is_admin() or a.professor_id = auth.uid() or public.vetor_pode_ver_turma(a.turma_id))
  )
);

drop policy if exists "vetor_resultados_write" on resultados_alunos;
create policy "vetor_resultados_write" on resultados_alunos for all to authenticated
using (
  exists (
    select 1 from avaliacoes a
    where a.id = resultados_alunos.avaliacao_id
      and (public.vetor_is_admin() or a.professor_id = auth.uid())
  )
)
with check (
  exists (
    select 1 from avaliacoes a
    where a.id = resultados_alunos.avaliacao_id
      and (public.vetor_is_admin() or a.professor_id = auth.uid())
  )
);
