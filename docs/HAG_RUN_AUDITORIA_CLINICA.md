# HAG RUN, auditoria clínica do motor de prescrição

**Documento para revisão do responsável médico.** Não constitui aprovação clínica nem recomendação assistencial.

- Branch auditada: `codex/hag-run-discovery`
- Commit auditado: `1628ed30b4f8adbd2bddb2965b8b092ef81b2b8e`
- Motor: `hag_run_engine.js`, versão `hag-run-engine/0.1.0`
- Escopo: regras efetivamente executadas pela interface, motor e RPC de gravação. Não foram alteradas regras de prescrição.
- As simulações são sintéticas. “Volume estimado” nas tabelas é cálculo desta auditoria, não campo calculado ou exibido pelo motor.

## Como revisar e decidir

Para cada item marcado **Decisão médica**, registrar: **Aprovar**, **Rejeitar** ou **Solicitar modificação**, com justificativa. Este relatório descreve comportamento de software; não presume que os limiares sejam clinicamente adequados.

## 1. Avaliação inicial e relação entre respostas e plano

Na tela [hag_run_HAG.html](../hag_run_HAG.html#L15), o formulário pergunta:

| Pergunta visível | Dado encaminhado ao motor | Efeito efetivamente implementado |
|---|---|---|
| Quanto tempo corre sem parar, em minutos? | `maxContinuousMinutes` | Critério de classificação R0–R3 e parte da R4/R5; determina minutos de corrida de R3. Faixa de entrada 0–300. |
| Dias correndo por semana | `runningDaysPerWeek` | Classificação R4/R5; limita quantidade prescrita. Inteiro de 0–7. |
| Distância semanal, km | `weeklyKm` | Classificação R4/R5. Faixa de 0–300. |
| Maior corrida recente, km | `longestRunKm` | Classificação R4/R5. Faixa de 0–60. |
| Objetivo | `goal` | “Completar 5 km” (`5k`) ou “Melhorar meu tempo nos 5 km” (`improve_5k`). R5 exige o segundo; a geração 5 km aceita somente esses dois. |
| Pace confortável, segundos/km, se souber | `habitualPaceSecondsPerKm` | Opcional. Dá pace para segmentos de corrida e estimativa de km. Faixa 120–1800 s/km. |
| Esforço nesse pace, 0–10 | `paceRpe` | Opcional. Se >4, adiciona 30 s/km ao pace confortável usado nos segmentos leves. Não altera os demais alvos. |
| Resultado recente: distância, tempo, data | `recentResults` | Opcional; o formulário exige os três campos juntos. Pode sustentar R4/R5 e determinar pace-alvo de R5. A elegibilidade usa data nos 90 dias anteriores. |
| Onde costuma correr? | `modality` | Rua/parque (`road`), pista (`track`) ou esteira (`treadmill`). Só na esteira é incluída velocidade calculada. |
| Dias disponíveis | `availableDays` | Restringe e ordena os dias programados. Seleção sem espaço suficiente pode impedir geração. |
| Dor agora, 0–10 | `currentPain` | 1–3 gera cautela sem bloquear plano; ≥4 requer revisão e não gera sessões. Inteiro 0–10. |
| Lesão ativa ou recente? | `activeInjury` e `recentInjury` | A mesma caixa define ambos como verdadeiro; qualquer um impede plano automático e exige revisão. |
| Sintomas incomuns, com exemplos de dor no peito, tontura ou falta de ar fora do esperado? | `concerningSymptoms` | Resposta afirmativa impede plano automático e exige revisão. É uma pergunta genérica sim/não, sem detalhamento. |

O formulário **não pergunta** idade, doença cardiovascular ou metabólica conhecida, medicação, fatores de risco, experiência objetiva, lesões anteriores já resolvidas, frequência cardíaca, peso ou sexo. `experience` recebe o literal `self_reported`, e `injuryHistory` fica vazio; esses valores não são respostas clínicas. Não existe pergunta de aptidão médica ou exame clínico implementado. Não inferir que campos ausentes equivalem a respostas negativas.

O resultado recente na interface aceita distância 3–10 km e texto informa 90 dias. O motor valida o pace de qualquer resultado recebido entre 2 e 30 min/km, mas uma data inválida, futura ou antiga fica fora da evidência temporal. Um resultado inválido de pace é rejeitado mesmo quando não seria usado para classificar.

## 2. Classificação funcional R0–R5

Origem: `normalizeProfile()` e `classifyRunner()` em [hag_run_engine.js](../hag_run_engine.js#L39). A ordem é decisiva: R5, depois R4, R3, R2, R1 e R0.

| Nível | Regra de entrada exata no código |
|---|---|
| R5 | Objetivo `improve_5k`; pelo menos um resultado datado nos 90 dias anteriores, distância de 3–10 km e pace validado; ≥3 dias correndo/semana; ≥15 km/semana; corrida mais longa ≥5 km. |
| R4 | Não classificado R5 e (`longestRunKm ≥5` **ou** resultado recente datado de 5–10 km), além de ≥2 dias/semana e ≥8 km/semana. O resultado de 5–10 km não exige objetivo de melhorar tempo. |
| R3 | Não R5/R4 e capacidade contínua ≥30 min. |
| R2 | Não acima e capacidade contínua ≥15 min. |
| R1 | Não acima e capacidade contínua ≥5 min. |
| R0 | Capacidade contínua <5 min. |

As variáveis de volume/frequência e corrida mais longa não distinguem R0–R3, salvo quando atendem à regra R4/R5. Um resultado recente de prova não classifica sozinho em R4 sem cumprir volume/frequência, exceto que estes são explicitamente parte da regra. **R0 e R1 recebem a mesma tabela de intervalos e mesma frequência-alvo.**

**Decisões médicas:** aprovar os limites e a precedência; decidir se R0/R1 devem partilhar protocolo; confirmar a regra R4 com uso de qualquer resultado recente 5–10 km e os mínimos de frequência/volume.

## 3. Ritmo, velocidade e intensidade codificados

Origem: `paceToKmh()`, `kmhToPace()`, `segment()`, `generate5kWeek()` em [hag_run_engine.js](../hag_run_engine.js#L21).

- Pace é aceito de 120 a 1800 segundos por quilômetro. Conversão para km/h é `3600 / pace`, arredondada a 2 casas no objeto; a interface exibe uma casa decimal. Conversão inversa para pace arredonda ao segundo.
- Pace confortável é opcional. O pace leve é o pace informado, acrescido de 30 s/km somente quando `paceRpe >4`; o resultado é limitado a 1800 s/km. Sem pace informado, segmentos de corrida não exibem pace nem velocidade.
- R5 escolhe o resultado qualificável mais recente e calcula `tempo5k = tempoResultado × (5 / distânciaResultado)^1,06`; o pace é `tempo5k / 5`. Se a estimativa ficar fora de 120–1800 s/km, usa o pace confortável informado; se este faltar, não há pace-alvo. O segmento de trabalho R5 recebe RPE 7. O texto da tela pede ritmo controlado e sugere reduzir se a pessoa não conseguir falar frases curtas; essa instrução não altera o cálculo.
- Corrida leve e intervalos R0–R4: alvo RPE 3. Corrida dos intervalos R5: RPE 7. Aquecimento, caminhada de recuperação e desaquecimento: RPE 2.
- A classificação e os treinos não usam zonas de frequência cardíaca, idade, limiares medidos ou calibragem fisiológica. RPE do pace só muda o pace leve, não a classificação nem o volume/duração.
- Não há pace/velocidade definidos para as caminhadas. Sem pace informado, não há estimativa de distância da corrida.

**Decisões médicas:** aprovar o uso e os limites de pace; validar a extrapolação Riegel e RPE 7 em R5; decidir como comunicar ou lidar com estimativa de pace de prova sem validação individual além do RPE.

## 4. Construção das sessões

Origem: `BEGINNER_STAGES`, `R2_STAGES`, `chooseSpacedDays()`, `makeIntervals()`, `generate5kWeek()` em [hag_run_engine.js](../hag_run_engine.js#L145).

Todas as sessões contínuas e intervaladas incluem 5 minutos de caminhada para aquecer e 5 minutos de caminhada para volta à calma, cada um com RPE 2. As durações totais incluem esses 10 minutos. Não há mobilidade, exercícios educativos ou outro aquecimento/desaquecimento implementados.

`makeIntervals()` adiciona a caminhada de recuperação **depois de cada repetição, inclusive depois da última**. Isto aumenta a sessão pelo ciclo completo de caminhada final. A auditoria preserva exatamente essa regra; requer decisão clínica explícita.

Frequência desejada: 2 sessões para R0/R1; 3 para R2–R5. O limite efetivo é `min(frequência desejada, runningDaysPerWeek)` quando a resposta é >0. Se `runningDaysPerWeek=0`, o fallback é 2 em R0/R1 e 1 nos demais. O programa escolhe até esse limite entre os dias disponíveis e exige diferença circular de pelo menos 2 dias entre corridas, mantendo pelo menos um dia sem corrida. Com poucos dias disponíveis, pode gerar menos sessões que o desejado.

O objeto contém duração em segundos e `durationMinutes = ceil(segundos / 60)`. A interface mostra minutos inteiros arredondados para cima.

### Prescrição da primeira semana para os seis pacientes fictícios

Todos são inteiramente fictícios, sem dor, lesão ou sintomas, disponíveis segunda/quarta/sábado, pace confortável 6:00 min/km, RPE nesse pace 4, objetivo 5 km, modalidade rua, exceto o Fictício 5, que usa esteira. Nos R0/R1 o pace é deliberadamente informado para possibilitar uma estimativa didática de distância; na interface real ele é opcional. Semana 1, data de avaliação 27/10/2026.

| Paciente | Dados funcionais | Classe e justificativa | Frequência e sessões da semana 1 |
|---|---|---|---|
| Fictício 0 | Contínuo 0 min; 0 km/sem; 0 dias; maior 0 km | **R0**, contínuo <5 min e sem regra superior aplicável | 2: seg e qua, iguais; cada sessão 28 min exibidos, 27:30 exatos. |
| Fictício 1 | Contínuo 10 min; 3 km/sem; 2 dias; maior 1,5 km | **R1**, entre 5 e <15 min; não satisfaz R4 | 2: seg e qua, iguais; cada sessão 28 min exibidos, 27:30 exatos. |
| Fictício 2 | Contínuo 20 min; 8 km/sem; 3 dias; maior 2,5 km | **R2**, ≥15 e <30 min; não satisfaz R4 | 3: seg/qua 35 min; sáb 30 min. |
| Fictício 3 | Contínuo 35 min; 12 km/sem; 3 dias; maior 4 km | **R3**, ≥30 min; não satisfaz R4 | 3: seg/qua 34 min; sáb 39 min. |
| Fictício 4 | Contínuo 40 min; 10 km/sem; 3 dias; maior 5,5 km | **R4**, maior corrida ≥5 km, ≥2 dias e ≥8 km/sem; objetivo completar 5 km | 3: seg 35 min; qua intervalos 30 min; sáb corrida longa 41 min. |
| Fictício 5 | Contínuo 45 min; 20 km/sem; 3 dias; maior 8 km; resultado fictício 5 km em 25:00 em 20/10/2026; objetivo melhorar 5 km; esteira | **R5**, resultado de 5 km há 7 dias, ≥3 dias, ≥15 km/sem e maior ≥5 km | 3: seg corrida leve 40 min; qua intervalos R5 35 min; sáb corrida longa 46 min. |

### Segmentos completos da semana 1

Os dias e sequências abaixo são exatamente os objetos de segmentos gerados; “RPE” é alvo do código.

**Fictícios 0 e 1, segunda e quarta, cada sessão:**

| Ordem | Segmento | Duração | RPE | Pace/velocidade |
|---:|---|---:|---:|---|
| 1 | Caminhada de aquecimento | 5:00 | 2 | Não prescrito |
| 2–15 | 7 ciclos: corrida 1:00, seguida de caminhada 1:30, inclusive após a sétima corrida | Corrida RPE 3; caminhada RPE 2 | 3 / 2 | Corrida 6:00 min/km; caminhada sem pace |
| 16 | Caminhada de volta à calma | 5:00 | 2 | Não prescrito |

Duração exata 27:30, 7:00 de corrida e 20:30 de caminhada total. O aplicativo mostra 28 minutos. Pace de corrida informado 6:00 min/km; se essa modalidade fosse esteira, o objeto conteria 10,00 km/h e a interface exibiria 10,0 km/h.

**Fictício 2, segunda e quarta:**

| Ordem | Segmento | Duração | RPE | Pace/velocidade |
|---:|---|---:|---:|---|
| 1 | Caminhada de aquecimento | 5:00 | 2 | Não prescrito |
| 2–11 | 5 ciclos: corrida 3:00, seguida de caminhada 2:00, inclusive após a quinta corrida | Corrida 3; caminhada 2 | Corrida 6:00 min/km; caminhada sem pace |
| 12 | Caminhada de volta à calma | 5:00 | 2 | Não prescrito |

35:00 por sessão, 15:00 corrida, 20:00 caminhada. **Sábado:** aquecimento 5:00; 4 ciclos de corrida 3:00 + caminhada 2:00 (a quarta caminhada também é prescrita); desaquecimento 5:00. Total 30:00, sendo 12:00 corrida e 18:00 caminhada.

**Fictício 3, segunda e quarta:** aquecimento 5:00 RPE 2; corrida contínua 24:00 RPE 3 a 6:00 min/km; desaquecimento 5:00 RPE 2. Total 34:00. **Sábado:** caminhada 5:00; corrida contínua 29:00 RPE 3 a 6:00 min/km; caminhada 5:00. Total 39:00.

**Fictício 4, segunda:** caminhada 5:00 RPE 2; corrida contínua 25:00 RPE 3 a 6:00 min/km; caminhada 5:00 RPE 2. Total 35:00. **Quarta:** aquecimento 5:00; 4 ciclos de corrida 3:00 RPE 3 + caminhada 2:00 RPE 2, incluindo a caminhada final; desaquecimento 5:00. Total 30:00. **Sábado:** caminhada 5:00; corrida 31:00 RPE 3; caminhada 5:00. Total 41:00.

**Fictício 5, segunda:** caminhada 5:00 RPE 2; corrida contínua 30:00 RPE 3 a 6:00 min/km / 10,0 km/h; caminhada 5:00. Total 40:00. **Quarta:** caminhada 5:00 RPE 2; 5 ciclos de corrida 3:00 RPE 7 a 5:00 min/km / 12,0 km/h, cada um seguido de caminhada 2:00 RPE 2, inclusive ao final; caminhada 5:00 RPE 2. Total 35:00. O teste de 5 km em 25:00 resulta em previsão algorítmica 25:00 para 5 km. **Sábado:** caminhada 5:00; corrida contínua 36:00 RPE 3 a 6:00 min/km / 10,0 km/h; caminhada 5:00. Total 46:00.

Em qualquer nível, se o paciente não informar pace confortável, os segmentos de corrida não têm pace ou velocidade. Se mudar para esteira, apenas segmentos de corrida com pace exibem km/h; caminhadas continuam sem velocidade.

## 5. Matriz das 12 semanas

Origem: tabelas de estágios e funções de geração citadas acima. Cada célula de sessões lista a duração que a interface exibe, em minutos arredondados para cima, na ordem dos dias. Corrida e caminhada indicam somas semanais, em minutos, incluindo aquecimento/desaquecimento na caminhada. O **km estimado** é apenas distância dos segmentos `run`, calculada como tempo de corrida / pace. Exclui distância caminhando e não é previsão de resultado ou meta clínica. Foi calculado com os dados sintéticos desta auditoria: pace confortável 6:00 min/km, RPE do pace 4; para R5, teste 5 km em 25:00 e pace-alvo calculado 5:00 min/km. Sem pace, o motor não permite calcular esses km. O motor não exibe um resumo semanal de volume.

### R0 e R1

São apresentadas linhas para cada nível, apesar de a tabela de prescrição ser idêntica.

| Nível | Semana | Sessões (min) | Corrida (min) | Caminhada total (min) | km corrida estimados | Intensidade de corrida | Critério de semana seguinte |
|---|---:|---|---:|---:|---:|---|---|
| R0 | 1 | 27:30 × 2 (exibição 28 × 2) | 14 | 41 | 2,33 | RPE 3 | Duas últimas execuções consecutivas toleradas e concluídas; política de resposta §6. |
| R0 | 2 | Igual à sem. 1 | 14 | 41 | 2,33 | RPE 3 | Igual |
| R0 | 3 | 31 × 2 | 21 | 41 | 3,50 | RPE 3 | Igual |
| R0 | 4 | Igual à sem. 3 | 21 | 41 | 3,50 | RPE 3 | Igual |
| R0 | 5 | 34 × 2 | 24 | 44 | 4,00 | RPE 3 | Igual |
| R0 | 6 | Igual à sem. 5 | 24 | 44 | 4,00 | RPE 3 | Igual |
| R0 | 7 | 35 × 2 | 30 | 40 | 5,00 | RPE 3 | Igual |
| R0 | 8 | Igual à sem. 7 | 30 | 40 | 5,00 | RPE 3 | Igual |
| R0 | 9 | 34 × 2 | 32 | 36 | 5,33 | RPE 3 | Igual |
| R0 | 10 | Igual à sem. 9 | 32 | 36 | 5,33 | RPE 3 | Igual |
| R0 | 11 | 34 × 2 | 36 | 32 | 6,00 | RPE 3 | Igual |
| R0 | 12 | 34 × 2 | 40 | 28 | 6,67 | RPE 3 | Igual; semana limitada em 12. |
| R1 | 1 | 27:30 × 2 (exibição 28 × 2) | 14 | 41 | 2,33 | RPE 3 | Duas últimas execuções consecutivas toleradas e concluídas; política de resposta §6. |
| R1 | 2 | Igual à sem. 1 | 14 | 41 | 2,33 | RPE 3 | Igual |
| R1 | 3 | 31 × 2 | 21 | 41 | 3,50 | RPE 3 | Igual |
| R1 | 4 | Igual à sem. 3 | 21 | 41 | 3,50 | RPE 3 | Igual |
| R1 | 5 | 34 × 2 | 24 | 44 | 4,00 | RPE 3 | Igual |
| R1 | 6 | Igual à sem. 5 | 24 | 44 | 4,00 | RPE 3 | Igual |
| R1 | 7 | 35 × 2 | 30 | 40 | 5,00 | RPE 3 | Igual |
| R1 | 8 | Igual à sem. 7 | 30 | 40 | 5,00 | RPE 3 | Igual |
| R1 | 9 | 34 × 2 | 32 | 36 | 5,33 | RPE 3 | Igual |
| R1 | 10 | Igual à sem. 9 | 32 | 36 | 5,33 | RPE 3 | Igual |
| R1 | 11 | 34 × 2 | 36 | 32 | 6,00 | RPE 3 | Igual |
| R1 | 12 | 34 × 2 | 40 | 28 | 6,67 | RPE 3 | Igual; semana limitada em 12. |

### R2

| Nível | Semana | Sessões (min) | Corrida (min) | Caminhada total (min) | km corrida estimados | Intensidade de corrida | Critério de semana seguinte |
|---|---:|---|---:|---:|---:|---|---|
| R2 | 1 | 35, 35, 30 | 42 | 58 | 7,00 | RPE 3 | §6 |
| R2 | 2 | 35, 35, 30 | 42 | 58 | 7,00 | RPE 3 | §6 |
| R2 | 3 | 34, 34, 28 | 44 | 52 | 7,33 | RPE 3 | §6 |
| R2 | 4 | 35, 35, 30 | 42 | 58 | 7,00 | RPE 3 | §6 |
| R2 | 5 | 31, 31, 24 | 40 | 46 | 6,67 | RPE 3 | §6 |
| R2 | 6 | 31, 31, 24 | 40 | 46 | 6,67 | RPE 3 | §6 |
| R2 | 7 | 34, 34, 22 | 50 | 40 | 8,33 | RPE 3 | §6 |
| R2 | 8 | 27, 27, 27 | 45 | 36 | 7,50 | RPE 3 | §6 |
| R2 | 9 | 27, 27, 27 | 45 | 36 | 7,50 | RPE 3 | §6; repete estágio 8. |
| R2 | 10 | 27, 27, 27 | 45 | 36 | 7,50 | RPE 3 | §6; repete estágio 8. |
| R2 | 11 | 27, 27, 27 | 45 | 36 | 7,50 | RPE 3 | §6; repete estágio 8. |
| R2 | 12 | 27, 27, 27 | 45 | 36 | 7,50 | RPE 3 | §6; repete estágio 8, semana limitada em 12. |

### R3

| Nível | Semana | Sessões (min) | Corrida (min) | Caminhada total (min) | km corrida estimados | Intensidade de corrida | Critério de semana seguinte |
|---|---:|---|---:|---:|---:|---|---|
| R3 | 1 | 34, 34, 39 | 77 | 30 | 12,83 | RPE 3 | §6 |
| R3 | 2 | 34, 34, 39 | 77 | 30 | 12,83 | RPE 3 | §6 |
| R3 | 3 | 37, 37, 42 | 86 | 30 | 14,33 | RPE 3 | §6 |
| R3 | 4 | 37, 37, 42 | 86 | 30 | 14,33 | RPE 3 | §6 |
| R3 | 5 | 40, 40, 45 | 95 | 30 | 15,83 | RPE 3 | §6 |
| R3 | 6 | 40, 40, 45 | 95 | 30 | 15,83 | RPE 3 | §6 |
| R3 | 7 | 43, 43, 48 | 104 | 30 | 17,33 | RPE 3 | §6 |
| R3 | 8 | 43, 43, 48 | 104 | 30 | 17,33 | RPE 3 | §6 |
| R3 | 9 | 46, 46, 50 | 112 | 30 | 18,67 | RPE 3 | §6 |
| R3 | 10 | 46, 46, 50 | 112 | 30 | 18,67 | RPE 3 | §6 |
| R3 | 11 | 49, 49, 50 | 118 | 30 | 19,67 | RPE 3 | §6 |
| R3 | 12 | 49, 49, 50 | 118 | 30 | 19,67 | RPE 3 | §6; semana limitada em 12. |

### R4

| Nível | Semana | Sessões (min) | Corrida (min) | Caminhada total (min) | km corrida estimados | Intensidade de corrida | Critério de semana seguinte |
|---|---:|---|---:|---:|---:|---:|---|
| R4 | 1 | 35, 30, 41 | 68 | 38 | 11,33 | RPE 3 | §6 |
| R4 | 2 | 35, 30, 42 | 69 | 38 | 11,50 | RPE 3 | §6 |
| R4 | 3 | 36, 30, 43 | 71 | 38 | 11,83 | RPE 3 | §6 |
| R4 | 4 | 36, 35, 44 | 75 | 40 | 12,50 | RPE 3 | §6 |
| R4 | 5 | 37, 35, 45 | 77 | 40 | 12,83 | RPE 3 | §6 |
| R4 | 6 | 37, 35, 46 | 78 | 40 | 13,00 | RPE 3 | §6 |
| R4 | 7 | 38, 40, 47 | 83 | 42 | 13,83 | RPE 3 | §6 |
| R4 | 8 | 38, 40, 48 | 84 | 42 | 14,00 | RPE 3 | §6 |
| R4 | 9 | 39, 40, 49 | 86 | 42 | 14,33 | RPE 3 | §6 |
| R4 | 10 | 39, 45, 50 | 90 | 44 | 15,00 | RPE 3 | §6 |
| R4 | 11 | 40, 45, 51 | 92 | 44 | 15,33 | RPE 3 | §6 |
| R4 | 12 | 40, 45, 52 | 93 | 44 | 15,50 | RPE 3 | §6; semana limitada em 12. |

### R5

| Nível | Semana | Sessões (min) | Corrida (min) | Caminhada total (min) | km corrida estimados | Intensidade | Critério de semana seguinte |
|---|---:|---|---:|---:|---:|---|---|
| R5 | 1 | 40, 35, 46 | 81 | 40 | 14,00 | Leve RPE 3; intervalos RPE 7 | §6 |
| R5 | 2 | 40, 35, 47 | 82 | 40 | 14,17 | Leve 3; intervalos 7 | §6 |
| R5 | 3 | 40, 35, 48 | 83 | 40 | 14,33 | Leve 3; intervalos 7 | §6 |
| R5 | 4 | 40, 35, 49 | 84 | 40 | 14,50 | Leve 3; intervalos 7 | §6 |
| R5 | 5 | 40, 35, 50 | 85 | 40 | 14,67 | Leve 3; intervalos 7 | §6 |
| R5 | 6 | 40, 35, 51 | 86 | 40 | 14,83 | Leve 3; intervalos 7 | §6 |
| R5 | 7 | 40, 35, 52 | 87 | 40 | 15,00 | Leve 3; intervalos 7 | §6 |
| R5 | 8 | 40, 35, 53 | 88 | 40 | 15,17 | Leve 3; intervalos 7 | §6 |
| R5 | 9 | 40, 35, 54 | 89 | 40 | 15,33 | Leve 3; intervalos 7 | §6 |
| R5 | 10 | 40, 35, 55 | 90 | 40 | 15,50 | Leve 3; intervalos 7 | §6 |
| R5 | 11 | 40, 35, 56 | 91 | 40 | 15,67 | Leve 3; intervalos 7 | §6 |
| R5 | 12 | 40, 35, 57 | 92 | 40 | 15,83 | Leve 3; intervalos 7 | §6; semana limitada em 12. |

**Limites de interpretação da matriz:** nível/frequência são fixados aos seis perfis sintéticos descritos. Se frequência semanal declarada ou dias disponíveis mudarem, número/dias de sessões podem mudar; para R2 a última sessão recebe um ciclo a menos, e em R4/R5 o treino especial ocupa a segunda posição. Pace confortável muda estimativas e velocidades, não a duração. Quilômetros caminhando não podem ser calculados, pois não há velocidade definida. Valores de volume são estimativas de distância em corrida usando pace fixo, não distância prescrita ou garantida.

O `weeklyKm` informado não escala progressivamente a dose semanal: para R0–R3 não participa da duração e, em R4/R5, serve como limiar de classificação. Por exemplo, os perfis sintéticos R3 (12 km/sem) e R4 (10 km/sem) geram respectivamente estimativas de 12,83 e 11,33 km de corrida na primeira semana, antes de contar a caminhada. Isto é comportamento observado, não uma avaliação de segurança ou adequação.

## 6. Progressão, manutenção e redução

Origem do cliente: `recommendNext()` e `buildRunRecord()` em [hag_run_engine.js](../hag_run_engine.js#L274). Autoridade de gravação/progressão: `patient_save_execution_impl()` e `patient_save_assessment_impl()` em [202610270001_hag_run.sql](../supabase/migrations/202610270001_hag_run.sql#L159).

| Ordem de avaliação | Condição registrada | Ação implementada | Efeito |
|---:|---|---|---|
| 1 | Sintoma incomum, lesão nova, ou dor ≥4/10 | `professional_review` | Não permitir avanço; solicitar revisão profissional. Antes do plano, sintomas, lesão ativa/recente ou dor ≥4 impedem gerar sessões. |
| 2 | Sessão incompleta, sem condição acima | `repeat` | Não progride; sugere repetir após revisar a causa. |
| 3 | Sessão completa, dor 1–3/10 | `maintain` | Não progride; texto diz manter ou reduzir carga. Não calcula dose reduzida. |
| 4 | Completa, dor zero, fadiga ≥8, recuperação `poor` ou RPE ≥9 | `reduce` | Não progride; indica reduzir/aguardar recuperação. O motor não gera uma prescrição reduzida. |
| 5 | Completa, dor zero, sem critério anterior, dificuldade `hard`, RPE ≥8 ou recuperação `partial` | `maintain` | Não progride; mantém estágio atual. |
| 6 | Corrida completa, dor zero, RPE ≤6, fadiga <8, recuperação `good`; execução imediatamente anterior também atende a tolerância | `progress` | Permite semana seguinte. |
| 7 | Qualquer outro caso, inclusive RPE 7 sem outros critérios | `repeat` | Não progride; aguarda sessão bem tolerada. |

As execuções são consideradas consecutivas por ordem temporal dos registros, não por dia/semana prescritos. O código não verifica que todas as sessões planejadas da semana foram realizadas. A regra de semana seguinte só permite semana atual ou atual+1 se a recomendação **persistida** for `progress`; ao salvar a avaliação, a prescrição da semana vigente é imutável. Semana é limitada a 12; não há fase de graduação pós-semana 12 ou detecção de conclusão de 5 km contínuos.

O cliente usa até os dois registros anteriores no argumento, mas exige apenas o mais recente. RPC calcula pelo último registro persistido e a sessão atual. Sessões duplicadas, por `client_event_id`, retornam a recomendação anterior e não criam nova execução. O código não interpreta a distância real ou o pace registrado como critério de progressão; só conclusão, dor, sintomas/lesão, RPE, dificuldade, fadiga e recuperação.

### Simulações de resposta

**A. Boa adaptação.** Registro atual: completa, dor 0, RPE 5, fadiga 3, dificuldade moderada, recuperação boa; registro persistido imediatamente anterior também completo, dor 0, RPE 5, fadiga 3, recuperação boa. Resultado: `progress`, `progressAllowed: true`; duas sessões consecutivas satisfazem os limiares. Se não houver registro anterior tolerado, a mesma sessão retorna `repeat` e não avança.

**B. Fadiga excessiva e recuperação insuficiente.** Completa, dor 0, RPE 7, fadiga 9, recuperação `poor`. A condição `fatigue >= 8`/recuperação `poor` precede os demais critérios; resultado `reduce`, `progressAllowed: false`. Nenhuma semana reduzida é montada automaticamente. A tela bloqueia o botão “Revisar a semana” para essa ação e informa aguardar recuperação.

**C. Dor musculoesquelética durante a corrida.** Não há detecção de dor em tempo real nem interrupção automática pelo cronômetro. A pessoa pode pausar, pular ou encerrar manualmente; depois deve marcar dor no formulário. Com sessão completa e dor 3/10, resultado `maintain`, sem progressão. Com dor 4/10, resultado `professional_review`, sem progressão. Marcar nova lesão também resulta `professional_review`. Se marcar sintomas incomuns, igualmente exige revisão. O formulário só registra a dor após a sessão; o limiar não interrompe imediatamente o exercício.

**Decisões médicas:** aprovar ou alterar os limiares; definir se duas sessões toleradas bastam quando o plano agenda três; definir se deve haver progressão dentro da semana ou somente após semana completa; decidir conduta após `reduce` e fluxo de liberação depois de `professional_review`; decidir como orientar interrupção durante dor/sintomas. O código atual não implementa essas decisões.

## 7. Triagem e segurança existentes

Origem da triagem inicial: `buildProfile()` e `assessment` em [hag_run_HAG.html](../hag_run_HAG.html#L18). Classificação/bloqueio: `classifyRunner()` e `generate5kWeek()` em [hag_run_engine.js](../hag_run_engine.js#L87). Registro depois da corrida: `renderLog()` e `saveRun()` em [hag_run_HAG.html](../hag_run_HAG.html#L83). Regras persistidas: RPC acima.

| Categoria | Entrada/condição | Resultado do código |
|---|---|---|
| Sintoma potencialmente relevante | Caixa genérica sim para sintomas, exemplificados como dor torácica, tontura, falta de ar fora do esperado | Revisão profissional obrigatória antes de plano; após corrida, impede progressão e recomenda revisão. Não há triagem individual de cada sintoma, escala, duração ou atendimento emergencial. |
| Lesão musculoesquelética | Caixa “lesão ativa ou recente” | Define `activeInjury` e `recentInjury`; bloqueia plano automático. Durante/após sessão, caixa “nova lesão” demanda revisão. |
| Dor atual | 1–3/10 | Plano pode ser gerado com cautela; não progride automaticamente após execução com dor. |
| Dor atual ou pós-corrida | ≥4/10 | Revisão profissional, sem plano automático na avaliação ou sem progressão no registro da sessão. |
| Recuperação insuficiente | Seleção pós-sessão “insuficiente”/`poor` | Ação `reduce`; sem prescrição de redução calculada. |
| Condicionamento/dificuldade | Capacidade contínua, carga semanal, frequência, maior corrida; após sessão RPE e dificuldade | Determinam classificação/treino e ação; não equivalem a contraindicação. Sessão incompleta repete; dificuldade alta ou RPE 8 mantém; RPE ≥9 reduz. |
| Histórico prévio de lesão resolvida | Campo interno `injuryHistory`, não perguntado nem preenchido na interface | Se informado por outro consumidor, gera cautela; no fluxo atual permanece vazio. |

Não se deve interpretar `eligibleForAutomaticPlan` como liberação clínica completa: é apenas o resultado das três categorias cobertas pelo código (sintomas assinalados, lesão ativa/recente, dor ≥4). Histórico médico e fatores não coletados não entram na decisão. O texto informativo inicial recomenda não iniciar com sinais, mas o bloqueio estruturado depende da caixa e dos limiares registrados.

## 8. Lacunas e inconsistências para deliberação médica

1. **R0/R1 sem individualização:** faixas funcionais distintas, mesma rotina de 12 semanas.
2. **R2 sem avanço após semana 8:** as semanas 9–12 repetem a última etapa de 15 min de corrida por sessão.
3. **Progresso pode ocorrer antes de cumprir frequência semanal:** duas sessões boas podem avançar a semana mesmo se houver três planejadas.
4. **Recuperação baixa não gera plano reduzido:** `reduce` apenas bloqueia o botão de seguir; não especifica prazo ou critérios de retorno.
5. **Sem interrupção clínica automatizada em tempo real:** dor/sintomas durante corrida só são processados no formulário posterior; `skip` pula a etapa sem classificar motivo.
6. **Triagem clínica limitada:** doença conhecida, fatores de risco, medicações, idade e outros dados não são perguntados. Não há decisão baseada em tais dados.
7. **Desfecho do programa não definido:** até a semana 12, não há critério de teste final ou demonstração de que a pessoa completa 5 km contínuos.
8. **Carga de caminhada sem velocidade/volume:** durações são somadas; distância/ritmo não são orientados.
9. **Volume recente não ajusta a dose:** fora dos limiares de classificação R4/R5, o volume semanal declarado não dimensiona o treino; a primeira semana dos exemplos R3/R4 resulta em estimativa de corrida acima do volume informado.
10. **Resultado de prova e pace-alvo:** previsão matemática fixa e RPE 7 sem individualização clínica adicional ou regra de ajuste registrada.
11. **Tolerância por sessão, não por semana:** progresso depende apenas do registro atual e imediatamente anterior; não avalia todas as sessões da semana, intervalo de recuperação em horas ou tendência acumulada.
12. **Plano automático por capacidade autodeclarada:** não há validação objetiva da capacidade contínua, volume ou resultado de prova.
13. **Sessões reduzidas por disponibilidade:** disponibilidade pode diminuir frequência; alguns níveis podem não receber a sessão longa/específica quando há apenas duas datas. A função usa posição da sessão para atribuir o estímulo especial.

## 9. Aprovação médica

Preencher antes de qualquer liberação a pacientes:

| Regra/tema | Decisão | Justificativa / modificação solicitada | Responsável | Data |
|---|---|---|---|---|
| Critérios e precedência de classificação R0–R5 | Pendente |  |  |  |
| Mesma prescrição para R0 e R1 | Pendente |  |  |  |
| Estágios R0/R1, R2, R3, R4 e R5; duração/volume/frequência | Pendente |  |  |  |
| Warm-up/cooldown e caminhada após a última repetição | Pendente |  |  |  |
| Pace confortável, extrapolação R5 e alvo RPE 7 | Pendente |  |  |  |
| Progressão após duas sessões, sem exigir semana completa | Pendente |  |  |  |
| Limiar de dor 1–3 / ≥4 e lesão | Pendente |  |  |  |
| Limiares RPE, fadiga e recuperação | Pendente |  |  |  |
| Triagem de sintomas e dados clínicos ausentes | Pendente |  |  |  |
| Conduta de retorno após redução ou revisão profissional | Pendente |  |  |  |
| Critério de conclusão/avaliação de 5 km | Pendente |  |  |  |

**Parecer final:** Pendente. Este relatório descreve o código auditado e não autoriza uso clínico.

## 10. Arquivos e funções de origem

- `hag_run_engine.js`: `normalizeProfile`, `classifyRunner`, `paceToKmh`, `kmhToPace`, `formatPace`, `segment`, `makeIntervals`, `BEGINNER_STAGES`, `R2_STAGES`, `chooseSpacedDays`, `generate5kWeek`, `recommendNext`, `buildRunRecord`.
- `hag_run_HAG.html`: formulário de avaliação, `buildProfile`, renderização da prescrição, timer, formulário de execução e restauração de histórico.
- `hag_run_store.js`: adaptação do perfil/prescrição para as RPCs e estrutura dos dados enviados/recuperados.
- `supabase/migrations/202610270001_hag_run.sql`: validação persistida de elegibilidade de sessão, captura de execução e regra server-side de progressão.
- `tests/hag_run_engine.test.js`: testes de classificação, geração, duração, pace, recuperação, dor e validações; não define indicação clínica.

## 11. Reprodutibilidade e segurança desta auditoria

A matriz foi calculada com `HAGRunEngine.generate5kWeek()` para as seis entradas sintéticas detalhadas neste documento e semanas 1–12. O relatório não altera motor, interface, migração ou produção. Não foram usados pacientes reais nem valores recebidos do Supabase. A revisão deve ser seguida de uma tarefa separada para modificar regras somente após decisão clínica documentada.
