# HAG RUN v1.0, especificação clínica consolidada para aprovação

**Estado: documento único de requisitos e propostas. Não é protocolo assistencial aprovado, não autoriza alterar o motor clínico e não autoriza uso com pacientes.**

**Escopo desta versão:** consolidar decisões recebidas, propostas ainda em discussão, comportamento observado no código e requisitos verificáveis para uma futura implementação. Quando faltar decisão clínica, a regra fica explicitamente pendente e o comportamento seguro é bloquear a decisão automatizada correspondente, sem inventar um limiar.

## 1. Resumo executivo e vocabulário de decisão

O HAG RUN é proposto como módulo adaptativo do HAG OS para acompanhar uma pessoa desde a triagem até a tentativa de completar 5 km continuamente, com decisão profissional e registro longitudinal. R0–R5 são categorias funcionais provisórias, não diagnóstico, risco cardiovascular ou liberação médica.

A governança proposta pelo responsável é híbrida: após triagem e avaliação completas, o estado VERDE pode seguir para prescrição sem clique médico obrigatório em todos os casos, salvo decisão institucional em contrário; a primeira prescrição que exigir decisão médica recebe uma autorização inicial simples, uma única vez, por cartão com quatro ações. O profissional autoriza o plano e o escopo. Adaptações seguintes só podem ocorrer dentro dos limites previamente aprovados. Intercorrência pode suspender a corrida e solicitar revisão. Alteração além do escopo ou restrição exige nova decisão registrada. Essa política operacional é proposta; a decisão institucional sobre revisão obrigatória de todos os pacientes segue pendente.

Legenda usada ao longo do documento:

- **Consolidado:** orientação conceitual expressamente aceita, sem implicar aprovação dos números.
- **Proposta pendente:** matriz ou regra apresentada para revisão, ainda sem aprovação assistencial.
- **Comportamento atual:** o que `hag_run_engine.js`, interface, store ou migração executam hoje; não é recomendação clínica.
- **Não definido:** não há regra implementada nem parâmetro aprovado. Não preencher por inferência.
- **Gate:** condição que impede automação até existir dado ou decisão autorizada.

### 1.1 Consolidações recebidas

| Tema | Estado consolidado | Limite |
|---|---|---|
| Objetivo | Completar 5 km contínuos em esforço confortável, com segurança e recuperação adequada; sem prazo fixo de 12 semanas. | Conforto, prontidão, protocolo e recuperação não têm critérios quantitativos aprovados. |
| Estrutura funcional | Manter R0–R5 provisoriamente, separada da triagem. | Cortes R4/R5 e entrada final continuam pendentes. |
| Resultados do ciclo | Distinguir progredir, manter, reduzir e encaminhar para revisão profissional. | Limiares e doses de manter/reduzir não aprovados. |
| Frequência | Duas ou três sessões podem ser individualizadas; três é padrão proposto apenas quando compatível. | Frequência concreta e espaçamento finais dependem de avaliação. |
| Dados de carga | Separar capacidade funcional, carga recente tolerada e estágio prescrito. | Janela sugerida de quatro semanas é hipótese da matriz v3, não regra aprovada. |
| Revisão individual | Médico pode ajustar uma prescrição individual sem alterar o protocolo geral; registrar autor, momento, justificativa, versão-base e alterações. | Papéis e interface administrativa ainda precisam ser implementados e validados. |
| Segurança | Quatro ações médicas, liberação com escopo, suspensão da corrida quando apropriado e evento novo pode suspender autorização anterior. | Perguntas, combinações, prazos e condutas finais pendentes de aprovação. |
| Autorização inicial | Modelo híbrido indicado pelo responsável: autorização do primeiro plano quando cabível, adaptação subsequente dentro do escopo. | Exigir clique médico para todo paciente VERDE é decisão de governança pendente. |

## 2. Objetivo, população e limites

### 2.1 Objetivo

Oferecer avaliação funcional, prescrição individualizada de corrida e caminhada, execução guiada, registro de resposta, adaptação baseada em histórico persistido e acompanhamento médico até um objetivo de 5 km contínuos. O plano não usa uma semana de calendário como garantia de avanço nem presume que 30 minutos contínuos correspondam a 5 km.

### 2.2 População-alvo proposta

Pessoas acompanhadas no contexto clínico do HAG OS que desejam iniciar ou organizar corrida recreativa até 5 km, bem como pessoas com experiência que possam necessitar de avaliação ou prescrição individual. R5, voltado a desempenho, está no código atual mas excede o objetivo mínimo de concluir 5 km; sua manutenção no escopo v1 precisa de decisão médica.

Idade mínima/máxima, populações excluídas, gestação, doenças específicas, capacidade cognitiva ou funcional e necessidade de consulta presencial não estão definidas. Não inferir elegibilidade a partir de R0–R5.

### 2.3 Não objetivos

O HAG RUN não diagnostica, não substitui avaliação médica, não concede aptidão geral para exercício, não prescreve tratamento de lesão, não substitui emergência e não garante resultado de prova. Talk test e RPE são medidas subjetivas de intensidade, não triagem de segurança.

## 3. Triagem, estado de segurança e liberação

### 3.1 Estados operacionais propostos

Os estados da matriz de triagem são categorias de fluxo, não diagnósticos:

| Estado | Significado proposto | Ação permitida | Ação bloqueada |
|---|---|---|---|
| VERDE | Sem pendência identificada pela regra aprovada, dentro do escopo aplicável. | Prosseguir para avaliação funcional e, cumpridos os demais gates, considerar plano. | Não significa ausência de doença nem substitui contexto clínico. |
| AMARELO | Informação insuficiente ou revisão necessária. | Resolver apenas a pendência específica com paciente/profissional. | Não gerar prescrição automática até resolução. |
| VERMELHO | Corrida HAG RUN suspensa por condição ou decisão registrada. | Consultar orientação e registrar avaliação/resolução profissional. | Não iniciar ou retomar corrida enquanto suspensão ativa. Não significa proibição automática de toda atividade física. |
| URGÊNCIA | Possível situação urgente ativa. | Interromper exercício e apresentar orientação de atendimento urgente aprovada. | Não retomar nem converter para VERDE por ação simples enquanto o evento urgente estiver ativo. |

### 3.2 Questionário inicial proposto, oito perguntas

Redação e regras permanecem propostas. “Não sei”, omissão ou contradição não equivale a “Não”. A matriz indica respostas candidatas, não implementação aprovada.

| ID | Pergunta proposta ao paciente | Efeito candidato de resposta positiva/insuficiente | Estado decisório atual |
|---|---|---|---|
| Q1 | Você possui alguma doença cardíaca diagnosticada ou restrição médica para realizar exercícios? | Diagnóstico sem decisão atual no escopo: revisar. Restrição incompatível: suspender corrida. Restrição já avaliada e escopo vigente: manter decisão documentada. | Proposta pendente. |
| Q2 | Já apresentou dor no peito, desmaio ou falta de ar desproporcional durante esforço? | Sintoma grave atual pode indicar urgência; evento anterior ainda não resolvido pede suspensão/revisão. | Proposta pendente. |
| Q3 | Apresenta palpitações acompanhadas de tontura, desmaio, dor no peito ou falta de ar? | Evento potencialmente grave atual: fluxo urgente; evento recorrente/anterior sem avaliação: revisão e suspensão conforme decisão. | Proposta pendente. |
| Q4 | Possui diabetes, doença renal, hipertensão ou doença pulmonar relevante? | Diagnóstico isolado não bloqueia automaticamente; considerar estabilidade, sintomas, atividade atual e intensidade pretendida. | Proposta pendente. |
| Q5 | Sente dor ou possui alguma lesão que dificulta caminhar ou correr? | Revisão musculoesquelética; suspensão se prescrita pelo profissional. A resposta não define diagnóstico nem gravidade. | Proposta pendente. |
| Q6 | Apresentou febre, doença aguda ou piora importante da saúde recentemente? | Adiar/revisar conforme condição e orientação; duração de “recentemente” não definida. | Proposta pendente. |
| Q7 | Você utiliza medicamentos regularmente ou teve alguma mudança recente nos seus medicamentos? | Solicitar nomes ou consultar lista autorizada do HAG OS. Paciente não classifica risco farmacológico; profissional ou regra previamente validada avalia relevância. | Redação proposta incorporada; critérios pendentes. |
| Q8 | Algum profissional de saúde orientou você a evitar ou limitar exercícios? | Traduzir a recomendação ao escopo HAG RUN; suspensão ou restrição explícita conforme decisão. | Proposta pendente. |

