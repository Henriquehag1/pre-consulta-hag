# HAG RUN v1.0, especificação clínica para decisão

**Status: RASCUNHO PARA APROVAÇÃO MÉDICA. Não autoriza implementação das novas regras nem liberação a pacientes.**

Este documento converte o parecer preliminar do responsável médico em requisitos verificáveis e uma lista estruturada dos parâmetros que ainda precisam de decisão. Valores ausentes permanecem pendentes; não foram completados por inferência. A descrição linha a linha do comportamento atual e as simulações estão em [HAG_RUN_AUDITORIA_CLINICA.md](HAG_RUN_AUDITORIA_CLINICA.md).

Uma primeira tradução dos requisitos em parâmetros discutíveis para R0–R2 está em [HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v1_R0-R2.md](HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v1_R0-R2.md). A comparação solicitada para a segunda versão está em [HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v2_R0-R2.md](HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v2_R0-R2.md). A revisão subsequente de entradas e dois modelos de transição R2 está em [HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v3_R0-R2.md](HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v3_R0-R2.md). O parecer mais recente e a agenda de decisões pendentes estão em [HAG_RUN_DECISAO_CLINICA_POS_V3.md](HAG_RUN_DECISAO_CLINICA_POS_V3.md). A proposta de segurança com matriz por resposta e invalidação de liberações está em [HAG_RUN_MATRIZ_TRIAGEM_SEGURANCA_LIBERACAO_PROPOSTA_v1.md](HAG_RUN_MATRIZ_TRIAGEM_SEGURANCA_LIBERACAO_PROPOSTA_v1.md). Todos os valores e regras das matrizes seguem como proposta sem aprovação clínica.

## 1. Decisão recebida

- A estrutura técnica atual é aceita como **base de desenvolvimento**, não como protocolo clínico aprovado para pacientes.
- Manter seis níveis funcionais R0–R5 provisoriamente. Eles descrevem capacidade funcional de corrida, não risco médico. Os cortes atuais são operacionais do HAG RUN, sem pretensão de pontos de corte fisiológicos universais.
- Solicitar modificações clínicas antes da liberação: triagem mais ampla, progressão avaliada ao fim do ciclo completo, prescrições distintas para R0/R1, continuidade da progressão de R2 depois da semana 8 e desfecho funcional de 5 km contínuos.
- O HAG RUN deverá se comportar como prescrição adaptativa. Não tratar 12 semanas como calendário fixo nem considerar a conclusão da semana 12 prova automática de conclusão do objetivo.
- Não alterar as prescrições do motor nesta etapa. Parâmetros ainda não definidos dependem de decisão do médico responsável.

## 2. Princípios aprovados provisoriamente

### 2.1 Classificação funcional

Usar capacidade funcional para organizar a prescrição, mantendo provisoriamente os cortes já documentados:

| Nível funcional | Corte atual proposto para manutenção provisória | Estado da decisão |
|---|---|---|
| R0 | Menos de 5 min de corrida contínua | Manter provisoriamente; reavaliar com casos simulados e supervisão |
| R1 | De 5 a menos de 15 min | Manter provisoriamente; reavaliar com casos simulados e supervisão |
| R2 | De 15 a menos de 30 min | Manter provisoriamente; reavaliar com casos simulados e supervisão |
| R3 | 30 min ou mais, sem critérios funcionais superiores | Manter provisoriamente; reavaliar com casos simulados e supervisão |
| R4 | Capacidade/experiência funcional compatível com completar 5 km | Conceito aprovado como direção; critério de código permanece por validar |
| R5 | Corredor com histórico recente e objetivo de melhorar desempenho em 5 km | Conceito aprovado como direção; critério de código permanece por validar |

Os cortes atuais exatos de R4/R5 no software também dependem de quilometragem semanal, dias correndo e prova recente. O responsável deve confirmar se esses critérios pertencem à classificação funcional e decidir seus valores finais. Nenhum nível substitui triagem médica nem calcula risco.

