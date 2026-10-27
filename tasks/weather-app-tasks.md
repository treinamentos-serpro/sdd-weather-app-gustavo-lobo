# Backlog: Weather App

Entrada: [plano técnico](../plans/weather-app-plan.md). Referência:
[spec](../specs/weather-app-spec.md). Todas as tarefas estão **pendentes**.
Este documento define trabalho futuro; não implementa a aplicação nem aprova
decisões abertas.

## Revisão de granularidade

Os IDs anteriores foram substituídos pelos IDs abaixo; usar este mapeamento ao
atualizar referências externas. Na reorganização por camadas, os IDs atuais
foram preservados: sua numeração identifica a tarefa, não sua posição de execução.
O mapeamento abaixo refere-se à revisão de granularidade anterior.

| Tarefa anterior | Motivo da divisão | IDs atuais |
|---|---|---|
| T-01 / T-02 | Mantidas: decisões específicas | T-01 / T-02 |
| T-03 | Escopo, frescor e condições do provedor eram decisões independentes | T-03 a T-05 |
| T-04 | Plataformas, desempenho e disponibilidade tinham aceites distintos | T-06 a T-08 |
| T-05 | Misturava bootstrap, estilos/HTML e infraestrutura de testes em seis arquivos | T-09 a T-11 |
| T-06 | Mantida: contratos em um arquivo | T-12 |
| T-07 / T-08 | Três módulos de regras e três suítes distintas | T-13 a T-18 |
| T-09 a T-15 | Mantidas: uma responsabilidade em até dois arquivos | T-19 a T-25 |
| T-16 | Misturava integração UI e testes do hook/componentes | T-26 a T-28 |
| T-17 a T-19 | Mantidas: mapeamentos e composição no serviço | T-29 a T-31 |
| T-20 | Matriz ampla de clima atual, calendário e respostas parciais | T-32 a T-34 |
| T-21 / T-22 | Mantidas: orquestração de forecast / apresentação atual | T-35 / T-36 |
| T-23 | Previsão e controle de unidade são componentes independentes | T-37 / T-38 |
| T-24 | Misturava ação de estado com composição de UI | T-39 / T-40 |
| T-25 | Cinco suítes e responsabilidades diferentes | T-41 a T-44 |
| T-26 | Estilos globais e alterações abertas em todos os componentes | T-45 a T-48 |
| T-27 | Mantida: jornada principal/conversão no navegador | T-49 |
| T-28 | Recuperação de erros e concorrência/parcialidade são cenários distintos | T-50 / T-51 |
| T-29 | Configuração, automação mobile e avaliação de plataformas | T-52 a T-54 |
| T-30 | Automação e avaliação manual; correções tinham escopo aberto | T-55 / T-56 |
| T-31 | Misturava política de dados, apresentação e testes | T-57 a T-59 |
| T-32 | Desempenho e disponibilidade têm evidências distintas | T-60 / T-61 |
| T-33 | Misturava atribuição UI, configuração e verificação da publicação | T-62 a T-64 |
| T-34 | Execução dos gates e fechamento de rastreabilidade | T-65 / T-66 |

## Revisão de edge cases — 2026-10-27

Cobertura ampliada sem mudanças em produção, priorizando:

- CA-05b: valores exatos 0 → 32, 100 → 212 e -40 → -40 nas onze
  temperaturas da tela, com alternâncias sem mutação nem novas consultas.
- CA-06a/06b: falha de rede do geocoding e retry do termo enviado após
  editar o input; erros HTTP 400/429/500/503 sem retry automático; falha
  após sucesso remove dados anteriores em vez de apresentá-los como atuais.
- CA-07b: campos atuais e arrays diários ausentes/malformados, preservação
  de indicadores válidos, zero real versus indisponível e aviso na UI;
  código WMO desconhecido com ícone acessível no fluxo completo.
- CA-08a: datas locais em UTC+14 na virada do ano e em Nova York na
  transição de horário de verão, sem deslocamento fixo do offset.
- CA-11: timeout real do serviço no navegador com relógio controlado,
  encerramento de loading e recuperação por retry.
- Recorte aprovado: `current`/`daily` ausentes geram erro e retry no
  navegador; não se exige sucesso parcial entre blocos neste recorte.

Evidências: `pnpm lint`, `pnpm build` e `pnpm test` aprovados
(149 testes em 13 arquivos); `pnpm test:e2e -- tests/e2e/weather.spec.ts`
aprovado (20 execuções nos projetos chromium/mobile).

Lacunas remanescentes: timeout durante leitura do corpo HTTP; datas diárias
duplicadas/fora de ordem e faixas físicas inválidas; homônimas com o mesmo
nome no fluxo E2E; apresentação completa em outro locale/fuso de navegador.
Espera por `Retry-After`, política de cache/frescor, matriz de plataformas
e avaliações de acessibilidade/desempenho/disponibilidade seguem pendentes
de implementação ou decisões próprias; testes verdes deste recorte não
representam aceite desses requisitos.

## Regras de execução

- Cada tarefa tem um único resultado principal e um ou dois arquivos prováveis,
  sem globs que escondam expansão de escopo. Arquivos de entrada não contam como
  arquivos a editar. Não criar módulos extras apenas para satisfazer essa contagem.
- Dependências são pré-requisitos diretos; os transitivos não são repetidos.
  Tarefas independentes podem avançar em paralelo, mas alterações no mesmo arquivo
  exigem coordenação. A posição das tarefas no documento segue as dependências;
  os IDs permanecem estáveis mesmo quando a ordem numérica não é crescente.
- Tarefas de decisão exigem aprovação explícita e registro na spec/plano.
  Se houver mudança de escopo, atualizar os artefatos e dependências antes do código.
  Sem aprovação, marcar as tarefas dependentes como bloqueadas, sem defaults arbitrários.
- Respeitar instruções React/Tailwind/testing, TypeScript strict e pnpm.
  Em tarefas que alterem `src/` ou `tests/`, executar `pnpm lint`, `pnpm build` e
  `pnpm test`. Usar testes focados durante o desenvolvimento e `pnpm test:e2e`
  nas tarefas de jornadas. Registrar comandos/resultados no aceite da tarefa.
- Separar a criação das suítes da implementação não elimina a validação desta:
  serviços são verificáveis por suas operações públicas e componentes por props.
  Mapeadores internos podem ser exercitados com fixtures durante o desenvolvimento,
  sem exportações temporárias apenas para teste.
- Não incluir backend, autenticação, store global, geolocalização ou cache genérico.
  Respostas parciais, UTC/datas civis, timeout e `Retry-After` seguem o plano.
- Avaliações não incluem correções ilimitadas. Achados viram tarefas corretivas
  T-NN de escopo limitado antes do fechamento; achados impeditivos bloqueiam o aceite.
- A coluna **Requisitos** e a matriz final mantêm a rastreabilidade. CA e NFR
  complementam os FR, não substituem a leitura da spec.
- Cada critério abaixo é cumulativo. Para concluir uma tarefa, registrar junto ao
  seu ID a evidência (teste/comando e resultado, ou avaliação/decisão datada com
  responsável). Critérios não demonstrados permanecem pendentes; não marcar a
  tarefa concluída com base apenas na existência de arquivos.
- Referências entre colchetes nos critérios apontam para IDs da
  [spec](../specs/weather-app-spec.md); regras adicionais identificadas como
  **Plano** são decisões técnicas, não novos requisitos de produto.
- Nas tarefas de teste, “cobrir” significa ter asserções sobre o resultado esperado
  e execução aprovada da suíte indicada em **Arquivos prováveis**, sem casos
  ignorados para os critérios listados. Nas tarefas visuais, registrar viewport,
  cenário e resultado; screenshot isolado não comprova semântica ou contraste.

## Prioridade e tamanho relativo

Cada tarefa possui **Prioridade** e **Tamanho**. Classificação é de planejamento,
não aprovação de escopo nem estimativa de prazo:

- **P0:** caminho crítico da primeira jornada funcional, seus contratos e testes.
- **P1:** qualidade, recuperação avançada, frescor, compatibilidade e preparação
  do release; podem vir depois da primeira demonstração, não depois do aceite.
- **P2:** acompanhamento operacional que não altera a primeira experiência visível.
  Continua obrigatório quando ligado a requisito do release; não significa opcional.
- **P (pequeno):** alteração/decisão localizada, poucos cenários e baixa incerteza.
- **M (médio):** uma responsabilidade com matriz de casos, integração ou aprovação
  externa. Não implica mais arquivos ou mistura de UI/dados/testes.
- **G (grande):** múltiplas responsabilidades ou incerteza que impede aceite
  isolado; exige nova decomposição antes de execução. Nenhuma das 66 tarefas
  recebe G após a revisão de granularidade. Dependência externa pode bloquear
  uma tarefa P/M sem aumentar automaticamente seu tamanho.

Prioridade não prevalece sobre dependências. Decisões P1/P2 devem ser iniciadas
em paralelo quando exigirem aprovação/observação externa, para não bloquear o release.
Reestimar tamanho após as decisões, sem transformar estimativa em promessa de duração.

## Sequência sugerida em fatias verticais

A organização por camadas abaixo continua útil para localizar trabalho. Para
entregar algo visível antes, executar as fatias nesta ordem, respeitando a ordem
local dos IDs listados e os pré-requisitos já concluídos nas fatias anteriores.
Cada tarefa aparece uma vez nesta sequência; testes acompanham a funcionalidade.

