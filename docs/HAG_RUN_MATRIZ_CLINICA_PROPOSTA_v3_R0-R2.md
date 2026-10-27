# HAG RUN v1.0, proposta comparativa v3 para R0–R2

**Status: proposta para revisão do médico responsável. Não é protocolo aprovado e não autoriza implementação clínica.**

## 1. Escopo e decisões recebidas

Esta versão responde ao parecer da matriz v2. Preserva a [v2](HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v2_R0-R2.md) como registro, mantém provisoriamente as sequências numéricas R0-A a R0-J e R1-A a R1-K, e propõe ajustes para seleção da entrada, pontes entre níveis e transição R2. Todos os números e regras continuam pendentes de decisão médica.

O código clínico, interface, RPCs, migrações e dados não foram alterados. Não usar estas tabelas para prescrever pacientes antes da aprovação formal.

O parecer favorável recebido cobre a estrutura, frequência individual de duas ou três sessões, descanso entre corridas, aquecimento/desaquecimento de cinco minutos e alvo provisório RPE 3–4 com talk test. A aprovação não abrange integralmente os parâmetros numéricos. R0 e R1 seguem como base com ajustes de seleção. R2 e as passagens entre níveis recebem as propostas abaixo.

## 2. Três variáveis clínicas distintas

| Variável | Definição proposta | Uso na decisão |
|---|---|---|
| Capacidade funcional | Maior duração de corrida contínua demonstrada sob condições registradas, sem inferir aptidão médica ou tolerância semanal. | Apoia a classificação funcional provisória R0, R1 ou R2. |
| Carga tolerada | Corrida e caminhada realmente realizadas em cada sessão e no ciclo recente, frequência realizada, maior bloco, resposta de esforço, sintomas e recuperação entre sessões. | Indica que volume a pessoa demonstrou tolerar. Não se deduz da classificação nem da frequência disponível. |
| Estágio prescrito | Dose futura escolhida para desenvolver capacidade, após considerar capacidade funcional, carga tolerada, frequência individual, recuperação e decisão clínica. | É uma decisão de prescrição. Não é sinônimo de R-level nem resultado automático de uma pergunta isolada. |

**Consequência proposta:** dois pacientes com a mesma capacidade contínua podem receber estágios e frequências diferentes, se a carga recente ou a recuperação forem diferentes. Um estágio com blocos menores que a capacidade máxima ainda pode representar volume total excessivo. A classificação R2 não autoriza automaticamente duas ou três sessões de 30 minutos.

## 3. Seleção de entrada em R0, R1 e R2

Os cortes funcionais continuam provisórios: R0 abaixo de 5 minutos contínuos, R1 de 5 a menos de 15 minutos, R2 de 15 a menos de 30 minutos. A medição, a segurança e a interpretação clínica continuam separadas.

| Nível funcional | Ponto candidato da v2 | Questão identificada | Regra de seleção proposta para discussão |
|---|---|---|---|
| R0 | Sequência R0-A a R0-J | A capacidade abaixo de 5 minutos não informa se a pessoa tolera o total da sessão ou do ciclo. | Usar a sequência como menu candidato. Escolher estágio considerando maior bloco demonstrado, corrida total e frequência realmente toleradas recentemente, recuperação e disponibilidade prescrita. Não inferir estágio somente do corte R0. |
| R1 | Sequência R1-A a R1-K | Alguém perto de 15 minutos não deveria ser enviado automaticamente a R1-A; alguém recém-capaz de 5 minutos pode não tolerar o volume de um estágio avançado. | Usar capacidade demonstrada para limitar o bloco candidato e carga recente para selecionar volume/frequência. Sem histórico ou resposta suficiente, não avançar a entrada automaticamente; solicitar decisão profissional. |
| R2 | 15–19 min: R2-E; 20–24: R2-G; 25–29: R2-J | Os candidatos pedem blocos de 9, 11 e 14 minutos. Cada sessão soma 18, 22 e 28 minutos de corrida. Em 2x, os ciclos somam 36, 44 e 56 minutos; em 3x, 54, 66 e 84 minutos. A capacidade sozinha não comprova tolerância a essa carga. | Manter E/G/J apenas como candidatos funcionais, sem mapeamento automático. Comparar minutos realizados nas últimas quatro semanas, sessões, maior bloco, recuperação e sintomas. O prescritor escolhe dose/frequência compatível, reduz o candidato, prescreve ajuste individual ou solicita avaliação se os dados não sustentarem decisão. |