### 2.2 Estados de decisão do ciclo

A lógica clínica futura deverá distinguir quatro resultados:

1. **Progredir** para próximo estágio quando os critérios médicos aprovados forem satisfeitos.
2. **Manter** o estágio atual.
3. **Reduzir** a carga prescrita segundo regra aprovada, se aplicável.
4. **Bloquear e encaminhar para avaliação profissional** quando houver condição aprovada de revisão.

O parecer pede avaliação do ciclo completo, adesão, esforço em relação ao prescrito, dor durante e depois, fadiga acumulada, recuperação entre sessões e alterações de disponibilidade/condição clínica. A conclusão de todas as sessões não precisa ser requisito absoluto. Portanto, a decisão deverá avaliar faltas e interrupções explicitamente, mas o limiar de presença/adesão está **pendente**.

### 2.3 Desfecho do programa

O objetivo funcional principal proposto é **completar 5 km continuamente, em intensidade confortável, sem sinais de alerta e com recuperação adequada**. O teste deve depender de prontidão e não de calendário fixo na semana 12. O programa deverá admitir extensão enquanto necessário.

“Confortável”, “prontidão” e “recuperação adequada” precisam de critérios operacionais aprovados. Até lá, o desfecho está definido qualitativamente, não como regra automatizável.

## 3. Requisitos clínicos solicitados

Os requisitos abaixo incorporam o parecer e ainda não são implementação.

### CLIN-01, triagem antes da prescrição

Ampliar a avaliação antes de gerar sessões. A avaliação deve cobrir antecedentes clínicos relevantes, sintomas, medicamentos que possam modificar a resposta ao exercício e limitações musculoesqueléticas. A necessidade de avaliação adicional deverá depender do risco identificado e não induzir solicitação indiscriminada de exames.

**Parâmetros que aguardam definição médica:** lista exata de perguntas/categorias; quais respostas bloqueiam, alertam ou permitem prescrição; o que caracteriza encaminhamento urgente; texto de interrupção e orientação de procura de atendimento; critérios para retomar após revisão. A escala de dor musculoesquelética não poderá substituir a regra para sintomas potencialmente graves.

### CLIN-02, separar classificação funcional de segurança

R0–R5 devem indicar somente capacidade funcional de corrida. A avaliação de risco e as decisões de bloqueio/encaminhamento devem ser distintas, com campos e resultados próprios. Uma classificação R0–R5 não é liberação médica.

### CLIN-03, prescrição inicial distinta em R0 e R1

R0: estratégia conservadora com alternância de caminhada e corrida muito curta.

R1: intervalos de corrida mais longos, respeitando a capacidade contínua informada.

**Aguardam decisão:** duração de corrida/caminhada por intervalo, repetições, aquecimento e desaquecimento, frequência-alvo, RPE/ritmo, espaçamento, volume inicial, critérios de repetição e progressão. Não copiar automaticamente os tempos atuais ou aplicar aumento linear.

### CLIN-04, transição e progressão de R2

R2 deve progredir gradualmente de intervalos para corrida contínua, sem o platô atual nas semanas 9–12. A nova progressão deve levar ao objetivo definido, sem pressupor que um número fixo de semanas seja suficiente.

**Aguardam decisão:** estágios, frequência, tempos de corrida e caminhada, quando introduzir corrida contínua, critérios para manter/regredir, necessidade de descarga e critério de passagem para outro nível/desfecho.

### CLIN-05, consolidação de R3/R4 e desempenho R5

Direções propostas pelo parecer:

- R3: consolidar corrida contínua e progredir duração.
- R4: consolidar 5 km e tolerância ao treinamento.
- R5: manter sessões leves e estímulos específicos de desempenho.

As durações, intensidades, volumes, frequência, paces, intervalos, adaptação ao volume recente e critérios de transição precisam de aprovação. A quilometragem semanal informada hoje não dimensiona diretamente o volume inicial gerado em R0–R3 e só atua como limiar de classificação em R4/R5; esse comportamento precisa ser deliberado.