| Fatia | Tarefas na ordem de execução | Resultado visível e condição de demonstração |
|---|---|---|
| 0 — Base visível, sem dados fictícios apresentados como reais | T-09, T-10, T-11, T-12, T-45 | Aplicação abre em pt-BR com tema escuro e smoke test aprovado. É preparação demonstrável, ainda não uma jornada vertical completa. |
| 1 — Buscar e escolher cidade | T-01, T-19, T-20, T-21, T-22, T-23, T-27, T-24, T-25, T-26, T-28, T-46 | Primeira fatia vertical completa: input → geocoding → estado → lista/seleção, incluindo vazio/erro/retry e testes. Não depende da aprovação de precipitação. |
| 2 — Consultar clima e cinco dias, alternando unidade | T-02, T-13, T-14, T-15, T-16, T-17, T-18, T-29, T-30, T-31, T-32, T-33, T-34, T-35, T-39, T-41, T-36, T-42, T-37, T-43, T-38, T-44, T-40, T-49 | Jornada meteorológica completa, com Celsius/Fahrenheit sem request, parciais e referências temporais. E2E principal aprovado em desktop/mobile nos projetos existentes. |
| 3 — Recuperação e UX mobile/acessível | T-06, T-47, T-48, T-50, T-51, T-52, T-53, T-54, T-55, T-56 | Recuperação/concorrência demonstradas, fluxo em 320 px sem rolagem horizontal e evidências de teclado, contraste, leitor de tela e plataformas. |
| 4 — Frescor e distribuição | T-03, T-04, T-05, T-57, T-58, T-59, T-62, T-63, T-64 | Política de frescor aprovada e visível; atribuição e URL HTTPS verificadas. Publicação externa só ocorre com condições de uso e gates pertinentes aprovados. |
| 5 — Evidências de aceite e operação | T-07, T-08, T-61, T-65, T-60, T-66 | Gates completos, desempenho medido, procedimento de disponibilidade e matriz final. Meta mensal permanece pendente até haver observação suficiente. |

T-01/T-02/T-03/T-04/T-05/T-06/T-07/T-08 são decisões: iniciar suas aprovações
em paralelo à base, embora o resultado seja consumido nas fatias indicadas.
Enquanto estiverem bloqueadas, avançar somente tarefas independentes; fixtures
podem apoiar demonstração claramente identificada, nunca simular aprovação ou
substituir a integração final.

Não há fatia separada de “clima atual apenas”: o contrato atual de `getWeather`
compõe clima e previsão e T-40 integra ambos. Antecipar esse recorte exigiria
revisar dependências/aceites, não concluir parcialmente essas tarefas.

Cada demonstração registra comandos/resultados pertinentes e limitações abertas.
Fatia concluída não equivale a produção aprovada: requisitos P1/P2, correções
impeditivas e evidências operacionais continuam exigidos em T-66.

## Ordem de implementação

Preparação e decisões → tipos → funções puras → services → hook → componentes
→ integração → testes → hardening.

- A preparação inclui somente bootstrap e setup do runner, necessários para
  compilar e validar incrementos; não antecipa a implementação funcional da UI.
- As seções definem a sequência recomendada de entrega. O campo **Dependências**
  define os pré-requisitos diretos obrigatórios, sem criar dependências artificiais
  entre tarefas independentes apenas para reproduzir a posição na lista.
- Testes focados e gates continuam obrigatórios em cada incremento. A seção de
  testes concentra a implementação das suítes explícitas, não o primeiro momento
  em que o código deve ser verificado.
- Hardening inclui refinamentos visuais, configuração de plataformas, testes mobile
  e de acessibilidade, frescor e validação operacional. Mudanças tardias no hook/UI
  nessa etapa são limitadas a essas políticas e exigem reexecução dos testes afetados.
- No fechamento, T-65 depende da configuração de publicação T-63 para validar
  também a base do build; T-60 mede desempenho após os gates T-65; T-64 exige
  compatibilidade avaliada em T-54. T-66 reúne essas evidências por dependências
  diretas e transitivas, sem repetir arestas redundantes.

## Preparação — Decisões e base executável

### T-01 — Aprovar prazo de timeout

- **ID:** T-01
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** fechar o prazo de espera com produto/operação.
- **Requisitos:** FR-06, CA-11.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [CA-11, FR-06] Spec e plano contêm duração positiva, unidade, operações abrangidas,
    responsável e data de aprovação. A decisão descreve loading → erro de timeout
    → nova tentativa; falta de aprovação bloqueia T-19.
  - Prazo numérico/unidade e aplicação a geocoding/forecast aprovados.
  - Cobrir obtenção e leitura do corpo, distinguindo timeout de cancelamento.

### T-02 — Confirmar janela e cobertura de precipitação

- **ID:** T-02
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** fechar a semântica de hora anterior e sua consulta no provedor.
- **Requisitos:** FR-03, CA-03, NFR-02.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [FR-03, CA-03; Plano] Registrar aprovação datada da janela e duas evidências
    com entrada/saída esperada: consulta durante o dia e na virada do dia, incluindo
    parâmetros, timestamp final do intervalo e acumulado. Se indisponível, o valor
    esperado é `null`, nunca zero ou acumulado extrapolado.
  - Produto aprova a janela; documentação/exemplo confirma acumulado horário e Unix.
  - Validar virada do dia e parâmetros de cobertura necessários; não extrapolar
    intervalos de 15 minutos nem inventar zero. Mudanças atualizam plano/backlog.

### T-03 — Aprovar público, cobertura e escopo inicial

- **ID:** T-03
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** fechar o recorte de produto.
- **Requisitos:** FR-01/02/10, Open Questions.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [Open Questions, FR-01/02/10] Registro aprovado lista público, regiões incluídas,
    exclusões e funcionalidades do primeiro release. Toda questão desse recorte
    está resolvida ou identificada como bloqueio com responsável, não como aprovação.
  - Público prioritário, regiões e escopo do release registrados e aprovados.
  - Ampliações identificadas antes de implementação, sem aprovação implícita.

### T-04 — Aprovar política de frescor e atualização

- **ID:** T-04
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** decidir frequência, envelhecimento e retenção.
- **Requisitos:** NFR-05, FR-06/08.
- **Dependências:** T-03.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [NFR-05] Registro aprovado define atualização manual/periódica, intervalo se
    periódico, idade máxima com unidade, instante usado no cálculo e comportamento
    no limite e após falha. Cache e persistência recebem decisão explícita.
  - Frequência e idade máxima aprovadas, com indicação de dados envelhecidos.
  - Confirmar proposta sem cache/persistência local ou revisar escopo antes do código.

### T-05 — Validar condições de uso da Open-Meteo

- **ID:** T-05
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** registrar condições técnicas e de uso do provedor.
- **Requisitos:** FR-01/03, NFR-08.
- **Dependências:** T-03.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [NFR-08; Assumptions] Registrar URLs/fontes e data da consulta, restrições de uso,
    limites aplicáveis e texto/link de atribuição. Registrar resultado de acesso
    aos dois endpoints a partir da origem pretendida, sem credenciais ou bypass.
  - Limites, cobertura, licença, atribuição e CORS verificados para o uso aprovado.
  - Restrições/impedimentos e evidências registrados; não contornar limites ou CORS.

### T-06 — Aprovar plataformas e critérios de acessibilidade

- **ID:** T-06
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** definir a matriz de compatibilidade e avaliação visual/acessível.
- **Requisitos:** NFR-01/06/07.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [NFR-01/06/07] Matriz aprovada identifica navegador, versão, SO, versão e aparelho
    ou emulação; as duas versões estáveis são identificadas pela data de referência.
    Lista de avaliação inclui 320 px, teclado, contraste e leitor de tela.
  - Nomear navegadores/SOs e duas versões estáveis suportadas, incluindo aparelhos.
  - Confirmar 320 px, WCAG 2.2 AA e avaliações manuais necessárias.

### T-07 — Aprovar condições da meta de desempenho

- **ID:** T-07
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** tornar a medição de latência reproduzível.
- **Requisitos:** NFR-03.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [NFR-03] Protocolo aprovado fixa início/fim da medição, rede, carga, número de
    amostras e janela. Define sucesso, contagem de falhas e fórmula da proporção
    dentro do limite; 95%/3 s permanecem propostos até aprovação ou revisão da spec.
  - Aprovar/revisar 95% das operações bem-sucedidas em até 3 s.
  - Definir rede, carga, amostragem, separação app/provedor e responsável.

### T-08 — Aprovar condições da meta de disponibilidade

- **ID:** T-08
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** M
- **Descrição:** definir como acompanhar disponibilidade mensal.
- **Requisitos:** NFR-04.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [NFR-04] Protocolo aprovado define mês/fuso, tempo elegível, manutenção,
    periodicidade da sondagem e classificação das falhas de app/API; inclui fórmula
    e limiar aprovado, sem considerar 99,5% já medido.
  - Aprovar/revisar 99,5% mensal e definir janela, manutenção e falhas externas.
  - Registrar frequência de sondagem, sinais de sucesso e responsável, sem impor fornecedor.

### T-09 — Inicializar raiz React