A matriz não coleta por essas oito perguntas a atividade física atual nem a intensidade pretendida; ambas precisam integrar o contexto clínico antes da prescrição. Não há critério aprovado para combinações, seguimentos, tempo de estabilidade ou retorno.

### 3.3 Liberação médica, quatro ações

Cartão simples para profissional autenticado e autorizado ao paciente:

1. **Liberar:** plano permitido no escopo documentado.
2. **Liberar com restrições:** condições e limites explícitos, com campos suficientes para aplicação pelo motor.
3. **Solicitar avaliação:** manter pendência e não emitir prescrição automática.
4. **Suspender:** interromper a corrida HAG RUN, com justificativa e escopo; restrições mais amplas somente se expressamente registradas.

Cada decisão guarda paciente derivado no servidor, profissional/ator, ação, data/hora, justificativa, escopo, condições, versão de triagem/avaliação revisada, prescrição afetada e eventual prazo de revisão. O paciente não pode acionar essas ações. Um evento urgente ainda ativo não pode ser apagado por simples clique em “Liberar”.

### 3.4 Validade e escopo

A autorização é individual, vinculada ao escopo e às restrições registradas, e não deve ser tratada como autorização permanente ou geral. Mudança de saúde, sintoma novo, lesão, alteração relevante de medicamento ou recomendação clínica pode exigir suspensão/revisão conforme regra aprovada. Não existe prazo universal aprovado de 30, 60 ou 90 dias. Prazo de revisão é configurável pelo profissional, quando clinicamente indicado, sem inventar validade padrão.

## 4. Capacidade, carga tolerada e seleção de estágio

### 4.1 Três variáveis separadas

| Variável | Definição operacional proposta | Não confundir com |
|---|---|---|
| Capacidade funcional | Maior duração contínua de corrida demonstrada em avaliação contextualizada. | Volume total semanal ou segurança clínica. |
| Carga recente tolerada | Sessões, minutos de corrida/caminhada, frequência realizada, maior bloco, esforço, sintomas e recuperação em período documentado. | Um teste contínuo isolado ou classificação funcional. |
| Estágio prescrito | Dose escolhida para desenvolver capacidade, considerando capacidade, carga tolerada, triagem, autorização, disponibilidade e resposta anterior. | Rótulo R0–R5 automaticamente mapeado para dose. |

A matriz v3 sugere observar quatro semanas recentes, mas esse intervalo não está validado. O sistema deve guardar período, origem e qualidade dos dados. Sem histórico, com dados contraditórios ou recuperação desconhecida, a seleção automática é bloqueada até decisão médica/regra aprovada. Maior tempo contínuo não é, sozinho, critério suficiente para prescrever aquele volume repetido por semana.

### 4.2 Campos funcionais atualmente apresentados

O formulário de `hag_run_HAG.html` hoje pergunta tempo contínuo, dias correndo por semana, quilômetros semanais, maior corrida recente, objetivo, pace confortável e RPE nesse pace, modalidade, dias disponíveis, dor atual, lesão ativa/recente e sintomas incomuns; coleta opcionalmente distância, tempo e data de um resultado recente. `hag_run_engine.js` também aceita `experience` e `injuryHistory`, mas eles não aparecem como campos do formulário observado. Essa avaliação não inclui as oito perguntas da matriz de triagem, medicamentos, doenças, atividade física geral, autorização médica ou carga detalhada por sessão nas últimas semanas. Portanto, o formulário atual não satisfaz sozinho os requisitos de seleção e liberação desta especificação.

### 4.3 Classificação funcional provisória

| Nível | Corte funcional atualmente proposto | Interpretação e pendência |
|---|---|---|
| R0 | Menos de 5 min contínuos | Início com corrida muito curta/caminhada é proposta. Carga tolerada decide dose. |
| R1 | De 5 a menos de 15 min | Capacidade intermediária inicial; os intervalos da v2 são candidatos, não aprovados. |
| R2 | De 15 a menos de 30 min | Capacidade para blocos de transição; não autoriza automaticamente os volumes candidatos R2-E/G/J. |
| R3 | 30 min ou mais, sem critério superior | Corte provisório de capacidade. Carga recente e objetivo precisam orientar dose. |
| R4 | Capacidade/histórico compatível com completar 5 km | Conceito aceito como direção; critérios exatos por validar. O código exige corrida longa ≥5 km ou resultado recente de 5–10 km, ≥2 dias de corrida e ≥8 km/semana. |
| R5 | Histórico recente e objetivo de melhorar desempenho em 5 km | Conceito aceito como direção; o código exige objetivo `improve_5k`, resultado recente de 3–10 km nos 90 dias anteriores, ≥3 dias, ≥15 km/semana e corrida longa ≥5 km. Critério, intensidade e necessidade no escopo v1 pendentes. |

A classificação funcional nunca elimina o gate de segurança. Se múltiplos níveis forem atendidos, o código seleciona a ordem R5, R4, R3, R2, R1, R0. Essa prioridade é comportamento atual, não política aprovada. Resultados futuros ou com data inválida não sustentam elegibilidade recente. As faixas de validação de dados do software não são critérios clínicos.

## 5. Prescrição candidata R0–R5

### 5.1 Regras transversais propostas

- Frequência individual de duas ou três sessões, escolhida conforme disponibilidade, histórico e recuperação; três é opção padrão somente se compatível.
- Evitar sessões consecutivas; a proposta anterior usa ao menos um dia sem corrida. O espaçamento mínimo final depende de decisão clínica.
- Aquecimento e desaquecimento de cinco minutos caminhando são favoráveis como padrão operacional inicial, mas ainda não aprovados como dose universal.
- RPE 3–4/10 e talk test confortável são alvos iniciais propostos para corrida leve. Confirmar instrumento, âncora e uso em intervalos. Caminhada RPE 2–3 é proposta das matrizes. Não converter RPE em pace fixo sem dados validados.
- Recuperação entre blocos deve ser explícita. Caminhada pós-último intervalo não é recuperação entre repetições e precisa ser contabilizada corretamente.
- Sem aumento universal de 10%. A decisão compara dose prescrita e realizada, maior bloco, intensidade, sintomas, fadiga, recuperação e motivo da mudança.
- Nenhuma duração de programa fixa. Ciclo pode ser repetido, ajustado, pausado ou estendido segundo regra aprovada.

### 5.2 R0 e R1, matrizes v2/v3 candidatas

Cada linha mostra um estágio candidato de sessão. Valores são **propostas numéricas para decisão médica**, não prescrições aprovadas. Cálculo: duração de corrida = repetições × bloco; caminhada por sessão inclui aquecimento e desaquecimento de 10 min mais recuperação entre repetições, sem recuperação após o último bloco. Total de ciclo pressupõe repetição de sessão idêntica em 2x ou 3x por semana.

#### R0, candidatos A–J

| Estágio | Corrida | Repetições | Recuperação caminhando entre blocos | Corrida/sessão | Caminhada/sessão | Duração total | Corrida/ciclo 2x / 3x |
|---|---:|---:|---:|---:|---:|---:|---:|
| A | 0:30 | 8 | 1:30 × 7 | 4:00 | 20:30 | 24:30 | 8 / 12 min |
| B | 0:40 | 8 | 1:30 × 7 | 5:20 | 20:30 | 25:50 | 10:40 / 16 min |
| C | 0:50 | 8 | 1:30 × 7 | 6:40 | 20:30 | 27:10 | 13:20 / 20 min |
| D | 1:00 | 8 | 1:30 × 7 | 8:00 | 20:30 | 28:30 | 16 / 24 min |
| E | 1:15 | 7 | 1:30 × 6 | 8:45 | 19:00 | 27:45 | 17:30 / 26:15 min |
| F | 1:30 | 6 | 1:30 × 5 | 9:00 | 17:30 | 26:30 | 18 / 27 min |
| G | 2:00 | 5 | 1:30 × 4 | 10:00 | 16:00 | 26:00 | 20 / 30 min |
| H | 2:30 | 4 | 1:30 × 3 | 10:00 | 14:30 | 24:30 | 20 / 30 min |
| I | 3:30 | 3 | 1:30 × 2 | 10:30 | 13:00 | 23:30 | 21 / 31:30 min |
| J | 5:00 | 2 | 1:30 × 1 | 10:00 | 11:30 | 21:30 | 20 / 30 min |

#### R1, candidatos A–K

