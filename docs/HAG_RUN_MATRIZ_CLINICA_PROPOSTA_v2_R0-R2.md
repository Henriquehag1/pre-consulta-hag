# HAG RUN v1.0, proposta comparativa v2 para R0–R2

**Status: proposta para revisão do médico responsável. Não é protocolo aprovado e não deve ser implementada ainda.**

## 1. O que esta revisão responde

Esta v2 mantém intacta a [matriz v1](HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v1_R0-R2.md) como referência, incorpora o parecer recebido e apresenta alternativas numéricas para as transições mais abruptas. Ela também compara ciclos prescritos com duas e três sessões semanais, inclui carga total de corrida por sessão/ciclo, transições entre níveis e simulações sintéticas.

O motor, a interface, as RPCs e as migrações não foram alterados. Todos os números abaixo continuam sujeitos à aprovação médica.

### Princípios do parecer que esta versão adota

- R0–R2 são classificações funcionais, separadas da triagem de segurança.
- Três sessões não consecutivas são frequência recomendada quando compatível; a prescrição individual pode conter duas ou três sessões.
- Com duas sessões prescritas, o ciclo é avaliado sobre essas duas sessões. Não existe uma terceira sessão implícita nem se registra “falta” por ela.
- Avaliar a carga prescrita e realizada, a maior sequência contínua, RPE, dor/sintomas, recuperação entre sessões, disponibilidade e dados ausentes.
- Não usar um teto universal de 10%. Comparar a variação absoluta em minutos, a duração do maior bloco e a resposta à carga.
- Progredir, manter, reduzir ou encaminhar para revisão continuam como quatro estados propostos. A dose exata de redução e os limiares seguem pendentes.
- A triagem ampliada fica separada da escolha do estágio. O R funcional não libera clinicamente.

