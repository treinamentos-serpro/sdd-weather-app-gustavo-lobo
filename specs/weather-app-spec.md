# Especificação de Produto: Aplicação de Previsão do Tempo

## Overview

Aplicação web responsiva para buscar cidades e consultar condições meteorológicas atuais e uma previsão de cinco dias. A interface atende ao público em pt-BR; temperaturas começam em Celsius, com opção de alternar para Fahrenheit.

O objetivo é ajudar pessoas a entender rapidamente as condições de uma localidade e planejar atividades, com dados identificados por local e período. A fonte definida é a API Open-Meteo, sem chave de API. A seleção de cidade é manual no escopo atual.

As personas de referência são Marina, que consulta o clima antes de sair; Rafael, que planeja uma viagem; e Joana, que alterna entre cidades e unidades. São hipóteses de discovery, ainda não validadas com usuários.

Esta especificação define o escopo funcional, mas não está pronta para aprovação de produção enquanto as perguntas operacionais listadas em **Open Questions** permanecerem sem decisão.

## Functional Requirements

**Ajuste de apresentação aprovado:** temperaturas atuais, mínimas e máximas
em Celsius e Fahrenheit são arredondadas ao inteiro mais próximo, sem casas
decimais (20.04 → `20 °C`; 12.26 → `12 °C`; 19.96 → `20 °C`).
Esta regra substitui a precisão decimal de temperatura nos requisitos e
exemplos abaixo; vento e precipitação continuam com uma casa decimal.
Os dados e as conversões mantêm a precisão original.

### Recorte aprovado para o serviço de integração

As operações `searchCities(name): Promise<City[]>` e
`getWeather(city): Promise<WeatherData>` serão implementadas em
`src/services/weatherService.ts`. Neste recorte, por solicitação explícita,
ausência de `current` ou `daily` é resposta incompleta e lança
`WeatherServiceError`, em vez de sucesso parcial entre blocos. Campos
meteorológicos individuais ausentes continuam anuláveis. Busca vazia não
acessa a rede; o nome é codificado com `encodeURIComponent`.

No recorte de integração solicitado, a busca carrega automaticamente o clima
da primeira cidade encontrada (substitui a seleção obrigatória de FR-02/CA-02b
neste fluxo). As demais cidades continuam disponíveis para seleção manual.
O hook expõe um status único (`idle`, `loading`, `success`, `error`, `empty`),
dados, cidades, erro, termo e ações de busca, seleção e nova tentativa.
Falhas podem ser repetidas manualmente na operação que falhou: busca por nome
ou consulta da cidade já encontrada. Requisições têm timeout de 10 segundos.

- **FR-01 — Buscar cidades:** permitir pesquisar cidades pelo nome usando o serviço de geocodificação da Open-Meteo. Não enviar consulta se o campo estiver vazio ou contiver apenas espaços; preservar letras acentuadas, espaços internos, hífens e apóstrofos no termo enviado.
- **FR-02 — Identificar e selecionar cidade:** apresentar os dados geográficos fornecidos pela Open-Meteo para distinguir localidades homônimas e permitir seleção explícita. Não selecionar automaticamente um resultado quando houver mais de uma opção ou não houver contexto suficiente para distingui-las.
- **FR-03 — Consultar clima atual:** exibir temperatura em °C/°F, condição meteorológica mapeada para texto pt-BR e ícone, umidade relativa em %, velocidade do vento em km/h, pressão ao nível da superfície em hPa e precipitação da hora anterior em mm para a cidade selecionada. Arredondar temperatura, vento e precipitação para uma casa decimal; umidade e pressão para o inteiro mais próximo.
- **FR-04 — Consultar previsão diária de cinco dias:** exibir uma previsão diária para hoje e os quatro dias seguintes, de acordo com o calendário local da cidade consultada.
- **FR-05 — Alternar unidade de temperatura:** iniciar em Celsius e permitir alternar entre Celsius e Fahrenheit, atualizando todas as temperaturas atuais e previstas. A alternância não altera as unidades métricas dos demais campos.
- **FR-06 — Informar falhas e permitir nova tentativa:** distinguir ausência de resultados de falha de serviço/rede, informar a operação que falhou e oferecer nova tentativa preservando o termo de busca ou cidade selecionada.
- **FR-07 — Exibir campos da previsão:** para cada dia, exibir temperatura mínima e máxima em °C/°F, condição meteorológica mapeada para texto pt-BR e ícone, precipitação acumulada diária em mm e probabilidade máxima diária de precipitação em %. Arredondar temperaturas e acumulado para uma casa decimal e probabilidade para o inteiro mais próximo.
- **FR-08 — Apresentar datas, horários e números:** usar o fuso horário da cidade consultada para os dias e horários da previsão e formatar datas, horários e números segundo a localidade configurada no dispositivo do usuário.
- **FR-09 — Usar idioma pt-BR:** apresentar textos e mensagens da interface em português do Brasil.
- **FR-10 — Permitir consulta sem conta:** permitir buscar cidades e consultar dados sem criar conta ou autenticar-se.