| Estágio | Corrida | Repetições | Recuperação caminhando entre blocos | Corrida/sessão | Caminhada/sessão | Duração total | Corrida/ciclo 2x / 3x |
|---|---:|---:|---:|---:|---:|---:|---:|
| A | 2:00 | 6 | 1:30 × 5 | 12:00 | 17:30 | 29:30 | 24 / 36 min |
| B | 2:30 | 6 | 1:30 × 5 | 15:00 | 17:30 | 32:30 | 30 / 45 min |
| C | 2:45 | 6 | 1:30 × 5 | 16:30 | 17:30 | 34:00 | 33 / 49:30 min |
| D | 3:00 | 6 | 1:30 × 5 | 18:00 | 17:30 | 35:30 | 36 / 54 min |
| E | 3:45 | 5 | 1:30 × 4 | 18:45 | 16:00 | 34:45 | 37:30 / 56:15 min |
| F | 4:00 | 5 | 1:30 × 4 | 20:00 | 16:00 | 36:00 | 40 / 60 min |
| G | 5:00 | 4 | 1:30 × 3 | 20:00 | 14:30 | 34:30 | 40 / 60 min |
| H | 5:30 | 4 | 1:30 × 3 | 22:00 | 14:30 | 36:30 | 44 / 66 min |
| I | 6:00 | 4 | 1:30 × 3 | 24:00 | 14:30 | 38:30 | 48 / 72 min |
| J | 8:00 | 3 | 1:30 × 2 | 24:00 | 13:00 | 37:00 | 48 / 72 min |
| K | 10:00 | 2 | 1:30 × 1 | 20:00 | 11:30 | 31:30 | 40 / 60 min |

R0 e R1 têm capacidade demonstrada distinta, mas a proposta v2 usa sequências candidatas separadas; o motor atual não as distingue e aplica `BEGINNER_STAGES` idêntica aos dois níveis. Confirmar as sequências, entradas, repetições e transições antes de codificar. A ponte R0→R1 da v2 utiliza em cada ciclo duas sessões intervaladas de 2×5 min, com 1:30 de caminhada entre blocos, e uma sessão de 5 min contínuos: corrida total 15 min no ciclo 2x, 25 min no 3x; redução planejada de 5 min ante R0-J. Exige capacidade contínua demonstrada de cinco minutos; a dose e a justificativa são pendentes.

**Ponte R1→R2 candidata:** duas sessões usam 2×10 min com 1:30 caminhando entre blocos e uma sessão usa 15 min contínuos. No ciclo 2x: 35 min de corrida, com sessões totais estimadas em 31:30 e 25:00. No ciclo 3x: 55 min de corrida, com sessões 31:30, 31:30 e 25:00. A redução é de 5 min ante R1-K repetido (40 min em 2x; 60 min em 3x), enquanto o maior bloco contínuo passa a 15 min. Não reiniciar automaticamente em R2-A quando isso reduzir a carga recente sem justificativa. Todos esses valores e a interpretação de ponte funcional seguem pendentes.

### 5.3 R2, candidatos intervalados e entrada

| Estágio candidato | Blocos | Corrida/sessão | Recuperação | Duração total/sessão | Corrida/ciclo 2x / 3x |
|---|---|---:|---|---:|---:|
| A | 2×5 min | 10 min | 2 min entre blocos | 22 min | 20 / 30 min |
| B | 2×6 min | 12 min | 2 min | 24 min | 24 / 36 min |
| C | 2×7 min | 14 min | 2 min | 26 min | 28 / 42 min |
| D | 2×8 min | 16 min | 2 min | 28 min | 32 / 48 min |
| E | 2×9 min | 18 min | 2 min | 30 min | 36 / 54 min |
| F | 2×10 min | 20 min | 2 min | 32 min | 40 / 60 min |
| G | 2×11 min | 22 min | 2 min | 34 min | 44 / 66 min |
| H | 2×12 min | 24 min | 2 min | 36 min | 48 / 72 min |
| I | 2×13 min | 26 min | 2 min | 38 min | 52 / 78 min |
| J | 2×14 min | 28 min | 2 min | 40 min | 56 / 84 min |
| K | 2×15 min | 30 min | 2 min | 42 min | 60 / 90 min |

Cálculo inclui aquecimento e desaquecimento caminhando de cinco minutos e um intervalo de dois minutos entre os blocos. Os candidatos de entrada da v3 são 15–19 min contínuos → R2-E, 20–24 → R2-G e 25–29 → R2-J, mas não são mapeamentos automáticos. Cada candidato pede, respectivamente, 18, 22 ou 28 minutos de corrida por sessão. A escolha precisa considerar carga recente e recuperação. A janela de quatro semanas é hipótese; sem histórico suficiente, não selecionar automaticamente.

### 5.4 R2 até corrida contínua, dois modelos em aberto

A matriz v3 prefere refinar o Modelo B, sem afirmar superioridade clínica. Nenhum modelo foi escolhido. Ambos pressupõem tolerância documentada a R2-K, recuperação adequada e bloco contínuo demonstrado de 15 min; se não demonstrado, a entrada precisa de etapa individual ainda não tabelada.

| Etapa | Bloco contínuo | Modelo A, corrida total por sessão/ciclo 2x/3x | Modelo B, corrida total ciclo 2x/3x |
|---|---:|---:|---:|
| T1 | 15 min | 30 min/sessão; 60/90 min/ciclo | 45/75 min/ciclo |
| T2 | 17 min | 30; 60/90 | 47/77 |
| T3 | 19 min | 30; 60/90 | 49/79 |
| T4 | 21 min | 30; 60/90 | 51/81 |
| T5 | 23 min | 30; 60/90 | 53/83 |
| T6 | 25 min | 30; 60/90 | 55/85 |
| T7 | 27 min | 30; 60/90 | 57/87 |
| T8 | 29 min | 30; 60/90 | 59/89 |
| T9 | 30 min contínuos | 30; 60/90 | 60/90 |

**Modelo A:** cada sessão mistura o bloco contínuo e um bloco complementar intervalado, com recuperação proposta de 1:30; o bloco complementar reduz para manter 30 min totais de corrida. Sessões mistas estimadas em 41:30, final contínua em 40:00, incluindo aquecimento/desaquecimento. A dose e sequência do bloco restante precisam de aprovação. Modelo preserva volume de corrida por sessão, não necessariamente a tolerabilidade.

**Modelo B:** a cada ciclo 2x há uma sessão intervalada de referência R2-K e uma contínua; em 3x são duas sessões intervaladas e uma contínua. A etapa inicial reduz 15 min por ciclo em relação a R2-K; os totais sobem conforme a tabela. Sessão intervalada 42:00; contínua de 25:00 a 40:00, com aquecimento/desaquecimento. A redução inicial é hipótese experimental, não regra clínica estabelecida.

Os totais são minutos de corrida, não distância nem carga fisiológica completa. O teste de 5 km não é sinônimo de correr 30 min. Velocidade, distância, terreno e recuperação podem modificar a interpretação.

**Atualização temporal do código atual:** R0/R1 usam 12 entradas indexadas por semana; R2 tem oito estágios e repete o oitavo nas semanas 9–12; R3–R5 calculam dose em função da semana até limites próprios. Esse calendário conflita com a orientação de não impor prazo fixo e não é progressão aprovada. Em R2, o código também reduz um ciclo de repetição na última sessão da semana, diferente das sessões equivalentes da matriz v2. A implementação futura deve seguir decisão médica por ciclo, não essa diferença de código.

### 5.5 R3–R5, comportamento atual como proposta de revisão, não protocolo

Não há matriz clínica aprovada R3–R5. Para evitar inventar novas doses, os valores abaixo reproduzem as fórmulas que hoje existem no motor e devem ser tratados apenas como material para revisão ou substituição médica.