Como referências gerais, o NHS Couch to 5K usa três corridas semanais, descanso entre corridas e aquecimento/desaquecimento caminhando por cinco minutos. Isso serve como exemplo de formato, não valida os números HAG. O ACSM estrutura triagem em torno do nível atual de atividade, sinais/sintomas ou doença conhecida e intensidade pretendida; a decisão de avaliação é profissional. O talk test do CDC é uma indicação subjetiva de intensidade, não teste de segurança. Fontes e limites estão na [v1](HAG_RUN_MATRIZ_CLINICA_PROPOSTA_v1_R0-R2.md#o-que-as-referências-sustentam-e-o-que-não-sustentam).

## 2. Convenções comuns propostas

| Parâmetro | Proposta para revisão |
|---|---|
| Frequência | Prescrever 2 ou 3 sessões por ciclo de sete dias, explicitamente por paciente. Três é o padrão recomendado. |
| Espaçamento | Sessões em dias não consecutivos, com pelo menos um dia sem corrida entre estímulos. Não comprimir sessões para compensar falta. A recuperação observada pode adiar o calendário. |
| Aquecimento e volta à calma | 5 minutos caminhando antes e depois, RPE de caminhada 2–3/10. |
| Corrida | Sem pace/velocidade fixa em R0–R2. RPE proposto 3–4/10, com fala confortável de frases completas. Reduzir o ritmo ou caminhar se o esforço exceder o alvo. |
| Intervalos | Caminhada prescrita somente entre blocos, sem intervalo extra depois do último bloco; em seguida, desaquecimento. |
| Duração do ciclo | Adaptativa. Repetir ou ajustar estágios em função da resposta; sem prazo máximo de semanas. |
| Carga inicial | Coletar minutos efetivamente corridos por sessão e por semana nas últimas quatro semanas, frequência real, maior bloco contínuo e recuperação. O prescritor escolhe estágio considerando capacidade funcional **e** carga recente. O nível não determina sozinho a dose. |
| Dados insuficientes | Sem registro suficiente da carga ou recuperação, não avançar automaticamente. O estágio pode ser mantido ou revisado por profissional. |

Os 5 minutos de caminhada e o padrão de três sessões são referências de desenho de um programa introdutório do NHS. O RPE 3–4, a escala de transição, os critérios de ciclo e qualquer regra de redução são escolhas operacionais HAG ainda sem validação médica. Não há teto percentual automático nesta proposta.

## 3. Como ler as tabelas comparativas

- `Corrida/sessão` é a soma dos minutos dos segmentos de corrida em uma sessão.
- `Sessão total` inclui aquecimento, caminhadas entre repetições e desaquecimento. É duração planejada, não distância nem estimativa de pace.
- `Ciclo 2x` e `Ciclo 3x` somam apenas minutos de corrida para a frequência individual correspondente. Não contam caminhada como carga de corrida.
- Em sessões repetidas no mesmo estágio, todos os treinos do ciclo usam a mesma estrutura, exceto quando uma tabela de transição especifica sessões distintas.
- Caminhadas não têm velocidade prescrita; por isso quilômetros totais não são calculados.
- Comparações percentuais são descritivas. A decisão deve considerar também os minutos absolutos, o maior bloco contínuo, RPE e recuperação.

## 4. R0, sequência ajustada

**Faixa funcional provisória:** menos de 5 minutos contínuos. Em intervalos mais curtos, foram incluídas etapas intermediárias para reduzir saltos absolutos. Repete-se o estágio até a revisão do ciclo autorizar avanço. Ponto de entrada abaixo de R0-A pode ser selecionado individualmente por profissional; nível funcional, sozinho, não deve definir carga inicial.

Todas as linhas A–J têm três ou duas sessões iguais, conforme a frequência prescrita. Recuperação de 1 minuto e 30 segundos somente entre blocos.

| Estágio | Corrida por sessão | Recuperações | Corrida/sessão | Caminhada/sessão total | Sessão total | Ciclo 2x, corrida | Ciclo 3x, corrida | Maior bloco |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| R0-A | 8 × 0:30 | 1:30 × 7 | 4:00 | 20:30 | 24:30 | 8:00 | 12:00 | 0:30 |
| R0-B | 8 × 0:40 | 1:30 × 7 | 5:20 | 20:30 | 25:50 | 10:40 | 16:00 | 0:40 |
| R0-C | 8 × 0:50 | 1:30 × 7 | 6:40 | 20:30 | 27:10 | 13:20 | 20:00 | 0:50 |
| R0-D | 8 × 1:00 | 1:30 × 7 | 8:00 | 20:30 | 28:30 | 16:00 | 24:00 | 1:00 |
| R0-E | 7 × 1:15 | 1:30 × 6 | 8:45 | 19:00 | 27:45 | 17:30 | 26:15 | 1:15 |
| R0-F | 6 × 1:30 | 1:30 × 5 | 9:00 | 17:30 | 26:30 | 18:00 | 27:00 | 1:30 |
| R0-G | 5 × 2:00 | 1:30 × 4 | 10:00 | 16:00 | 26:00 | 20:00 | 30:00 | 2:00 |
| R0-H | 4 × 2:30 | 1:30 × 3 | 10:00 | 14:30 | 24:30 | 20:00 | 30:00 | 2:30 |
| R0-I | 3 × 3:30 | 1:30 × 2 | 10:30 | 13:00 | 23:30 | 21:00 | 31:30 | 3:30 |
| R0-J | 2 × 5:00 | 1:30 × 1 | 10:00 | 11:30 | 21:30 | 20:00 | 30:00 | 5:00 |

### Ponte funcional R0 → R1

O critério funcional de R0 para R1 é demonstrar pelo menos cinco minutos de corrida contínua. A matriz propõe substituir progressivamente sessões intervaladas por sessões contínuas, sem presumir que uma semana fixa seja suficiente.

| Frequência prescrita | Sessão 1 | Sessão 2 | Sessão 3 | Corrida total no ciclo | Sessões totais |
|---|---|---|---|---:|---|
| 2 sessões | 2 × 5:00, 1:30 caminhando entre blocos | 5:00 contínuos | Não prescrita | 15:00 | 21:30 e 15:00 |
| 3 sessões | 2 × 5:00, 1:30 caminhando entre blocos | 2 × 5:00, 1:30 entre blocos | 5:00 contínuos | 25:00 | 21:30, 21:30 e 15:00 |

**Ponto para decisão:** a ponte reduz o total de corrida comparada a R0-J. No ciclo de duas sessões, 20 para 15 minutos, diferença absoluta de 5 minutos; no de três sessões, 30 para 25, diferença de 5 minutos. A maior sequência contínua passa de 5 minutos intervalados para um teste/sessão de 5 minutos contínuos. O médico deve decidir se a dose e a posição dessa avaliação são adequadas.

## 5. R1, sequência ajustada

**Faixa funcional provisória:** de 5 a menos de 15 minutos contínuos. R1 usa intervalos maiores que R0. Para evitar que uma pessoa com capacidade de 14 minutos comece necessariamente na primeira linha, o ponto de entrada deve ser escolhido pelo prescritor com base no maior bloco demonstrado, carga recente, resposta e histórico. O seguinte mapeamento numérico não está aprovado.

Recuperação de 1 minuto e 30 segundos somente entre blocos.

| Estágio | Corrida por sessão | Recuperações | Corrida/sessão | Caminhada/sessão total | Sessão total | Ciclo 2x, corrida | Ciclo 3x, corrida | Maior bloco |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| R1-A | 6 × 2:00 | 1:30 × 5 | 12:00 | 17:30 | 29:30 | 24:00 | 36:00 | 2:00 |
| R1-B | 6 × 2:30 | 1:30 × 5 | 15:00 | 17:30 | 32:30 | 30:00 | 45:00 | 2:30 |
| R1-C | 6 × 2:45 | 1:30 × 5 | 16:30 | 17:30 | 34:00 | 33:00 | 49:30 | 2:45 |
| R1-D | 6 × 3:00 | 1:30 × 5 | 18:00 | 17:30 | 35:30 | 36:00 | 54:00 | 3:00 |
| R1-E | 5 × 3:45 | 1:30 × 4 | 18:45 | 16:00 | 34:45 | 37:30 | 56:15 | 3:45 |
| R1-F | 5 × 4:00 | 1:30 × 4 | 20:00 | 16:00 | 36:00 | 40:00 | 60:00 | 4:00 |
| R1-G | 4 × 5:00 | 1:30 × 3 | 20:00 | 14:30 | 34:30 | 40:00 | 60:00 | 5:00 |
| R1-H | 4 × 5:30 | 1:30 × 3 | 22:00 | 14:30 | 36:30 | 44:00 | 66:00 | 5:30 |
| R1-I | 4 × 6:00 | 1:30 × 3 | 24:00 | 14:30 | 38:30 | 48:00 | 72:00 | 6:00 |
| R1-J | 3 × 8:00 | 1:30 × 2 | 24:00 | 13:00 | 37:00 | 48:00 | 72:00 | 8:00 |
| R1-K | 2 × 10:00 | 1:30 × 1 | 20:00 | 11:30 | 31:30 | 40:00 | 60:00 | 10:00 |

### Ponte funcional R1 → R2

O critério funcional de passagem é demonstrar 15 minutos contínuos com resposta tolerada no ciclo. A proposta substitui parte das sessões intervaladas por corrida contínua.

| Frequência prescrita | Sessão 1 | Sessão 2 | Sessão 3 | Corrida total no ciclo | Sessões totais |
|---|---|---|---|---:|---|
| 2 sessões | 2 × 10:00, 1:30 caminhando entre blocos | 15:00 contínuos | Não prescrita | 35:00 | 31:30 e 25:00 |
| 3 sessões | 2 × 10:00, 1:30 entre blocos | 2 × 10:00, 1:30 entre blocos | 15:00 contínuos | 55:00 | 31:30, 31:30 e 25:00 |

O total de corrida é abaixo de R1-K repetido em todas as sessões: 35 contra 40 minutos no ciclo 2x, diferença de 5 minutos; 55 contra 60 no ciclo 3x, também 5 minutos. A maior sequência contínua aumenta até 15 minutos. A passagem não deve reiniciar o paciente automaticamente em R2-A se isso reduzir inadequadamente a carga recente.

## 6. R2, intervalos longos e transição à corrida contínua

**Faixa funcional provisória:** de 15 a menos de 30 minutos contínuos. A entrada sugerida considera o máximo contínuo e a carga recente. O mapa serve para revisão e não deve ser implementado sem aprovação:

| Capacidade contínua demonstrada | Estágio de entrada sugerido |
|---|---|
| 15 a 19 min | R2-E |
| 20 a 24 min | R2-G |
| 25 a 29 min | R2-J |

Se o volume recente ou a resposta não sustentar esse ponto de entrada, o prescritor escolhe estágio menor ou ajuste individual versionado. O R-level não sobrepõe a avaliação de carga.

Recuperação de 2 minutos entre os dois blocos de corrida.

| Estágio | Corrida por sessão | Recuperações | Corrida/sessão | Caminhada/sessão total | Sessão total | Ciclo 2x, corrida | Ciclo 3x, corrida | Maior bloco |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| R2-A | 2 × 5:00 | 2:00 × 1 | 10:00 | 12:00 | 22:00 | 20:00 | 30:00 | 5:00 |
| R2-B | 2 × 6:00 | 2:00 × 1 | 12:00 | 12:00 | 24:00 | 24:00 | 36:00 | 6:00 |
| R2-C | 2 × 7:00 | 2:00 × 1 | 14:00 | 12:00 | 26:00 | 28:00 | 42:00 | 7:00 |
| R2-D | 2 × 8:00 | 2:00 × 1 | 16:00 | 12:00 | 28:00 | 32:00 | 48:00 | 8:00 |
| R2-E | 2 × 9:00 | 2:00 × 1 | 18:00 | 12:00 | 30:00 | 36:00 | 54:00 | 9:00 |
| R2-F | 2 × 10:00 | 2:00 × 1 | 20:00 | 12:00 | 32:00 | 40:00 | 60:00 | 10:00 |
| R2-G | 2 × 11:00 | 2:00 × 1 | 22:00 | 12:00 | 34:00 | 44:00 | 66:00 | 11:00 |
| R2-H | 2 × 12:00 | 2:00 × 1 | 24:00 | 12:00 | 36:00 | 48:00 | 72:00 | 12:00 |
| R2-I | 2 × 13:00 | 2:00 × 1 | 26:00 | 12:00 | 38:00 | 52:00 | 78:00 | 13:00 |
| R2-J | 2 × 14:00 | 2:00 × 1 | 28:00 | 12:00 | 40:00 | 56:00 | 84:00 | 14:00 |
| R2-K | 2 × 15:00 | 2:00 × 1 | 30:00 | 12:00 | 42:00 | 60:00 | 90:00 | 15:00 |

### Ponte R2 para corrida contínua

A proposta adiciona blocos contínuos gradualmente e torna visível a troca entre tempo total de corrida e continuidade. Todos os valores precisam de revisão, pois a transição pode reduzir a corrida semanal agregada enquanto aumenta o maior bloco contínuo.

| Etapa de transição | Ciclo 2 sessões | Corrida total 2x | Ciclo 3 sessões | Corrida total 3x | Maior contínuo ao final do ciclo |
|---|---|---:|---|---:|---:|
| R2-T1 | 2 × 15:00 intervalado; 18:00 contínuos | 48 min | 2 × 15:00; 2 × 15:00; 18:00 contínuos | 78 min | 18 min |
| R2-T2 | 2 × 15:00; 20:00 contínuos | 50 min | 2 × 15:00; 18:00; 20:00 contínuos | 68 min | 20 min |
| R2-T3 | 18:00; 20:00 contínuos | 38 min | 18:00; 20:00; 22:00 contínuos | 60 min | 22 min |
| R2-T4 | 20:00; 22:00 contínuos | 42 min | 20:00; 22:00; 24:00 contínuos | 66 min | 24 min |
| R2-T5 | 22:00; 24:00 contínuos | 46 min | 22:00; 24:00; 26:00 contínuos | 72 min | 26 min |
| R2-T6 | 24:00; 26:00 contínuos | 50 min | 24:00; 26:00; 28:00 contínuos | 78 min | 28 min |
| R2-T7 | 26:00; 28:00 contínuos | 54 min | 26:00; 28:00; 30:00 contínuos | 84 min | 30 min |

Cada corrida contínua inclui 5 min de caminhada antes e depois. Sessões intervaladas seguem R2-K, com aquecimento, dois blocos de 15 min, 2 min caminhando entre eles e desaquecimento.

**Distribuição semanal a decidir:** R2-T1 cai de 60 para 48 min em duas sessões, diferença absoluta de 12 min; e de 90 para 78 em três, também 12 min. A maior sequência contínua sobe para 18 min. Nos ciclos seguintes, R2-T2 tem aumento de 2 min no caminho de duas sessões, mas reduz 10 min no caminho de três sessões em relação a T1. O médico deve decidir se a frequência de duas e três sessões deve usar transições distintas, uma sessão leve adicional ou outro arranjo. Não tratar o total isolado como medida suficiente de segurança.

**Objetivo desta sequência:** alcançar 30 min contínuos quando tolerado, e então avançar para R3 com um plano que use distância/carga recente para aproximar-se de 5 km. Completar R2-T7 não confirma automaticamente 5 km contínuos nem encerra o programa.

## 7. Comparação das principais transições com a v1

| Transição | v1 | Proposta v2 | Diferença e decisão necessária |
|---|---|---|---|
| R0-A → B | 4 para 6 min por sessão; +2 min, +50% no ciclo | 4 para 5:20; +1:20 por sessão. Ciclo 3x: 12 para 16 min, +4 min. | A variação percentual continua visível, mas a diferença absoluta fica em quatro minutos por ciclo de três sessões. Avaliar carga real. |
| R0-C → D | 8 para 10:30 min por sessão; +2:30 | 6:40 para 8 min; +1:20 por sessão | Reduz o salto absoluto, mas a v2 inclui mais etapas para compensar. |
| R0-E → F | 12 para 15 min por sessão; +3 min | 8:45 para 9 min; +0:15 por sessão | Diminui o salto absoluto; estágio E-F será ajustado com base na tolerância individual. |
| R1-A → B | 12 para 18 min por sessão; +6 min | 12 para 15 min; +3 min | Reduz o incremento por sessão pela metade. |
| R1-C → D | 20 para 24 min por sessão; +4 min | 16:30 para 18 min; +1:30 | Diminui o salto absoluto e acrescenta subestágios. |
| R2-B → C | 24 para 30 min por sessão; +6 min | 12 para 14 min; +2 min | As estruturas não são diretamente equivalentes. A v2 redistribui número de blocos; validar a dose total e entrada por capacidade. |
| R2-G → H | V1 não é transição contínua, repete etapa final após semana 8 | 22 para 24 min por sessão, maior bloco 11 para 12 min; +2 min | Incremento explícito em tempo total e maior bloco. |
| R2 intervalado → contínuo | Sem ciclo de transição estável; semanas finais repetem 15 min intervalados | Introduz 7 ciclos T1–T7 até 30 min contínuos | Torna a continuidade explícita. A corrida semanal varia e precisa de decisão específica para 2x/3x. |

Comparação de R0/R1 mede tempo total corrido no ciclo, não velocidade, terreno ou resposta. R2-B/C alteram a organização do treino e não podem ser comparados somente por percentuais.

## 8. Progressão adaptativa proposta

### Dados a comparar no fechamento do ciclo

- Frequência efetivamente prescrita para a pessoa, 2 ou 3, como denominador do ciclo.
- Sessões prescritas, concluídas, parciais, interrompidas ou não realizadas; motivo registrado para cada uma.
- Minutos e blocos de corrida planejados versus realizados, incluindo maior bloco contínuo efetivamente tolerado.
- RPE observado por sessão e se ficou dentro do alvo individual.
- Dor/sintoma durante, logo após e depois da sessão, com mudança funcional.
- Fadiga e recuperação antes da sessão seguinte.
- Disponibilidade e mudança de condição clínica/medicação que altere o exercício.

O ciclo de 2 sessões só é comparado com 2 sessões prescritas. Não se considera a ausência de uma terceira sessão como falha. Se faltarem dados para avaliar carga ou recuperação, não avançar automaticamente.

### Estados e ações, ainda para decisão

| Estado | Proposta para discussão | Saída de prescrição concreta |
|---|---|---|
| Progredir | Ciclo encerrado e todos os itens prescritos têm status. Comparar carga absoluta entregue com carga prevista, resposta, maior bloco e recuperação. Avançar um estágio se o profissional aprovar que o volume tolerado e a recuperação sustentam o próximo incremento. | Selecionar uma etapa seguinte. Não pular etapas automaticamente por RPE baixo isolado. |
| Manter | Adesão ou resposta abaixo do critério, sem sinal de revisão ou indicação de redução. Pode haver falta não clínica documentada, RPE acima do alvo ou recuperação ainda incompleta. | Repetir a mesma etapa, podendo ajustar dia/calendário sem comprimir sessões. |
| Reduzir | Resposta adversa sem critério de urgência, esforço persistentemente acima do alvo, baixa tolerância repetida ou recuperação insuficiente. Limiar e persistência requerem aprovação. | Proposta inicial: voltar um estágio completo. Se estiver no estágio inicial, reduzir duas repetições ou trocar por caminhada; se isso não resolver ou houver dor/sintoma, revisão profissional. Essa ação requer ratificação clínica. |
| Revisão profissional | Sinais potencialmente graves, lesão nova, dor progressiva ou com alteração de marcha/função, mudança de saúde relevante ou dados inconclusivos que impeçam decisão segura. | Bloquear prescrição automática até decisão/liberação profissional registrada. Mensagens e destino conforme protocolo institucional a definir. |

Não se propõe uma regra percentual de progressão. A documentação de minutos absolutos não substitui avaliação médica da continuidade, recuperação e intensidade relativa.

## 9. Simulações com pacientes fictícios

As simulações ilustram esta proposta e não configuram indicação para pacientes reais.

### A. Baixa tolerância

Perfil fictício: R0, corrida contínua máxima observada inferior a 30 segundos, sem sintomas de alerta na triagem, prescrição individual de duas sessões por ciclo. Entrada em R0-A: cada treino propõe oito blocos de 30 segundos de corrida com sete caminhadas de 1:30, mais aquecimento e desaquecimento. Carga prevista: 4 min corridos/sessão, 8 min no ciclo.

Resposta simulada: completa cinco blocos, RPE 6/10, relata fadiga e não recuperou o padrão habitual para a segunda sessão. A carga realizada é 2:30 corrida, 62,5% dos minutos previstos e cinco de oito blocos. Como a resposta não está dentro do alvo, não há avanço. A segunda sessão é adiada e o motivo registrado, não comprimida.

Resultado proposto: **manter** se for episódio isolado sem sintoma de alerta; se a resposta insuficiente se repetir ou não recuperar, **reduzir** para seis blocos de 30 segundos na próxima tentativa. Dor crescente, limitação funcional ou sintoma de alerta encaminha para **revisão profissional**. Os limites que definem repetição e redução precisam de aprovação.

### B. Recuperação inadequada

Perfil fictício: R1, capacidade contínua demonstrada de 10 min, carga recente compatível, duas sessões prescritas no estágio R1-F, cinco blocos de 4 min com recuperação de 1:30 entre blocos. Carga prevista: 20 min corridos por sessão, 40 min no ciclo.

Resposta simulada: primeira sessão concluída em 20 min corridos, RPE 4. Antes da segunda sessão, a pessoa relata que a recuperação ainda não voltou ao padrão habitual. A sessão é adiada e registrada. Se recuperar e concluir dentro do limite individual, fecha o ciclo com dados reais; se não recuperar, não se avança. Se o ciclo encerrar após uma sessão, avaliar os 20 min realizados contra os 40 min prescritos e motivo, sem contar a sessão faltante como concluída.

Resultado proposto: **manter** ou **reduzir**, conforme recorrência e causa aprovada pelo médico; não há avanço automático por uma única sessão boa. Se a recuperação baixa persistir ou vier junto a sintomas/lesão, encaminhar para revisão. A matriz deve decidir prazo de espera e condição para tentar novamente.

### C. Evolução mais rápida

Perfil fictício: R2, máximo contínuo demonstrado de 26 min, três sessões prescritas e carga recente adequada para entrada em R2-J. Cada sessão tem dois blocos de 14 min com 2 min caminhando entre eles; carga prevista 28 min corridos/sessão, 84 min no ciclo.

Resposta simulada: as três sessões são registradas, a corrida total realizada fica próxima ao volume prescrito, RPE 3/10 dentro do alvo, maior bloco 14 min, sem sintomas ou dor progressiva, e recuperação adequada antes de cada sessão. A resposta autoriza considerar R2-K, que propõe dois blocos de 15 min. Não salta diretamente para corrida contínua de 30 min.

Se fossem prescritas duas sessões, a carga planejada do ciclo seria 56 min, e a avaliação usaria esses 56 min como referência, não 84. Como R2-J a R2-K aumenta o total por sessão de 28 para 30 min e o maior bloco de 14 para 15 min, a mudança absoluta é +2 min de corrida/sessão; o médico avalia a resposta global e decide se avança.

## 10. Passagem de estágio e de classificação

### R0 para R1

1. R0 continua no percurso funcional enquanto a capacidade de corrida contínua demonstrada permanece abaixo de 5 min.
2. O ciclo-ponte introduz blocos de 5 min e uma sessão contínua de 5 min; a passagem não é determinada somente pela semana do calendário.
3. Ao registrar 5 min contínuos dentro dos critérios médicos aprovados, recalcular a classificação funcional como R1.
4. Transferir o estágio de prescrição levando em conta a carga recente e a sessão realmente tolerada. Não reiniciar automaticamente em R1-A se isso produzir regressão de carga sem razão clínica.

### R1 para R2

1. R1 permanece até demonstrar 15 min contínuos dentro dos critérios aprovados.
2. A ponte R1-para-R2 combina blocos intervalados com uma sessão de 15 min contínuos.
3. Reclassificar funcionalmente em R2 depois da demonstração e da revisão do ciclo, sem considerar isso liberação médica.
4. Escolher R2-E/G/J como candidato conforme capacidade e histórico; ajustar individualmente quando o volume recente não comportar a etapa sugerida.

Os limites funcionais continuam provisórios. A disponibilidade de duas ou três sessões não muda o corte de capacidade, mas modifica o volume agregado, o calendário e as observações usadas na decisão de ciclo.

## 11. Ajuste profissional individual da prescrição

Mantém-se o requisito arquitetural da v1: o médico/profissional autorizado pode criar uma revisão específica do paciente sem alterar a matriz global. Cada mudança deve registrar ator autenticado, autorização para aquele paciente, data/hora do servidor, motivo, versão-base, valores anteriores e novos. A alteração cria revisão imutável, não apaga prescrição ou execução anterior. O link do paciente não autoriza editar prescrição. O mecanismo deve usar autenticação profissional existente do HAG OS, ainda a mapear; não presumir `auth.uid()` nem aceitar identificador do profissional fornecido pelo navegador.

## 12. Decisões médicas necessárias

| Item | Proposta v2 | Decisão |
|---|---|---|
| Padrão 3 sessões, opção individual 2 | Usar frequência prescrita por pessoa como denominador do ciclo | Pendente |
| Dia de recuperação entre sessões | Evitar sessões consecutivas e não comprimir faltas | Pendente |
| R0-A a R0-J | Subdividir incrementos curtos, sem limite universal de 10% | Pendente |
| Ciclo-ponte R0→R1 | Comparar 2x e 3x e aceitar a redução de minutos só se clinicamente justificada | Pendente |
| R1-A a R1-K | Suavizar aumentos e considerar capacidade/volume ao selecionar entrada | Pendente |
| Ciclo-ponte R1→R2 | Introduzir uma ou duas sessões contínuas; validar redução de volume total | Pendente |
| R2-A a R2-K | Dois blocos por sessão, com incrementos absolutos de 1 min por bloco | Pendente |
| R2-T1 a T7 | Distribuição distinta para 2x/3x ou caminho comum | Pendente; a tabela mostra diferenças relevantes |
| Minutos de corrida tolerados | Comparar prescrito e realizado; definir como qualificar volume suficiente | Pendente |
| Critérios de RPE/recuperação | Usar RPE, dor, sintomas e recuperação entre sessões em conjunto | Pendente; sem limiar universal automático |
| Dose concreta de redução | Um estágio atrás ou menos repetições na primeira etapa | Pendente |
| Triagem ampliada e sinais de alerta | Separar triagem, classificação funcional e seleção da dose | Pendente; ver especificação clínica v1 |
| Teste e fim de R2 | Transição funcional não conclui automaticamente objetivo de 5 km | Pendente |

## 13. Validação aritmética e limites

A proposta usa soma de minutos dos blocos de corrida, caminhadas entre blocos, aquecimento e desaquecimento para calcular cada duração. As tabelas de etapas A–K foram recalculadas a partir dessas quantidades. Ciclos de transição são somas das sessões explicitadas.

Os totais não representam carga fisiológica completa, não incluem velocidade, relevo, sono, força, trabalho físico ou sintomas e não foram validados prospectivamente. A comparação com v1 aponta reduções de alguns saltos, mas também pontes com queda de minutos corridos. A escolha entre 2 e 3 sessões altera a carga semanal absoluta, por isso a próxima decisão deve definir critérios de ciclo por frequência prescrita.

## 14. Segurança da mudança

Esta alteração é documental. Preservar a matriz v1, manter o código clínico inalterado, não executar migrações e não publicar. Depois de uma decisão médica registrada, converter os valores aprovados em testes unitários e de integração isolada antes de alterar o motor.
