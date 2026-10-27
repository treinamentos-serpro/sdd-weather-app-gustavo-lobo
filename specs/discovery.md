# Discovery: Aplicação de Previsão do Tempo

## Contexto

A empresa precisa de uma aplicação para consultar condições meteorológicas de cidades. O escopo inicial inclui busca de cidades, clima atual, previsão para cinco dias, alternância entre Celsius e Fahrenheit e uso em dispositivos móveis.

O briefing ainda não define quais dados meteorológicos serão exibidos, como as cidades serão selecionadas nem quais critérios de desempenho e compatibilidade devem ser atendidos.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário pesquise cidades por nome.
- **RF-02 — Selecionar cidade:** permitir que o usuário escolha uma cidade correspondente à busca. Quando houver nomes iguais ou semelhantes, apresentar informação suficiente para distingui-las.
- **RF-03 — Consultar clima atual:** exibir as condições atuais da cidade selecionada.
- **RF-04 — Consultar previsão:** exibir a previsão para os próximos cinco dias da cidade selecionada.
- **RF-05 — Alternar unidade de temperatura:** permitir alternar entre Celsius e Fahrenheit e atualizar os valores de temperatura exibidos.
- **RF-06 — Tratar falhas de consulta:** quando uma busca ou consulta falhar, informar o usuário de forma compreensível e permitir que ele tente novamente.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade:** em larguras de tela a partir de 320 px, a interface não deve exigir rolagem horizontal e deve manter acessíveis as funções principais de busca, consulta e alternância de unidade.
- **RNF-02 — Clareza dos dados:** todo valor de temperatura deve ser acompanhado de sua unidade; previsões devem identificar o dia ou período a que se referem.
- **RNF-03 — Desempenho:** como meta inicial a validar, 95% das buscas e consultas devem apresentar resultado em até 3 segundos, medidos do envio da solicitação até a exibição dos dados, em condições de rede e carga acordadas. O tempo do provedor externo deve ser medido separadamente para diagnóstico.
- **RNF-04 — Disponibilidade:** como meta inicial a validar, as funções principais devem estar disponíveis em 99,5% do tempo em cada mês. A indisponibilidade da aplicação e a do provedor meteorológico devem ser monitoradas separadamente.
- **RNF-05 — Frescor dos dados:** exibir o horário da última atualização e identificar dados potencialmente desatualizados quando uma nova consulta falhar. A idade máxima aceitável dos dados ainda precisa ser definida.
- **RNF-06 — Acessibilidade:** buscar conformidade com WCAG 2.2 nível AA, incluindo operação por teclado, nomes acessíveis para controles e identificação programática de estados de carregamento e erro.
- **RNF-07 — Compatibilidade:** suportar as duas versões estáveis mais recentes dos navegadores e sistemas operacionais móveis acordados com as partes interessadas; a lista exata deve ser definida antes dos testes.
- **RNF-08 — Segurança e privacidade:** usar HTTPS. Caso a localização do dispositivo seja implementada, solicitá-la somente após consentimento explícito do usuário.

## Riscos

As probabilidades são estimativas preliminares; devem ser revistas após a escolha do provedor, do público-alvo e dos critérios de aceite.

