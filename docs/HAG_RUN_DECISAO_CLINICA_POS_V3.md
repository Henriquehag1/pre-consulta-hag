# HAG RUN, registro de decisões clínicas após a matriz v3

**Data do registro original:** 27/10/2026
**Atualização:** 27/10/2026
**Status:** registro histórico acrescido de aprovação expressa de dez diretrizes de produto. A aprovação não valida parâmetros clínicos numéricos nem libera o sistema para uso assistencial.

**Leitura vigente:** a seção 8 é a decisão mais recente e prevalece sobre estados provisórios das seções anteriores somente nos dez itens que enumera. Todo parâmetro não explicitamente coberto permanece pendente.

## 1. Documentos de referência

Este registro preserva o parecer recebido após a revisão da [matriz clínica proposta v3 R0–R2](HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v3_R0-R2.md). A v3 permanece como referência histórica. A especificação consolidada vigente é [HAG_RUN_ESPECIFICACAO_FINAL_v1.md](HAG_RUN_ESPECIFICACAO_FINAL_v1.md). A seção 8 abaixo atualiza somente as decisões expressamente aprovadas em 27/10/2026; pareceres anteriores permanecem como histórico e não se sobrepõem a essa atualização.

## 2. Parecer registrado

| Componente | Decisão recebida | Estado para desenvolvimento |
|---|---|---|
| Estrutura funcional R0–R2 | Favorável como arquitetura provisória | Consolidar como requisito de organização, sem tratar a classificação como liberação para exercício |
| Separação entre capacidade funcional, carga tolerada e estágio prescrito | Favorável | Manter como requisito clínico e de dados |
| Frequência individual de duas ou três sessões | Favorável como princípio | Considerar a frequência efetivamente prescrita ao avaliar cada ciclo |
| Pontes R0→R1 e R1→R2 | Favorável ao conceito; valores ainda pendentes | Preservar como hipóteses de transição de continuidade, registrar seu motivo |
| Modelo A da transição R2 | Manter para comparação | Alternativa não aprovada |
| Modelo B da transição R2 | Preferência do responsável para refinamento | Hipótese de desenho preferencial, sem conclusão de superioridade clínica |
| Redução inicial de 15 minutos no Modelo B | Manter para avaliação | Parâmetro experimental pendente; representa 25% do ciclo de 60 min em 2x e cerca de 17% do ciclo de 90 min em 3x |
| Incrementos de dois minutos | Considerar na proposta | Valores provisórios; a resposta à etapa anterior pode justificar repetir, ajustar ou não avançar |
| Progressão automática | Não aprovada | Critérios de progressão, manutenção, redução e encaminhamento seguem pendentes |
| Triagem e liberação para exercício | Não aprovadas | Regras de segurança precisam ser definidas antes de prescrição automática |
| Implementação clínica | Não autorizada | Manter código clínico inalterado |

A preferência pelo Modelo B serve apenas para orientar o próximo refinamento. Não demonstra que ele seja mais seguro ou eficaz que o Modelo A. A redução de volume é planejada na hipótese, mas não está aprovada como regra.

## 3. Requisitos consolidados para as próximas decisões

### 3.1 Entrada em um estágio

- A capacidade contínua observada sustenta a classificação funcional e limita quais blocos contínuos podem ser considerados.
- A carga tolerada deve ser avaliada em separado, com volume por sessão e ciclo, frequência realizada, maior bloco, esforço, sintomas e recuperação.
- O estágio prescrito é escolhido considerando capacidade, carga, recuperação, disponibilidade e decisão clínica. Não é inferido apenas do nível R0–R2.
- Completar R2-K, isoladamente, não autoriza o início da transição para corrida contínua. Devem estar registrados a recuperação, a tolerância à carga e o bloco contínuo demonstrado.
- O maior bloco contínuo não representa o total de corrida tolerado; esses valores precisam permanecer separados nos registros e na avaliação.
- Dados ausentes ou inconsistentes não devem provocar progressão automática. O tratamento final desses casos ainda depende do médico.

### 3.2 Avaliação do ciclo

O ciclo deve comparar a dose realmente prescrita para a pessoa com a dose realizada, não com uma frequência padrão que não foi prescrita. Para cada sessão, a especificação clínica futura deverá distinguir concluída, parcial, interrompida e não realizada, com motivo registrado.

No fechamento, avaliar minutos de corrida prescritos e realizados, maior bloco contínuo, RPE e talk test, dor ou outros sintomas, fadiga, recuperação entre sessões e mudanças relevantes de saúde ou disponibilidade. Ainda não foram aprovados valores mínimos, limiares ou a regra que combina esses dados.