| Nível no código atual | Regra de sessão do código (sem aprovação clínica) | Lacuna para v1 |
|---|---|---|
| R3 | `base = clamp(floor(maxContinuousMinutes × 0,7), 18, 35)`. `gain = floor((semana−1)/2) × 3`. Sessões base de `min(base + gain, 40)` min; última sessão planejada recebe mais 5 min, limitada a 40. Duas ou três sessões conforme seleção de dias. | Sem janela de carga recente na fórmula; avanço por semana de calendário; não adapta a dose à resposta do ciclo; usuário R3 pode receber sessões superiores à capacidade declarada por fórmula; limite 40 não foi validado. |
| R4 | Sessão intermediária: intervalos 4×3 min com 2 min caminhando; aumenta uma repetição a cada três semanas. Demais sessões usam corrida leve de `min(35, 25 + floor((semana−1)/2))` min, e última sessão `min(45, 30 + semana)` min. | Categoria de entrada é definida por corrida longa ≥5 km ou prova recente 5–10 km, ≥2 dias e ≥8 km/semana. Dose não compara carga detalhada, nem verifica recuperação antes da semana seguinte. |
| R5 | Uma sessão de 5×3 min corrida/2 min caminhada, RPE-alvo 7; demais sessões leves de 30 min e longa `min(50, 35 + semana)` min. Ritmo de trabalho estima 5 km por fórmula de Riegel 1,06 a partir de prova recente de 3–10 km até 90 dias; fallback para pace habitual. | Categoria exige objetivo melhorar 5 km, prova elegível, ≥3 dias e ≥15 km/semana, corrida longa ≥5 km. Intensidade RPE 7 e volume/desempenho não validados. O programa v1 orientado à conclusão pode excluir R5 ou mantê-lo como trilha distinta, decisão pendente. |

Para R3–R5, a futura proposta deve declarar por sessão duração, blocos, recuperação, frequência 2x/3x, intensidade e critérios para transição. Até isso ser aprovado, são gates clínicos; o motor não deve ganhar novas regras derivadas desta tabela.

### 5.6 Ritmo e velocidade

O código atual valida pace entre 2:00 e 30:00 min/km, converte `km/h = 3600 / segundos por km`, arredonda a velocidade a 0,01 km/h e converte inversamente com `segundos por km = round(3600 / km/h)`. Para corrida leve, usa pace habitual e soma 30 s/km se RPE habitual >4, limitado a 30:00 min/km. Caso não haja pace, nenhuma velocidade é exibida. O resultado R5 pode usar previsão de Riegel; o pace estimado é uma extrapolação, não prescrição validada.

A especificação futura deve preferir orientação subjetiva de esforço/talk test conforme decisão médica, usar ritmo apenas se dados e contexto o justificarem e não exigir pace de pacientes iniciantes. Velocidade de esteira deriva do pace exibido; não é recomendação independente. Regras de arredondamento do produto não devem mudar o tempo total das sessões.

## 6. Progressão, manutenção, redução e revisão

### 6.1 Decisão por ciclo

O ciclo individual deve comparar carga prescrita com carga realizada. Registrar cada sessão como concluída, parcial, interrompida por vontade, interrompida por sintoma ou não realizada, com motivo. Considerar minutos e blocos corridos/caminhados, maior intervalo contínuo, frequência prescrita versus realizada, RPE/talk test, dor e sintomas, fadiga, recuperação entre estímulos, disponibilidade e mudança clínica.

| Resultado | Condição mínima conceitual | Saída necessária |
|---|---|---|
| Progredir | Resposta suficiente e aceitável ao ciclo inteiro segundo critérios que serão aprovados. | Nova dose individual com motivo/estágio, sem depender só da semana do calendário. |
| Manter | Dados ou resposta apontam repetição apropriada, sem motivo para progressão ou redução clínica. | Repetir dose vigente ou especificar ajuste de disponibilidade; motivo auditado. |
| Reduzir | Baixa tolerância/recuperação conforme causa e regra aprovada. | Dose concreta: blocos, repetições, frequência ou etapa alterada, com próxima reavaliação definida pelo profissional/regra. |
| Revisão profissional | Sintoma, evento, dado insuficiente ou condição fora do escopo. | Suspender ação automatizada relevante, encaminhar pendência específica e registrar decisão. |

Os quatro estados são arquitetura conceitual consolidada. Critérios quantitativos e dose de redução não estão aprovados. Não classificar automaticamente falta por indisponibilidade como baixa tolerância; não classificar redução planejada de volume como regressão sem considerar motivo.

### 6.2 Critérios de progressão em discussão

A proposta pós-v3 exige duas execuções consecutivas toleradas no comportamento atual, mas não foi aprovada como regra clínica. A especificação pretendida usa o ciclo completo e os dados prescritos. O motor atual considera tolerada uma sessão concluída com dor zero, RPE ≤6, fadiga <8 e recuperação `good`; exige a execução imediatamente anterior também tolerada. São limiares implementados, não critérios clínicos aprovados. Ainda estão pendentes: quantidade/proporção de dose realizada, leitura de sessão parcial, RPE alvo e tolerância, recuperação, janela, dados faltantes e regra de frequência.

A matriz v1 registrou como candidatos “2 de 3 sessões”, ≥80% dos blocos, RPE de corrida ≤4, recuperação habitual e ausência de alerta; a redução foi associada a RPE ≥6 em pelo menos duas sessões, recuperação insuficiente ou sessões incompletas repetidas. Esses cortes não têm aprovação e não devem ser combinados com os limiares do motor. A matriz v2 abandonou teto percentual universal e reforçou comparação de carga absoluta, resposta e recuperação. As v1/v2 permanecem como histórico de deliberação, não regras vigentes.

### 6.3 Manutenção e redução concreta

Uma sessão não realizada por agenda é diferente de interrupção por fadiga ou sintoma. Recuperação insuficiente pode adiar sessão e impedir progressão; a duração desse adiamento não está definida. “Reduzir” não pode ser apenas mensagem: a dose e critério de retorno precisam ser escolhidos por médico ou regra clínica aprovada. Não aplicar redução percentual fixa nem aumento universal de 10%.

### 6.4 Razão da mudança

Categorias semânticas candidatas: continuidade funcional planejada; manutenção/repetição; recuperação insuficiente; baixa tolerância/esforço; ajuste clínico individual; alteração de disponibilidade; sintoma/lesão; retorno pós-interrupção. Nomes, exclusividade e consequências são pendentes. Cada prescrição individual ajustada deve versionar dose anterior/nova, autor, data/hora, justificativa breve e versão geral usada; não sobrescrever protocolo nem histórico.

## 7. Check-ins, treino guiado e registro

### 7.1 Fluxo do paciente

1. **Primeiro acesso pelo link pessoal:** validar autorização no servidor; nenhum ID de URL autoriza acesso sozinho.
2. **Triagem:** responder perguntas e seguimentos; mostrar estado e instruções compreensíveis. Resposta ausente/“não sei” não vira negativa.
3. **Avaliação funcional:** informar capacidade contínua, atividade e carga recente, dias disponíveis, objetivo, modalidade e dados de esforço; manter cada dimensão separada.
4. **Prescrição autorizada:** apresentar nível funcional, estágio, sessões, duração total, corrida/caminhada, intensidade/RPE, pace/velocidade se aplicável, recuperação e motivo. Mostrar quem autorizou ou quais regras autorizadas geraram a dose.
5. **Check-in pré-sessão:** três perguntas candidatas sobre condição/sintoma, dor ou lesão e recuperação/fadiga. O formulário não repete a triagem sem evento novo; seguimentos específicos estão pendentes.
6. **Treino guiado:** instrução segmentada de aquecimento, corrida, caminhada de recuperação e desaquecimento; controles pausar, encerrar voluntariamente e interromper por sintoma. Áudio/vibração não é requisito decidido.
7. **Registro pós-treino:** status, tempo decorrido, distância, RPE, dificuldade, dor/sintomas, fadiga e recuperação. Distinguir prescrito de realizado. Registrar falha de conexão e permitir sincronização idempotente.
8. **Retorno e histórico:** carregar contexto e prescrição atual do servidor, última sessão e histórico; retomar no ponto correto, apresentar evolução e semana/estágio vigente. “Semana” deve ser derivada do estágio/ciclo autorizado, não contar calendário automaticamente.

### 7.2 Interrupção e resposta

O código hoje recomenda revisão para sintoma preocupante, nova lesão ou dor ≥4/10; recomenda manter para dor positiva abaixo desse limiar; reduzir para fadiga ≥8, recuperação `poor` ou RPE ≥9; manter para dificuldade `hard`, RPE ≥8 ou recuperação `partial`; e, se não concluída, repetir. Isso conflita em prioridade se dor e sessão incompleta coexistem? A implementação prioriza sintomas/dor alta, depois lesão, depois incompleta, depois qualquer dor, depois fadiga/recuperação. O algoritmo é atual e não aprovado.

No produto, “interromper por sintoma” deve salvar sessão parcial e abrir seguimento. Sintoma de possível urgência encerra treino, impede retomada e apresenta orientação aprovada. Dor musculoesquelética sem urgência deve seguir regra clínica específica; não diagnosticar nem reduzir automaticamente como resposta universal. Mensagens e limiares permanecem pendentes.