### CLIN-06, ciclo completo de progressão adaptativa

Não autorizar avanço baseado apenas nas duas últimas sessões toleradas. Ao fechar o ciclo prescrito, considerar em conjunto:

- sessões planejadas e realizadas;
- adesão, faltas, motivo e sessões incompletas;
- RPE observado em relação ao RPE prescrito;
- dor durante e após o exercício;
- fadiga acumulada;
- recuperação entre sessões;
- alterações relevantes na disponibilidade;
- alterações clínicas declaradas durante o ciclo.

**Aguardam decisão:** o que caracteriza “ciclo completo” para cada frequência; proporção/quantidade mínima de sessões necessária, se houver; como tratar faltas e dados ausentes; janelas de recuperação; tendência de fadiga; discrepância aceitável entre RPE prescrito e observado; peso de cada variável; critérios numéricos dos quatro resultados (progredir/manter/reduzir/bloquear); tamanho e duração da regressão; critérios para nova tentativa. Não assumir que falta ou sessão incompleta sempre impede avanço, pois o parecer declara que conclusão total não precisa ser requisito absoluto.

### CLIN-07, sintomas e interrupção

Sintomas potencialmente graves deverão ter orientação explícita de interrupção e procura de atendimento, independente de dor musculoesquelética e da respectiva escala. O parecer cita dor torácica, síncope e dispneia desproporcional como exemplos, além de “outros sintomas potencialmente graves”.

**Aguardam decisão:** lista e redação aprovadas, diferenciação de urgência, orientação final ao paciente, registro e estado de bloqueio, profissional/equipe de destino e critérios de liberação. O aplicativo ainda não interrompe automaticamente a sessão quando há dor ou sintomas.

### CLIN-08, dor e limitações musculoesqueléticas

Revisar a regra atual de dor ≥4/10; não usá-la como regra clínica isolada. Avaliar dor durante e depois, sintomas, limitação musculoesquelética e evolução ao longo do ciclo.

**Aguardam decisão:** escala e momento das perguntas, limiares, duração/recorrência, efeito em sessão atual e próximas, gatilho de redução ou bloqueio, critério de retorno. O limiar atual permanece apenas descrição do código antigo, não parâmetro aprovado.

### CLIN-09, prontidão para teste final de 5 km

O objetivo principal pode ser considerado alcançado quando houver 5 km contínuos em intensidade confortável, sem sinais de alerta e com recuperação adequada. O teste deve ocorrer somente quando a prontidão estiver satisfeita e poderá ser adiado. O programa deve poder se estender.

**Aguardam decisão:** provas de prontidão, quantidade/recência de sessões preparatórias, critérios de conforto, segurança e recuperação, procedimento do teste, como registrar tentativa não concluída e se é necessária confirmação profissional. O código não possui este desfecho hoje.

## 4. Parâmetros para aprovação antes da implementação

Preencher ou apontar um protocolo aprovado para cada linha. Campos vazios são bloqueadores da implementação clínica correspondente.

| Decisão | Valor/regra aprovada pelo responsável médico | Estado |
|---|---|---|
| Perguntas de triagem e respostas requeridas |  | Pendente |
| Respostas que bloqueiam a prescrição ou exigem encaminhamento |  | Pendente |
| Orientação para sintoma potencialmente grave durante a sessão |  | Pendente |
| Campos de antecedentes clínicos, medicamentos e limitações |  | Pendente |
| Cortes funcionais R0–R3 | Manter provisoriamente os cortes desta especificação; ratificação final pendente | Provisório |
| Regra funcional final de R4 |  | Pendente |
| Regra funcional final de R5 |  | Pendente |
| Prescrição R0 por estágio |  | Pendente |
| Prescrição R1 por estágio |  | Pendente |
| Prescrição R2 até o desfecho |  | Pendente |
| Prescrição R3/R4/R5 e relação com carga recente |  | Pendente |
| Frequência e espaçamento por nível |  | Pendente |
| Aquecimento e desaquecimento |  | Pendente |
| Escala RPE e diferença aceitável entre alvo e observado |  | Pendente |
| Regra de dor musculoesquelética |  | Pendente |
| Medição de fadiga e recuperação entre sessões |  | Pendente |
| Métrica de adesão e tratamento de faltas/incompletas |  | Pendente |
| Regras numéricas de progredir/manter/reduzir/bloquear |  | Pendente |
| Ação e momento de reavaliação após reduzir/bloquear |  | Pendente |
| Critério de prontidão e protocolo do teste 5 km |  | Pendente |
| Como prolongar o programa e registrar conclusão |  | Pendente |

