# Auditoria completa — VETOR (v1 → v2)

Auditoria feita analisando, arquivo por arquivo, o que é efetivamente referenciado
por `index.html`, `service-worker.js`, `manifest.webmanifest` e por todos os `.js`
(incluindo construção dinâmica de caminhos, ex. `assets/${l}`).

## 1. Removidos (0 referências em qualquer lugar do código)

| Arquivo | Tamanho | Motivo |
|---|---|---|
| `assets/header-ete-modelo.png` | 180 KB | Nenhuma referência estática ou dinâmica. Resquício da identidade visual anterior ("ETE"), não coberto pela limpeza da v1. |
| `assets/modelo-logo-1.png` | 616 KB | Idem. A lista `LOGOS` em `js/exportacoes-office.js` só contém `vetor-logo.png`. |
| `assets/modelo-logo-2.png` | 392 KB | Idem. |
| `descritores/matematica-em.json` | 17,5 KB | Nenhum `fetch`/`import` no projeto carrega esse arquivo. Os descritores realmente usados estão *hardcoded* em `js/descritores.js` (`window.Descritores`). Este JSON é uma base de dados antiga, duplicada e não sincronizada com a que está em uso. |
| `descritores/portugues-em.json` | 11,2 KB | Idem. |

**Total removido: ≈ 1,22 MB** (mais de 85% do peso do pacote original, que tinha 1,4 MB).

Pasta `descritores/` foi removida por ficar vazia.

## 2. Arquivados, não deletados (risco para bancos já existentes)