### 7.3 Registro mínimo de execução

O store já envia: `completed`, `duration_seconds`, `distance_km`, `rpe`, `difficulty`, `pain`, `fatigue`, `recovery`, `concerning_symptoms`, `injury_during_run`, `session_id`, `prescription_id`, `client_event_id`, versão do motor, semana e pace calculado em detalhes. A futura estrutura deve preservar isso e adicionar de forma aditiva os dados ainda necessários: status/motivo parcial, segmentos realizados/tempos por etapa, check-in pré-treino, origem da prescrição, frequência/dose planejadas, evento clínico, resposta pós-sessão e vínculo à versão individual vigente. Não apagar nem reinterpretar campos existentes.

## 8. Retorno após interrupções e conclusão

### 8.1 Retorno

Interrupções por falta, viagem, doença, lesão, dor ou indisponibilidade devem ter motivo distinguido. Não há regra aprovada de duração que exige reiniciar ou reavaliar. Ao retornar, carregar a última prescrição, última execução, capacidade documentada, carga recente disponível, triagem/liberação e estado de recuperação. Se autorização expirou conforme prazo individual, houver sintoma novo, evento ativo, dados insuficientes ou situação fora do escopo, bloquear progressão e solicitar a decisão correspondente. Perda de condicionamento não pode ser inferida apenas por número de dias sem atividade sem decisão médica.

### 8.2 Critério de conclusão de 5 km

Objetivo conceitual: completar 5 km continuamente, em intensidade confortável, sem sinal de alerta e com recuperação adequada. Não equivale a 30 minutos contínuos, pois velocidade varia. O aplicativo deve distinguir tentativa, conclusão medida, distância/tempo, esforço, sintomas e recuperação. Critério de prontidão, instrumento/distância, método GPS/manual, tolerância de erro, condições de teste, necessidade de confirmação profissional e recuperação pós-teste não estão definidos. Até decisão, não declarar objetivo clínico concluído automaticamente pelo tempo estimado.

## 9. Painel médico e ajuste individual

### 9.1 Visão necessária

- Identidade do paciente resolvida pelo vínculo autorizado no servidor, sem confiar em ID do navegador.
- Estado atual de segurança, motivo, data, evento aberto e escopo da liberação.
- Respostas de triagem e pendências, medicações informadas/consultadas e mudanças.
- Capacidade funcional e evolução do maior bloco contínuo.
- Carga prescrita versus realizada por sessão/ciclo e frequência efetivamente prescrita.
- Adesão contextualizada, sessões ausentes/parciais/interrompidas e motivo.
- RPE, dificuldade, pace/distância quando válidos, dor, sintomas, fadiga e recuperação.
- Estágio/semana funcional vigente e histórico de decisões/progressões.
- Alertas e ação recomendada sem apresentar uma proposta como diagnóstico.
- Histórico imutável das prescrições e versões, autor, horário e motivo.

### 9.2 Ajuste individual

Ação profissional simples com criação de nova versão individual ligada à matriz/engine version. Campos conceituais: paciente; prescrição-base; versão anterior; valores ajustados; motivo/categoria; justificativa; autoria autenticada; timestamp; escopo/validade; decisão e restrições; estado de aprovação. Mudança individual não altera matriz geral. Deve existir trilha append-only ou histórico equivalente; estratégia final de schema e papéis precisa de revisão técnica. Alteração fora do escopo autorizado requer nova decisão clínica.

## 10. Arquitetura técnica, privacidade e dados

### 10.1 Identidade paciente e Supabase existente

A integração atual usa links pessoais do HAG Treino: tokens aleatórios de 24 bytes, validados no servidor no vínculo `treino_acessos` e revogáveis, sem expiração automática previamente confirmada. O navegador envia token portador apenas às RPCs; não envia `patient_id` como autoridade. O banco deriva o paciente depois de validar token. URL/token isolado não substitui validação server-side; token é credencial secreta e deve ser removido de logs/analytics.

### 10.2 Componentes e regras atuais

- `hag_run_store.js`: wrapper de RPC com chave publicável, valida forma do token e recusa chave service_role no navegador; `load`, `saveAssessment`, `saveExecution`.
- `supabase/migrations/202610270001_hag_run.sql`: tabelas de programa, prescrição e execução com `patient_id`; constraints compostas para isolamento; RLS habilitada/forçada; acesso direto API revogado; funções internas de implementação e RPCs públicas de contexto, avaliação e execução validam token no servidor. Funções publicadas são SECURITY INVOKER, implementação privada SECURITY DEFINER conforme migração e search_path restrito; grants mínimos para anon nas RPCs gateway.
- A migração é aditiva e foi testada em Supabase local segundo relatório de homologação. Não executar em produção nesta tarefa.
- Reutilizar esquema e token atual; adicionar tabelas versionadas de liberação/evento/check-in/ajuste só após revisar schema real e compatibilidade. Nunca usar service_role no frontend nem desabilitar RLS.

### 10.3 Modelo de dados lógico

| Entidade | Conteúdo e vínculo lógico | Regra de preservação |
|---|---|---|
| Triagem/avaliação | respostas versionadas, atividade, capacidade, histórico de carga, disponibilidade, sintomas e data. | Nova versão; manter avaliação anterior. |
| Estado/evento segurança | estado, origem, início, resolução, escopo e relação com triagem/liberação. | Evento novo não apaga liberação anterior; calcula estado efetivo. |
| Liberação | decisão, médico, justificativa, escopo, restrições, validade/revisão opcional. | Versionada e revogável; médico associado ao paciente no servidor. |
| Programa | slug, objetivo, seleção, perfil funcional e estado de progressão. | Um vínculo por paciente/programa conforme schema atual. |
| Prescrição | versão do motor, plano JSON, fingerprint, stage/ciclo e autoria/motivo se ajuste. | Prescrições anteriores preservadas; idempotência por fingerprint existente. |
| Execução | dose prescrita e realizada, segmentação, RPE, dor, sintomas, fadiga, recuperação e status. | Vínculos compostos com paciente; idempotência por `client_event_id`. |
| Decisão de ciclo/progressão | evidências, regra/versão, resultado e motivo. | Gerada no servidor; não confiar em recomendação do navegador. |
| Auditoria de ajuste | valor anterior/novo, usuário, horário e justificativa. | Append-only para eventos assistenciais; acesso restrito. |

### 10.4 Autorização, RLS e idempotência

Todas leituras/gravações de paciente passam por RPC autenticada por token validado no servidor. RPC deriva paciente; rejeita token inválido, expirado ou revogado; não aceita ID como prova. RLS segue habilitada e forçada. Restrições/foreign keys compostas mantêm `patient_id` consistente em referências. Dados profissionais usam autenticação HAG OS existente e autorização por vínculo de equipe/paciente, a ser explicitamente implementada e testada; o identificador enviado pelo cliente não prova autorização. Não expor token em console, URL referer, analytics ou relatórios.

Idempotência usa `client_event_id` único por paciente e lock transacional/constraint, retornando resultado existente na repetição da mesma submissão. Mesma sessão em nova tentativa de sync não duplica execução; uma nova execução legítima deve ter novo evento vinculado a sessão/prescrição. Política para dupla conclusão independente da mesma sessão precisa ser definida. Concorrência deve ser validada em PostgreSQL real isolado.

## 11. Matriz de decisão executável

Os identificadores `CASE-*` são contratos de teste propostos; não indicam que já existam testes automatizados com esse nome. “Bloqueada” significa sem ação automatizada até aprovação clínica da regra, não um diagnóstico.

### 11.1 Entrada, segurança e seleção