- **ID:** T-09
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** criar entrada e raiz mínimas da aplicação.
- **Requisitos:** FR-09/10.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/main.tsx`, `src/components/App.tsx`.
- **Critérios de aceite:**
  - [FR-09/10, CA-09/10] Abrir a aplicação mostra uma raiz React com texto pt-BR,
    sem formulário de autenticação; inspecionar Network confirma zero chamadas a
    geocoding/forecast nessa tela mínima. `pnpm build` termina com código 0.
  - Raiz renderiza conteúdo mínimo pt-BR, sem login ou chamadas meteorológicas.
  - Entrada corresponde ao HTML existente; React/TypeScript existentes são reutilizados.

### T-10 — Conectar HTML e estilo global

- **ID:** T-10
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** habilitar estilo global e metadados básicos.
- **Requisitos:** FR-09, NFR-01/06.
- **Dependências:** T-09.
- **Arquivos prováveis:** `index.html`, `src/index.css`.
- **Critérios de aceite:**
  - [FR-09, NFR-01/06; Plano] HTML contém `lang="pt-BR"` e viewport com
    `width=device-width`; folha global carregada retorna sem erro e uma classe
    Tailwind usada na raiz tem sua regra gerada no build.
  - Documento identifica pt-BR e viewport mobile; Tailwind usa configuração existente.
  - Estilo global é carregado pelo HTML, sem alterar a entrada ou adicionar dependências.

### T-11 — Preparar setup e smoke test

- **ID:** T-11
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** habilitar Testing Library/jest-dom no runner existente.
- **Requisitos:** FR-09/10.
- **Dependências:** T-09.
- **Arquivos prováveis:** `tests/setup.ts`, `tests/unit/app.test.tsx`.
- **Critérios de aceite:**
  - [CA-09/10; Plano] `pnpm test -- tests/unit/app.test.tsx` executa ao menos uma
    asserção de conteúdo/role da raiz usando matcher jest-dom, com código 0,
    sem fetch real; `pnpm lint`, `pnpm build` e `pnpm test` passam.
  - Setup compatível com Vitest e smoke test da raiz sem rede.
  - Runner descobre teste; comandos de qualidade existentes passam com a base criada.

## Entrega 1 — Tipos

### T-12 — Definir contratos compartilhados

- **ID:** T-12
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** implementar tipos de domínio, resultados e erros.
- **Requisitos:** FR-02/03/05/06/07/08.
- **Dependências:** T-09.
- **Arquivos prováveis:** `src/types/weather.ts`.
- **Critérios de aceite:**
  - [FR-02/03/05/06/07/08; Plano] Comparar exports/campos com Data Model, State
    Management e Error Handling do plano: todos estão presentes, `Unit` aceita
    somente celsius/fahrenheit e erros/resultados permitem narrowing por discriminante.
    `pnpm build` passa em strict.
  - Tipos do plano incluem `Unit`, medições anuláveis, UTC, datas civis e issues.
  - `WeatherResult` preserva contexto em success/empty; erro HTTP contém `retryAt`.
  - Compilar strict sem `any` ou casts substituindo validação.

## Entrega 2 — Funções puras

### T-13 — Implementar conversão de temperatura

- **ID:** T-13
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** converter Celsius para apresentação sem estado derivado.
- **Requisitos:** FR-05.
- **Dependências:** T-12.
- **Arquivos prováveis:** `src/lib/temperature.ts`.
- **Critérios de aceite:**
  - [FR-05, CA-05b] Chamar a função com `(0, fahrenheit)`, `(100, fahrenheit)`,
    `(-40, fahrenheit)` e `(null, celsius)` retorna respectivamente 32, 212, -40 e
    `null`; `(12.26, celsius)` retorna exatamente 12.26.
  - Preservar `null`, precisão e valor de entrada; não arredondar internamente.
  - Celsius é identidade; Fahrenheit usa a fórmula do plano, sem efeitos.

### T-15 — Implementar formatação e calendário civil

- **ID:** T-15
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** formatar indicadores e normalizar datas com locale/fuso explícitos.
- **Requisitos:** FR-03/04/07/08, NFR-02.
- **Dependências:** T-12.
- **Arquivos prováveis:** `src/lib/weatherFormat.ts`.
- **Critérios de aceite:**
  - [CA-03/07a/08b] Para locale en-US, 12.26 °C → `12.3`, 19.96 °C → `20.0`,
    67.4% → `67`; para `2026-03-05` e 1.5, produzir `05/03/2026`/`1,5`
    em pt-BR e `3/5/2026`/`1.5` em en-US, sem alterar os valores de entrada.
  - Precisão/unidades conforme spec, sem arredondar dados armazenados.
  - Datas civis e instantes não usam o fuso implícito nem dias fixos de 86.400 s.

### T-17 — Implementar mapeamento WMO

- **ID:** T-17
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** converter códigos em condição de domínio.
- **Requisitos:** FR-03/07/09.
- **Dependências:** T-12.
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`.
- **Critérios de aceite:**
  - [CA-03/07a; Edge Cases] Código 0 retorna `Céu limpo`, 3 retorna `Nublado`;
    código não mapeado retorna `Condição indisponível` e `iconKey='unknown'`.
    Todas as chaves retornadas pertencem a WeatherIconKey.
  - Categorias fornecem descrição pt-BR e chave de ícone do plano.
  - Código desconhecido produz condição indisponível e ícone genérico, sem inferência.

## Entrega 3 — Services

### Recorte solicitado — timeout, hook e integração da tela

- Adicionar `fetchWithTimeout` ao serviço com `AbortController`, 10 segundos,
  mensagens tipadas exatas e `clearTimeout` em `finally`.
- Implementar `src/hooks/useWeather.ts` com status único, busca e carregamento
  automático da primeira cidade, seleção manual, retry da operação que falhou
  e descarte de respostas antigas/desmontadas.
- Substituir mock e controles demo de `App` pelo hook; manter unidade local,
  estados acessíveis, opções de cidade e ação de retry.
- Atualizar testes de serviço, hook, App e E2E para os fluxos reais com rede
  simulada; executar lint, build, unitários e E2E desktop/mobile.
- **Evidência (2026-10-27):** `pnpm lint` e `pnpm build` aprovados;
  `pnpm test` aprovado (89 testes em 11 arquivos); `pnpm test:e2e` aprovado
  (6 testes, projetos chromium e mobile). Timeout verificado em 9.999/10.000 ms
  com timer limpo; retry, seleção e descarte de respostas antigas cobertos.

### Recorte solicitado — busca e forecast

- Implementar as operações públicas em `src/services/weatherService.ts`,
  correspondentes ao geocoding e aos mapeamentos de clima atual/diário.
- Retornar `[]` sem rede para nome vazio; codificar nomes com
  `encodeURIComponent` e normalizar resultados para `City[]`.
- Mapear clima atual e cinco índices diários para `WeatherData`, reutilizando
  códigos WMO, unidades canônicas e contratos temporais do plano.
- Lançar `WeatherServiceError` para HTTP não-ok e ausência de `current`/`daily`.
- Cobrir rede simulada, campos opcionais, cinco dias e erros em
  `tests/unit/weatherService.test.ts`; validar com `pnpm lint`, `pnpm build`
  e `pnpm test`. Não concluir os demais critérios das tarefas amplas com base
  apenas neste recorte.
- **Evidência do recorte (2026-10-27):** `pnpm exec vitest run
  tests/unit/weatherService.test.ts` aprovado (23 testes); `pnpm lint`
  aprovado; `pnpm build` aprovado; `pnpm test` aprovado (76 testes em
  10 arquivos). As tarefas amplas continuam com seus demais critérios pendentes.

### T-19 — Implementar controle HTTP

- **ID:** T-19
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** controlar chamadas no serviço específico da Open-Meteo.
- **Requisitos:** FR-06, CA-11.
- **Dependências:** T-01, T-12.
- **Arquivos prováveis:** `src/services/openMeteo.ts`.
- **Critérios de aceite:**
  - [FR-06, CA-11; Plano] Por chamada, fetch rejeitado → network; HTTP não-2xx →
    http com status; JSON inválido → invalid-response; prazo aprovado expirado →
    timeout. Signal externo abortado não vira timeout nem resultado vazio.
  - Verificar status/JSON e classificar rede, HTTP e resposta inválida sem fallback de sucesso.
  - Timeout de obtenção/leitura e cancelamento distintos, com limpeza de recursos.
  - Normalizar `Retry-After` para `retryAt`; não criar cliente HTTP genérico.

### T-20 — Implementar geocoding

- **ID:** T-20
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** expor `searchCities` normalizado para `City`.
- **Requisitos:** FR-01/02/06, CA-01c/01d/02a/02c.
- **Dependências:** T-19.
- **Arquivos prováveis:** `src/services/openMeteo.ts`.
- **Critérios de aceite:**
  - [CA-01c/01d/02c] Para termo com acento/apóstrofo/hífen, a query decodificada
    mantém exatamente o termo enviado. Para dois resultados, saída mantém seus IDs
    e coordenadas; `results=[]` retorna `[]`; envelope inválido rejeita a promise.
  - Enviar name/count=10/language=pt/format=json, preservando caracteres via URLSearchParams.
  - Validar identidade/coordenadas/contexto; opcionais ausentes seguem o plano.
  - Lista válida vazia/ausente retorna `[]`; resposta inválida propaga erro.

### T-29 — Mapear condições atuais e precipitação

- **ID:** T-29
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** construir consulta e normalização do bloco atual.
- **Requisitos:** FR-03/06/08, CA-03/07b.
- **Dependências:** T-02, T-15, T-17, T-19.
- **Arquivos prováveis:** `src/services/openMeteo.ts`.
- **Critérios de aceite:**
  - [FR-03/08, CA-07b; Plano] Para a fixture do plano, referenceTime é
    `2026-10-27T15:15:00.000Z`, precipitação é 0.4 e intervalo UTC termina às
    15:00, começando às 14:00. Sem current.time válido, valores dependentes são
    `null` e a previsão independente permanece; aplicar ajustes aprovados em T-02.
  - Consulta usa indicadores, cobertura aprovada, unidades canônicas, timezone automático e unixtime.
  - Instantes UTC e período horário corretos; sem futuro/extrapolação.
  - Sem `current.time` válido, campos dependentes ficam indisponíveis com aviso; mapeamento interno verificável por fixtures.

### T-30 — Mapear previsão diária

- **ID:** T-30
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** normalizar séries diárias e calendário da cidade.
- **Requisitos:** FR-04/07/08, CA-04/07a/07b/08a.
- **Dependências:** T-15, T-17, T-19.
- **Arquivos prováveis:** `src/services/openMeteo.ts`.
- **Critérios de aceite:**
  - [CA-04/07a/07b/08a] Fixture completa produz exatamente cinco ForecastDay em
    ordem, cada campo no índice de sua data civil. Elemento inválido anula só o
    campo afetado; array incompatível anula só a série; datas inválidas geram
    forecast vazio com issue, não datas reconstruídas.
  - Cinco datas civis de hoje a hoje + 4, sem soma fixa de 86.400 segundos.
  - Mapear séries por índice; falha isolada não inventa zero nem descarta outros campos.
  - Datas incertas invalidam somente bloco diário; mapeamento interno verificável por fixtures.