Os scripts abaixo pertencem à era anterior do projeto (identidade "ETE Professor
José Luiz de Mendonça", schema V66.x), já superada pelos scripts `supabase_vetor_v68_*`.
Nenhum é carregado pelo front-end (scripts SQL são executados manualmente no
Supabase), então não há risco de quebrar a aplicação ao movê-los. Mas apagá-los
de vez pode ser arriscado caso exista algum banco em produção que ainda dependa
deles para uma migração pontual. Por isso foram movidos para `sql-legado/` em vez
de excluídos:

- `supabase_ete_consolidacao_v66_5.sql`
- `supabase_ete_consolidacao_v66_6.sql`
- `supabase_ete_consolidacao_v66_7.sql`
- `supabase_ete_diagnostico_schema.sql`
- `supabase_ete_migracao_v66.sql`

**Se você tem certeza de que nenhum banco em uso precisa mais desses scripts**
(ou seja, todos os bancos já rodam o schema V68.x), pode apagar a pasta
`sql-legado/` inteira com segurança.

## 3. Mantidos — confirmados como ativos

- Todo `index.html`, `manifest.webmanifest`, `service-worker.js`.
- Todo `css/style.css`.
- Todos os 26 arquivos em `js/` — cada um tem uma tag `<script>` correspondente em `index.html`.
- `assets/vetor-logo.png`, `assets/vetor-logo.svg`, `assets/icons/icon.png`, `assets/icons/icon.svg` — referenciados em `index.html`, `manifest.webmanifest`, `service-worker.js` e/ou `js/exportacoes-office.js`.
- `supabase_vetor_v68_6.sql`, `supabase_vetor_v68_6_1_hotfix_auth.sql`, `supabase_vetor_v68_7_admin_institucional.sql` — schema ativo atual.
- `supabase_edge_function_vetor_admin_user.ts` — Edge Function usada por `js/auth-supabase.js` (criação/reset de usuário via `action:'createUser'` / `action:'resetPassword'`).

## 4. Bug corrigido nesta versão

`service-worker.js` guardava no cache `./index.html?v=69-svg-icons` e
`./css/style.css?v=69-svg-icons`, enquanto o `index.html` atual carrega
`css/style.css?v=72-logout-header` e os scripts com `?v=68-7`/`?v=68-8`, e o
`manifest.webmanifest` aponta `start_url` para `./index.html?v=68-7`. O nome
do cache já estava atualizado (`vetor-v72-logout-header`), mas as strings de
versão dentro da lista `ASSETS` (e no fallback offline do `fetch`) tinham
ficado para trás. Isso não quebrava o app em uso normal (o handler de
`fetch` sempre busca a rede primeiro), mas fazia o pré-cache da instalação
(`install`) tentar baixar uma URL de `index.html`/`style.css` que não
corresponde ao arquivo real servido hoje, e o fallback offline caía numa
versão desatualizada.

**Correção aplicada:**
- `./index.html?v=69-svg-icons` → `./index.html?v=68-7` (alinhado ao `start_url` do manifest)
- `./css/style.css?v=69-svg-icons` → `./css/style.css?v=72-logout-header` (alinhado ao `<link>` do `index.html`)
- Fallback offline do `fetch` atualizado para `./index.html?v=68-7`

## 5. Revisão de código morto (v3) — funções JS e classes CSS não usadas

Verificação feita cruzando cada função (`function nome(...)`) e cada classe CSS
(`.classe{...}`) com todo o restante do projeto (HTML + os 26 arquivos JS),
incluindo os objetos `window.X={...}` que cada módulo exporta — uma função só
foi considerada morta se não aparecesse em lugar nenhum além da própria
declaração.

### JavaScript — removido
| Item | Arquivo | Motivo |
|---|---|---|
| `function questionOk(u,q)` | `js/auth-supabase.js` | Nunca chamada e não está na lista exportada em `window.AuthSupabase` (que inclui `assessmentOk`, `turmaOk`, `disciplineOk` etc., mas não esta). Resquício de um modelo antigo de permissão por questão. |
| `function triRobusta()` | `js/pedagogico-avancado.js` | Nunca chamada (nem por `renderAll()`, que soma só `profileTurma, radar, evolution, riskPanel, conselho, bankSmart, studentAppend`), não exportada, e busca `#triAdvancedPanel`, um elemento que **não existe** em `index.html`. Resquício de uma funcionalidade de TRI (Teoria de Resposta ao Item) que foi retirada da interface, mas cujo código ficou para trás. |

### CSS — removido
112 seletores/regras (ou partes de regras com seletores combinados) que
apontavam para classes sem nenhum uso em `index.html` ou em qualquer `.js`,
todas remanescentes de estruturas de tela anteriores:

- **Cabeçalho antigo:** `.hero-title`, `.hero-logo`, `.hero-actions`, `.savebox`, `.creator` — o cabeçalho atual usa outra marcação (`.vetor-header-brand`, `.vetor-user-box` etc.).
- **Menu lateral antigo:** `.sidebar-nav`, `.sidebar-toggle`, `.sidebar-user`, `.sidebar-session`, `.menu-item`, `.nav-section-title` — o menu atual usa `.sidebar` e `.nav` diretamente.
- **Modal antigo de login/senha:** `.modal-card`, `.password-modal`, `.sidebarLogoutBtn`, `.sidebarPasswordBtn`.
- **Painel de administração antigo:** `.users-admin-table`, `.admin-user-form`.
- **Dashboard versionado:** `.v54-alerts`, `.v54-dashboard`, `.v54-student-extra`, `.badge-v55`, `.v56-note` — literalmente marcados com números de versão de builds anteriores.
- **Funcionalidade de TRI removida:** `.tri-help`, `.tri-scale`, `.tri-table` (a parte específica de `.tri-table` foi removida de seletores combinados como `.preview-table,.tri-table`, mantendo `.preview-table`, que continua em uso).
- Outras ~40 classes isoladas sem nenhum uso: `metricgrid`, `reportbox`, `photo-grid`, `photo-q`, `saved-row`, `print-area`, `quick-actions`, `info-dot`, `panel-toggle`, `coord-ux-note`, `ux-card`, `home-insights`, `export-status`, `evolution-guide`, `inline-check`, `readonly-note`, `assistant-callout`, `blocked`, `compact-modules`, `smallTopBtn`, `wizard-grid`, `proof-table`, `quick-filter`, `flow-panel`, `flow-steps`, `hero-action`, `logo-title`, `logo-subtitle`, `main-content`, `management-hero`, `vetor-hero`, `professor-panel`, `professor-checklist`, `checklist-pedagogico`, `student-advanced`, `coordenacao-institucional`, `status-level-note`, `c0`, `c1`.

Em todos os casos em que a classe morta fazia parte de um seletor combinado com
uma classe **ativa** (ex.: `.metricgrid,.checkgrid{...}` ou `.reportbox,.map-output{...}`),
apenas a parte morta foi removida — `.checkgrid` e `.map-output`, que continuam
em uso, foram preservados intactos. `css/style.css` caiu de 105.604 para 93.920
caracteres (–11%), sem alterar nenhum estilo visível hoje na aplicação.

**O que não foi tocado:** não removi nenhuma classe que aparecesse pelo menos
uma vez em `index.html` ou em algum template `innerHTML` dos arquivos `.js`,
mesmo que o uso pareça raro — o risco de quebrar uma tela pouco testada é maior
que o ganho de espaço.

## Resultado

- Pacote v1: 55 arquivos, ≈ 1,4 MB.
- Pacote v2: 53 arquivos "ativos" + 5 arquivos SQL arquivados em `sql-legado/`, ≈ 0,8 MB (–~40% no total; –~85% considerando só o que estava realmente morto). Corrigido bug de versionamento do cache no `service-worker.js`.
- Pacote v3 (esta versão): mesmos arquivos do v2, mas com 2 funções JavaScript mortas removidas e 112 regras/seletores CSS de telas antigas removidos (`css/style.css`: –11%). Nenhuma mudança visual ou funcional para quem usa o sistema hoje — só código que já não rodava.