### Registros de carga para seleção

Proposta de coletar, para as quatro semanas recentes quando disponíveis: minutos de corrida e caminhada por sessão; total por ciclo de sete dias; frequência efetivamente realizada; maior bloco contínuo; sessões incompletas e motivo; RPE, dor/sintomas e recuperação antes da sessão seguinte. Quatro semanas é uma janela operacional para discussão, não um limiar validado.

Não foi definido um percentual universal de correspondência entre carga prévia e carga nova. Também não foi definido um piso de dados para seleção automática. Enquanto esses critérios não forem aprovados, dados ausentes ou inconsistentes devem impedir seleção automática e exigir decisão profissional, sem classificar automaticamente o caso como falha de adesão.

## 4. R0 e R1, matriz mantida e ponte com motivo registrado

As sequências intervaladas R0-A a R0-J e R1-A a R1-K da v2 permanecem como propostas-base sem mudança numérica nesta revisão. Permanecem pendentes os pontos de entrada conforme carga recente e os critérios quantitativos de avanço, manutenção e redução.

As pontes da v2 representam troca planejada de distribuição: R0-J para a ponte R0→R1 reduz 5 minutos de corrida por ciclo, tanto em 2x (20 para 15) quanto em 3x (30 para 25); R1-K para a ponte R1→R2 também reduz 5 minutos (40 para 35 em 2x; 60 para 55 em 3x). A continuidade máxima aumenta. A redução não deve ser registrada como regressão por si só.

Toda alteração de estágio ou distribuição deverá registrar um motivo principal e, quando necessário, motivos complementares:

| Motivo registrado | Significado proposto | Interpretação da mudança |
|---|---|---|
| functional_continuity | Substituir parte dos intervalos por bloco contínuo para desenvolver continuidade, após ciclo tolerado. | Progressão de continuidade. Pode reduzir intencionalmente minutos totais; não rotular como regressão sem analisar carga/resposta. |
| capacity_maintenance | Manter capacidade e dose por falta de dados suficientes para progredir, indisponibilidade ou necessidade de repetir o ciclo. | Manutenção; registrar o que foi prescrito e realizado. |
| recovery_insufficient | Adiar, manter ou reduzir porque recuperação entre sessões não foi adequada segundo critério médico a definir. | Ajuste por recuperação; não atribuir automaticamente a falta de adesão. |
| low_tolerance | Ajustar por esforço acima do alvo ou incapacidade repetida de completar o estímulo, sem presumir a causa. | Requer distinguir carga, ritmo, sintomas, doença recente e demais fatores antes de escolher nova dose. |
| clinical_individual_adjustment | Prescritor modifica a dose por condição, histórico ou resposta individual. | Ajuste profissional versionado, com autor, data/hora, motivo e dose anterior/nova. Não altera matriz geral. |
| availability_adjustment | Adaptar frequência ou calendário à disponibilidade real. | Prescrever duas ou três sessões explicitamente; não tratar sessão não prescrita como falta. Não comprimir sessões. |
| symptom_or_injury_review | Dor nova/progressiva, sinal de alerta ou lesão que exija decisão clínica. | Pausar a progressão e seguir protocolo de revisão aprovado; não substituir por redução automática de exercício. |

Os identificadores são rótulos documentais propostos, não nomes de campos aprovados para software. A decisão sobre enumerações, combinação de motivos e permissões fica para a especificação técnica após validação clínica.

## 5. Propostas para a transição R2 à corrida contínua

### Referência comum

R2-K da v2 corresponde a 2 × 15 minutos de corrida, com dois minutos caminhando entre os blocos, aquecimento e desaquecimento de cinco minutos. São 30 minutos de corrida e 42 minutos totais por sessão. O ciclo de duas sessões soma 60 minutos de corrida; o de três soma 90. A recuperação, RPE, sintomas e carga recente continuam relevantes; chegar a R2-K não autoriza automaticamente uma sessão contínua de 30 minutos.

Os modelos de transição abaixo pressupõem que a pessoa já chegou a R2-K por uma progressão individual e tolerou essa carga. Não são prescritos diretamente pela capacidade R2 nem pelos pontos candidatos E/G/J. Como o corte funcional começa em 15 minutos, ambos começam com um bloco contínuo de 15 minutos; se a pessoa não demonstrar esse bloco com resposta aceitável, precisa de uma etapa individual abaixo desse ponto, ainda não tabelada.