### T-31 — Compor WeatherResult

- **ID:** T-31
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** concluir `getWeather` e classificar sucesso, parcialidade ou vazio.
- **Requisitos:** FR-03/04/06/07/08, CA-07b, NFR-02/05.
- **Dependências:** T-29, T-30.
- **Arquivos prováveis:** `src/services/openMeteo.ts`.
- **Critérios de aceite:**
  - [CA-07b, FR-06; Plano] Fixture com indicador utilizável retorna success;
    sem indicadores, sem problemas de validação e com período válido retorna empty
    com data; fuso/envelope inválido rejeita. Cidade mantém ID/coordenadas de entrada,
    fetchedAt corresponde ao relógio da consulta e issues identifica cada rejeição.
  - Retornar cidade original, fuso, fetchedAt, referências e issues com dados válidos preservados.
  - Empty exige contexto e ausência de falhas de validação; falhas impeditivas rejeitam operação.
  - Não completar lacunas com consultas anteriores nem confundir consulta com referência.

## Entrega 4 — Hook de estado

### T-23 — Implementar estado da busca

- **ID:** T-23
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** iniciar reducer e ações de geocoding em `useWeather`.
- **Requisitos:** FR-01/02/06, CA-01b/06a.
- **Dependências:** T-20.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Critérios de aceite:**
  - [CA-01b/01d/06a; Plano] Envio branco gera zero chamadas; envio válido limpa lista
    e erro e entra em loading; resposta com itens/sem itens/rejeitada termina em
    success/empty/error. Após editar o input, retry reenvia o termo anterior submetido.
  - Idle/loading/success/empty/error consistentes; impedir busca vazia e preservar último termo enviado.
  - Cancelar chamadas antigas/desmontagem; descartar sucesso, erro e finalização antigos.
  - Espera 429 bloqueia só a busca, libera controles sem retry automático e limpa timer.

### T-35 — Orquestrar consulta meteorológica

- **ID:** T-35
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** estender hook com forecast independente da busca.
- **Requisitos:** FR-02/03/04/06, CA-06b/11.
- **Dependências:** T-23, T-31.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Critérios de aceite:**
  - [CA-06b/11; Plano] Selecionar B após A limpa dados de A antes do request.
    Success/empty armazenam result.data; error mantém selectedCity=B e weather=null.
    Respostas antigas não alteram B e falha de forecast não apaga erro de geocoding.
  - Seleção limpa dados anteriores, inicia loading e preserva cidade em erro.
  - Aplicar success/empty com contexto sem parsing no hook.
  - Controlador/ID próprios descartam respostas antigas; 429 não bloqueia a outra operação.

### T-39 — Adicionar ação de unidade ao hook

- **ID:** T-39
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** manter somente preferência de apresentação no reducer.
- **Requisitos:** FR-05, CA-05a/05b.
- **Dependências:** T-35.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Critérios de aceite:**
  - [CA-05a/05b; Plano] Estado inicial contém celsius; ação Fahrenheit seguida de
    Celsius altera somente temperatureUnit. Comparação antes/depois mantém
    WeatherData/fetchedAt e contagem de chamadas aos dois serviços.
  - Celsius inicial e ação muda somente Unit, sem novo request ou fetchedAt.
  - Não armazenar Fahrenheit/strings formatadas nem alterar unidades dos demais indicadores.

## Entrega 5 — Componentes

### T-24 — Construir busca e resultados acessíveis

- **ID:** T-24
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** apresentar formulário e opções por props/callbacks.
- **Requisitos:** FR-01/02/09, CA-01b/02a/02b/02c, NFR-06.
- **Dependências:** T-12.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`, `src/components/CityResults.tsx`.
- **Critérios de aceite:**
  - [CA-01b/02a/02b/02c, NFR-06] Campo é encontrado por label; enviar espaços exibe
    orientação e não chama busca. Duas homônimas mostram subdivisão/país disponíveis
    e nenhuma seleção inicial; teclado seleciona a City de ID esperado.
  - Formulário rotulado, validação pt-BR e foco disponível; nenhum fetch.
  - Contexto distingue homônimas; seleção explícita por teclado/toque entrega a City, não só nome.

### T-25 — Apresentar estados por operação

- **ID:** T-25
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** criar status e ação de recuperação controlados por props.
- **Requisitos:** FR-06/09, CA-01d/06a/06b/11, NFR-06.
- **Dependências:** T-12.
- **Arquivos prováveis:** `src/components/RequestStatus.tsx`.
- **Critérios de aceite:**
  - [CA-01d/06a/06b/11, NFR-06] Props de loading/erro/vazio produzem mensagens
    distintas com semântica de status/alerta; erro identifica busca ou consulta.
    Acionar retry habilitado chama callback uma vez; bloqueado chama zero vezes.
  - Loading/erro anunciáveis e vazio distinto; contexto temporal no vazio meteorológico.
  - Retry respeita bloqueio recebido e chama callback correto; sem payload bruto ou texto fora de pt-BR.

### T-36 — Apresentar condições atuais

- **ID:** T-36
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** renderizar indicadores e seus períodos.
- **Requisitos:** FR-03/08/09, CA-03/07b, NFR-02/05/06.
- **Dependências:** T-13, T-15, T-17, T-25.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`.
- **Critérios de aceite:**
  - [CA-03/07b/08b] Com locale en-US e valores de CA-03, exibir `20.0 °C`,
    `Céu limpo`, `63%`, `12.3 km/h`, `1014 hPa` e `0.5 mm`; em pt-BR,
    localizar os separadores. `null` exibe indisponibilidade, não 0, e ícone tem nome acessível.
  - Indicadores com unidades/precisão, condição e ícone acessível.
  - Consulta, referência e intervalo distintos; ausências/issues explícitos, sem payload bruto.
  - Props controladas incluem unidade; componente não faz fetch.

### T-37 — Apresentar previsão diária

- **ID:** T-37
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** renderizar cinco datas e indicadores quando disponíveis.
- **Requisitos:** FR-04/07/08/09, CA-04/07a/07b/08b.
- **Dependências:** T-13, T-15, T-17, T-25.
- **Arquivos prováveis:** `src/components/DailyForecast.tsx`.
- **Critérios de aceite:**
  - [CA-04/07a/07b/08b] Fixture completa gera cinco datas; para CA-07a e en-US,
    exibir `12.3 °C`, `20.0 °C`, `Nublado`, `2.3 mm` e `67%`.
    Com forecast vazio, mostrar previsão indisponível sem criar cartões de dias.
  - Datas e todos os indicadores diários seguem locale, fuso e unidade recebidos.
  - Bloco/medição ausente recebe mensagem; não inventar dados, datas ou zero.

### T-38 — Construir seletor de unidade

- **ID:** T-38
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** criar controle de apresentação Celsius/Fahrenheit.
- **Requisitos:** FR-05/09, CA-05a/05b, NFR-06.
- **Dependências:** T-12.
- **Arquivos prováveis:** `src/components/TemperatureUnitToggle.tsx`.
- **Critérios de aceite:**
  - [CA-05a/05b, NFR-06] Com unit=celsius, estado acessível indica Celsius;
    ativar Fahrenheit por teclado ou clique/toque emite exatamente `fahrenheit`
    uma vez e não executa fetch. Prop atualizada muda o estado acessível selecionado.
  - Rótulos pt-BR, estado selecionado perceptível e operação por teclado/toque.
  - Emite Unit por callback, sem fetch, conversão armazenada ou regra de dados.

## Entrega 6 — Integração

### T-26 — Conectar a entrega de busca na raiz

- **ID:** T-26
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** compor hook, busca, lista e status.
- **Requisitos:** FR-01/02/06/09/10.
- **Dependências:** T-23, T-24, T-25.
- **Arquivos prováveis:** `src/components/App.tsx`.
- **Critérios de aceite:**
  - [FR-01/02/06, CA-10] Com serviço simulado retornando duas cidades, envio exibe
    lista e seleção atualiza a City pelo ID; erro mostra retry que reenvia o termo.
    Não há etapa de login ou chamada meteorológica por mero recebimento da lista.
  - Props/callbacks permitem buscar, editar e repetir, sem fetch/parsing na raiz.
  - Seleção entrega City ao estado; lista vazia não inicia forecast; sem login.

### T-40 — Compor tela meteorológica

- **ID:** T-40
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** conectar seleção, forecast, status e unidade na raiz.
- **Requisitos:** FR-01 a FR-10.
- **Dependências:** T-26, T-36, T-37, T-38, T-39.
- **Arquivos prováveis:** `src/components/App.tsx`.
- **Critérios de aceite:**
  - [FR-01 a FR-10; Plano] Com fixtures, seleção dispara consulta da City correta
    e renderiza indicadores/dias; toggle altera todas as temperaturas sem chamada
    adicional. Nova busca preserva clima selecionado; nova seleção não mostra clima anterior.
  - Props/callbacks conectam todos os estados sem fetch/parsing na raiz.
  - Troca de cidade não exibe dados anteriores; nova busca não apaga consulta vigente.
  - Toggle atualiza temperaturas atuais/previstas por renderização, sem estado duplicado.

## Entrega 7 — Testes unitários, de integração e E2E

### Cobertura dedicada obrigatória