| Tipo | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| Técnico | Indisponibilidade, limites de requisição ou mudanças na API meteorológica podem interromper buscas e previsões. | Média | Alto | Validar limites, cobertura e condições do provedor; monitorar falhas; definir timeouts e novas tentativas com backoff; identificar dados em cache como desatualizados. |
| Técnico | Dados atrasados ou divergentes da expectativa podem ser apresentados como atuais. | Média | Alto | Exibir horário da última atualização; definir idade máxima aceitável; distinguir observações atuais de previsões e validar a frequência de atualização da fonte. |
| Técnico/Produto | Cidades homônimas podem levar o usuário a consultar a localidade errada. | Alta | Médio/alto | Exibir estado, região e país nos resultados; testar nomes duplicados e buscas com acentos; permitir corrigir a cidade selecionada. |
| Produto | O formato diário ou horário da previsão de cinco dias permanece ambíguo. | Alta | Alto | Definir se a previsão será diária ou horária antes de aprovar a especificação. |
| Técnico | Rede lenta ou provedor externo pode elevar a latência das buscas e consultas. | Média | Alto | Validar metas de desempenho; medir separadamente app e provedor; evitar chamadas redundantes; exibir carregamento e permitir nova tentativa. |
| Técnico/Produto | A experiência pode falhar em telas móveis pequenas, apesar da exigência de uso móvel. | Média | Alto | Definir larguras e navegadores suportados; testar em dispositivos reais e telas estreitas; verificar acesso às funções principais. |
| Produto | Público-alvo, cobertura geográfica e critérios de sucesso não estão definidos. | Alta | Alto | Identificar usuários e regiões prioritárias; validar necessidades com usuários; definir métricas de sucesso antes de ampliar o escopo. |
| Produto | Localização automática, persistência de preferências ou uso offline podem ampliar o escopo sem valor confirmado. | Média | Médio/alto | Tratar essas capacidades como decisões de produto; priorizar busca e consulta manual; incluir extras somente após validação. |
| Técnico/Produto | Celsius e Fahrenheit podem ser aplicados de forma inconsistente entre telas. | Baixa/média | Médio | Definir persistência da preferência; centralizar conversão e formatação; testar clima atual e todos os dias da previsão nas duas unidades. |
| Técnico/Produto | Acessibilidade e compatibilidade podem ser consideradas tarde, gerando barreiras ou retrabalho. | Média | Alto | Definir padrão e matriz de navegadores; incluir teclado, nomes acessíveis e contraste nos critérios de aceite desde o início. |
| Técnico/Produto | A localização do dispositivo pode ser coletada sem necessidade ou consentimento adequado, caso o recurso seja incluído. | Baixa sem o recurso; média se incluído | Alto | Não coletar localização sem decisão de produto; se aprovada, solicitar consentimento explícito e limitar coleta e retenção. |

## Perguntas em Aberto

| Pergunta em aberto | Impacto de seguir sem resposta |
|---|---|
| Quem é o público principal e qual necessidade prioritária o app deve resolver? Quais métricas indicarão sucesso? | O produto pode priorizar fluxos e conteúdo inadequados ao público, e não haverá critério objetivo para avaliar se o lançamento foi bem-sucedido. |
| Quais países ou regiões devem estar cobertos no lançamento? | A busca ou o provedor podem não cobrir as localidades esperadas, causando retrabalho na seleção de dados e na validação. |
| Como diferenciar cidades com nomes iguais nos resultados? A busca deve ignorar acentos ou aceitar variações de escrita? | O usuário pode selecionar a cidade errada ou não encontrar a cidade desejada, reduzindo a confiança nos resultados. |
| A previsão de cinco dias será diária, horária ou ambas? | O formato pode divergir da expectativa, tornando ambíguos os critérios de aceite e a interpretação da previsão. |
| Com que frequência as informações devem ser atualizadas? | Dados podem ficar obsoletos ou gerar chamadas excessivas, afetando confiança, desempenho e limites do provedor. |
| A cidade selecionada e a unidade de temperatura devem ser mantidas localmente entre visitas ou sessões? | O comportamento pode ser inconsistente entre sessões; persistir dados localmente ainda depende de decisão de produto. |
| A localização automática será incluída ou a seleção será manual? Se incluída, quais regras de consentimento, uso e retenção se aplicam? | A equipe pode implementar escopo desnecessário ou coletar localização sem clareza sobre consentimento, privacidade e retenção. |
| Quais navegadores e sistemas operacionais móveis devem compor a matriz de compatibilidade? | Falhas em ambientes não definidos podem passar despercebidas e não haverá uma base objetiva para os testes de compatibilidade. |
| As metas iniciais de responsividade (a partir de 320 px) e WCAG 2.2 nível AA são aceitáveis para as partes interessadas? | A interface pode não atender às necessidades de acessibilidade ou aos dispositivos esperados, e os critérios de validação permanecerão incertos. |
| As metas iniciais de desempenho (95% das respostas em até 3 segundos) e disponibilidade (99,5% ao mês) são aceitáveis? Como será contabilizada a indisponibilidade do provedor meteorológico? | Sem metas aprovadas e uma regra para dependências externas, não será possível avaliar objetivamente o serviço nem separar falhas do app das do provedor. |
| Qual idade máxima dos dados é aceitável para que sejam considerados atuais? | Dados antigos podem ser apresentados como atuais ou ser descartados sem necessidade, comprometendo confiança e utilidade. |
| Quando uma consulta falhar, dados em cache podem ser exibidos? Como devem ser identificados para não parecerem atuais? | O usuário pode ficar sem informação útil ou tomar dados antigos como atuais se o comportamento de fallback não for definido. |
| O que está dentro e fora do escopo do primeiro lançamento? Localização automática, persistência de preferências e uso offline serão considerados agora ou depois? | O escopo pode crescer sem validação de valor, atrasando a entrega das funções principais ou criando expectativas divergentes. |

