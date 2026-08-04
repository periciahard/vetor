# Limpeza do projeto — histórico

## v1
Removeu arquivos de histórico e versões antigas que não eram carregados pela aplicação
(READMEs antigos, AUDITORIA_*.md antigos, JS obsoletos, `assets/logo-ete.png`).

## v2 (esta versão) — ver AUDITORIA_V2.md para o relatório completo
- Removidas 3 imagens da identidade visual anterior sem nenhuma referência no código:
  `assets/header-ete-modelo.png`, `assets/modelo-logo-1.png`, `assets/modelo-logo-2.png`.
- Removida a pasta `descritores/` (JSON antigo, nunca carregado — os descritores em uso
  estão hardcoded em `js/descritores.js`).
- Scripts SQL da era anterior ("ETE", schema V66.x) movidos para `sql-legado/` em vez de
  apagados, por segurança em relação a bancos antigos ainda não migrados.