| Frente | Tarefas dedicadas | Evidência de conclusão |
|---|---|---|
| Conversão de unidade (Vitest) | T-14 | Suíte de função pura aprovada, incluindo valores conhecidos, `null` e precisão. |
| Services com mock de `fetch` (Vitest) | T-21, T-22, T-32, T-33, T-34 | Operações públicas reais com HTTP simulado; nenhuma chamada à API ao vivo. |
| Componentes em loading/erro/vazio (Testing Library) | T-44; integração em T-28 | Casos isolados por estado com mensagens, semântica acessível e callbacks verificados. |
| Fluxo principal E2E desktop/mobile (Playwright) | T-49; viewport de 320 px em T-53 | Jornada busca → seleção → consulta → unidade aprovada nos dois projetos e no limite mobile. |

Essas tarefas permanecem obrigatórias no fechamento T-65; cobertura de uma frente
não substitui a outra. A execução mobile é critério do fluxo principal, não apenas
uma inspeção visual posterior.

### T-14 — Testar conversão de temperatura

- **ID:** T-14
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** verificar limites e alternância de unidades.
- **Extensão solicitada:** implementar `formatTemperature(celsius, unit, locale?)`
  e `unitLabel(unit)` no módulo de temperatura, reutilizando a formatação
  existente. Cobrir arredondamento ao inteiro, símbolo, locale e
  ausência de medição na suíte dedicada, sem duplicar os testes de conversão.
- **Ajuste solicitado:** exibir todas as temperaturas sem casas decimais,
  reutilizando `formatTemperature` nos componentes atual e diário, preservando
  a precisão dos dados e a casa decimal de vento/precipitação. Esta regra
  substitui os exemplos decimais de temperatura dos aceites anteriores.
- **Evidência do ajuste (2026-10-27):** `pnpm lint`, `pnpm build` e
  `pnpm test` aprovados (114 testes em 12 arquivos), incluindo arredondamento
  positivo/negativo e apresentação atual/diária nas duas unidades.
- **Evidência da extensão (2026-10-27):** suíte dedicada com 28 testes aprovada;
  `pnpm exec vitest run tests/unit/temperature.test.ts tests/unit/weatherLib.test.ts`
  aprovado (37 testes); `pnpm lint`, `pnpm build` e `pnpm test` aprovados
  (112 testes em 12 arquivos na suíte completa).
