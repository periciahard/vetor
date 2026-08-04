-- V66.7 – Consolidação Definitiva Supabase
-- Objetivo: remover duplicações antigas e impedir novas duplicações lógicas.
-- Execute no SQL Editor do Supabase uma única vez, após conferir backup.

begin;

-- 1) Atualiza registros filhos para apontar para a avaliação "mantida".
-- Critério: mesma turma, disciplina, título e data_aplicacao; mantém a mais recente.
with ranked as (
  select
    id,
    first_value(id) over (
      partition by turma_id, disciplina, lower(trim(coalesce(titulo,nome,''))), data_aplicacao
      order by criado_em desc, id desc
    ) as keep_id,
    row_number() over (
      partition by turma_id, disciplina, lower(trim(coalesce(titulo,nome,''))), data_aplicacao
      order by criado_em desc, id desc
    ) as rn
  from avaliacoes
)
update resultados_alunos r
set avaliacao_id = ranked.keep_id
from ranked
where r.avaliacao_id = ranked.id
  and ranked.rn > 1;

with ranked as (
  select
    id,
    first_value(id) over (
      partition by turma_id, disciplina, lower(trim(coalesce(titulo,nome,''))), data_aplicacao
      order by criado_em desc, id desc
    ) as keep_id,
    row_number() over (
      partition by turma_id, disciplina, lower(trim(coalesce(titulo,nome,''))), data_aplicacao
      order by criado_em desc, id desc
    ) as rn
  from avaliacoes
)
update respostas r
set avaliacao_id = ranked.keep_id
from ranked
where r.avaliacao_id = ranked.id
  and ranked.rn > 1;

-- 2) Remove resultados duplicados por avaliação/aluno, mantendo o mais recente.
delete from resultados_alunos a
using resultados_alunos b
where a.avaliacao_id = b.avaliacao_id
  and a.aluno_id = b.aluno_id
  and a.criado_em < b.criado_em;

-- 3) Remove respostas duplicadas por avaliação/aluno/resposta/acerto quando houver regravações iguais.
-- Observação: a tabela respostas não possui número da questão; preserva registros distintos por resposta/acerto.
delete from respostas a
using respostas b
where a.avaliacao_id = b.avaliacao_id
  and a.aluno_id = b.aluno_id
  and coalesce(a.resposta,'') = coalesce(b.resposta,'')
  and coalesce(a.acertou,false) = coalesce(b.acertou,false)
  and a.id < b.id;

-- 4) Remove avaliações duplicadas depois de mover filhos.
with ranked as (
  select
    id,
    row_number() over (
      partition by turma_id, disciplina, lower(trim(coalesce(titulo,nome,''))), data_aplicacao
      order by criado_em desc, id desc
    ) as rn
  from avaliacoes
)
delete from avaliacoes a
using ranked
where a.id = ranked.id
  and ranked.rn > 1;

-- 5) Índice único lógico para impedir novas duplicações.
create unique index if not exists avaliacoes_unique_logica_v667
on avaliacoes (
  turma_id,
  disciplina,
  lower(trim(coalesce(titulo,nome,''))),
  data_aplicacao
);

-- 6) Índice de apoio para evolução e dashboard.
create index if not exists resultados_alunos_avaliacao_aluno_idx
on resultados_alunos (avaliacao_id, aluno_id);

commit;