As duas alternativas abaixo separam explicitamente o efeito sobre minutos totais e continuidade. Ambas são construções operacionais hipotéticas para discussão, sem respaldo como prescrição individual validada.

### Modelo A, manter melhor o volume de corrida

Cada sessão mantém 30 minutos totais de corrida, como R2-K, repartidos em um bloco contínuo-alvo e um bloco intervalado complementar. A ordem proposta é fazer o contínuo primeiro, após aquecimento, e o intervalo depois; uma pausa caminhando de 1:30 separa os blocos nos estágios T1–T8. T9 é corrida contínua de 30 minutos. A ordem e essa recuperação também precisam de decisão médica.

| Estágio | Bloco contínuo | Bloco intervalado complementar | Corrida por sessão | Total 2 sessões | Total 3 sessões | Sessão total estimada |
|---|---:|---|---:|---:|---:|---:|
| A-T1 | 15 min | 15 min corridos em intervalo | 30 min | 60 min | 90 min | 41:30 |
| A-T2 | 17 min | 13 min corridos em intervalo | 30 min | 60 min | 90 min | 41:30 |
| A-T3 | 19 min | 11 min corridos em intervalo | 30 min | 60 min | 90 min | 41:30 |
| A-T4 | 21 min | 9 min corridos em intervalo | 30 min | 60 min | 90 min | 41:30 |
| A-T5 | 23 min | 7 min corridos em intervalo | 30 min | 60 min | 90 min | 41:30 |
| A-T6 | 25 min | 5 min corridos em intervalo | 30 min | 60 min | 90 min | 41:30 |
| A-T7 | 27 min | 3 min corridos em intervalo | 30 min | 60 min | 90 min | 41:30 |
| A-T8 | 29 min | 1 min corrido em intervalo | 30 min | 60 min | 90 min | 41:30 |
| A-T9 | 30 min contínuos | Nenhum | 30 min | 60 min | 90 min | 40:00 |

Para calcular a sessão total nos estágios T1–T8, o bloco complementar é um intervalo de corrida, com 1:30 caminhando entre corrida e contínuo; somam-se 5 minutos de aquecimento e 5 de desaquecimento. Esse desenho aumenta o maior bloco de 15 para 30 minutos sem reduzir os minutos semanais de corrida, mas não reduz a duração total da sessão. A dose intervalada exata e a sequência da tarefa precisam ser definidas. T9 omite recuperação interna e totaliza 40 minutos.

**Questão clínica:** manter os minutos semanais não garante que a redistribuição ou a sessão individual seja tolerável. O volume-alvo se mantém igual a R2-K. O primeiro estágio mantém o bloco contínuo de 15 minutos e depois o aumenta em dois minutos por estágio até 29, seguido de 30. A entrada requer tolerância documentada ao ciclo-base; ausência de tolerância demonstrada a 15 minutos exige uma etapa individual de entrada.

### Modelo B, redução planejada para priorizar continuidade

Em cada ciclo, manter uma ou duas sessões intervaladas de referência R2-K e substituir a sessão restante por corrida contínua. A dose intervalada permanece em 30 minutos de corrida. A mudança reduz deliberadamente 15 minutos do total do ciclo na entrada em comparação com R2-K; depois o total sobe dois minutos a cada estágio até 29 minutos contínuos, e mais um minuto para concluir 30.

| Estágio | Sessões intervaladas de referência | Sessão contínua | Total 2 sessões | Diferença de R2-K 2x | Total 3 sessões | Diferença de R2-K 3x | Sessão contínua total |
|---|---:|---:|---:|---:|---:|---:|---:|
| B-T1 | 1 em 2x; 2 em 3x | 15 min | 45 min | −15 min | 75 min | −15 min | 25 min |
| B-T2 | 1 em 2x; 2 em 3x | 17 min | 47 min | −13 min | 77 min | −13 min | 27 min |
| B-T3 | 1 em 2x; 2 em 3x | 19 min | 49 min | −11 min | 79 min | −11 min | 29 min |
| B-T4 | 1 em 2x; 2 em 3x | 21 min | 51 min | −9 min | 81 min | −9 min | 31 min |
| B-T5 | 1 em 2x; 2 em 3x | 23 min | 53 min | −7 min | 83 min | −7 min | 33 min |
| B-T6 | 1 em 2x; 2 em 3x | 25 min | 55 min | −5 min | 85 min | −5 min | 35 min |
| B-T7 | 1 em 2x; 2 em 3x | 27 min | 57 min | −3 min | 87 min | −3 min | 37 min |
| B-T8 | 1 em 2x; 2 em 3x | 29 min | 59 min | −1 min | 89 min | −1 min | 39 min |
| B-T9 | 1 em 2x; 2 em 3x | 30 min | 60 min | 0 min | 90 min | 0 min | 40 min |