| ID / condição | Dados obrigatórios | Regra executável pretendida | Estado | Permitido | Bloqueado | Médico? | Auditoria | Caso de teste |
|---|---|---|---|---|---|---|---|---|
| DEC-01, link pessoal válido | token; vínculo ativo | Servidor valida token e deriva paciente do vínculo. | autorizado no escopo de link | ler/gravar próprio contexto | usar patient_id do navegador; acesso cruzado | revisão de equipe conforme papel | token hash/id de acesso, resultado, hora; nunca token em claro no log | CASE-AUTH-01 |
| DEC-02, token inválido/revogado/expirado | token e estado no servidor | Rejeitar sem revelar dados; token expirado depende de política de expiração a implementar no vínculo atual. | negado | solicitar link novo | carregar ou gravar | não, salvo suporte | evento de acesso negado sem credencial | CASE-AUTH-02/03 |
| DEC-03, triagem incompleta/“não sei” | respostas e versão | Não converter em “não”; pendência direcionada. | AMARELO candidato | resolver resposta | prescrever automaticamente | sim para liberar conforme política | resposta, campo, resolução e autor | CASE-TRI-01 |
| DEC-04, evento urgente ativo | evento/estado e data | interromper e manter bloqueio conforme conduta aprovada. | URGÊNCIA candidata | mostrar instrução aprovada e contato | iniciar/retomar; clique simples para verde | revisão necessária | evento, mensagem/versão, resolução | CASE-TRI-02 |
| DEC-05, limitação/dor/lesão sem urgência | função, sintomas, evolução | diferenciar limitação musculoesquelética de segurança sistêmica; sem limiar aprovado, revisão direcionada. | AMARELO ou VERMELHO candidato | registrar e revisar | inferir causa ou reduzir universalmente | conforme decisão | dados, escopo e ação | CASE-TRI-03 |
| DEC-06, triagem VERDE candidata | oito respostas completas, contexto de atividade/intensidade, autorização aplicável | Permite avaliação funcional; prescrição depende de carga, estágio e política inicial aprovada. | VERDE candidato | avaliar | tratar verde como liberação geral | governança decide se todos exigem clique inicial | versão da triagem e decisão | CASE-TRI-04 |
| DEC-07, primeira prescrição | avaliação, carga recente, autorização/escopo | Médico autoriza plano inicial quando a política/estado exigir; restrições incorporadas. | aguardando/autorizada | emitir dentro do escopo | exceder limite | sim no modelo híbrido quando necessário | ator, versão, justificativa, escopo | CASE-RX-01 |
| DEC-08, selecionar R0–R5 | capacidade, carga recente, sintomas, frequência e disponibilidade | Classificar capacidade separada; estágio depende das outras dimensões. Sem histórico suficiente, não mapear automaticamente. | candidato / revisão | propor estágio | inferir dose só pelo nível | sim se dado insuficiente ou fora de regra | evidências e versão | CASE-ENTRY-01 a 06 |
| DEC-09, entrada R2 E/G/J | contínuo demonstrado; carga por sessão/ciclo, frequência, recuperação | E/G/J são candidatos. Verificar minutos pedidos (18/22/28 por sessão) contra carga tolerada; sem critério aprovado, revisão. | pendente | simular e comparar | entrada automática pelo maior contínuo | sim até regra aprovada | capacidade, carga e motivo | CASE-R2-ENTRY-01 |
| DEC-10, capacidade vs carga | teste contínuo e histórico de corrida | Nunca tratar bloco máximo como volume semanal tolerado. | válido somente se variáveis separadas | definir ambos | somar ou substituir uma pela outra | se conflito/dado ausente | fonte e intervalo observado | CASE-LOAD-01 |

### 11.2 Sessão, ciclo, retorno e conclusão

| ID / condição | Dados obrigatórios | Regra executável pretendida | Estado | Permitido | Bloqueado | Médico? | Auditoria | Caso de teste |
|---|---|---|---|---|---|---|---|---|
| DEC-11, check-in pré-treino sem mudança | condição/sintomas, dor/lesão, recuperação | Usar perguntas curtas propostas; regras finais pendentes. | liberar sessão/adiar/revisar | iniciar dentro da prescrição vigente | progredir pela resposta prévia sozinha | conforme resultado | respostas e versão | CASE-CHECKIN-01 |
| DEC-12, execução normal | segmentos planejados e clock | Cronômetro deve somar aquecimento + blocos + recuperações + desaquecimento exatamente; pausa não aumenta tempo ativo sem regra definida. | em execução | pausar/retomar/encerrar | transição com tempo perdido | não | tempos planejado/real | CASE-TIMER-01 |
| DEC-13, sessão parcial/falta | status e motivo; dose planejada/real | Distinguir disponibilidade, esforço, sintoma e falha técnica; ciclo compara com prescrito. | parcial/não realizada | registrar e replanejar | chamar automaticamente de baixa adesão clínica | pode ser necessária conforme sintoma | motivo, segmentos e dose | CASE-EXEC-01/02 |
| DEC-14, dor ou sintoma novo | relato, início, escala aprovada, repercussão | A regra atual de 4/10 não é aprovada; interromper/encaminhar segundo regra médica futura. | pendente de regra | salvar parcial e alerta | retomar/progredir automaticamente | sim conforme classificação aprovada | evento e sequência de ações | CASE-SYMPTOM-01/02 |
| DEC-15, recuperação insuficiente | recuperação, fadiga, esforço e intervalo | Não progredir; atraso/redução concreta dependem de regra clínica ainda pendente. | manter/adiar/reduzir candidato | adiar e reavaliar | avançar pelo calendário | revisão se persistente/associada a sintoma conforme regra | medições e dose resultante | CASE-RECOVERY-01 |
| DEC-16, fechar ciclo | frequência prescrita, dose prescrita/real, blocos, RPE, sintomas e recuperação | Avaliar ciclo inteiro, não frequência padrão nem apenas duas sessões arbitrárias. Limiar não definido. | progredir/manter/reduzir/revisão | decisão da regra aprovada | avanço automático por semana | sim se dado insuficiente/fora de escopo | evidências, algoritmo e resultado | CASE-CYCLE-01 |
| DEC-17, adaptação automática | nova prescrição e escopo autorizado | Permitir só dentro dos limites autorizados na primeira prescrição. Fora deles exige nova ação médica. | autorizada / reavaliação | adaptar dentro do envelope | alterar frequência/intensidade/volume além do escopo | sim fora do escopo | versão-base, delta e motivo | CASE-SCOPE-01 |
| DEC-18, ajuste médico individual | profissional autenticado, paciente associado, motivo, valores e versão anterior | Criar versão individual; não alterar matriz global; registrar autoria/tempo/motivo. | nova versão vigente | ajuste permitido por papel | sobrescrita silenciosa ou alteração por paciente | sim | trilha append-only | CASE-AUDIT-01 |
| DEC-19, retorno após ausência | motivo, duração, última carga, sintomas e liberação vigente | Sem corte aprovado de dias; reavaliar com dados disponíveis e estado de segurança; fora do escopo vai ao médico. | retorno candidato/revisão | recuperar histórico e reavaliar | reiniciar ou avançar por regra temporal inventada | conforme causa | intervalo, avaliação e decisão | CASE-RETURN-01 a 04 |
| DEC-20, concluir 5 km | distância contínua medida, tempo, intensidade, sintomas e recuperação | 5 km contínuos é alvo; 30 min não prova distância. Prontidão/protocolo não aprovados. | tentativa/concluído pendente | registrar resultado | declarar sucesso por semana ou minutos | decisão clínica conforme regra final | método, distância, tempo, versão | CASE-5K-01 |

## 12. Testes clínicos sintéticos e critérios de homologação

### 12.1 Perfis e cenários obrigatórios

Somente fixtures fictícias, sem dados de pacientes reais:

- Adulto sedentário sem relato de sintomas: validar caminho R0 candidato, frequência individual e bloqueio quando histórico/dados requeridos estiverem ausentes.
- Corredor experiente com resultado recente e objetivo de desempenho: validar R4/R5 candidato, idade do resultado, pace e limites sem supor aprovação de RPE/intensidade.
- Sessões parciais, voluntariamente interrompidas e faltas por agenda: persistir separadamente; nunca duplicar retry.
- Recuperação insuficiente/fadiga: impedir progressão e comprovar dose de retorno somente após regra aprovada.
- Dor musculoesquelética em repouso/durante/depois, dor progressiva e sintoma potencialmente grave: sem usar limiar não aprovado como decisão clínica; estados e mensagem são validados pelo médico.
- R2 em entrada E/G/J, perfil próximo a limites, carga recente menor que volume candidato e capacidade maior que carga tolerada.
- Retorno após viagem, doença, lesão e inatividade, em cenários sintéticos; não inferir “reset” por calendário.
- R3/R4/R5 em duas e três sessões, com datas disponíveis diferentes, somas de duração e progressão sob histórico.
- Duração do cronômetro com aquecimento, cada bloco, recuperações, pausa, encerramento e desaquecimento; comparar exatamente com a prescrição.
- 30 minutos contínuos com distância inferior/superior a 5 km para comprovar que conclusão não é inferida pelo tempo.