## Suposições

- A busca e a consulta de previsão são iniciadas a partir de uma cidade escolhida pelo usuário.
- A alternância entre Celsius e Fahrenheit afeta todos os valores de temperatura apresentados, tanto no clima atual quanto na previsão.
- A aplicação precisa funcionar em dispositivos móveis, mas o briefing não exige funcionalidades exclusivas para eles.
- A seleção de cidade será manual até que o uso de localização automática seja confirmado.
- A fonte de dados meteorológicos é a API Open-Meteo; as políticas de atualização ainda precisam ser definidas.
- As metas quantitativas propostas para requisitos não funcionais são iniciais e dependem de validação com as partes interessadas.

## Decisões

| Decisão | Justificativa | Perguntas em aberto resolvidas |
|---|---|---|
| Usar a API Open-Meteo como fonte de dados meteorológicos, sem chave de API. | Atende à consulta de clima sem exigir credenciais de API para o escopo definido. | Define o provedor; limites, cobertura, condições de uso e atribuição ainda devem ser validados. |
| Considerar a previsão de cinco dias como hoje e os quatro dias seguintes. | Deixa explícito o período coberto pela previsão. | Resolve se o dia atual está incluído; ainda falta definir se a previsão será diária, horária ou ambas. |
| Usar Celsius como unidade de temperatura padrão. | Define um valor inicial consistente para a primeira consulta. | Resolve qual unidade será usada por padrão; a alternância para Fahrenheit continua prevista no escopo. |
| Não oferecer autenticação. | Mantém a consulta meteorológica sem exigir conta ou credenciais do usuário. | Fecha a decisão sobre exigir autenticação no escopo inicial. |
| Não persistir dados no servidor. | Evita armazenar dados de usuários no backend neste escopo. | Descarta persistência e sincronização de dados pelo servidor; ainda falta decidir se cidade e unidade serão mantidas localmente entre visitas. |
| Usar pt-BR como idioma da interface. | Atende ao idioma definido para o público inicial. | Resolve o idioma da interface. |
| Exibir temperaturas mínima e máxima e informações de chuva, vento e umidade nos resultados meteorológicos. | Reúne indicadores úteis para avaliar as condições e planejar atividades. | Define quais informações meteorológicas devem aparecer nos resultados. |
| Usar o fuso horário da cidade consultada para os dias e horários da previsão. | Mantém datas e horários alinhados ao local a que a previsão se refere. | Define o fuso horário aplicável à previsão. |
| Formatar datas, horários e números de acordo com a localidade configurada no dispositivo do usuário. | Apresenta os valores no formato familiar ao usuário. | Define os formatos locais de data, hora e número, mesmo com a interface em pt-BR. |

## Personas (hipóteses)

As personas abaixo são hipóteses para orientar a discovery e precisam ser validadas com usuários reais. As métricas são propostas iniciais, não critérios aprovados.

| Persona | Objetivo principal | Contexto de uso | Métrica de sucesso do ponto de vista da persona |
|---|---|---|---|
| **Marina, a pessoa que decide antes de sair** | Saber se precisa levar guarda-chuva ou mudar a roupa por causa do clima atual. | Principalmente no celular, em consultas rápidas antes de sair de casa. | Encontra a condição atual da cidade certa em até 30 segundos, sem precisar repetir a busca. |
| **Rafael, quem planeja uma viagem** | Consultar a previsão de cinco dias para decidir o que levar e quais atividades planejar. | Geralmente no desktop, antes da viagem; pode voltar ao celular durante o trajeto. | Localiza o destino e entende a previsão dos cinco dias sem confundir datas ou períodos. |
| **Joana, usuária que alterna localidades e unidades** | Consultar o tempo em cidades diferentes e ver a temperatura na unidade que prefere. | No celular ou desktop, em consultas pontuais; pode alternar entre Celsius e Fahrenheit. | Seleciona a cidade correta e entende os valores na unidade desejada, sem conversões ou dúvidas. |