Cada sessão intervalada de referência dura 42 minutos, como R2-K. Cada corrida contínua soma 5 minutos de caminhada antes e depois. O total do ciclo é, portanto, carga de corrida e não duração total. Em 2x há uma sessão intervalada e uma contínua; em 3x, duas intervaladas e uma contínua. Frequência não prescrita continua fora do denominador.

**Racional a revisar:** uma redução inicial intencional pode abrir espaço para a primeira exposição contínua e para observar recuperação; ela não está estabelecida por uma referência externa como necessidade clínica. O caminho torna a redução explícita e progressivamente recupera os minutos de corrida. O médico deve decidir se −15 minutos é aceitável em ambas as frequências ou se o desenho 2x e 3x precisa de doses diferentes.

### Comparação dos modelos

| Aspecto | Modelo A, volume mantido | Modelo B, redução planejada |
|---|---|---|
| Minutos no ciclo ao sair de R2-K | Sem redução: 60 em 2x e 90 em 3x | 45 em 2x e 75 em 3x no primeiro estágio |
| Maior bloco contínuo inicial | 15 min | 15 min |
| Progressão de continuidade | +2 min por estágio de 15 a 29 min, depois 30; o bloco complementar cai para manter 30 min corridos por sessão | +2 min por estágio de 15 a 29 min, depois 30; uma sessão intervalada por ciclo 2x ou duas por ciclo 3x permanece em 30 min |
| Duração planejada de sessão | 41:30 nos estágios mistos, 40:00 em T9 | Intervalada 42:00; contínua 25:00 a 40:00 |
| Principal incerteza | Distribuir 30 min de corrida entre bloco contínuo e intervalo na mesma sessão pode alterar fadiga e duração percebida | A redução inicial de 15 min pode ser excessiva ou insuficiente; exige justificar e comparar recuperação |
| Frequência | Mesmo volume total por sessão para 2x e 3x, muda somente a soma do ciclo | Dose total é explicitamente calculada segundo 2x ou 3x prescritos |

Os modelos não são sequências automaticamente intercambiáveis. A seleção deve considerar carga tolerada, frequência prescrita, maior bloco, sintomas e recuperação. Se os dados não sustentarem nenhum caminho, a proposta é individualização profissional, não escolher o Modelo A por preservar volume ou o Modelo B por ser mais conservador.

## 6. Interpretação das pontes R0→R1 e R1→R2

| Ponte | Mudança funcional | Mudança de carga do ciclo | Interpretação proposta |
|---|---|---|---|
| R0→R1 | Bloco contínuo demonstrado de 5 min | −5 min por ciclo em relação a R0-J, para 2x e 3x | Pode ser functional_continuity se decidida para aumentar continuidade após resposta tolerada. Não é regressão por si só. Se a ponte decorrer de baixa tolerância, registrar low_tolerance ou recovery_insufficient e usar a ação aprovada para esses motivos. |
| R1→R2 | Bloco contínuo demonstrado de 15 min | −5 min por ciclo em relação a R1-K, para 2x e 3x | A mesma redução tem significado distinto conforme motivo. Uma ponte funcional planejada não deve mascarar incapacidade de completar dose. |
| R2 intervalado→contínuo | Aumenta o maior bloco rumo a 30 min | Modelo A: mantém 60/90; Modelo B: 45/75 na primeira etapa, subindo até 60/90 | Registrar que caminho foi prescrito e qual justificativa. Comparar execução à prescrição desse modelo, não comparar apenas com estágio anterior sem considerar a intenção. |