### 12.2 Homologação técnica e clínica

A homologação técnica local registrada em `docs/HAG_RUN_HOMOLOGACAO.md` informa 48 testes Node aprovados, testes PostgreSQL 17 temporário, stack Supabase local, chamadas concorrentes e emulação Playwright 320 px/iPhone 13/768 px. Esses resultados são histórico de homologação reportado em 27/10/2026, não execução desta especificação nem aprovação clínica. A interface ainda não foi validada em aparelho físico nem via link sintético no host HAG Treino, segundo o mesmo relatório.

Antes de implantação, requerer: decisões clínicas assinadas/versionadas; testes unitários para cada regra aprovada; PostgreSQL e Supabase isolados para RLS/RPC/concorrência/persistência; teste de autorização servidor com tokens sintéticos válidos, expirados e revogados; testes UI móveis com acessibilidade e fluxo offline/retorno; revisão de privacidade; ambiente homologado HAG OS; revisão clínica final. Migração de produção, publicação ou uso assistencial exigem autorização separada.

## 13. Plano de implementação após aprovação

### 13.1 Reutilizar

`hag_run_engine.js` para funções determinísticas depois de substituir regras não aprovadas; `hag_run_store.js` como gateway RPC sem ID de paciente; `hag_run_HAG.html` para interface responsiva; migration atual como base aditiva; tabelas/RPCs de programa, prescrição, execução e contexto; `client_event_id`, fingerprint, locks e vínculo composto atuais; testes Node, PostgreSQL, Supabase local e Playwright existentes.

### 13.2 Criar ou ampliar

1. Modelo versionado de triagem, eventos e autorização clínica.
2. Tabelas de check-in e estado de ciclo, se esquema atual não acomodar dados sem sobrescrever.
3. Prescrição individual versionada, trilha de ajustes e envelope aprovado de adaptação automática.
4. RPCs server-side para decisão de ciclo, ajuste profissional, evento/retorno e leitura do histórico, sempre derivando patient_id do token/identidade profissional autorizada.
5. Painel profissional HAG OS para estado, carga, evolução, alertas e quatro ações.
6. Interface paciente com fluxo de triagem, prescrição autorizada, timer, pós-sessão e histórico.
7. Migrações estritamente aditivas, constraints, índices, RLS habilitada/forçada, grants mínimos e políticas por papel; revisar compatibilidade e backfill sem tocar registros existentes.

### 13.3 Autenticação e autorização

Paciente: link secreto aleatório existente, validação server-side, revogação e expiração explícita a definir; token não dá acesso a outras pessoas nem transmite autoridade por ID URL. Profissional: autenticação HAG OS existente, autorização por função e vínculo profissional-paciente conferidos no servidor. Service role somente em ambiente server-side estritamente necessário, nunca browser; preferir RPC invoker/gateway mínimo e funções privilegiadas restritas. Não relaxar RLS para resolver integração.

### 13.4 Critérios de aceite

- Decisões clínicas aprovadas têm ID/versão, texto inequívoco, limites, saída e testes correspondentes.
- Nenhum parâmetro pendente participa da prescrição automatizada.
- Triagem e capacidade são independentes; dado desconhecido não vira negativo.
- Capacidade, carga tolerada e dose prescrita ficam em campos distintos.
- 2x e 3x são avaliados contra plano individual, não frequência fixa.
- Sessão incompleta, sintoma, dor e recuperação seguem rotas aprovadas e persistem sem duplicação.
- Histórico restaura prescrição atual, semana/estágio e execução anterior após fechar/reabrir.
- Adaptação fica dentro do envelope; ajuste médico gera nova versão auditável.
- RLS/RPC impedem acesso e gravação cruzados; URL alterada não troca paciente.
- Cronômetro fecha com soma de segmentos e resultado não presume 5 km a partir de 30 min.
- Testes automatizados, PostgreSQL real isolado e UI móvel passam; teste de produção não é necessário nem permitido para homologação.

## 14. Referências e interpretação

As matrizes anteriores citam ACSM para triagem pré-participação e CDC para talk test; fontes oficiais brasileiras para sinais de alerta e SAMU. Essas referências sustentam princípios gerais ali indicados, não os tempos, cortes R0–R5, frequência, RPE, dor, percentuais, estágios ou algoritmo de progressão HAG. NHS Couch-to-5K e recomendações gerais de corrida também não validam diretamente o desenho HAG.

- Riebe et al. Atualização das recomendações de triagem ACSM, 2015: https://journals.lww.com/acsm-msse/fulltext/2015/11000/updating_acsm_s_recommendations_for_exercise.28.aspx
- CDC, medir intensidade e talk test: https://www.cdc.gov/physicalactivity/basics/measuring/index.html
- Ministério da Saúde, infarto: https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/i/infarto
- Ministério da Saúde, SAMU 192: https://www.gov.br/saude/pt-br/composicao/saes/samu-192
- NHS, lesões relacionadas à corrida: https://www.nhs.uk/live-well/exercise/knee-pain-and-other-running-injuries/

## 15. Registro de origem e rastreabilidade

| Fonte | Conteúdo incorporado | Autoridade nesta consolidação |
|---|---|---|
| `HAG_RUN_ESPECIFICACAO_CLINICA_v1.md` | objetivo, separação de segurança/nível, gates de aceite e pendências | Base de requisitos, preservada e expandida |
| `HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v1_R0-R2.md` | primeira hipótese R0–R2 e referências | Histórico, substituído como fonte de navegação pela comparação consolidada; não descartado |
| `HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v2_R0-R2.md` | frequências 2x/3x, sessões R0/R1/R2, pontes | Valores reproduzidos como candidatos, ainda pendentes |
| `HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v3_R0-R2.md` | capacidade/carga/estágio, entrada condicionada, modelos A/B, razões | Refinamento mais recente, preferências não são aprovação |
| `HAG_RUN_DECISAO_CLINICA_POS_V3.md` | parecer, agenda e limites | Fonte de decisão mais recente antes desta consolidação |
| `HAG_RUN_MATRIZ_TRIAGEM_SEGURANCA_LIBERACAO_PROPOSTA_v1.md` | oito perguntas, estados, quatro ações, escopo da suspensão e check-in | Proposta de segurança; regras e parâmetros seguem pendentes |
| `HAG_RUN_AUDITORIA_CLINICA.md` | comportamento anterior do motor e lacunas | Auditoria histórica; divergências anotadas acima devem ser rechecadas antes de codificar |
| `HAG_RUN_HOMOLOGACAO.md` | resultados técnicos locais e pendências | Evidência técnica reportada, não homologação clínica |
| `hag_run_engine.js` | classificação, sessões, pace e recomendação atuais | Descrição de código, não aprovação médica |
| `hag_run_store.js` e `supabase/migrations/202610270001_hag_run.sql` | RPC, token, persistência, RLS e idempotência | Base técnica atual, não migração autorizada para produção |
| `tests/*.test.js`, `tests/ui/*` | contratos e verificações automatizadas existentes | Casos existentes; `CASE-*` deste documento ainda precisam mapear para testes reais |

### 15.1 Pontos de origem no código

| Arquivo/função | Regra ou responsabilidade descrita |
|---|---|
| `hag_run_engine.js::normalizeProfile` | validação dos campos funcionais, resultados, objetivo, modalidade, dor e sintomas. |
| `hag_run_engine.js::classifyRunner` | prioridade e critérios de classificação R0–R5; flags atuais de revisão/cautela. |
| `hag_run_engine.js::paceToKmh`, `kmhToPace`, `formatPace` | conversão, arredondamento e apresentação de pace/velocidade. |
| `hag_run_engine.js::makeIntervals`, `makeSession`, `generate5kWeek` | intervalos, soma temporal, frequência/dias, sessões R0–R5 e fórmula temporal atual. |
| `hag_run_engine.js::recommendNext` | prioridade atual de revisão, repetição, redução, manutenção e progressão. |
| `hag_run_engine.js::buildRunRecord` | validação e cálculo de pace da execução registrada. |
| `hag_run_store.js::createRunStore` | chamadas `hag_run_patient_context`, `hag_run_patient_save_assessment` e `hag_run_patient_save_execution`; o navegador não envia patient_id. |
| `hag_run_HAG.html::buildProfile`, `restore`, manipuladores de sessão e gravação | formulário, restauração do contexto, cronômetro e fluxo observado; consultar arquivo para nomes exatos em cada revisão. |
| `supabase/migrations/202610270001_hag_run.sql::hag_run_private.patient_context_impl` | valida token e carrega contexto/histórico derivando paciente no banco. |
| `...::patient_save_assessment_impl`, `...::patient_save_execution_impl` | persistência, fingerprint/idempotência, lock e recomendação do lado do servidor. |