## User Stories

- **US-01 (FR-01, FR-02):** Como Marina, a pessoa que decide antes de sair, quero buscar e selecionar minha cidade para consultar as condições do lugar correto.
- **US-02 (FR-03, FR-07):** Como Marina, a pessoa que decide antes de sair, quero ver as condições atuais e os indicadores meteorológicos disponíveis para me preparar antes de sair.
- **US-03 (FR-04, FR-07, FR-08):** Como Rafael, quem planeja uma viagem, quero consultar a previsão de hoje e dos quatro dias seguintes no fuso da cidade para planejar o que levar e minhas atividades.
- **US-04 (FR-05):** Como Joana, usuária que alterna localidades e unidades, quero alternar entre Celsius e Fahrenheit para interpretar as temperaturas na unidade que prefiro.
- **US-05 (FR-06):** Como Joana, usuária que alterna localidades e unidades, quero tentar novamente quando uma busca ou consulta falhar para concluir minha consulta sem começar o fluxo do zero.
- **US-06 (FR-09):** Como Marina, a pessoa que decide antes de sair, quero usar uma interface em pt-BR para entender as informações e mensagens com clareza.
- **US-07 (FR-10):** Como Rafael, quem planeja uma viagem, quero consultar uma cidade sem criar uma conta para verificar a previsão rapidamente.

## Acceptance Criteria

