-- Migração necessária para a versão V66 Supabase da Plataforma Diagnóstico ETE.
-- Execute no SQL Editor do Supabase antes de testar gravação/leitura na nuvem.

-- 1) Complementa a tabela avaliacoes criada no passo inicial.
alter table avaliacoes add column if not exists titulo text;
alter table avaliacoes add column if not exists tipo text default 'diagnostica';
alter table avaliacoes add column if not exists data_avaliacao date;
alter table avaliacoes add column if not exists questoes_json jsonb default '[]'::jsonb;
alter table avaliacoes add column if not exists descritores_json jsonb default '[]'::jsonb;
alter table avaliacoes add column if not exists gabarito_json jsonb default '[]'::jsonb;

update avaliacoes set titulo = coalesce(titulo, nome) where titulo is null;
update avaliacoes set data_avaliacao = coalesce(data_avaliacao, data_aplicacao) where data_avaliacao is null;

-- 2) Cria uma tabela própria para armazenar resultados importados das planilhas.
create table if not exists resultados_alunos (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid references avaliacoes(id) on delete cascade,
  aluno_id uuid references alunos(id) on delete cascade,
  aluno_nome text not null,
  respostas_json jsonb default '[]'::jsonb,
  acertos integer default 0,
  total integer default 0,
  percentual numeric default 0,
  descritores_criticos jsonb default '[]'::jsonb,
  relatorio_individual text,
  mapa_da_mina jsonb,
  ficha_exercicios jsonb,
  criado_em timestamp default now()
);

alter table resultados_alunos enable row level security;

-- 3) Políticas simples para teste institucional com usuários autenticados.
do $$
begin
  if not exists (select 1 from pg_policies where tablename='resultados_alunos' and policyname='usuarios autenticados gerenciam resultados_alunos') then
    create policy "usuarios autenticados gerenciam resultados_alunos"
    on resultados_alunos for all
    to authenticated
    using (true)
    with check (true);
  end if;
end $$;

-- 4) Garante leitura/gravação autenticada nas tabelas já criadas.
do $$
begin
  if not exists (select 1 from pg_policies where tablename='turmas' and policyname='usuarios autenticados gerenciam turmas') then
    create policy "usuarios autenticados gerenciam turmas"
    on turmas for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='perfis' and policyname='usuarios autenticados gerenciam perfis') then
    create policy "usuarios autenticados gerenciam perfis"
    on perfis for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='alunos' and policyname='usuarios autenticados gerenciam alunos') then
    create policy "usuarios autenticados gerenciam alunos"
    on alunos for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='avaliacoes' and policyname='usuarios autenticados gerenciam avaliacoes') then
    create policy "usuarios autenticados gerenciam avaliacoes"
    on avaliacoes for all to authenticated using (true) with check (true);
  end if;
end $$;

-- 5) Turma mínima para teste imediato. Você pode apagar depois.
insert into turmas (nome, serie)
select 'Turma Teste', 'Teste'
where not exists (select 1 from turmas where nome='Turma Teste');
