# HAG RUN v1.0, matriz clínica proposta para R0–R2

**Status: proposta técnica para revisão médica. Os parâmetros abaixo não foram aprovados como protocolo assistencial.**

## Finalidade

Converter a orientação clínica recebida em uma primeira matriz revisável para R0, R1 e R2. O objetivo é oferecer valores explícitos para debate, identificar onde eles são escolhas operacionais do HAG RUN e registrar o que não deve ser codificado sem aprovação. Não altera o motor nem autoriza uso com pacientes.

Referência da situação atual: [auditoria clínica](HAG_RUN_AUDITORIA_CLINICA.md) e [especificação clínica preliminar](HAG_RUN_ESPECIFICACAO_CLINICA_v1.md). Os níveis R0–R5 permanecem uma classificação funcional provisória, separada da triagem de segurança.

## O que as referências sustentam e o que não sustentam

| Fonte | Recomendação/fato utilizado | Limite de interpretação para o HAG RUN |
|---|---|---|
| ACSM, atualização da triagem pré-participação | A triagem considera nível atual de atividade, sinais/sintomas e doença cardiovascular, metabólica ou renal conhecida, além da intensidade pretendida. Para pessoas inativas com sintomas ou doença conhecida, indica avaliação profissional antes de iniciar; pessoas inativas, assintomáticas e sem doença conhecida podem começar leve a moderado e progredir gradualmente. | Não define os intervalos abaixo, nem converte R0–R5 em risco médico. A decisão de avaliação individual cabe ao profissional de saúde. [Artigo ACSM](https://journals.lww.com/acsm-msse/fulltext/2015/11000/updating_acsm_s_recommendations_for_exercise.28.aspx) |
| NHS Couch to 5K | Um programa público de referência usa três corridas semanais com dia de descanso entre elas, caminhada de aquecimento e desaquecimento de cinco minutos, ritmo próprio e alternância corrida/caminhada. A semana inicial usa blocos de corrida de um minuto e caminhada de 1 minuto e 30 segundos, repetidos. | É um exemplo de programa público para iniciantes, não uma diretriz individualizada para todos os pacientes HAG, não valida os cortes R0–R2 nem os limiares de progressão desta proposta. [Plano NHS](https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/) |
| CDC, talk test | Em atividade moderada, em geral a pessoa consegue conversar, mas não cantar; em vigorosa, não consegue dizer mais que poucas palavras sem pausar para respirar. | A classificação varia por aptidão individual. A proposta de conversa confortável abaixo é um controle operacional e não um teste de segurança. [CDC](https://www.cdc.gov/physicalactivity/basics/measuring/index.html) |
| ACSM, componentes FITT-VP | Frequência, intensidade, tempo, tipo, volume e progressão são dimensões de uma prescrição. | Não há, nas fontes acima, uma única progressão de intervalos aplicável a todas as pessoas R0–R2. As durações e regras numéricas desta matriz são parâmetros operacionais propostos para avaliação médica, não recomendações diretamente estabelecidas pelas fontes. [ACSM, guia de prescrição](https://acsm.org/education-resources/books/exercise-testing-prescription/) |
| Diretriz Brasileira de Ergometria em População Adulta, 2024 | Referência nacional para indicações e condução de teste ergométrico em adultos. | É diretriz de teste ergométrico; não deve ser interpretada como obrigação de solicitar teste para cada pessoa antes de iniciar caminhada/corrida leve. Rever com o médico se o HAG RUN vier a propor teste clínico. [SBC/ABC Cardiol](https://abccardiol.org/en/article/diretriz-brasileira-de-ergometria-em-populacao-adulta-2024/) |

As fontes não estabelecem os cortes de RPE 0–10, a proporção de sessões necessária para avançar, o limite de dor, nem o algoritmo completo desta matriz. Esses pontos estão identificados como proposta HAG e aguardam aprovação médica.

## Separar três decisões

1. **Triagem clínica:** avalia sinais/sintomas, doenças conhecidas, medicamentos relevantes, mudanças de saúde e limitações musculoesqueléticas. O resultado é uma decisão de segurança e encaminhamento, não um nível R.
2. **Classificação funcional:** R0, R1 ou R2 organiza a capacidade de corrida e o ponto de entrada na sequência. Não dá liberação médica.
3. **Prescrição individual:** estágio e sessões são adaptados à capacidade, volume recente, disponibilidade e resposta. Uma exceção clínica individual não altera o protocolo geral.

## Triagem proposta antes de apresentar sessões

### Campos de avaliação

Perguntas propostas para análise do médico, sem pretensão de substituir consulta:

- Prática habitual atual: atividades, dias por semana, minutos por sessão, intensidade percebida e há quanto tempo mantém esse padrão.
- Diagnóstico conhecido de doença cardiovascular, metabólica, renal ou outra condição que possa alterar a resposta ao exercício.
- Sinais/sintomas em repouso ou esforço: desconforto/dor no peito, pescoço, mandíbula ou braços; falta de ar em repouso ou com esforço leve; tontura ou desmaio; falta de ar ao deitar ou despertar por falta de ar; edema; palpitação/taquicardia; claudicação; sopro cardíaco conhecido; fadiga ou falta de ar incomum nas atividades habituais. A lista deve ser revisada pelo responsável médico antes de ser transformada em questionário.
- Medicamentos atuais e mudanças recentes que o médico considere relevantes para resposta ao esforço, frequência cardíaca, pressão, glicemia, equilíbrio, alerta ou hidratação. O sistema não deverá classificar medicamentos por conta própria sem uma regra aprovada.
- Dor musculoesquelética atual, localização, início, mudança recente, relação com corrida/caminhada, interferência na marcha e lesão ativa ou recente.
- Mudança recente da condição de saúde, nova limitação ou orientação médica específica para exercício.
- Intensidade pretendida, inicialmente caminhada e corrida leve a moderada, conforme decisão médica individual.

### Saídas de triagem a validar

| Estado proposto | Condição geral | Comportamento de produto a aprovar |
|---|---|---|
| Pode considerar início gradual | Inativo, sem sinais/sintomas, sem doença conhecida que requeira avaliação e sem limitação ativa relevante | Permitir avaliação funcional e apresentar apenas o protocolo aprovado, com instrução para interromper se surgir sinal de alerta. |
| Revisão clínica antes de gerar prescrição | Doença conhecida, medicamento/alteração que exija julgamento clínico, limitação ou lesão relevante, resposta incompleta ou dúvida | Não classificar como contraindicação automática. Encaminhar para avaliação e registrar decisão do profissional antes de liberar o plano. A regra final depende do médico. |
| Interrupção e avaliação urgente conforme protocolo institucional | Sinal potencialmente grave em repouso ou esforço, por exemplo dor torácica, síncope ou falta de ar desproporcional | Interromper exercício, impedir retomada automática e apresentar instrução clínica/local aprovada. O texto final de urgência e rota de atendimento ainda precisam ser definidos pelo médico. |

Este fluxo é uma proposta. O modelo ACSM orienta triagem por atividade atual, sinais/sintomas ou doença conhecida e intensidade pretendida. A tabela não substitui julgamento clínico e não presume que todo diagnóstico ou medicamento seja bloqueio absoluto.

## Parâmetros comuns propostos para R0–R2

| Parâmetro | Proposta inicial | Base e estado |
|---|---|---|
| Frequência de ciclo | 3 sessões de corrida/caminhada em cada ciclo de avaliação | Segue como referência a frequência do NHS Couch to 5K. A adoção para todos os níveis HAG é uma escolha operacional para revisão. |
| Espaçamento | Dias não consecutivos, com ao menos um dia sem corrida entre sessões. Não comprimir sessões para compensar falta. Se não houver dias suficientes, adiar/reorganizar o ciclo. | O NHS recomenda dia de descanso entre corridas; a regra de agenda HAG requer aprovação. |
| Aquecimento | 5 min caminhando confortavelmente | Referência do plano NHS. |
| Desaquecimento | 5 min caminhando confortavelmente | Referência do plano NHS. |
| Pace/velocidade | Sem pace ou velocidade fixos em R0–R2. Não converter a capacidade declarada em pace. | Evita criar alvo de velocidade sem teste individual. A tela pode exibir cronômetro e RPE. |
| RPE | Corrida: alvo operacional 3–4/10; caminhada: 2–3/10. Falar frases completas deve permanecer confortável. Se o esforço superar o alvo, reduzir o ritmo ou caminhar. | Faixa HAG proposta, não ponto de corte validado pelas fontes. O talk test é uma pista subjetiva, não liberação clínica. Revisão médica necessária. |
| Repetição corrida/caminhada | Recuperação caminhando somente entre blocos de corrida, sem caminhada adicional automática depois do último bloco; depois começa o desaquecimento. | Escolha operacional. Evita duplicar recuperação no fim; requer confirmação médica. |
| Progressão temporal | Por estágio de capacidade, sem prazo fixo. Repetir o estágio quando os critérios do ciclo não permitirem avançar. | Compatível com a decisão de programa adaptativo, não calendário obrigatório. |
| Carga inicial conforme histórico | Acrescentar na avaliação tempo total de corrida por sessão e por semana nas últimas 4 semanas, frequência real e maior sessão tolerada. Como proposta de entrada, selecionar a etapa com estímulo compatível com a capacidade contínua e cujo volume semanal não exceda a mediana recente; para quem não tem histórico, escolher o estágio inicial mais conservador do nível. Se os dados forem incompletos, houver mudança clínica ou lesão, encaminhar para seleção individual pelo prescritor. | Regra operacional HAG proposta, sem fator percentual e sem validação universal. O código atual só pergunta distância semanal, frequência e corrida mais longa; não tem este histórico temporal. A fórmula exata de seleção aguarda aprovação. |
| Progressão da carga | Manter a frequência constante enquanto duração/maior bloco mudam; rever volume agregado antes de avançar. Evitar elevar frequência, corrida total e maior bloco ao mesmo tempo. | Princípio operacional proposto. Os números de estágio abaixo ainda não cumprem um limite uniforme de aumento de volume; a tabela é material de revisão, não uma sequência pronta para automatizar. A evidência consultada não define limite percentual universal para o HAG RUN; não aplicar automaticamente a regra de 10%. |
| Teste funcional | O estágio que pede corrida contínua deve ser registrado como avaliação de capacidade, sem tratá-lo como teste máximo. | Carga, instruções e requisitos de supervisão aguardam decisão médica. |

### Escala sugerida para a interface

RPE de 0 a 10 deve mostrar âncoras verbais, porque os números sem explicação podem ser interpretados de modo diferente. Sugestão de redação para revisão: `0 repouso`, `2 muito leve`, `3 leve`, `4 confortável`, `5 exigente`, `6 ou mais acima do alvo deste estágio`. O mapa numérico é um parâmetro HAG proposto e precisa ser aprovado. O código atual não documenta âncoras dessa escala.

## Matriz R0 proposta

**Entrada funcional provisória:** menos de 5 min de corrida contínua. A capacidade de entrada deve ser medida ou revisada pelo profissional; a caixa autodeclarada, sozinha, não é avaliação objetiva. Ponto de entrada dentro da sequência ainda deve ser aprovado. Para discussão, o rascunho usa o primeiro estágio como início conservador e permite seleção de estágio pelo prescritor individual.

Cada linha representa uma sessão; estágios A–H seriam repetidos nas três sessões do ciclo. `Run × repetições` e caminhada indicam a sequência por sessão. Duração total inclui aquecimento e desaquecimento de 5 min. Caminhadas entre repetições ocorrem somente entre blocos, não depois do último bloco. Estes valores são escolhas operacionais propostas.

| Estágio | Blocos corrida | Recuperação entre blocos | Aquecer / desaquecimento | Duração total da sessão | Tempo de corrida | Caminhada total | RPE corrida / caminhada |
|---|---|---|---|---:|---:|---:|---|
| R0-A | 8 × 0:30 | 1:30 × 7 | 5:00 / 5:00 | 24:30 | 4:00 | 20:30 | 3–4 / 2–3 |
| R0-B | 8 × 0:45 | 1:30 × 7 | 5:00 / 5:00 | 26:30 | 6:00 | 20:30 | 3–4 / 2–3 |
| R0-C | 8 × 1:00 | 1:30 × 7 | 5:00 / 5:00 | 28:30 | 8:00 | 20:30 | 3–4 / 2–3 |
| R0-D | 7 × 1:30 | 1:30 × 6 | 5:00 / 5:00 | 29:30 | 10:30 | 19:00 | 3–4 / 2–3 |
| R0-E | 6 × 2:00 | 1:30 × 5 | 5:00 / 5:00 | 29:30 | 12:00 | 17:30 | 3–4 / 2–3 |
| R0-F | 5 × 3:00 | 2:00 × 4 | 5:00 / 5:00 | 33:00 | 15:00 | 18:00 | 3–4 / 2–3 |
| R0-G | 4 × 4:00 | 2:00 × 3 | 5:00 / 5:00 | 32:00 | 16:00 | 16:00 | 3–4 / 2–3 |
| R0-H | 3 × 5:00 | 2:00 × 2 | 5:00 / 5:00 | 29:00 | 15:00 | 14:00 | 3–4 / 2–3 |
| R0-I, ciclo-ponte | Sessão 1: 3 × 5:00. Sessão 2: 2 × 5:00. Sessão 3: 5:00 contínuos | Sessão 1: 2:00 × 2. Sessão 2: 2:00 × 1. Sessão 3: sem intervalo | 5:00 / 5:00 em cada sessão | 29:00, 22:00, 15:00 | 15:00, 10:00, 5:00 | 14:00, 12:00, 10:00 | 3–4 / 2–3 |

**Saída funcional proposta de R0:** ter uma sessão contínua de 5 min registrada sem sintoma de alerta e com resposta de esforço/recuperação aceitável segundo o ciclo aprovado. Isso permite reavaliar a classe funcional; não significa liberação médica. O médico deve decidir se este ciclo-ponte é progressão adequada e se sua redução de minutos de corrida é apropriada.

**Ponto de carga para decisão:** o total de corrida semanal cai do R0-H para o R0-I misto. Essa redução faz parte do rascunho de transição, não é regra estabelecida. Aprovar, redistribuir os estímulos ou exigir uma ponte diferente.

## Matriz R1 proposta

**Entrada funcional provisória:** de 5 a menos de 15 min contínuos. A intenção é usar blocos mais longos que R0. Na entrada, o prescritor seleciona estágio conforme capacidade medida e histórico recente. O mapeamento automático pelo formulário ainda não está aprovado.

| Estágio | Blocos corrida | Recuperação entre blocos | Aquecer / desaquecimento | Duração total da sessão | Tempo de corrida | Caminhada total | RPE corrida / caminhada |
|---|---|---|---|---:|---:|---:|---|
| R1-A | 6 × 2:00 | 1:30 × 5 | 5:00 / 5:00 | 29:30 | 12:00 | 17:30 | 3–4 / 2–3 |
| R1-B | 6 × 3:00 | 1:30 × 5 | 5:00 / 5:00 | 35:30 | 18:00 | 17:30 | 3–4 / 2–3 |
| R1-C | 5 × 4:00 | 1:30 × 4 | 5:00 / 5:00 | 36:00 | 20:00 | 16:00 | 3–4 / 2–3 |
| R1-D | 4 × 6:00 | 2:00 × 3 | 5:00 / 5:00 | 40:00 | 24:00 | 16:00 | 3–4 / 2–3 |
| R1-E | 3 × 8:00 | 2:00 × 2 | 5:00 / 5:00 | 38:00 | 24:00 | 14:00 | 3–4 / 2–3 |
| R1-F | 2 × 10:00 | 2:00 × 1 | 5:00 / 5:00 | 32:00 | 20:00 | 12:00 | 3–4 / 2–3 |
| R1-G, ciclo-ponte | Sessão 1: 2 × 10:00. Sessão 2: 12:00 contínuos. Sessão 3: 15:00 contínuos | Sessão 1: 2:00 × 1. Sessões 2 e 3: sem intervalo | 5:00 / 5:00 em cada sessão | 32:00, 22:00, 25:00 | 20:00, 12:00, 15:00 | 12:00, 10:00, 10:00 | 3–4 / 2–3 |

**Saída funcional proposta de R1:** registrar 15 min contínuos no ciclo, com resposta tolerada pelos critérios clínicos aprovados. Reclassificar capacidade funcional para R2 sem reiniciar automaticamente em R2-A; o prescritor deve transferir o estágio de modo que a primeira carga de R2 não seja uma regressão injustificada. O mapeamento entre classes requer validação.

**Ponto de carga para decisão:** a sequência R1-F/R1-G reduz o total semanal de corrida enquanto aumenta o maior bloco contínuo. Validar se essa redução é intencional e compatível com o volume recente.

## Matriz R2 proposta

**Entrada funcional provisória:** de 15 a menos de 30 min contínuos. A sequência transita de intervalos mais longos para corrida contínua. A primeira etapa sugerida depende do máximo contínuo medido e do histórico de carga. Para debate, iniciar em R2-A para capacidade de 15–19 min, R2-B para 20–24 min e R2-D para 25–29 min. Esse mapeamento é uma regra operacional inventada para tornar a matriz aplicável e requer aprovação explícita.

| Estágio | Blocos corrida | Recuperação entre blocos | Aquecer / desaquecimento | Duração total da sessão | Tempo de corrida | Caminhada total | RPE corrida / caminhada |
|---|---|---|---|---:|---:|---:|---|
| R2-A | 4 × 5:00 | 2:00 × 3 | 5:00 / 5:00 | 36:00 | 20:00 | 16:00 | 3–4 / 2–3 |
| R2-B | 3 × 8:00 | 2:00 × 2 | 5:00 / 5:00 | 38:00 | 24:00 | 14:00 | 3–4 / 2–3 |
| R2-C | 3 × 10:00 | 2:00 × 2 | 5:00 / 5:00 | 44:00 | 30:00 | 14:00 | 3–4 / 2–3 |
| R2-D | 3 × 11:00 | 2:00 × 2 | 5:00 / 5:00 | 47:00 | 33:00 | 14:00 | 3–4 / 2–3 |
| R2-E | 2 × 15:00 | 2:00 × 1 | 5:00 / 5:00 | 42:00 | 30:00 | 12:00 | 3–4 / 2–3 |
| R2-F, ciclo-ponte | Sessão 1: 2 × 12:00. Sessão 2: 18:00 contínuos. Sessão 3: 20:00 contínuos | Sessão 1: 2:00 × 1. Sessões 2 e 3: sem intervalo | 5:00 / 5:00 em cada sessão | 36:00, 28:00, 30:00 | 24:00, 18:00, 20:00 | 12:00, 10:00, 10:00 | 3–4 / 2–3 |
| R2-G | 20:00, 22:00, 24:00 contínuos, uma sessão por dia | Sem intervalo | 5:00 / 5:00 em cada sessão | 30:00, 32:00, 34:00 | 20:00, 22:00, 24:00 | 10:00 cada | 3–4 / 2–3 |
| R2-H | 25:00, 27:00, 30:00 contínuos, uma sessão por dia | Sem intervalo | 5:00 / 5:00 em cada sessão | 35:00, 37:00, 40:00 | 25:00, 27:00, 30:00 | 10:00 cada | 3–4 / 2–3 |

**Saída funcional proposta de R2:** demonstrar capacidade contínua de 30 min com resposta tolerada no ciclo aprovado. Isso conclui a etapa de transição, não significa automaticamente que o objetivo de 5 km foi concluído. A passagem para R3 e o plano de distância precisam ser estabelecidos na próxima parte da matriz.

**Ponto de carga para decisão:** o ciclo-ponte R2-F aumenta o bloco contínuo e reduz o tempo total semanal de corrida comparado ao R2-E. Aprovar essa troca de duração total por continuidade, alterar os valores ou criar estágios intermediários.

## Variação de minutos de corrida entre etapas

Os números abaixo somam somente minutos de corrida nos três treinos do ciclo. A variação é calculada em relação à etapa imediatamente anterior. Ela não representa carga fisiológica completa, porque exclui velocidade, terreno, desnível, caminhada, força e recuperação individual. Expõe transições que merecem revisão, especialmente aumentos acima de 20% ou quedas por mudança para corrida contínua.

| Caminho | Minutos semanais de corrida por etapa | Variação entre etapas |
|---|---|---|
| R0-A a H | 12, 18, 24, 31,5, 36, 45, 48, 45 | +50%, +33%, +31%, +14%, +25%, +7%, −6% |
| R0-I, ciclo-ponte | 30 | −33% após R0-H |
| R1-A a F | 36, 54, 60, 72, 72, 60 | +50%, +11%, +20%, 0%, −17% |
| R1-G, ciclo-ponte | 47 | −22% após R1-F |
| R2-A a E | 60, 72, 90, 99, 90 | +20%, +25%, +10%, −9% |
| R2-F, ciclo-ponte | 62 | −31% após R2-E |
| R2-G e H | 66, 82 | +6%, +24% |

Essas variações indicam que a matriz ainda precisa de revisão, particionamento em subestágios ou decisões explícitas de descarga/transição antes de servir como tabela implementável. Não alterei os valores para forçar uma regra percentual arbitrária.

**Ponto de carga para decisão:** o ciclo-ponte R2-F aumenta o bloco contínuo e reduz o tempo total semanal de corrida comparado ao R2-E. Aprovar essa troca de duração total por continuidade, alterar os valores ou criar estágios intermediários.

## Regra adaptativa proposta para cada ciclo

Um ciclo é a avaliação das três sessões planejadas e deve terminar com decisão de ciclo. Todos os itens programados recebem estado: concluído, parcialmente concluído, não iniciado ou interrompido, mais motivo. Faltas não são apagadas nem tratadas como sessão concluída. A ausência de registro bloqueia progressão automática até reconciliação. Os números abaixo são critérios operacionais de discussão, não limiares de diretrizes.

| Estado | Proposta quantitativa para discussão médica | Ação do produto proposta |
|---|---|---|
| Progredir | Pelo menos 2 das 3 sessões concluídas; todas as três têm resultado ou motivo registrado; em cada sessão concluída, pelo menos 80% dos blocos de corrida foram feitos; RPE de corrida ≤4/10; recuperação retornou ao padrão habitual antes da sessão seguinte; sem sinal de alerta e sem dor nova ou piora funcional. A terceira sessão pode faltar por motivo não clínico documentado, então conclusão total não é requisito absoluto. | Avançar um estágio após fechar o ciclo, nunca durante a semana. Persistir justificativas e métricas consideradas. |
| Manter | Ciclo documentado sem gatilho de redução ou revisão, mas não cumpre todos os critérios de progressão, por exemplo só 1 sessão concluída, esforço acima do alvo sem sinal grave, recuperação parcial já resolvida ou falta com motivo clínico não esclarecido. | Repetir o mesmo estágio depois de resolver a causa ou revisar disponibilidade. |
| Reduzir | Proposta para revisão: 2 ou mais sessões com RPE ≥6/10; recuperação não retornou ao habitual antes da próxima sessão; ou 2 ou mais sessões incompletas por incapacidade de tolerar os blocos. | Recuar um estágio ou reduzir 1 bloco por sessão, conforme protocolo e validação clínica. Não reduzir e progredir simultaneamente. |
| Revisão profissional | Sintoma potencialmente grave; nova lesão ou dor crescente que altere a marcha/função; mudança relevante de condição de saúde; sinal desconhecido que não seja possível classificar com segurança. | Bloquear novo treino automático, exibir orientação clínica aprovada e registrar liberação por profissional antes de retomar. |

### Registro após cada sessão

Proposta de coletar RPE global e RPE das partes de corrida, blocos completados, sessão concluída/parcial/interrompida, motivo da interrupção/falta, dor antes/durante/imediatamente após e no dia seguinte, mudança na marcha/função, fadiga, recuperação antes da próxima sessão, sintomas de alerta e alteração de saúde/medicação. O médico deverá decidir escala, âncoras, momento, obrigatoriedade e limiares finais.

**Inconsistência a resolver antes de automatizar:** o rascunho usa 80%, 2/3, RPE≤4 e RPE≥6 para propor decisões de ciclo. A evidência citada não determina esses cortes. O responsável deve aprovar, substituir ou remover cada um. Na ausência dessa aprovação, o software não deve progredir automaticamente por esses parâmetros.

## Revisão e ajuste individual da prescrição

Requisito arquitetural proposto: um profissional autorizado pode revisar e modificar a prescrição de um paciente sem alterar o protocolo global.

1. O ajuste cria uma nova revisão imutável vinculada ao paciente, programa, ciclo e versão do protocolo usada na prescrição original. Não sobrescreve o histórico da prescrição anterior.
2. Registrar identificador do profissional autenticado, papel/credencial usada para autorizar a ação, data/hora do servidor, motivo obrigatório, dados alterados, valores anteriores e novos, estado da revisão e versão da prescrição substituída.
3. O profissional só modifica pacientes aos quais tem autorização no HAG OS. A autorização deriva da sessão/servidor existente, nunca de `patient_id` fornecido pelo navegador.
4. Link/token do paciente continua limitado a ler contexto e enviar avaliação/execução permitida. Não pode criar, aprovar ou editar override clínico.
5. Mostrar ao paciente a prescrição vigente e uma indicação compreensível de que houve ajuste; a nota clínica interna e o motivo sensível seguem as permissões do HAG OS.
6. Duas alterações concorrentes devem detectar conflito de versão. A correção de um ajuste é outra revisão, preservando auditoria.
7. Testes devem comprovar autorização por paciente e profissional, impossibilidade de paciente alterar prescrição, histórico de revisões, autoria confiável, trilha de motivo/data/versão e resolução de concorrência.

Antes de implementar, é necessário mapear a autenticação e a autorização real do profissional no HAG OS. Não presumir que `auth.uid()` corresponda a um médico nem criar role/tabela privilegiada sem verificar o sistema existente.

## Decisões médicas pendentes nesta proposta

| Decisão | Proposta do rascunho | Parecer |
|---|---|---|
| Frequência | 3 sessões por ciclo semanal em R0–R2, não consecutivas | Pendente |
| Carga inicial e histórico | Coletar duração de corrida nas quatro semanas anteriores e usar mediana para selecionar uma etapa compatível | Pendente, sem fórmula aprovada |
| Regra de progressão da carga | Frequência fixa, mudar uma dimensão principal por vez, rever volume agregado; sem regra percentual automática | Pendente |
| Variação permitida de minutos de corrida entre etapas | Revisar aumentos de +20% a +50% e quedas nas pontes; decidir se adiciona subestágios, muda repetições ou usa outro limite | Pendente |
| RPE de corrida/caminhada | 3–4 / 2–3 em escala 0–10 com âncoras verbais | Pendente |
| Aquecimento/desaquecimento | 5 min caminhando cada | Pendente, tem precedente no NHS C25K |
| Caminhada após última repetição | Não; recuperação só entre blocos, seguida de desaquecimento | Pendente |
| Tempos e repetições R0 | Matriz R0-A a R0-I | Pendente |
| Tempos e repetições R1 | Matriz R1-A a R1-G | Pendente |
| Tempos e repetições R2 | Matriz R2-A a R2-H | Pendente |
| Seleção inicial do estágio | Por prescritor até validar mapeamento automático | Pendente |
| Progressão de ciclo | Pelo menos 2/3, 80% dos blocos, RPE ≤4, recuperação habitual e sem alertas | Pendente; cortes são escolhas operacionais HAG |
| Manter | Ciclo documentado que não cumpre todos critérios de avanço, sem red flag | Pendente |
| Reduzir | Duas sessões com RPE ≥6, recuperação abaixo do habitual ou incapacidade repetida de concluir | Pendente; dose de redução depende de aprovação |
| Revisão | Red flag, lesão/dor progressiva com limitação, mudança de saúde ou situação incerta | Pendente; texto e destino de atendimento necessários |
| Mapeamento entre R0/R1/R2 | Preservar estágio equivalente ao subir de nível, sem reiniciar em dose menor | Pendente |
| Ajuste individual pelo profissional | Revisão versionada, auditável, com autoria, data, motivo e versão-base | Requisito consolidado para arquitetura; autorização do HAG OS ainda a mapear |

## Protocolo de validação antes de codificar

1. O responsável médico aprova, rejeita ou altera cada linha da tabela anterior e os critérios de triagem.
2. Rever a soma de corrida/caminhada e as transições de carga, especialmente os ciclos-ponte, em simulações sintéticas limítrofes.
3. Definir se os estágios são repetidos por ciclo ou avançam somente após o critério de ciclo; definir plano para duas sessões disponíveis e falta de dados.
4. Definir triagem institucional, mensagens para sintomas graves, critérios de avaliação clínica e retorno após liberação.
5. Documentar versão assinada/aprovada, responsável e data. Só então transformar os valores aprovados em testes de aceitação, atualizar motor/RPC e revalidar em ambiente isolado.

## Referências

- Riebe D, Franklin BA, Thompson PD, et al. *Updating ACSM’s Recommendations for Exercise Preparticipation Health Screening*. Medicine & Science in Sports & Exercise. 2015;47(11):2473–2479. [Texto integral](https://journals.lww.com/acsm-msse/fulltext/2015/11000/updating_acsm_s_recommendations_for_exercise.28.aspx).
- NHS. *Couch to 5K running plan*. [Plano e sessões](https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/).
- CDC. *Measuring Physical Activity Intensity*. [Talk test e intensidade percebida](https://www.cdc.gov/physicalactivity/basics/measuring/index.html).
- ACSM. *Guidelines for Exercise Testing and Prescription*. [Descrição oficial do manual FITT](https://acsm.org/education-resources/books/exercise-testing-prescription/).
- Sociedade Brasileira de Cardiologia. *Diretriz Brasileira de Ergometria em População Adulta, 2024*. [Diretriz](https://abccardiol.org/en/article/diretriz-brasileira-de-ergometria-em-populacao-adulta-2024/).

**Parecer final desta matriz:** proposta para discussão. Nenhum número, regra de triagem ou critério de progressão foi aprovado por este documento. Manter o código clínico inalterado até decisão médica registrada.