- **Requisitos:** CA-05a/05b.
- **Dependências:** T-11, T-13.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`.
- **Critérios de aceite:**
  - [CA-05b; Plano] Suíte contém asserções para 0/100/-40, decimal negativo e `null`
    nas duas unidades; repetir 100 alternâncias não modifica o Celsius original.
    Comparações de decimais usam tolerância numérica, não arredondamento no domínio.
  - Verificar 0 → 32, 100 → 212, -40 → -40, decimais, negativos e `null`.
  - Alternâncias repetidas partem do valor canônico, sem mutação ou erro acumulado.
  - [FR-05; Plano] Executar `pnpm test -- tests/unit/temperature.test.ts` com
    código 0; a suíte testa diretamente a função pura, sem montar React ou mockar
    o conversor que está sendo verificado.

### T-16 — Testar formatação e calendário

- **ID:** T-16
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** testar números e fronteiras temporais.
- **Requisitos:** CA-03/04/07a/08a/08b.
- **Dependências:** T-11, T-15.
- **Arquivos prováveis:** `tests/unit/weatherFormat.test.ts`.
- **Critérios de aceite:**
  - [CA-08a/08b; Plano] Fixtures fixam relógio e fusos distintos; asserts verificam
    cinco datas consecutivas na cidade, inclusive mudança de mês/ano e dias de
    23/25 h. Dois timestamps da hora repetida continuam instantes distintos.
  - Conferir pt-BR/en-US, precisão por indicador, zero real versus ausência.
  - Cobrir mês/ano, dias de 23/25 h e hora repetida com instantes distintos.

### T-18 — Testar condições WMO

- **ID:** T-18
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** verificar categorias e fallback.
- **Requisitos:** CA-03/07a, edge case de código desconhecido.
- **Dependências:** T-11, T-17.
- **Arquivos prováveis:** `tests/unit/weatherCodes.test.ts`.
- **Critérios de aceite:**
  - [CA-03/07a; Plano] Suíte verifica ao menos um código por categoria do modelo:
    clear, cloudy, fog, drizzle, rain, snow, thunderstorm e unknown, comparando
    rótulo pt-BR e chave esperada, não apenas existência do objeto.
  - Cobrir categorias representativas, inclusive códigos 0 e 3.
  - Desconhecidos retornam fallback pt-BR; testes sem React/rede.

### T-21 — Testar controle HTTP

- **ID:** T-21
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** verificar falhas pela operação pública de busca.
- **Requisitos:** FR-06, CA-11.
- **Dependências:** T-11, T-20.
- **Arquivos prováveis:** `tests/unit/openMeteoErrors.test.ts`.
- **Critérios de aceite:**
  - [CA-11, FR-06; Plano] Cada cenário de falha verifica `kind` e operação; HTTP
    verifica status/retryAt. Após sucesso, erro ou cancelamento, timers/listeners
    da chamada estão liberados e resposta tardia não produz novo resultado.
  - Mock de fetch cobre rede, 400/429/5xx, JSON inválido e envelope de erro 2xx.
  - Relógio controlado cobre leitura lenta, cancelamento, limpeza e `Retry-After`
    em segundos/data HTTP, expirado, zero, inválido, ausente e inacessível.

### T-22 — Testar contrato de geocoding

- **ID:** T-22
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** validar query e mapeamento de cidades.
- **Requisitos:** CA-01a/01c/01d/02a/02c.
- **Dependências:** T-11, T-20.
- **Arquivos prováveis:** `tests/unit/geocoding.test.ts`.
- **Critérios de aceite:**
  - [CA-01a/01c/01d/02a/02c] Asserts comparam todos os parâmetros da query e
    os dois objetos City de uma fixture de homônimas. Ausência de admin1 e
    country_code produz `null`; resultado essencial inválido rejeita, não retorna `[]`.
  - Cobrir homônimas, múltiplos resultados, lista vazia/ausente e opcionais ausentes.
  - Conferir query via URL com acentos/espaços/hífens/apóstrofos; rejeitar estrutura essencial inválida.
  - [FR-01/02; Plano] Chamar `searchCities` real com `fetch` substituído por mock;
    conferir URL/signal e resposta normalizada. Restaurar o mock após cada teste;
    não mockar o próprio serviço nem permitir rede externa.

### T-27 — Testar estado e concorrência da busca

- **ID:** T-27
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** validar hook com serviços simulados.
- **Requisitos:** CA-01b/01d/06a/11.
- **Dependências:** T-11, T-23.
- **Arquivos prováveis:** `tests/unit/useWeatherSearch.test.tsx`.
- **Critérios de aceite:**
  - [CA-01b/01d/06a/11; Plano] Controlar duas promises A/B: ao finalizar A após B,
    cidades, erro e loading de B permanecem. Timers simulados verificam bloqueio
    antes de retryAt e liberação no prazo com zero requests automáticos.
  - Cobrir estados, retry do termo enviado após edição e invariantes do reducer.
  - Verificar descarte de finalizações antigas, cancelamento e bloqueio/liberação 429.

### T-28 — Testar apresentação e integração da busca

- **ID:** T-28
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** validar formulário/lista e sua composição com estado.
- **Requisitos:** CA-01a a CA-02c, CA-06a/09/10.
- **Dependências:** T-11, T-26.
- **Arquivos prováveis:** `tests/unit/citySearch.test.tsx`, `tests/unit/appSearch.test.tsx`.
- **Critérios de aceite:**
  - [CA-01a/01b/01c/01d/02a/02b/02c/06a/09/10] Testes verificam lista com duas
    opções sem seleção automática, input editável no vazio, zero forecast no vazio,
    seleção por teclado com ID esperado e retry do termo após falha.
  - Componentes controlados cobrem labels, teclado, contexto e seleção de identidade correta.
  - Integração cobre loading/vazio/erro/sucesso, preservação do termo e consulta sem conta.

### T-32 — Testar consulta e condições atuais

- **ID:** T-32
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** verificar parâmetros e normalização atual pela API pública.
- **Requisitos:** CA-03/07b/11.
- **Dependências:** T-11, T-31.
- **Arquivos prováveis:** `tests/unit/forecastCurrent.test.ts`.
- **Critérios de aceite:**
  - [CA-03/07b; Plano] Asserts comparam query via URL, números originais sem
    arredondamento e UTC/intervalo da fixture T-29. Horário futuro não é usado;
    current ausente não produz precipitação independente nem altera dias válidos.
  - Mock fetch confere current/hourly/daily, unidades, coordenadas, timezone, cinco dias e signal.
  - Cobrir unixtime, referência UTC, acumulado/intervalo na virada do dia e ausência de current.time.
  - [FR-03/06/08; Plano] Chamar `getWeather` real com mock de `fetch`, sem substituir
    o mapeamento. Aplicar a mesma fronteira HTTP simulada nas suítes T-33/T-34,
    restaurando mocks e relógio entre casos e impedindo API ao vivo.

### T-33 — Testar calendário e séries diárias

- **ID:** T-33
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** verificar mapeamento diário via getWeather.
- **Requisitos:** CA-04/07a/07b/08a/08b.
- **Dependências:** T-11, T-31.
- **Arquivos prováveis:** `tests/unit/forecastDaily.test.ts`.
- **Critérios de aceite:**
  - [CA-04/07a/07b/08a] Suíte compara as cinco datas esperadas e valores por índice;
    fixture diária contém 12.26/19.96/2.26/67.4 preservados sem arredondamento.
    Casos de DST e datas inválidas verificam saída e issue, não apenas ausência de exceção.
  - Cobrir alinhamento e valores por data, mês/ano, dias de 23/25 h e hora repetida.
  - Datas duplicadas/incertas invalidam bloco, série desalinhada invalida apenas indicador.

### T-34 — Testar resultados parciais, vazios e inválidos

- **ID:** T-34
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** verificar as fronteiras de validade de WeatherResult.
- **Requisitos:** CA-07b, FR-06, NFR-02/05.
- **Dependências:** T-11, T-31.
- **Arquivos prováveis:** `tests/unit/forecastPartial.test.ts`.
- **Critérios de aceite:**
  - [CA-07b, NFR-02; Plano] Ausência vira `null` sem zero; campo inválido vira
    `null` com issue; bloco independente válido é preservado. Empty mantém cidade,
    fuso e referência válida; ausência total causada por validação rejeita a promise.
  - Cobrir blocos ausentes, campos rejeitados, issues e contexto preservado em empty.
  - Fuso/envelope inválido e falhas sem dados utilizáveis geram erro, não sucesso.
  - FetchedAt usa relógio fixo; nenhuma resposta inventa zero ou usa rede ao vivo.

### T-41 — Testar hook meteorológico e unidade

- **ID:** T-41
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** verificar reducer/orquestração com serviços simulados.
- **Requisitos:** CA-05a/05b/06b/07b/11.
- **Dependências:** T-11, T-39.
- **Arquivos prováveis:** `tests/unit/useWeather.test.tsx`.
- **Critérios de aceite:**
  - [CA-05a/05b/06b/11; Plano] Suite compara transições e dados do reducer, chamadas
    por operação e descarte de resposta/finalização antiga. Após desmontagem não há
    timers de retry ativos; erro de timeout encerra loading sem resetar cidade.
  - Estados/contextos consistentes, operações independentes, respostas/finalizações antigas descartadas.
  - Testar timeout tipado, 429/limpeza e cancelamento; toggle não chama serviço nem altera dados.

### T-42 — Testar apresentação atual

- **ID:** T-42
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** verificar CurrentWeather com props controladas.
- **Requisitos:** CA-03/05b/07b/08b/09.
- **Dependências:** T-11, T-36.
- **Arquivos prováveis:** `tests/unit/currentWeather.test.tsx`.
- **Critérios de aceite:**
  - [CA-03/05b/07b/08b/09] Asserts verificam todos os resultados de CA-03,
    Celsius/Fahrenheit e pt-BR/en-US; timestamps de consulta e referência distintos
    aparecem em rótulos distintos. Campo nulo e código desconhecido têm mensagens pt-BR.
  - Valores/precisão/unidades e referência/consulta/intervalo exibidos corretamente.
  - Cobrir unidade, locale, dados parciais, código desconhecido e avisos acessíveis.

### T-43 — Testar apresentação diária

- **ID:** T-43
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** verificar DailyForecast com props controladas.
- **Requisitos:** CA-04/05b/07a/07b/08a/08b.
- **Dependências:** T-11, T-37.
- **Arquivos prováveis:** `tests/unit/dailyForecast.test.tsx`.
- **Critérios de aceite:**
  - [CA-04/05b/07a/07b/08a/08b] Asserts verificam cinco datas e resultados de CA-07a,
    mínimas/máximas convertidas e datas não deslocadas por fuso do dispositivo.
    Série parcialmente nula mantém dias e outros campos; bloco ausente não fabrica datas.
  - Cinco datas e indicadores corretos nas duas unidades e locales.
  - Bloco ausente e campos rejeitados preservam avisos e dados válidos, sem dias fabricados.

### T-44 — Testar unidade e componentes em loading, erro e vazio

- **ID:** T-44
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** testar isoladamente o seletor e RequestStatus, com props controladas.
- **Requisitos:** CA-01d/05a/05b/06a/06b/09/11, NFR-06.
- **Dependências:** T-11, T-25, T-38.
- **Arquivos prováveis:** `tests/unit/temperatureUnitToggle.test.tsx`,
  `tests/unit/requestStatus.test.tsx`.
- **Critérios de aceite:**
  - [CA-05a/05b/06a/06b/09/11, NFR-06] Queries por role/name encontram controles;
    callbacks recebem unidade/operação esperadas uma vez. Estado bloqueado tem
    zero callbacks; status e alerta comunicam loading/erro em pt-BR.
  - Toggle acessível chama callback com unidade correta.
  - Status cobrem idle/loading/erro/vazio/sucesso, contexto e retry bloqueado/liberado.
  - [FR-06/09, NFR-06] Caso **loading** renderiza região de status e mensagem
    pt-BR da operação, sem alerta de erro nem mensagem de vazio.
  - [CA-06a/06b/11] Caso **error** renderiza alerta específico de busca/consulta
    ou timeout e botão de nova tentativa; clique habilitado chama callback uma
    vez e botão bloqueado por espera não chama callback.
  - [CA-01d; Plano] Caso **empty** de busca mostra ausência de resultados sem
    afirmar que a cidade não existe; empty meteorológico identifica local/período.
    Nenhum dos dois apresenta alerta de falha de rede.
  - [CA-09; Plano] Renderizações isoladas não chamam serviços nem fetch.
    `pnpm test -- tests/unit/temperatureUnitToggle.test.tsx tests/unit/requestStatus.test.tsx`
    termina com código 0, sem ignorar casos de loading/error/empty.

### T-49 — Criar E2E principal e conversão

- **ID:** T-49
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** verificar jornada integrada com endpoints interceptados.
- **Requisitos:** CA-01a/02a/02c/03/04/05a/05b/08a/08b/09/10.
- **Dependências:** T-40.
- **Arquivos prováveis:** `tests/e2e/weather-flow.spec.ts`, `tests/e2e/fixtures/forecast.ts`.
- **Critérios de aceite:**
  - [CA-01a/02c/03/04/05a/05b/08a/08b/09/10] Teste compara ID/coordenadas enviados
    após seleção, cinco datas locais e valores da fixture. Contagem de forecast
    antes/depois de Fahrenheit → Celsius é idêntica; o teste falha se precisar de login.
  - Buscar → selecionar homônima → clima/cinco dias, sem login e com locale/fuso distintos.
  - Celsius → Fahrenheit → Celsius confere valores e nenhuma chamada extra.
  - Requests inesperados falham; fixtures determinísticas e esperas observáveis, sem sleeps.
  - [CA-01a/02c/03/04/05b/10, NFR-01; Plano] Executar
    `pnpm exec playwright test tests/e2e/weather-flow.spec.ts --project=chromium --project=mobile`
    com código 0 nos projetos existentes. Em ambos, assertar busca → seleção
    explícita → condições atuais/cinco dias → troca de unidade sem novo forecast.
    No mobile, incluir seleção e toggle por toque; não substituir a jornada por screenshot.

### T-50 — Criar E2E de vazio e recuperação

- **ID:** T-50
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** verificar validação e falhas das duas operações.
- **Requisitos:** CA-01b/01d/06a/06b/11.
- **Dependências:** T-49.
- **Arquivos prováveis:** `tests/e2e/weather-errors.spec.ts`.
- **Critérios de aceite:**
  - [CA-01b/01d/06a/06b/11; Plano] Asserts verificam zero geocoding em branco,
    zero forecast no vazio e fim de loading no timeout. Retry repete termo/City;
    429 antes do prazo não envia request e após o prazo permite um novo envio manual.
  - Busca branca não solicita API; lista vazia não inicia forecast.
  - Falha/timeout/429 encerra loading, respeita espera e permite retry com contexto preservado.

### T-51 — Criar E2E de parcialidade e concorrência

- **ID:** T-51
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** verificar consistência dos dados exibidos em cenários adversos.
- **Requisitos:** CA-06b/07b, FR-02/06.
- **Dependências:** T-49.
- **Arquivos prováveis:** `tests/e2e/weather-consistency.spec.ts`.
- **Critérios de aceite:**
  - [CA-07b, FR-02/06; Plano] Com campo inválido/nulo, assert localiza aviso e
    outro campo válido; empty mostra local/período sem indicador fabricado.
    Ao concluir request de A depois de B, somente nome e valores de B aparecem.
  - Dados parciais/empty preservam local/período e indisponibilidade sem zero inventado.
  - Respostas controladas fora de ordem não sobrescrevem cidade vigente.

## Entrega 8 — Hardening e aceite

### T-45 — Definir tema global dark glassmorphism

- **ID:** T-45
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** estabelecer fundo, painéis e estilos compartilhados.
- **Requisitos:** NFR-01/06.
- **Dependências:** T-10.
- **Arquivos prováveis:** `src/index.css`.
- **Critérios de aceite:**
  - [NFR-06; Plano/instruções do projeto] Inspeção de estilos computados confirma
    fundo escuro e painel translúcido com fallback sólido. Medição registra contraste
    de texto normal >= 4,5:1 e texto grande >= 3:1 sobre fundos usados; foco
    perceptível e distinção de estado não dependem apenas de cor.
  - Fundo escuro, transparência/blur e alternativa sólida com legibilidade.
  - Estilos de foco e estados não dependem apenas de cor; sem biblioteca visual extra.

### T-46 — Ajustar layout da busca

- **ID:** T-46
- **Tipo:** UI
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** adaptar formulário/lista ao tema e a 320 px.
- **Requisitos:** NFR-01/06, FR-02.
- **Dependências:** T-24, T-45.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`, `src/components/CityResults.tsx`.
- **Critérios de aceite:**
  - [NFR-01/06, CA-02a/02c] Em viewport de 320 px com nome de cidade de 80 caracteres,
    formulário e opções permanecem dentro da área visível, scrollWidth <= clientWidth;
    teclado alcança e seleciona opções sem perda de foco ou corte das ações.
  - Termos e localidades longos não cortam controles nem geram rolagem horizontal.
  - Teclado/toque e foco preservados em resultados/loading.

### T-47 — Ajustar layout dos indicadores