## 5. Critérios de aceite de engenharia após aprovação

Estes critérios verificam aderência à decisão médica futura; não substituem sua aprovação.

1. Motor e interface apresentam avaliação funcional e triagem separadas, sem inferir resposta negativa a dado ausente.
2. Nenhum plano é produzido quando uma resposta de bloqueio aprovada estiver ativa; o usuário recebe instrução compatível com o nível de urgência decidido.
3. Perfis R0 e R1 geram sessões distintas conforme a matriz médica aprovada.
4. R2 tem estágios contínuos definidos até critério funcional, sem repetição artificial de uma etapa apenas porque terminou uma tabela de semanas.
5. O fechamento avalia o ciclo de treino e registra realizados, faltas, interrupções, adesão, RPE, dor, fadiga, recuperação e mudanças relevantes.
6. A progressão resulta em exatamente um dos estados aprovados: progredir, manter, reduzir ou revisão profissional; decisões e justificativas são persistidas e restauradas.
7. Disponibilidade alterada recalcula sessões sem atribuir estímulo especial incorretamente pela posição do dia.
8. O programa admite mais ou menos que 12 semanas e registra o teste funcional de 5 km apenas quando critérios de prontidão aprovados forem atendidos.
9. Testes cobrem combinações limítrofes e cenários de falta, sessão incompleta, RPE acima do alvo, dor, fadiga acumulada, recuperação inadequada, sintomas de alerta, mudança de condição e extensão do programa.
10. Nenhum cenário de teste usa dados reais; a homologação técnica isolada deve continuar aprovada antes da revisão clínica final.

## 6. Riscos mantidos até aprovação e implementação

- A triagem atual é insuficiente para funcionar como autorização médica.
- A progressão atual pode avançar antes do fechamento de uma semana com três sessões.
- R0/R1 compartilham a prescrição; R2 repete a etapa 8 nas semanas 9–12.
- A carga semanal recente não dimensiona adequadamente todos os níveis.
- Dor/sintomas durante a corrida não interrompem automaticamente o cronômetro.
- `reduce` não gera dose reduzida; não há critério objetivo de prontidão para teste final ou conclusão.

Até a aprovação dos itens da seção 4, manter a homologação clínica como **não aprovada para uso com pacientes**. A aprovação preliminar da arquitetura funcional não elimina esses bloqueadores.

## 7. Registro de aprovação médica

| Revisão | Decisão | Responsável | Data | Documento/versão aprovado |
|---|---|---|---|---|
| Parecer preliminar recebido | Aprovar a estrutura técnica como base; solicitar modificações clínicas antes de liberação | Responsável médico, conforme parecer fornecido |  | Esta especificação, rascunho |
| Aprovação dos parâmetros numéricos | Pendente |  |  |  |
| Aprovação final para homologação clínica | Pendente |  |  |  |

## 8. Fonte técnica

- Regras atuais auditadas: [HAG_RUN_AUDITORIA_CLINICA.md](HAG_RUN_AUDITORIA_CLINICA.md).
- Implementação: `hag_run_engine.js`, `hag_run_HAG.html`, `hag_run_store.js` e `supabase/migrations/202610270001_hag_run.sql`.
- Esta especificação registra as decisões e solicitações recebidas; não muda esses arquivos nem substitui o registro de aprovação médica.