As denominações de funções acima são rastreabilidade do comportamento vigente. Se o código mudar, a revisão deve confirmar linhas/funções atuais antes de converter esta especificação em implementação.

## 16. Quadro único de decisões médicas pendentes

Este é o quadro consolidado para revisão conjunta. “Recomendação” orienta debate; não é aprovação nem implementação. Alternativas são preservadas quando existem decisões anteriores.

| ID | Decisão pendente | Recomendação para avaliação | Alternativas/impacto a decidir | Prioridade |
|---|---|---|---|---|
| MED-01 | População elegível, exclusões e necessidade de avaliação presencial | Definir população e contexto HAG antes de qualquer prescrição | Definir escopo restrito a adultos; incluir grupos mediante fluxo específico; excluir grupos até evidência | Bloqueadora |
| MED-02 | Questionário final, seguimentos, estados e prioridade entre respostas | Aprovar Q1–Q8 revisadas, dados de atividade/intensidade e regra de desconhecido como pendência | Alterar perguntas/combinações; adicionar avaliação dirigida | Bloqueadora |
| MED-03 | Situações URGÊNCIA, mensagem e orientação brasileira | Validar sinais, texto, interrupção e rota de atendimento | Mensagem geral aprovada; regras diferenciadas por sinal | Bloqueadora |
| MED-04 | Governança da primeira liberação | Adotar modelo híbrido proposto: primeiro plano revisto quando necessário e adaptação autorizada no envelope | Exigir autorização médica inicial para todos; VERDE seguir sem clique individual conforme política institucional | Bloqueadora de governança |
| MED-05 | Escopo, validade, revisão e revogação da autorização | Escopo específico e validade definida individualmente, sem prazo universal | Prazo institucional definido; revisão por evento; ambos combinados | Bloqueadora |
| MED-06 | Restrições e suspensão de corrida versus atividade física geral | VERMELHO suspende corrida HAG RUN; restrição ampla precisa ser explícita | Permitir alternativas somente com decisão profissional documentada | Bloqueadora |
| MED-07 | Critérios funcionais R0–R3 e método de demonstrar capacidade | Manter cortes provisórios de 5, 15 e 30 min apenas para classificar; confirmar repetibilidade/condição de teste | Outros cortes; classificação sem teste formal | Alta |
| MED-08 | Critérios finais R4/R5 e necessidade de R5 no produto 5 km | Separar capacidade para completar 5 km de objetivo de desempenho; validar carga e prova recente | R5 fora da v1; trilha avançada independente; manter com critérios revisados | Alta |
| MED-09 | Janela e métricas de carga recente | Avaliar a janela candidata de quatro semanas, incluindo minutos, frequência, maior bloco, esforço, sintomas e recuperação | Outra janela; histórico não disponível gera avaliação profissional | Bloqueadora para seleção automática |
| MED-10 | Doses candidatas de R0/R1 e intervalos | Revisar todas as linhas R0-A–J/R1-A–K, aquecimento, recuperação e distinção R0/R1 | Aprovar com ajustes; criar estágios intermediários; substituir matriz | Bloqueadora |
| MED-11 | Pontes R0→R1 e R1→R2 | Registrar continuidade funcional como motivo distinto de regressão e comparar ciclo 2x/3x | Manter reduções candidatas de 5 min; recalibrar doses; fluxo individual alternativo | Alta |
| MED-12 | Entrada R2 e candidatos E/G/J | Não mapear só por maior contínuo; condicionar a carga recente e recuperação | Aprovar E/G/J com gate; mudar candidato; abandonar mapeamento | Bloqueadora |
| MED-13 | Modelo de transição R2 até contínuo | Refinar Modelo B preferido sem afirmar superioridade; comparar adequação da redução de 15 min por 2x/3x com Modelo A | Escolher A, B, modelo diferente por frequência ou nenhum | Bloqueadora |
| MED-14 | Incrementos e resposta entre estágios R2 | Avaliar incremento candidato de 2 min e repetição/ajuste individual | Usar incremento diferente; adaptar sem incremento fixo; etapa abaixo de 15 min | Bloqueadora |
| MED-15 | Prescrições R3–R5 | Substituir/ratificar as fórmulas do motor com matriz por sessão e frequência, sem avanço por calendário | Nova matriz; R5 fora da v1; trilhas distintas por objetivo | Bloqueadora |
| MED-16 | Frequência individual, espaçamento e recuperação | Permitir 2x/3x conforme pessoa e contabilizar exatamente sessões prescritas | Manter ao menos um dia sem corrida; espaçamento individual com gate de recuperação | Alta |
| MED-17 | Intensidade/RPE/talk test, pace e esteira | Usar alvo leve subjetivo como candidato; pace/velocidade só quando medidos e contextualizados | Definir escalas e faixa; não usar pace em iniciantes; protocolo específico de desempenho | Alta |
| MED-18 | Progressão no fechamento do ciclo | Considerar dose prescrita versus realizada, maior bloco, esforço, sintomas e recuperação; dados insuficientes não avançam | Aprovar dois eventos tolerados; critérios por frequência; outra combinação | Bloqueadora |
| MED-19 | Manter e reduzir, com dose concreta | Definir ação por causa, reavaliação e limite do envelope automático | Repetir estágio; reduzir blocos/repetições/frequência; retorno a etapa anterior; decisão individual | Bloqueadora |
| MED-20 | Dor, sintomas, fadiga e recuperação | Não manter limiar de dor 4/10/RPE/fadiga do código sem validação; separar alerta de limitação musculoesquelética | Escalas/limiares e comportamento por evento aprovados pelo médico | Bloqueadora |
| MED-21 | Sessão parcial, falta, pausa e adesão | Classificar status/motivo e avaliar contra prescrição individual sem penalizar indisponibilidade automaticamente | Limiares de ciclo; tratamento distinto por motivo | Alta |
| MED-22 | Retorno após viagem, doença, lesão ou inatividade | Definir reavaliação por causa, estado clínico e histórico; não reiniciar por prazo arbitrário | Retorno por estágio anterior; novo teste funcional; revisão profissional | Bloqueadora |
| MED-23 | Check-in pré/pós e sintomas durante execução | Aprovar perguntas breves, seguimentos e prioridade de interrupção | Três perguntas da proposta; conjunto ajustado; regra por evento | Bloqueadora |
| MED-24 | Prontidão e protocolo de 5 km | Definir distância contínua, método de medição, esforço, sintomas, recuperação e confirmação | Conclusão autorrelatada; medição GPS/manual; confirmação clínica | Bloqueadora |
| MED-25 | Conteúdo clínico da adaptação automática | Delimitar envelope autorizado, eventos que suspendem, restrições e nova aprovação fora do escopo | Proibir adaptação clínica automática; autorizar somente alterações de baixa consequência previamente limitadas | Bloqueadora de governança |
| MED-26 | Ajuste individual versionado | Confirmar papéis, campos, assinatura/auditoria e invalidadores | Apenas médico; equipe clínica com permissão definida; justificativa estruturada ou texto curto | Alta |

## 17. Registro de aprovação

| Item | Decisão | Responsável | Data | Versão/escopo |
|---|---|---|---|---|
| Estrutura conceitual R0–R5, segurança separada | Favorável provisoriamente, conforme decisões registradas | Responsável médico |  | Não aprova números |
| Matriz R0–R2 v3 | Estrutura favorável, alterações obrigatórias ainda em discussão | Responsável médico |  | Proposta comparativa |
| Triagem e liberação | Arquitetura favorável, regras clínicas pendentes | Responsável médico |  | Proposta v1 |
| Modelo híbrido de autorização | Recomendação recebida; decisão institucional inicial ainda pendente | Responsável médico/gestor |  | Sem implementação |
| Parâmetros numéricos e protocolo assistencial | Pendente |  |  | Não liberar a pacientes |
| Revisão desta especificação integral | Pendente |  |  | Aprovar, rejeitar ou solicitar ajustes por ID MED-* |

**Conclusão de prontidão:** requisitos consolidados para revisão única; não há aprovação clínica integral. Implementação clínica permanece bloqueada até que os itens bloqueadores do quadro MED-* sejam decididos e registrados. Nenhuma regra clínica foi alterada neste trabalho.