- **ID:** T-47
- **Tipo:** UI
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** adaptar clima e previsão ao tema e telas estreitas.
- **Requisitos:** NFR-01/02/06.
- **Dependências:** T-36, T-37, T-45.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`, `src/components/DailyForecast.tsx`.
- **Critérios de aceite:**
  - [NFR-01/02] Em 320 px, fixture de cinco dias com avisos em todos os campos é
    percorrida verticalmente; scrollWidth <= clientWidth. Rótulos/unidades e
    mensagens não sobrepõem outros valores; registrar screenshot e inspeção de cada dia.
  - Cinco dias e indicadores usam rolagem vertical, sem sobreposição ou corte.
  - Unidades, ausências e avisos legíveis em 320 px.

### T-48 — Ajustar composição e mensagens responsivas

- **ID:** T-48
- **Tipo:** UI
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** finalizar disposição da raiz e status, sem alterar dados.
- **Requisitos:** NFR-01/06, FR-06/09.
- **Dependências:** T-40, T-45.
- **Arquivos prováveis:** `src/components/App.tsx`, `src/components/RequestStatus.tsx`.
- **Critérios de aceite:**
  - [NFR-01/06, FR-06] Em 320 px e viewport desktop do Playwright, mensagens de
    erro/loading/vazio e toggle não saem da área do documento. Retry e seletor
    permanecem visíveis ao rolar até eles e operáveis por teclado, sem sobreposição.
  - Mensagens longas e toggle permanecem acessíveis em 320 px e desktop.
  - Loading/erro/vazio não sobrepõem ações e respeitam foco/tema.

### T-52 — Configurar projetos de plataformas aprovadas

- **ID:** T-52
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** ajustar execução Playwright à matriz definida.
- **Requisitos:** NFR-07.
- **Dependências:** T-06, T-49.
- **Arquivos prováveis:** `playwright.config.ts`.
- **Critérios de aceite:**
  - [NFR-07; Plano] `pnpm exec playwright test --list` lista projetos e jornadas
    esperados sem erro; executar weather-flow em cada projeto configurado termina
    com código 0. Comparação com T-06 identifica cobertura automatizada e lacunas manuais.
  - Manter desktop/mobile existentes e acrescentar somente projetos necessários.
  - Descoberta e execução focada funcionam; documentar limites de emulação na configuração.

### T-53 — Automatizar mobile e limite de 320 px

- **ID:** T-53
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** testar interação e layout em telas estreitas.
- **Requisitos:** NFR-01, CA-02c/05b/06b.
- **Dependências:** T-46, T-47, T-48, T-50, T-51, T-52.
- **Arquivos prováveis:** `tests/e2e/weather-mobile.spec.ts`.
- **Critérios de aceite:**
  - [NFR-01, CA-02c/05b/06b] Asserts de bounding boxes/visibilidade e
    scrollWidth <= clientWidth passam em 320 px para loading/error/empty/success.
    Toque executa seleção, toggle e retry; cinco dias são alcançados por rolagem vertical.
  - Fluxo principal, unidade e recuperação passam com toque no mobile.
  - Em 320 px, scrollWidth <= clientWidth; loading/erro/vazio/sucesso e textos longos
    não cortam controles, inclusive previsão por rolagem vertical.
  - [NFR-01, CA-03/04/05b] Além da jornada mobile de T-49, executar o fluxo
    completo em viewport com largura exata de 320 px e verificar valores atuais,
    cinco dias e unidade após toque, sem rolagem horizontal. Registrar resultado
    de `pnpm exec playwright test tests/e2e/weather-mobile.spec.ts --project=mobile`.

### T-54 — Avaliar plataformas e aparelhos

- **ID:** T-54
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** registrar compatibilidade fora dos limites da emulação.
- **Requisitos:** NFR-07.
- **Dependências:** T-53.
- **Arquivos prováveis:** `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [NFR-07] Evidência datada identifica versão da aplicação, navegador/SO/aparelho
    e resultado de busca, seleção, consulta, unidade e recuperação em cada linha
    da matriz T-06. Linha não executada fica pendente, não “suportada”.
  - Registrar evidência nas plataformas/versões/aparelhos aprovados.
  - Limitações e defeitos explícitos; incompatibilidade impeditiva bloqueia aceite.

### T-55 — Automatizar jornada acessível

- **ID:** T-55
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** verificar semântica e teclado no navegador.
- **Requisitos:** NFR-06, CA-02c/09.
- **Dependências:** T-46, T-47, T-48, T-50.
- **Arquivos prováveis:** `tests/e2e/weather-accessibility.spec.ts`.
- **Critérios de aceite:**
  - [NFR-06, CA-02c/09] Jornada sem mouse envia busca, seleciona City, alterna unidade
    e aciona retry; asserts por role/name verificam destino do foco e callbacks.
    Loading/erro têm região semântica identificável; todos os controles têm nome acessível.
  - Roles/names/labels, ordem de foco e teclado cobrem busca, seleção, toggle e retry.
  - Regiões de status/erro possuem semântica anunciável, sem afirmar certificação WCAG.

### T-56 — Avaliar contraste e leitor de tela

- **ID:** T-56
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** produzir evidência manual de acessibilidade.
- **Requisitos:** NFR-06.
- **Dependências:** T-06, T-55.
- **Arquivos prováveis:** `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [NFR-06] Registro informa ferramenta/leitor/versão e resultado por cenário:
    navegação, loading, vazio, erro e recuperação. Anúncios identificam operação
    sem ler payload bruto; contraste medido atende 4,5:1 para texto normal e 3:1
    para texto grande, além dos critérios AA aplicáveis a controles/foco.
  - Registrar método, cenários e resultado de contraste, foco e anúncios com leitor de tela.
  - Barreiras identificadas viram tarefas corretivas limitadas; não aprovar com bloqueios nem
    usar screenshots/jsdom como prova suficiente de WCAG 2.2 AA.

### T-57 — Aplicar atualização e envelhecimento no hook

- **ID:** T-57
- **Tipo:** Data
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** implementar somente a política de dados aprovada.
- **Requisitos:** NFR-05, FR-06/08.
- **Dependências:** T-04, T-39.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Critérios de aceite:**
  - [NFR-05; decisão T-04] Para idade imediatamente antes, no limite e após o limite
    aprovado, estado de frescor segue a definição registrada. Se periódico,
    relógio controlado confirma intervalo e limpeza; se manual, não existe request automático.
  - Frequência e idade máxima seguem decisão; liberar recursos de atualização quando aplicável.
  - Expor estado necessário de frescor sem UI, cache não aprovado ou referência antiga
    tratada como nova só porque fetchedAt mudou.

### T-58 — Apresentar frescor na tela

- **ID:** T-58
- **Tipo:** UI
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** conectar sinais de frescor e mensagens aos dados exibidos.
- **Requisitos:** NFR-05, FR-06/08/09.
- **Dependências:** T-40, T-57.
- **Arquivos prováveis:** `src/components/App.tsx`, `src/components/CurrentWeather.tsx`.
- **Critérios de aceite:**
  - [NFR-05, FR-08/09] Com consulta em t2 e referência em t1, a UI apresenta os dois
    horários com rótulos distintos no fuso da cidade e mostra aviso no limite
    aprovado. Após falha, não renderiza dados antigos sob rótulo de atuais.
  - Idade/referência e horário de consulta distintos, com indicação de envelhecimento aprovada.
  - Falha não reapresenta dados antigos como atuais; não ampliar política sem cache.

### T-59 — Testar atualização e apresentação de frescor

- **ID:** T-59
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** validar política com relógio controlado.
- **Requisitos:** NFR-05, FR-06/08.
- **Dependências:** T-11, T-58.
- **Arquivos prováveis:** `tests/unit/weatherFreshness.test.tsx`.
- **Critérios de aceite:**
  - [NFR-05, FR-06/08] Timers simulados exercitam antes/no/depois do limite de T-04;
    asserts verificam estado e mensagem. Consulta recente não reinicia idade da
    referência antiga; desmontagem cancela timer e falha não recupera cache inexistente.
  - Limites de idade, atualização/falha e limpeza de recursos seguem decisão.
  - Consulta recente com referência antiga não aparenta dados novos; ausência de cache preservada.

### T-61 — Definir acompanhamento de disponibilidade

- **ID:** T-61
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** M
- **Descrição:** registrar procedimento operacional verificável de sondagem.
- **Requisitos:** NFR-04.
- **Dependências:** T-05, T-08.
- **Arquivos prováveis:** `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [NFR-04] Procedimento registra sondas, responsável, intervalo, mês/fuso,
    exclusões e fórmula aprovados em T-08, com exemplos de app indisponível e
    API indisponível contabilizados separadamente. Aceite desta tarefa é do
    procedimento; atingimento mensal só recebe aceite após janela efetivamente medida.
  - Especificar responsável, frequência, sinal/cálculo e evidências de app e API separados,
    respeitando limites; formulário carregado não equivale a API utilizável.
  - Registrar observação mensal pendente, sem declarar 99,5% comprovado antecipadamente;
    automação adicional só entra com escopo próprio aprovado.

### T-62 — Exibir atribuição do provedor

- **ID:** T-62
- **Tipo:** UI
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** cumprir atribuição aprovada na interface.
- **Requisitos:** NFR-08, condições de uso, FR-09.
- **Dependências:** T-05, T-40.
- **Arquivos prováveis:** `src/components/App.tsx`.
- **Critérios de aceite:**
  - [Condições de uso/T-05; FR-09, NFR-08] Comparar conteúdo e destino do link com
    decisão aprovada; link tem nome acessível e destino HTTPS esperado. Em 320 px
    e desktop, atribuição permanece legível e alcançável por teclado.
  - Conteúdo/link e posição seguem condições aprovadas com nome acessível.
  - Atribuição legível em mobile/desktop, sem prejudicar jornadas.

### T-63 — Preparar publicação existente