- **CA-01a — FR-01 / US-01:** **Given** a geocodificação retorna duas opções para o termo `Recife`, **When** a pessoa envia `Recife`, **Then** as duas opções retornadas aparecem com seus nomes de cidade e nenhuma é selecionada automaticamente.
- **CA-01b — FR-01 / Edge case:** **Given** o campo de busca está vazio ou contém apenas espaços, **When** a pessoa envia a busca, **Then** nenhuma requisição de geocodificação é enviada e a interface solicita um nome de cidade.
- **CA-01c — FR-01 / Edge case:** **Given** o termo contém acentos, espaços internos, hífen ou apóstrofo, **When** a busca é enviada, **Then** o serviço recebe o mesmo termo sem remoção ou substituição desses caracteres.
- **CA-01d — FR-01 / Edge case:** **Given** a geocodificação responde com sucesso e lista vazia, **When** a busca termina, **Then** a interface mostra estado sem resultados, mantém o termo editável e não inicia consulta meteorológica.
- **CA-02a — FR-02 / US-01:** **Given** os resultados são localidades homônimas e a resposta contém subdivisão ou país, **When** as opções são exibidas, **Then** os campos disponíveis são apresentados junto ao nome da cidade para diferenciá-las.
- **CA-02b — FR-02 / US-01:** **Given** há mais de uma opção ou os dados disponíveis não distinguem claramente as localidades, **When** os resultados são exibidos, **Then** nenhuma cidade é selecionada até a pessoa escolher uma opção.
- **CA-02c — FR-02 / US-01:** **Given** a pessoa percorre os resultados usando teclado, **When** seleciona uma opção, **Then** a cidade consultada corresponde ao identificador geográfico daquela opção, não apenas ao texto do nome.
- **CA-03 — FR-03 / US-02:** **Given** a unidade selecionada é Celsius e a resposta atual contém `temperature=20.04 °C`, `weather_code=0`, `relative_humidity=63.4%`, `wind_speed_10m=12.34 km/h`, `surface_pressure=1013.67 hPa` e `precipitation=0.46 mm`, **When** a consulta termina, **Then** a interface identifica a cidade e exibe `20.0 °C`, `Céu limpo` com ícone acessível, `63%`, `12.3 km/h`, `1014 hPa` e `0.5 mm`, respectivamente.
- **CA-04 — FR-04 / US-03:** **Given** uma cidade selecionada, seu fuso horário e uma previsão diária, **When** a previsão é exibida, **Then** há exatamente um registro para cada uma das cinco datas locais de hoje a hoje + 4 dias, em ordem cronológica, sem datas adicionais.
- **CA-05a — FR-05 / US-04:** **Given** uma sessão nova com temperaturas disponíveis, **When** os dados são exibidos pela primeira vez, **Then** todas as temperaturas aparecem em Celsius com `°C`.
- **CA-05b — FR-05 / US-04:** **Given** os valores atuais e previstos incluem `0 °C` e `100 °C`, **When** a pessoa seleciona Fahrenheit, **Then** esses valores aparecem como `32 °F` e `212 °F`; ao retornar a Celsius, os valores originais são restaurados sem erro acumulado por alternância.
- **CA-06a — FR-06 / US-01, US-05:** **Given** a busca falha por erro de serviço ou rede, **When** a falha é recebida, **Then** a interface mostra erro distinto do estado sem resultados, preserva o termo e disponibiliza nova tentativa que reenvia o mesmo termo.
- **CA-06b — FR-06 / US-02, US-03, US-05:** **Given** a consulta meteorológica falha por erro de serviço ou rede, **When** a falha é recebida, **Then** a interface mostra erro, preserva a cidade selecionada e disponibiliza nova tentativa para essa cidade.
- **CA-07a — FR-07 / US-03:** **Given** um registro diário com temperatura mínima `12.26 °C`, máxima `19.96 °C`, `weather_code=3`, `precipitation_sum=2.26 mm` e `precipitation_probability_max=67.4%`, **When** o dia é exibido, **Then** aparecem `12.3 °C`, `20.0 °C`, `Nublado` com ícone acessível, `2.3 mm` acumulados e `67%` de probabilidade máxima.
- **CA-07b — FR-07 / Edge case:** **Given** falta um campo obrigatório na resposta atual ou diária, **When** os dados são exibidos, **Then** o campo é marcado como indisponível, os demais campos válidos permanecem visíveis e nenhum valor ausente é convertido em zero ou inventado.
- **CA-08a — FR-08 / US-03:** **Given** o dispositivo e a cidade consultada usam fusos diferentes, **When** a previsão diária é exibida, **Then** as cinco datas correspondem ao calendário da cidade consultada, inclusive em transições de mês ou ano.
- **CA-08b — FR-08 / US-03:** **Given** a localidade do dispositivo é `pt-BR` ou `en-US`, **When** são exibidos a data `2026-03-05` e o número `1.5`, **Then** a data e o número seguem essa localidade (`05/03/2026` e `1,5` para `pt-BR`; `3/5/2026` e `1.5` para `en-US`), enquanto os textos permanecem em pt-BR.
- **CA-09 — FR-09 / US-06:** **Given** a interface exibe rótulos, botões ou mensagens de busca, consulta, carregamento, vazio ou erro, **When** qualquer estado é renderizado, **Then** todo texto visível da interface está em português do Brasil.
- **CA-10 — FR-10 / US-07:** **Given** uma sessão nova sem conta ou credenciais, **When** a pessoa pesquisa uma cidade e consulta seus dados, **Then** ambas as operações podem ser concluídas sem cadastro, login ou etapa de autenticação.
- **CA-11 — Edge case:** **Given** uma requisição não retorna antes do timeout configurado, **When** o timeout ocorre, **Then** o carregamento termina, uma mensagem de timeout é exibida e uma nova tentativa fica disponível.

