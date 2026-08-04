-- ============================================================
-- ETE Professor José Luiz de Mendonça
-- Diagnóstico Pedagógico ETE - Consolidação Supabase V66.6
-- Execute no SQL Editor do Supabase.
-- Seguro: não apaga dados. Apenas cria índices e uma visão de auditoria.
-- ============================================================

create extension if not exists "pgcrypto";

-- Índices para acelerar salvamento, histórico, evolução e detecção de duplicidades
create index if not exists idx_v666_avaliacoes_assinatura
on public.avaliacoes(turma_id, disciplina, tipo, titulo, data_aplicacao);

create index if not exists idx_v666_avaliacoes_professor
on public.avaliacoes(professor_id);

create index if not exists idx_v666_resultados_avaliacao_aluno
on public.resultados_alunos(avaliacao_id, aluno_id);

create index if not exists idx_v666_respostas_avaliacao_aluno
on public.respostas(avaliacao_id, aluno_id);

-- Visão de auditoria: mostra avaliações potencialmente duplicadas
create or replace view public.v666_avaliacoes_possiveis_duplicadas as
select
  turma_id,
  disciplina,
  tipo,
  titulo,
  data_aplicacao,
  count(*) as quantidade,
  array_agg(id order by criado_em desc) as ids,
  min(criado_em) as primeiro_registro,
  max(criado_em) as ultimo_registro
from public.avaliacoes
group by turma_id, disciplina, tipo, titulo, data_aplicacao
having count(*) > 1;

-- Conferência rápida
select
  'V66.6 Supabase consolidado' as status,
  (select count(*) from public.turmas) as turmas,
  (select count(*) from public.alunos) as alunos,
  (select count(*) from public.avaliacoes) as avaliacoes,
  (select count(*) from public.respostas) as respostas,
  (select count(*) from public.resultados_alunos) as resultados_alunos,
  (select count(*) from public.v666_avaliacoes_possiveis_duplicadas) as grupos_possivelmente_duplicados;
