-- V68.7.1 HOTFIX AUTH/USUÁRIOS
-- Execute no SQL Editor do Supabase após subir a versão do site.

-- 1) Colunas para forçar troca de senha no primeiro login.
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS senha_temporaria boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS senha_alterada_em timestamp;

-- Professores institucionais podem ser marcados como senha temporária.
-- Ajuste conforme necessidade.
UPDATE perfis
SET senha_temporaria = true
WHERE email LIKE '%@vetor.edu'
  AND perfil IN ('professor','coordenacao')
  AND senha_alterada_em IS NULL;

-- Admins não são forçados por padrão.
UPDATE perfis
SET senha_temporaria = false
WHERE perfil = 'admin';

-- 2) Tabela de vínculo professor-turma, se ainda não existir.
CREATE TABLE IF NOT EXISTS professor_turmas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id uuid NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    turma_id uuid NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    disciplina text,
    criado_em timestamp DEFAULT now(),
    UNIQUE (professor_id, turma_id, disciplina)
);

ALTER TABLE professor_turmas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS professor_turmas_select ON professor_turmas;
CREATE POLICY professor_turmas_select
ON professor_turmas
FOR SELECT
TO authenticated
USING (
  professor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.id = auth.uid()
      AND p.perfil IN ('admin','coordenacao')
  )
);

DROP POLICY IF EXISTS professor_turmas_insert_admin ON professor_turmas;
CREATE POLICY professor_turmas_insert_admin
ON professor_turmas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.id = auth.uid()
      AND p.perfil IN ('admin','coordenacao')
  )
);

DROP POLICY IF EXISTS professor_turmas_update_admin ON professor_turmas;
CREATE POLICY professor_turmas_update_admin
ON professor_turmas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.id = auth.uid()
      AND p.perfil IN ('admin','coordenacao')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.id = auth.uid()
      AND p.perfil IN ('admin','coordenacao')
  )
);

DROP POLICY IF EXISTS professor_turmas_delete_admin ON professor_turmas;
CREATE POLICY professor_turmas_delete_admin
ON professor_turmas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.id = auth.uid()
      AND p.perfil IN ('admin','coordenacao')
  )
);

-- 3) Permitir que admin/coord atualizem perfis pela tela de Usuários.
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vetor_perfis_select ON perfis;
CREATE POLICY vetor_perfis_select
ON perfis
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.id = auth.uid()
      AND p.perfil IN ('admin','coordenacao')
  )
);

DROP POLICY IF EXISTS vetor_perfis_insert_admin ON perfis;
CREATE POLICY vetor_perfis_insert_admin
ON perfis
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.id = auth.uid()
      AND p.perfil = 'admin'
  )
);

DROP POLICY IF EXISTS vetor_perfis_update_admin_self ON perfis;
CREATE POLICY vetor_perfis_update_admin_self
ON perfis
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.id = auth.uid()
      AND p.perfil = 'admin'
  )
)
WITH CHECK (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.id = auth.uid()
      AND p.perfil = 'admin'
  )
);

DROP POLICY IF EXISTS vetor_perfis_delete_admin ON perfis;
CREATE POLICY vetor_perfis_delete_admin
ON perfis
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.id = auth.uid()
      AND p.perfil = 'admin'
  )
);
