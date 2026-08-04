# VETOR V68.7 – Produção Final

**VETOR**  
**Transformando avaliações em direção pedagógica.**

Versão focada em produção:
- identidade VETOR consolidada;
- cache e PWA revisados;
- exportações padronizadas;
- RLS institucional mais restritivo;
- limpeza de resquícios visuais e técnicos da identidade anterior;
- scripts verificados sem erro de sintaxe.

Arquivo SQL: `supabase_vetor_v68_6.sql`


## VETOR SEPC v3.1

Correção aplicada: o diagnóstico passa a calibrar os itens apenas com os alunos da avaliação ativa/importação atual. Se forem importadas até 4 planilhas juntas, elas são consolidadas antes do cálculo do IA, dos pesos, da proficiência 0–500 e dos níveis. Avaliações antigas salvas não entram mais na calibração, evitando divergência com o SEPC.

## v3.2 — Motor SEPC idêntico
- O cálculo do diagnóstico foi ajustado para reproduzir o HTML SEPC de referência.
- IA da questão: acertos / respostas não vazias naquela questão.
- Todos os alunos importados entram no resultado, sem filtro de 80% de preenchimento.
- Respostas em branco contam como erro individual, mas não entram no denominador do IA da questão.
- Peso, coerência, penalização e cortes 0–500 mantidos conforme SEPC.

## v3.3 — Correção do motor SEPC consolidado

Nesta versão, o cálculo do IA e dos pesos passa a consolidar todas as turmas salvas que pertencem à mesma aplicação: mesma disciplina, mesmas questões, mesmo gabarito e mesmos descritores. Assim, quando o professor importar 1, 2, 3 ou 4 planilhas da mesma prova, o VETOR calcula os pesos uma única vez com o conjunto total de alunos e depois apresenta os resultados por turma.

Observação técnica: este motor não é TRI. Ele é uma escala pedagógica 0–500 baseada em índice de acerto, peso por dificuldade empírica e regra de coerência, conforme o SEPC de referência usado no projeto.


## VETOR SEPC v3.4 — Três motores de cálculo

Esta versão implementa exatamente três modos de cálculo da proficiência na aba Resultados:

1. **SEPC Compatível (Linear)**
   - IA = acertos da questão / alunos que responderam a questão.
   - Peso = 1 + 4 × (1 − IA).
   - Proficiência = nota bruta / nota máxima × 500.

2. **Curva Logística**
   - Mantém IA, nota bruta, nota máxima, escala 0–500, coerência e níveis.
   - Altera apenas o peso do item para: Peso = 1 + 4 / (1 + e^(6 × (IA − 0,5))).

3. **Comparativo**
   - Executa Linear e Logístico lado a lado.
   - Mostra média nos dois motores, diferença média, distribuição por níveis e comparação aluno por aluno.

Observação técnica: nenhum dos três modos é TRI. São modelos pedagógicos de proficiência em escala 0–500 baseados no Índice de Acerto dos itens.


## V3.5 — Motor de proficiência restrito ao administrador

- A aba Resultados não exibe mais o seletor de cálculo para o professor.
- O professor visualiza apenas proficiência, níveis, descritores e relatórios.
- A escolha do motor foi movida para Configurações, área restrita ao administrador.
- Motor logístico configurado com K = 6.
- Opções administrativas mantidas: Linear, Logístico (K = 6) e Comparativo.
- O sistema não utiliza TRI; utiliza escala pedagógica 0–500 por IA/peso.