## Non-Functional Requirements

- **NFR-01 — Responsividade:** em larguras de tela a partir de 320 px, as funções principais de busca, consulta e alternância de unidade permanecem acessíveis sem rolagem horizontal.
- **NFR-02 — Clareza dos dados:** todo valor meteorológico inclui rótulo e unidade; cada registro da previsão identifica uma data local; campos ausentes são marcados como indisponíveis. Aplicar a precisão definida em FR-03 e FR-07 e localizar os separadores numéricos conforme a localidade do dispositivo.
- **NFR-03 — Desempenho:** meta proposta: pelo menos 95% das operações bem-sucedidas de busca e consulta meteorológica renderizam o resultado em até 3 segundos, medidos do envio da ação até a apresentação dos dados válidos e dos campos indisponíveis identificados. Medir latência da aplicação e do provedor separadamente; contabilizar falhas à parte. Rede, carga e período de amostragem precisam ser definidos antes do aceite da meta.
- **NFR-04 — Disponibilidade:** meta proposta: 99,5% de disponibilidade mensal para a aplicação. Medir a aplicação e a Open-Meteo separadamente; definir janela de medição, manutenção planejada e tratamento de dependências externas antes de aprovar a meta.
- **NFR-05 — Frescor:** mostrar o horário da última atualização dos dados e identificar dados potencialmente desatualizados se uma atualização falhar. A idade máxima aceitável e a política de cache precisam ser definidas antes do lançamento.
- **NFR-06 — Acessibilidade:** atender WCAG 2.2 nível AA. Verificar operação por teclado, nomes acessíveis, anúncio de estados de carregamento/erro e contraste por avaliação automatizada e manual.
- **NFR-07 — Compatibilidade:** suportar as duas versões estáveis mais recentes dos navegadores e sistemas operacionais móveis acordados com as partes interessadas. A matriz nominal de plataformas e versões é pré-requisito para o aceite.
- **NFR-08 — Segurança e privacidade:** usar HTTPS. Não exigir autenticação nem persistir dados no servidor neste escopo. Caso localização do dispositivo venha a ser aprovada, solicitá-la somente após consentimento explícito.

## Traceability Matrix

| User Story | Acceptance Criteria | Requisitos não funcionais relevantes |
|---|---|---|
| **US-01 — Buscar e selecionar cidade** | CA-01a, CA-01b, CA-01c, CA-01d, CA-02a, CA-02b, CA-02c, CA-06a | NFR-01 (responsividade), NFR-06 (teclado e acessibilidade), NFR-07 (compatibilidade) |
| **US-02 — Consultar clima atual** | CA-03, CA-06b, CA-07b | NFR-01 (responsividade), NFR-02 (rótulos, unidades e campos ausentes), NFR-03 (desempenho), NFR-05 (frescor), NFR-06 (acessibilidade), NFR-07 (compatibilidade) |
| **US-03 — Consultar previsão diária** | CA-04, CA-06b, CA-07a, CA-07b, CA-08a, CA-08b | NFR-01 (responsividade), NFR-02 (clareza e unidades), NFR-03 (desempenho), NFR-05 (frescor), NFR-06 (acessibilidade), NFR-07 (compatibilidade) |
| **US-04 — Alternar unidade** | CA-05a, CA-05b | NFR-01 (responsividade), NFR-02 (unidades e formatação), NFR-06 (acessibilidade), NFR-07 (compatibilidade) |
| **US-05 — Recuperar falha** | CA-06a, CA-06b, CA-11 | NFR-01 (acesso às ações), NFR-03 (tempo de resposta), NFR-05 (identificação de dados desatualizados), NFR-06 (anúncio de erro), NFR-07 (compatibilidade) |
| **US-06 — Usar interface em pt-BR** | CA-09 | NFR-06 (nomes e mensagens acessíveis), NFR-07 (compatibilidade) |
| **US-07 — Consultar sem conta** | CA-10 | NFR-08 (sem autenticação ou persistência no servidor), NFR-07 (compatibilidade) |