### 3.3 Motivo e interpretação da mudança

Registrar por que a prescrição mudou para diferenciar:

- progressão de continuidade, com redistribuição deliberada dos intervalos;
- manutenção da capacidade ou repetição do ciclo;
- redução por recuperação insuficiente;
- ajuste após baixa tolerância ao esforço;
- ajuste clínico individual;
- mudança de disponibilidade;
- revisão por sintoma ou lesão.

Essas categorias são requisitos semânticos para discussão. Os nomes, campos, combinações válidas e ações associadas não estão aprovados para código.

## 4. Agenda clínica pendente, sem valores presumidos

| Ordem | Decisão a obter | Perguntas para o responsável médico |
|---:|---|---|
| 1 | Triagem e segurança | Quais perguntas são obrigatórias? Quais respostas bloqueiam, geram alerta ou permitem avaliação funcional? Qual orientação deve aparecer para sintoma durante a sessão, e quais condições exigem revisão antes de retomar? |
| 2 | Seleção inicial R0–R2 | Qual evidência demonstra capacidade contínua? Qual janela histórica de corrida é útil? Quais campos mínimos de volume, frequência e recuperação sustentam a escolha de um estágio? Como agir quando o histórico não existe? |
| 3 | Progressão após um ciclo | Que proporção ou quantidade de carga precisa ter sido realizada? Como interpretar sessão parcial, falta por disponibilidade ou interrupção por esforço? Quais dados de recuperação e sintomas permitem considerar avanço? |
| 4 | Manutenção | Quais motivos levam a repetir a dose? Por quanto tempo ou em que evento a repetição deve gerar reavaliação? Como diferenciar manutenção deliberada de ausência de resposta? |
| 5 | Redução | Que ação concreta corresponde a cada causa, como recuperação insuficiente, baixa tolerância, mudança de saúde ou limitação de agenda? Quando reduzir blocos, repetições, frequência ou retornar a etapa anterior? |
| 6 | Dor, sintomas e fadiga | Quais respostas interrompem a sessão? Quais exigem bloqueio, avaliação urgente ou contato profissional? Quais podem levar a pausa e reavaliação? Quais regras de retorno precisam de aprovação? |
| 7 | Retorno após interrupção | Como retomar após faltas, doença, lesão, viagem ou intervalo prolongado? Quando usar carga recente anterior, reavaliar a capacidade ou solicitar decisão profissional? |
| 8 | Caminho R2, preferência Modelo B | O paciente precisa tolerar R2-K e demonstrar 15 min contínuos antes do primeiro ciclo? A redução de 15 min é aceitável em 2x e 3x? As sessões intervaladas restantes devem permanecer idênticas a R2-K? |
| 9 | Incremento contínuo R2 | Dois minutos são apenas um incremento candidato. Quais respostas permitem avançar, repetir, usar incremento diferente ou interromper a sequência? Como considerar blocos de 15 a 30 min e o ciclo correspondente? |
| 10 | Frequência 2x versus 3x | A mesma progressão contínua pode ser usada com as duas frequências? Qual separação mínima se aplica e como recuperação insuficiente adia o ciclo? |

Esta agenda delimita decisões clínicas; não preenche as respostas. O Modelo B da v3 permanece somente uma hipótese preferida para refinamento, e o Modelo A permanece disponível para comparação. A proposta de triagem e liberação a revisar linha a linha está em [HAG_RUN_MATRIZ_TRIAGEM_SEGURANCA_LIBERACAO_PROPOSTA_v1.md](HAG_RUN_MATRIZ_TRIAGEM_SEGURANCA_LIBERACAO_PROPOSTA_v1.md).

## 5. Critérios de implementação futura

Não alterar o motor até haver decisões clínicas registradas para triagem, seleção de entrada, avaliação de ciclo, ações concretas de manter/reduzir/revisar, retorno após interrupção e progressão R2. Depois da aprovação, traduzir cada parâmetro em especificação verificável e testes em ambiente isolado antes de qualquer uso clínico.

## 6. Limites desta decisão

Este registro não modifica a matriz global nem as prescrições individuais existentes. Não altera motor, interface, RPCs, migrações ou dados; não aprova segurança para exercício; não substitui avaliação clínica; e não autoriza uso do HAG RUN com pacientes.

## 7. Parecer de usabilidade da matriz de segurança

