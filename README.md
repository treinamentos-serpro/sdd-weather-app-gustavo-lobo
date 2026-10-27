<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install   # navegadores para os testes E2E
```

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

---

## Arquitetura do app

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

---

## Serviço Open-Meteo

As operações `searchCities(name): Promise<City[]>` e
`getWeather(city): Promise<WeatherData>` estão em
[src/services/weatherService.ts](src/services/weatherService.ts).
A busca ignora nomes vazios sem acessar a rede e codifica o nome com
`encodeURIComponent`. O forecast solicita cinco dias, unidades métricas,
fuso automático e timestamps Unix; normaliza condições WMO e arrays diários
para os contratos compartilhados. A precipitação atual vem da última hora
fechada disponível em `hourly`, não do intervalo de 15 minutos de `current`.

Falhas HTTP, de rede, de JSON e ausência de `current` ou `daily` lançam
`WeatherServiceError`. Medições ausentes permanecem `null`, com problemas
registrados em `issues`, sem substituí-las por zero.

`fetchWithTimeout` usa `AbortController` com limite de 10 segundos e limpa o
timer em `finally`. Um `AbortError` vira `WeatherServiceError` com mensagem
“A requisição demorou demais.”; falhas de rede usam “Falha de rede.”.

O hook [useWeather](src/hooks/useWeather.ts) expõe `status`
(`idle | loading | success | error | empty`), `data`, `cities`, `error`,
`query` e as ações assíncronas `search(name)`, `selectCity(city)` e `retry()`.
`data` e `error` começam como `null`; `cities` começa vazia. A busca carrega
automaticamente a primeira cidade; lista vazia não inicia forecast.
Retry repete a busca que falhou ou apenas forecast quando a cidade já foi
encontrada. Respostas antigas e posteriores à desmontagem são descartadas.

## Dados fictícios para desenvolver a UI

Os contratos estão em [src/types/weather.ts](src/types/weather.ts). Para desenvolver
componentes sem acessar a API, importe o objeto tipado:

```ts
import { mockWeatherData } from './mocks/weather';
```

O caminho acima considera um arquivo diretamente em `src/`. O mock está em
[src/mocks/weather.ts](src/mocks/weather.ts) e contém São Paulo, clima atual e
exatamente cinco dias consecutivos, de 27 a 31 de outubro de 2026. São dados
fictícios com datas fixas, não uma previsão real nem atualizada automaticamente.
Temperaturas ficam em Celsius, horários em UTC e datas diárias no fuso
`America/Sao_Paulo`; converta e formate apenas na apresentação. O mock não é
um fallback automático para falhas da API.

## Componente de busca

[SearchBar](src/components/SearchBar.tsx) implementa o formulário previsto como
`CitySearch` no plano, com o nome solicitado para a UI. Recebe
`onSearch(city: string)` e `disabled` opcional (padrão `false`). Remove apenas
espaços nas extremidades, rejeita buscas vazias com uma orientação acessível e
permite envio pelo botão ou Enter. Não acessa a API; a integração fica a cargo
do callback. `disabled` bloqueia o campo, o botão e o envio do formulário.

## Controle de unidade

[UnitToggle](src/components/UnitToggle.tsx) implementa o controle previsto como
`TemperatureUnitToggle` no plano. Recebe `unit: Unit` e `onChange(unit: Unit)`,
sem estado interno, conversão ou acesso à API. Os botões `°C` e `°F` indicam a
seleção com `aria-pressed` dentro do grupo “Unidade de temperatura”.
Use Tab/Shift+Tab para navegar e Enter/Espaço para ativar; o componente pai deve
atualizar a prop `unit` ao receber o callback.

## Condições atuais

[CurrentWeather](src/components/CurrentWeather.tsx) recebe `city: City`,
`current: CurrentWeather` e `unit: Unit`. Exibe temperatura, condição com ícone
acessível e métricas em layout responsivo glassmorphism, sem acessar a API.
Valores ausentes aparecem como “Indisponível”; zero continua sendo uma medição.

O componente usa [temperature](src/lib/temperature.ts) para conversão sem
arredondamento, [weatherFormat](src/lib/weatherFormat.ts) para formatação na
localidade do dispositivo e [weatherCodes](src/lib/weatherCodes.ts) para ícones.
Este último também exporta `getWeatherCondition(code)` para normalizar códigos
WMO, incluindo a condição genérica para códigos desconhecidos.

Como estas props não incluem `timezone`, `fetchedAt` ou `issues`, a apresentação
dos horários no fuso da cidade e dos avisos de validação fica para a integração,
sem inferir o horário meteorológico a partir do momento da renderização.

## Previsão diária

[ForecastList](src/components/ForecastList.tsx) recebe `forecast: ForecastDay[]`
e `unit: Unit` e renderiza a sequência recebida em um grid de 2/3/5 colunas
(base/`sm`/`lg`). A validação dos cinco dias cabe à camada de dados; a lista não
inventa nem descarta datas. Uma lista vazia mostra “Previsão indisponível”.

[ForecastCard](src/components/ForecastCard.tsx) recebe `day: ForecastDay` e
`unit: Unit`. Cada cartão exibe data, condição com ícone acessível, máxima,
mínima, probabilidade de chuva e precipitação diária. Medições ausentes são
explicitamente indisponíveis. O helper `formatDayLabel` em
[format](src/lib/format.ts) formata a data civil na localidade do dispositivo
sem deslocá-la pelo fuso do navegador; não usa o relógio para inventar “hoje”.

## Estados de apresentação

Os componentes em [states](src/components/states/) são independentes da rede:

- [LoadingState](src/components/states/LoadingState.tsx): `role="status"`,
  mensagem opcional `message` (padrão “Carregando dados…”) e indicador animado
  apenas quando o dispositivo não solicita movimento reduzido.
- [ErrorState](src/components/states/ErrorState.tsx): `message` obrigatória,
  anunciada como alerta, e botão “Tentar novamente” que chama `onRetry`.
  A prop opcional `disabled` bloqueia a nova tentativa.
- [EmptyState](src/components/states/EmptyState.tsx): `role="status"`, título
  `title` e dica `hint` opcionais, com padrões para busca sem resultados.
  Na consulta meteorológica, forneça textos com cidade/período preservados.

Use mensagens específicas à operação e voltadas ao usuário, sem expor erros
brutos da API. O componente pai controla qual estado exibir e quando liberar
uma nova tentativa.

## Executar a aplicação integrada

Execute `pnpm dev` e abra a URL indicada pelo Vite. A composição está em
[App](src/App.tsx), com entrada em [main](src/main.tsx) e estilos globais em
[index.css](src/index.css).

O estado inicial orienta a busca. Enviar uma cidade consulta o geocoding e
carrega o clima do primeiro resultado. Quando há várias opções, botões com
nome, região e país permitem selecionar outra cidade. Durante a consulta,
busca e seleção ficam desabilitadas; ausência de resultados e falhas têm
mensagens distintas. “Tentar novamente” repete a operação que falhou.
Não há mock como fallback nem controles de demonstração na aplicação.

A unidade começa em Celsius e permanece no estado de UI entre consultas.
As onze temperaturas são convertidas pelos componentes na renderização, sem
alterar os dados nem acessar a rede. Referência meteorológica, consulta e
intervalo de precipitação são apresentados separadamente no fuso da cidade.

### Acessibilidade e responsividade

- Busca inválida mantém a mensagem associada ao campo e leva o foco para ele.
- A recuperação de erro move o foco para o conteúdo, sem perdê-lo quando o
  botão desaparece. O link “Ir para o conteúdo” também alcança essa região.
- O sucesso e a troca de unidade têm anúncio resumido em uma região viva.
  Botões ativos usam sublinhado além de cor e `aria-pressed`.
- Textos longos quebram sem ocultar conteúdo; o grid mantém 2/3/5 colunas.
  Sem suporte a blur, os painéis usam um fundo sólido escuro.
- Contraste calculado pela luminância WCAG, considerando o fundo mais claro do
  gradiente e o painel branco a 5%: borda do campo 6,17:1 (antes 1,53:1),
  foco sobre painel 6,20:1, texto secundário sobre painel 10,65:1 e texto do
  botão no hover 5,39:1. Emojis dependem da renderização do sistema; a condição
  também é apresentada em texto.
- Testes E2E cobrem teclado, movimento reduzido, busca, retry e grid responsivo
  em 320, 375, 640, 768, 1024 e 1440 px. Isso não substitui avaliação com leitor
  de tela real nem certifica conformidade integral com WCAG.

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>