## Edge Cases

| Caso | Comportamento esperado |
|---|---|
| Cidade inexistente | Se a busca for concluída com sucesso, mas não houver correspondência para a cidade informada, apresentar “nenhuma cidade encontrada”, manter o termo pesquisado e permitir editá-lo ou fazer nova busca. Não solicitar previsão para uma cidade não selecionada. A interface não deve afirmar que a cidade definitivamente não existe, pois a ausência também pode decorrer da cobertura do geocodificador. |
| Input vazio | Para campo vazio ou contendo apenas espaços, não enviar requisição; informar que é necessário inserir o nome de uma cidade e manter o foco disponível no campo de busca. |
| Caracteres especiais | Tratar acentos, espaços internos, hífens e apóstrofos como parte do termo de busca, sem erro de interface nem remoção silenciosa desses caracteres. Exibir somente as correspondências retornadas; se não houver correspondência, apresentar o estado sem resultados. |
| Falha de API | Se a Open-Meteo responder com erro ou estiver indisponível, apresentar estado de erro distinto do estado sem resultados, manter o termo ou a cidade selecionada e oferecer nova tentativa. Não apresentar a falha como uma resposta meteorológica válida. |
| Timeout | Se a requisição exceder o limite de espera configurado, encerrar o estado de carregamento, informar que a consulta expirou e oferecer nova tentativa. O limite de espera ainda precisa ser definido; a interface não deve permanecer carregando indefinidamente. |
| Geocoding sem resultados | Quando o geocodificador responder com sucesso e uma lista vazia, apresentar estado sem resultados, preservar o termo de busca e permitir alterá-lo. Não tratar a lista vazia como falha de API nem consultar dados meteorológicos. |
| Resposta parcial | Exibir os campos válidos recebidos e identificar campos ausentes como indisponíveis; não substituir valores ausentes por zero ou inventar dados. Manter a cidade e o período identificados e não descartar os demais campos válidos. |
| Código de condição meteorológica desconhecido | Exibir “Condição indisponível” em pt-BR e um ícone genérico acessível; não exibir o código bruto nem inferir uma condição. |
| Cidades homônimas ou com nomes semelhantes | Mostrar o contexto geográfico retornado pelo serviço para apoiar a escolha; não selecionar automaticamente uma opção ambígua. |
| Dados atuais, previsão ou indicadores ausentes | Identificar os dados ou períodos indisponíveis sem fabricar valores e manter claro a que período os dados disponíveis se referem. |
| Falha de atualização após dados anteriores | Se dados anteriores forem exibidos, identificá-los como potencialmente desatualizados. A política para apresentar cache e a idade máxima aceitável continuam em aberto. |
| Mudança de data entre fusos | Determinar hoje e os quatro dias seguintes pelo calendário da cidade consultada, não pelo calendário do dispositivo. |
| Localidade do dispositivo diferente de pt-BR | Manter os textos da interface em pt-BR e aplicar a localidade do dispositivo à formatação de datas, horários e números. |
| Resposta malformada do provedor | Não exibir campos malformados como valores válidos; preservar a identificação da cidade e comunicar a indisponibilidade dos dados afetados. |

## Assumptions

- A pessoa usuária inicia a consulta escolhendo manualmente uma cidade; localização automática não faz parte do fluxo definido.
- Open-Meteo é a fonte de geocodificação e dados meteorológicos, sem chave de API para o escopo definido. Cobertura, limites, atribuição e condições de uso ainda precisam ser validados.
- “Cinco dias” significa hoje e os quatro dias seguintes no fuso da cidade consultada, com uma previsão diária para cada data.
- Celsius é a unidade inicial, mas Fahrenheit continua disponível por alternância.
- A interface é em pt-BR; a formatação de datas, horários e números segue a localidade configurada no dispositivo do usuário.
- Não há autenticação nem persistência no servidor. A persistência local da cidade ou da unidade entre visitas ainda não foi decidida.
- As metas quantitativas de desempenho, disponibilidade, acessibilidade e compatibilidade são propostas iniciais a validar com as partes interessadas.
- As personas e suas métricas são hipóteses, não resultados de pesquisa com usuários.