O parecer recebido considera adequada a arquitetura da triagem breve, dos estados operacionais, da liberação individual e com restrições, do check-in, da interrupção por sintoma e da autorização auditável no servidor. Os ajustes propostos estão registrados na seção 14 da [matriz de triagem e liberação](HAG_RUN_MATRIZ_TRIAGEM_SEGURANCA_LIBERACAO_PROPOSTA_v1.md).

| Item | Registro do parecer | Estado |
|---|---|---|
| Q7, medicamentos | Perguntar se usa medicamentos regularmente ou se houve mudança recente. O paciente informa nomes ou confirma dados existentes; não classifica risco farmacológico. | Redação proposta incorporada; revisão final pendente |
| Cartão médico | Ações Liberar, Liberar com restrições, Solicitar avaliação e Suspender, com escopo e justificativa breve | Proposta incorporada |
| VERMELHO | Suspende a corrida HAG RUN. Restrições mais amplas precisam ser explicitadas pelo profissional. | Proposta incorporada |
| Autorização inicial | Preferência recebida por permitir fluxo automático em VERDE quando triagem e avaliação funcional estiverem completas; manter análise médica no AMARELO. A autorização obrigatória para todos continua como opção institucional. | Decisão de governança pendente |
| Resolução de pendências | Médico revisa somente resposta/evento e dados necessários, preservando a triagem anterior, sem repetir o questionário completo. | Proposta incorporada |
| Implementação | Nenhuma autorização para modificar regras clínicas do motor. | Não autorizada |

A próxima prioridade clínica é definir critérios de progressão, manutenção, redução concreta de carga e retorno após interrupções. A preferência pelo Modelo B de R2 permanece apenas como hipótese de refinamento.


## 8. Aprovação expressa de diretrizes de produto, 27/10/2026

O médico responsável aprovou expressamente as dez diretrizes abaixo. A aprovação está limitada à redação desta lista. Não converte parâmetros de matrizes, limiares do código ou recomendações deste registro em protocolo clínico aprovado.

| # | Diretriz aprovada | Limite que permanece pendente |
|---:|---|---|
| 1 | População inicial adulta. | Exclusões e critérios adicionais de elegibilidade. |
| 2 | Objetivo principal: completar 5 km contínuos. | Protocolo de avaliação e prontidão. |
| 3 | R0–R4 no escopo inicial; R5 reservado para versão futura. | Cortes funcionais e critérios finais de entrada R4. |
| 4 | Duas ou três sessões semanais individualizadas. | Escolha da frequência e espaçamento por perfil. |
| 5 | Intensidade inicial predominantemente leve. | Escala, faixa de RPE, talk test e parâmetros operacionais. |
| 6 | Autorização médica obrigatória do primeiro plano. | Campos, escopo codificável, validade e fluxos de revisão. |
| 7 | Adaptação automática somente dentro do escopo autorizado. | Envelope quantitativo e eventos invalidadores. |
| 8 | Avaliação do ciclo completo. | Métricas, limiares, janela e tratamento de sessões parciais. |
| 9 | Quatro resultados: progredir, manter, reduzir ou revisão profissional. | Gatilhos e dose concreta de manutenção/redução. |
| 10 | Conclusão baseada em 5 km contínuos efetivamente registrados. | Método de medição, tolerância operacional e registro de interrupções. |

### 8.1 Efeito sobre o parecer anterior

As afirmações nas seções 2 a 7 que diziam que a progressão automática, autorização inicial e escopo de R5 não estavam decididos são registros do estado anterior à aprovação. Para fins de decisão vigente, aplicar a lista da seção 8 e a classificação MED-01 a MED-26 da especificação consolidada. Os parâmetros não contemplados continuam pendentes. Em particular, esta aprovação **não** aprova tempos de corrida/caminhada, frequências por nível, limiares de RPE/dor/fadiga, janela de carga, regra de progressão, dose de redução, retorno após interrupção, protocolo de urgência nem fórmula R3/R4.

### 8.2 Quadro residual único

O único quadro residual vigente está na seção 17 de [HAG_RUN_ESPECIFICACAO_FINAL_v1.md](HAG_RUN_ESPECIFICACAO_FINAL_v1.md). Ele recomenda decisões específicas para cada assunto ainda aberto, preservando alternativas quando não há base para selecionar um parâmetro. Não manter tabelas paralelas de pendências neste registro; usar aquele quadro como referência para a revisão conjunta.

### 8.3 Limites de implementação

A aprovação de diretrizes de produto não autoriza por si só alterar código clínico. Motor, interface, RPCs, migrações, Supabase e produção permanecem inalterados nesta atualização documental. Implementar somente após registrar os parâmetros clínicos específicos aplicáveis e convertê-los em critérios verificáveis e testes.