Proposta de registro por sessão/ciclo: classificação funcional antes/depois; capacidade contínua observada; carga recente e carga prescrita; carga realizada; frequência individual prescrita; maior bloco; decisão (progredir, manter, reduzir ou revisão); motivo da transição; versão da matriz; autor e data/hora quando houver ajuste profissional. Esquema e nomenclatura aguardam desenho técnico posterior.

## 7. Como distinguir redução planejada, manutenção e baixa tolerância

| Situação observada | Leitura que deve ser evitada | Conduta proposta para discussão |
|---|---|---|
| Volume menor por troca deliberada de intervalos por contínuo | Marcar como regressão sem considerar o objetivo da prescrição | Registrar functional_continuity, comparar execução com a prescrição desse modelo e avaliar separadamente total e maior bloco. |
| Uma sessão não realizada por indisponibilidade | Interpretar automaticamente como baixa tolerância ou falha clínica | Registrar status/motivo e avaliar somente a frequência e o volume prescritos. Ajustar calendário sem comprimir sessões; limiar de ciclo permanece pendente. |
| Sessão parcial/interrompida por esforço acima do alvo | Reduzir sempre o mesmo percentual ou avançar pelo bloco concluído isoladamente | Registrar bloco e minutos realizados, RPE e motivo; rever ritmo, estágio e carga antes de decisão concreta. Critério e dose dependem de aprovação médica. |
| Recuperação insuficiente entre sessões | Prescrever a próxima sessão no dia originalmente previsto sem reavaliar | Adiar a sessão e reavaliar; manter ou reduzir segundo recorrência/gravidade e regra médica ainda a definir. |
| Dor musculoesquelética nova/progressiva ou sintoma de alerta | Tratar como simples fadiga e substituir por uma sessão menor automaticamente | Pausar progressão e seguir a triagem/revisão clínica aprovada; não inferir que reduzir minutos resolva a causa. |
| Ajuste por condição ou histórico individual | Alterar silenciosamente a matriz geral | Criar prescrição individual versionada, com profissional autorizado, motivo, valores anteriores/novos e versão-base. |

Esta tabela não cria novos critérios diagnósticos, níveis de dor, limiares de RPE, prazo de recuperação ou autorização de retorno. Todos continuam pendentes de especificação médica.

## 8. Decisões requeridas antes de implementar

| Decisão clínica | Alternativas em discussão | Estado |
|---|---|---|
| R0/R1 entrada | Seleção profissional baseada conjuntamente em capacidade contínua e carga recente; confirmar janela de observação e dados mínimos | Pendente |
| R2 entrada E/G/J | Manter como candidatos com gate explícito de carga/recuperação, alterar os candidatos ou abolir mapeamento numérico | Pendente |
| Definição de carga recente suficiente | Definir janela, métricas e como considerar volume por frequência; sem teto percentual universal | Pendente |
| Pontes R0→R1 e R1→R2 | Manter redução planejada de 5 min, recalibrar sessões ou criar caminho alternativo | Pendente |
| Motivo da transição | Confirmar categorias, se são mutuamente exclusivas, e quais decisões cada motivo permite | Pendente |
| Redução por baixa tolerância | Distinguir indisponibilidade, recuperação, esforço, sintomas e limitação; aprovar ação e dose concreta por causa | Pendente |
| Modelo R2 | Escolher A, B, caminhos diferentes por frequência, outro desenho ou não aprovar nenhum | Pendente |
| Recuperação e espaçamento | Manter um dia sem corrida como padrão e definir como sintomas/recuperação adiam o ciclo | Pendente |
| Progressão | Definir critérios de dados completos, carga entregue, maior bloco, RPE, recuperação e avanço de um estágio | Pendente |
| Segurança | Validar triagem ampliada, sinais de interrupção, revisão profissional e retorno | Pendente; ver especificação clínica v1 |

## 9. Limites e segurança de desenvolvimento

As somas de minutos são cálculos de tempo prescrito, não estimativas completas de carga fisiológica. Não há distância calculada, pace fixo, velocidade, terreno ou resposta objetiva. Os valores, a sessão híbrida do Modelo A e a redução planejada do Modelo B não foram validados prospectivamente nem são recomendações universais de diretrizes.

Esta versão é documental. Preservar v1 e v2, não alterar regras do motor, interface, RPCs ou migrações, não executar migrações e não publicar. Somente após decisão clínica registrada converter parâmetros aprovados em especificação executável e testes. Toda exceção individual deve continuar distinta da matriz geral e ter revisão profissional auditável.