## Risks

| Risco | Impacto | Mitigação |
|---|---|---|
| Indisponibilidade, limite de requisições, mudanças ou cobertura insuficiente da Open-Meteo. | Busca e consulta podem falhar ou não cobrir as localidades esperadas. | Validar cobertura, limites, atribuição e condições de uso; monitorar falhas; definir timeout e estratégia de nova tentativa. |
| Dados desatualizados ou divergentes da expectativa podem ser entendidos como atuais. | Decisões do usuário podem se basear em informação incorreta. | Mostrar horário da última atualização, distinguir dados atuais de previsão e definir idade máxima e política de cache antes da implementação. |
| Cidades homônimas ou busca com variações de escrita podem levar à localidade errada ou a nenhum resultado. | O usuário perde confiança ou consulta dados de outra cidade. | Exibir contexto geográfico retornado, permitir seleção explícita e validar acentos e nomes duplicados. |
| A frequência de atualização ainda não está definida. | Dados podem ficar obsoletos ou gerar chamadas excessivas. | Definir a frequência de atualização e medi-la em relação aos limites do provedor antes do lançamento. |
| Rede lenta ou indisponibilidade do provedor afeta a latência percebida. | O objetivo de desempenho pode não ser cumprido. | Medir app e provedor separadamente, evitar chamadas redundantes e apresentar carregamento, erro e nova tentativa. |
| Telas pequenas, navegadores não acordados ou barreiras de acessibilidade comprometem o uso. | Funções principais podem ficar inacessíveis para parte do público. | Validar a matriz de dispositivos, testar a partir de 320 px e avaliar teclado e WCAG 2.2 AA. |
| Preferências locais, localização automática ou uso offline ampliarem o escopo sem validação. | A entrega pode atrasar e envolver dados além do necessário. | Manter seleção manual e sem persistência de servidor; aprovar cada capacidade adicional antes de incluí-la. |

## Out of Scope

- Criar contas, autenticar usuários ou oferecer perfis.
- Persistir dados de usuário em servidor ou sincronizar dados entre dispositivos.
- Selecionar automaticamente a cidade por localização do dispositivo no escopo atual.
- Oferecer funcionamento offline como requisito do primeiro escopo.
- Oferecer idioma de interface diferente de pt-BR no lançamento definido.
- Definir retenção local de cidade ou unidade sem decisão explícita.
- Exibir direção ou rajadas de vento, pressão na previsão, umidade na previsão ou probabilidade de precipitação no clima atual.

## Open Questions

- Qual é o público principal, qual necessidade deve ser priorizada e quais métricas validarão sucesso?
- Quais países ou regiões devem estar cobertos no lançamento?
- A busca deve ignorar acentos ou aceitar variações de escrita? Quais campos de localização são obrigatórios para distinguir cidades?
- Com que frequência as informações devem ser atualizadas?
- A cidade selecionada e a unidade devem ser mantidas localmente entre visitas ou sessões?
- Localização automática será incluída futuramente? Se sim, quais regras de consentimento, uso e retenção se aplicam?
- Qual matriz de navegadores e sistemas operacionais móveis deve ser suportada?
- As metas iniciais de responsividade (a partir de 320 px) e WCAG 2.2 nível AA são aceitáveis?
- As metas iniciais de desempenho (95% em até 3 segundos) e disponibilidade (99,5% ao mês) são aceitáveis? Como será contabilizada a indisponibilidade do provedor?
- Qual idade máxima de dados ainda é aceitável para que sejam considerados atuais?
- Em caso de falha, dados em cache podem ser exibidos? Como devem ser identificados?
- Quais são os limites, a cobertura, as condições de uso e as exigências de atribuição aplicáveis à Open-Meteo para o produto?
- Qual é o escopo aprovado para o primeiro lançamento além das funções descritas nesta especificação?