- **ID:** T-63
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** configurar assets/base path e pipeline existente.
- **Requisitos:** NFR-08, FR-10.
- **Dependências:** T-62.
- **Arquivos prováveis:** `.github/workflows/pages.yml`, `vite.config.ts`.
- **Critérios de aceite:**
  - [NFR-08, FR-10; Plano] `pnpm build` termina com código 0 na base de publicação;
    artefatos referenciam o prefixo esperado e pipeline usa o diretório de saída
    correto. Inspeção de configuração não encontra chave de API ou etapa de login da aplicação.
  - Reutilizar Pages existente, com base path coerente e assets resolvidos.
  - Build publicável sem backend, credenciais ou API key; não publicar se houver impedimento.

### T-65 — Executar gates completos

- **ID:** T-65
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** consolidar resultados dos runners e cobertura.
- **Requisitos:** FR-01 a FR-10, NFR-01/02/05/06/07/08.
- **Dependências:** T-14, T-16, T-18, T-21, T-22, T-27, T-28, T-32, T-33,
  T-34, T-41, T-42, T-43, T-44, T-54, T-55, T-59, T-63.
- **Arquivos prováveis:** `tasks/weather-app-tasks.md`.
- **Critérios de aceite:**
  - [Plano; FR-01 a FR-10] Para a mesma revisão, registrar separadamente `pnpm lint`,
    `pnpm build`, `pnpm test`, `pnpm test:coverage` e `pnpm test:e2e`, todos com
    código 0; execução ausente ou falha impede conclusão. Anexar referência ao
    relatório de cobertura e aos diagnósticos de retries sem ignorar casos exigidos.
  - Registrar resultado exato de pnpm lint/build/test/test:coverage/test:e2e.
  - Inspecionar trace/screenshots/retries; falhas e flakiness geram correções limitadas
    antes do aceite, sem reescrever produção/testes nesta tarefa de execução.

### T-60 — Medir desempenho

- **ID:** T-60
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** produzir evidência de latência nas condições aprovadas.
- **Requisitos:** NFR-03.
- **Dependências:** T-07, T-56, T-65.
- **Arquivos prováveis:** `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [NFR-03] Evidência contém amostras e tempos desde ação até dados renderizados,
    quantidade de sucessos/falhas e proporção dentro do limite aprovado em T-07.
    Registrar ambiente/data/app/API separados; se a proporção for inferior à meta,
    resultado é reprovado e gera correção, não tarefa concluída com meta atendida.
  - Medir busca/consulta, percentual em até 3 s e falhas à parte, conforme meta aprovada.
  - Separar latências app/provedor; mocks E2E não comprovam latência externa.

### T-64 — Verificar URL publicada e contrato do provedor

- **ID:** T-64
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** validar HTTPS e integração pontual fora dos gates determinísticos.
- **Requisitos:** FR-09/10, NFR-08.
- **Dependências:** T-54, T-56, T-59, T-63.
- **Arquivos prováveis:** `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [CA-09/10, NFR-08] Registrar data, versão e URL: navegação final/requests de dados
    usam HTTPS, assets necessários respondem 2xx, busca e forecast concluem sem
    credenciais da pessoa. Network mostra parâmetros/contrato e atribuição exigidos,
    sem requests de geolocalização ou persistência de usuário no servidor da aplicação.
  - Registrar URL HTTPS, assets, formulário e consulta sem autenticação/persistência servidor/geolocalização.
  - Verificar endpoints HTTPS, atribuição e contrato ao vivo pontualmente respeitando limites;
    não tornar testes automatizados dependentes da API externa.

### T-66 — Fechar rastreabilidade e pendências

- **ID:** T-66
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** revisar evidências e declarar o estado real do aceite.
- **Requisitos:** FR-01 a FR-10, NFR-01 a NFR-08, CA-01a a CA-11.
- **Dependências:** T-60, T-61, T-64.
- **Arquivos prováveis:** `tasks/weather-app-tasks.md`, `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - [FR-01 a FR-10, NFR-01 a NFR-08, CA-01a a CA-11] Matriz de fechamento possui
    uma linha por FR/NFR/CA com tarefa, evidência, resultado e pendência/responsável.
    Nenhum “atendido” depende somente de intenção; meta mensal sem observação
    permanece pendente e impede declarar todos os NFR comprovados.
  - Cada requisito/CA tem evidência; avaliações manuais e decisões estão registradas.
  - Observação mensal e bloqueios residuais explícitos; não declarar produção aprovada
    com metas não comprovadas ou achados impeditivos.

## Rastreabilidade resumida

### Requisitos funcionais

Cada linha corresponde a um requisito da [spec](../specs/weather-app-spec.md).
“Coberto no backlog” significa que há tarefas correspondentes, não que o requisito
foi implementado ou validado. Tarefas de decisão não substituem implementação.

| Requisito funcional | Tarefas que implementam | Testes correspondentes | Cobertura e decisões pendentes |
|---|---|---|---|
| FR-01 — Buscar cidades | T-20 (geocoding e termo preservado), T-23 (validação/estado), T-24 (formulário), T-26 (integração) | T-22, T-27, T-28, T-49, T-50 | Coberto no backlog. Escopo/cobertura do lançamento depende de T-03/T-05. |
| FR-02 — Identificar e selecionar cidade | T-20 (identidade/contexto), T-24 (opções/seleção explícita), T-26 (seleção no estado), T-35 (consulta da cidade selecionada), T-40 (composição) | T-22, T-28, T-49, T-51 | Coberto no backlog, incluindo homônimas, teclado e descarte de resposta de outra cidade. |
| FR-03 — Consultar clima atual | T-13 (conversão), T-15 (precisão), T-17 (WMO), T-29 (dados atuais/precipitação), T-31 (resultado), T-35 (orquestração), T-36 (indicadores), T-40 (integração) | T-14, T-16, T-18, T-32, T-34, T-42, T-49 | Coberto no backlog. Janela/cobertura da precipitação depende da decisão T-02. |
| FR-04 — Consultar previsão diária de cinco dias | T-15 (calendário), T-30 (cinco datas locais), T-31 (resultado), T-35 (consulta), T-37 (apresentação), T-40 (integração) | T-16, T-33, T-43, T-49 | Coberto no backlog: hoje a hoje + 4, sem datas fabricadas em resposta parcial. |
| FR-05 — Alternar unidade de temperatura | T-13 (conversão pura), T-36/T-37 (temperaturas derivadas), T-38 (controle), T-39 (preferência Celsius inicial), T-40 (conexão) | T-14, T-41, T-42, T-43, T-44, T-49, T-53 | Coberto no backlog: todas as temperaturas, sem request ou mudança das outras unidades. |
| FR-06 — Informar falhas e permitir nova tentativa | T-19 (classificação/timeout), T-23 (erro/retry da busca), T-25 (mensagens/ações), T-31 (parcial/vazio/inválido), T-35 (erro/retry do clima), T-26/T-40 (integração) | T-21, T-27, T-28, T-34, T-41, T-44, T-50, T-51 | Coberto no backlog. Prazo de timeout depende de aprovação em T-01. |
| FR-07 — Exibir campos da previsão | T-13 (conversão), T-15 (precisão), T-17 (WMO), T-30 (séries diárias), T-31 (parcialidade), T-37 (indicadores), T-40 (integração) | T-14, T-16, T-18, T-33, T-34, T-43, T-49 | Coberto no backlog: mínimas/máximas, condição/ícone, acumulado e probabilidade máxima. |
| FR-08 — Apresentar datas, horários e números | T-15 (locale/fuso), T-29/T-30 (instantes UTC/datas civis), T-36/T-37 (formatação), T-40 (integração), T-58 (consulta versus referência no frescor) | T-16, T-32, T-33, T-42, T-43, T-49, T-59 | Coberto no backlog. Política adicional de frescor depende de T-04, sem bloquear a formatação básica. |
| FR-09 — Usar idioma pt-BR | T-09/T-10 (raiz/idioma do documento), T-17 (condições), T-24/T-25 (busca/status), T-36/T-37/T-38 (clima/previsão/controle), T-40 (composição), T-58 (mensagens de frescor) | T-11, T-18, T-28, T-42, T-44, T-49, T-55, T-59, T-64 | Coberto no backlog: textos pt-BR; locale do dispositivo afeta formatos, não o idioma da UI. |
| FR-10 — Permitir consulta sem conta | T-09 (raiz sem login), T-20/T-29 (APIs sem credenciais da pessoa), T-26/T-40 (jornada sem autenticação) | T-11, T-28, T-49, T-64 | Coberto no backlog. Não exige criar tarefa de autenticação ou backend; ausência dessas etapas é verificada no fluxo. |

**Lacunas funcionais:** nenhum dos dez FR está sem tarefa de implementação.
Existem decisões que bloqueiam partes da execução (T-01/T-02 e aprovação de
escopo/uso do provedor em T-03/T-05), não requisitos funcionais sem tarefa.
Todos os itens continuam pendentes de implementação e evidência; T-65/T-66
consolidam os resultados, sem substituir os testes listados.

### Requisitos não funcionais

| Requisito | Implementação/decisão | Verificação principal |
|---|---|---|
| NFR-01/07 | T-06, T-45, T-46, T-47, T-48, T-52 | T-53, T-54 |
| NFR-02 | T-12, T-15, T-31, T-36, T-37 | T-16, T-32, T-33, T-34, T-42, T-43 |
| NFR-03 | T-07 | T-60 |
| NFR-04 | T-08 | T-61, observação mensal posterior |
| NFR-05 | T-04, T-36, T-57, T-58 | T-34, T-42, T-59 |
| NFR-06 | T-06, T-24, T-25, T-38, T-45 a T-48 | T-28, T-44, T-55, T-56 |
| NFR-08 | T-05, T-62, T-63 | T-49, T-64 |

T-65/T-66 consolidam a evidência; a matriz não substitui os critérios de cada
tarefa nem aprova questões abertas. Esta revisão não alterou a spec ou o plano.
