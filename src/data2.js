
/* ===== Trilhas adicionais ===== */
BUILTIN_DECKS.push(
  {
    id: 'mat', title: 'Matemática ENEM', subtitle: 'Matemática do dia a dia',
    blurb: 'Porcentagem, regra de três, médias, juros e geometria com as armadilhas que mais derrubam no ENEM.',
    color: 'orange', tag: 'Escola',
    questions: [
      {
        id: 'mt1', topic: 'Porcentagem sucessiva', c: 'Uma loja aumentou em 10% o preço de um tênis de R$ 200,00. Na semana seguinte, anunciou 10% de desconto sobre o novo preço.',
        q: 'Qual é o preço final do tênis?', a: 2, src: 'Aumentos e descontos sucessivos',
        o: [
          { t: 'R$ 200,00', p: 'generalizacao', w: 'Supõe que +10% e −10% se anulam. Não se anulam, porque o desconto incide sobre um valor maior.' },
          { t: 'R$ 180,00', p: 'calculo', w: 'Aplicou o desconto sobre o preço original e ignorou o aumento.' },
          { t: 'R$ 198,00', p: 'correta', w: '200 × 1,10 = 220. Depois, 220 × 0,90 = 198. O fator total é 1,1 × 0,9 = 0,99, ou seja, 1% a menos.' },
          { t: 'R$ 220,00', p: 'calculo', w: 'Aplicou apenas o aumento e esqueceu o desconto.' }
        ]
      },
      {
        id: 'mt2', topic: 'Regra de três inversa', c: 'Seis pedreiros constroem um muro em 10 dias, trabalhando no mesmo ritmo.',
        q: 'Em quantos dias 15 pedreiros, no mesmo ritmo, construiriam o mesmo muro?', a: 0, src: 'Grandezas inversamente proporcionais',
        o: [
          { t: '4 dias', p: 'correta', w: 'Mais pedreiros, menos dias: a relação é inversa. 6 × 10 = 15 × x, logo x = 60 ÷ 15 = 4.' },
          { t: '25 dias', p: 'inversao', w: 'Montou a regra de três como direta. Se mais pedreiros levassem mais tempo, não faria sentido contratar mais gente.' },
          { t: '6 dias', p: 'calculo', w: 'Subtraiu valores sem relação proporcional. Regra de três não se resolve por diferença.' },
          { t: '5 dias', p: 'calculo', w: 'Chute por arredondamento. A conta exata é 60 ÷ 15 = 4.' }
        ]
      },
      {
        id: 'mt3', topic: 'Média ponderada', c: 'Em um curso, a nota final é a média ponderada de três provas: P1 com peso 1, P2 com peso 2 e P3 com peso 3. Bia tirou 6, 7 e 8, respectivamente.',
        q: 'Qual é a nota final de Bia, aproximadamente?', a: 3, src: 'Média ponderada',
        o: [
          { t: '7,0', p: 'troca', w: 'Essa é a média aritmética simples. Com pesos, a prova de maior peso puxa a média.' },
          { t: '7,5', p: 'calculo', w: 'Valor sem base no cálculo. Some notas × pesos e divida pela soma dos pesos.' },
          { t: '8,0', p: 'extrapolacao', w: 'Considerou só a prova de maior peso, como se as outras não contassem.' },
          { t: '7,3', p: 'correta', w: '(6×1 + 7×2 + 8×3) ÷ (1+2+3) = (6 + 14 + 24) ÷ 6 = 44 ÷ 6 ≈ 7,33.' }
        ]
      },
      {
        id: 'mt4', topic: 'Juros simples', c: 'Carlos aplicou R$ 1.000,00 a juros simples de 2% ao mês durante 6 meses.',
        q: 'Qual é o montante ao final do período?', a: 1, src: 'Juros simples: J = C × i × t',
        o: [
          { t: 'R$ 120,00', p: 'troca', w: 'Esse é só o valor dos juros. O montante soma juros e capital: 1.000 + 120.' },
          { t: 'R$ 1.120,00', p: 'correta', w: 'J = 1.000 × 0,02 × 6 = 120. Montante = 1.000 + 120 = 1.120.' },
          { t: 'R$ 1.126,16', p: 'troca', w: 'Esse seria o montante a juros compostos (1.000 × 1,02⁶). O enunciado diz juros simples.' },
          { t: 'R$ 1.012,00', p: 'calculo', w: 'Usou 2% de forma errada, como se fosse 0,2% ao mês.' }
        ]
      },
      {
        id: 'mt5', topic: 'Área de figuras', c: 'Um terreno retangular mede 12 m por 8 m. O dono vai gramar todo o terreno, exceto um canteiro circular de 3 m de raio. Use π = 3.',
        q: 'Qual é a área que será gramada?', a: 0, src: 'Área do retângulo e do círculo',
        o: [
          { t: '69 m²', p: 'correta', w: 'Retângulo: 12 × 8 = 96. Círculo: π × r² = 3 × 9 = 27. Área gramada: 96 − 27 = 69 m².' },
          { t: '78 m²', p: 'troca', w: 'Subtraiu o comprimento da circunferência (2πr = 18) no lugar da área do círculo.' },
          { t: '87 m²', p: 'calculo', w: 'Subtraiu só r² = 9 e esqueceu de multiplicar por π.' },
          { t: '96 m²', p: 'calculo', w: 'Calculou a área total e esqueceu de retirar o canteiro.' }
        ]
      },
      {
        id: 'mt6', topic: 'Mediana', c: 'Os tempos, em minutos, que cinco alunos levaram para resolver uma lista foram: 3, 8, 5, 10 e 4.',
        q: 'Qual é a mediana desses tempos?', a: 2, src: 'Estatística: mediana',
        o: [
          { t: '6', p: 'troca', w: 'Esse valor é a média (30 ÷ 5). Mediana é o valor central dos dados ordenados.' },
          { t: '8', p: 'calculo', w: 'Pegou o termo do meio sem ordenar os dados. Primeiro ordene: 3, 4, 5, 8, 10.' },
          { t: '5', p: 'correta', w: 'Ordenando: 3, 4, 5, 8, 10. Com 5 valores, a mediana é o 3º termo: 5.' },
          { t: '4', p: 'calculo', w: 'Escolheu um termo fora da posição central após ordenar.' }
        ]
      }
    ]
  },
  {
    id: 'lgpd', title: 'LGPD no trabalho', subtitle: 'Proteção de dados · Lei 13.709/2018',
    blurb: 'O que todo colaborador precisa saber sobre dados pessoais, bases legais, direitos do titular e incidentes.',
    color: 'navy', tag: 'Corporativo',
    questions: [
      {
        id: 'lg1', topic: 'Dado pessoal sensível', c: 'O RH está revisando quais informações dos funcionários exigem cuidado redobrado.',
        q: 'Qual destas informações é um dado pessoal sensível segundo a LGPD?', a: 3, src: 'LGPD, art. 5º, II',
        o: [
          { t: 'O número do CPF do funcionário.', p: 'troca', w: 'CPF é dado pessoal, mas não está na lista de dados sensíveis.' },
          { t: 'O e-mail corporativo do funcionário.', p: 'troca', w: 'É dado pessoal, porque identifica a pessoa, mas não é sensível.' },
          { t: 'O endereço residencial do funcionário.', p: 'troca', w: 'Também é dado pessoal comum, fora do rol de sensíveis.' },
          { t: 'A filiação do funcionário a um sindicato.', p: 'correta', w: 'A LGPD lista como sensíveis: origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato, dados de saúde, vida sexual, genéticos e biométricos.' }
        ]
      },
      {
        id: 'lg2', topic: 'Bases legais', c: 'A empresa vai processar a folha de pagamento e recolher os encargos trabalhistas dos funcionários.',
        q: 'Ela precisa obrigatoriamente do consentimento dos funcionários para isso?', a: 1, src: 'LGPD, art. 7º',
        o: [
          { t: 'Sim, todo tratamento de dados exige consentimento.', p: 'generalizacao', w: 'O consentimento é só uma das bases legais. Há outras, como cumprimento de obrigação legal e execução de contrato.' },
          { t: 'Não, pois pode se apoiar no cumprimento de obrigação legal e na execução do contrato de trabalho.', p: 'correta', w: 'A folha e os encargos decorrem da lei e do contrato. Essas bases legais dispensam o consentimento.' },
          { t: 'Sim, e o consentimento precisa ter firma reconhecida em cartório.', p: 'extrapolacao', w: 'A LGPD não exige reconhecimento de firma. A alternativa cria um requisito inexistente.' },
          { t: 'Não, porque a LGPD não se aplica a dados de funcionários.', p: 'restricao', w: 'A LGPD se aplica a qualquer tratamento de dados pessoais, inclusive de funcionários.' }
        ]
      },
      {
        id: 'lg3', topic: 'Direitos do titular', c: 'Um cliente envia um e-mail pedindo para saber quais dados pessoais a empresa mantém sobre ele.',
        q: 'Como a empresa deve agir?', a: 0, src: 'LGPD, art. 18',
        o: [
          { t: 'Atender ao pedido, pois o acesso aos dados é direito do titular e deve ser gratuito.', p: 'correta', w: 'O art. 18 garante ao titular o acesso aos dados, e os pedidos devem ser atendidos sem custos para ele.' },
          { t: 'Atender apenas se houver ordem judicial.', p: 'restricao', w: 'O titular pode pedir diretamente ao controlador. Não precisa de ordem judicial.' },
          { t: 'Atender mediante cobrança de uma taxa administrativa.', p: 'extrapolacao', w: 'A lei prevê que os direitos sejam exercidos sem custos para o titular.' },
          { t: 'Recusar, se os dados forem usados apenas para marketing.', p: 'restricao', w: 'A finalidade do tratamento não retira o direito de acesso do titular.' }
        ]
      },
      {
        id: 'lg4', topic: 'Incidente de segurança', c: 'Um notebook com a base de clientes, sem criptografia, foi furtado. Os dados podem gerar risco ou dano relevante aos titulares.',
        q: 'O que a empresa deve fazer?', a: 2, src: 'LGPD, art. 48',
        o: [
          { t: 'Resolver internamente, sem comunicar ninguém, para evitar danos à imagem.', p: 'inversao', w: 'Esconder o incidente contraria a lei. Com risco relevante, a comunicação é obrigatória.' },
          { t: 'Comunicar apenas a polícia, por se tratar de furto.', p: 'restricao', w: 'O boletim pode ser feito, mas não substitui a comunicação exigida pela LGPD.' },
          { t: 'Comunicar a ANPD e os titulares afetados.', p: 'correta', w: 'O art. 48 exige comunicar à ANPD e ao titular a ocorrência de incidente que possa acarretar risco ou dano relevante.' },
          { t: 'Comunicar apenas se o incidente se repetir.', p: 'extrapolacao', w: 'Não existe regra de reincidência. Um único incidente relevante já exige comunicação.' }
        ]
      },
      {
        id: 'lg5', topic: 'Encarregado (DPO)', c: 'Um novo colaborador quer entender o papel do encarregado pelo tratamento de dados pessoais.',
        q: 'Qual é a função do encarregado?', a: 1, src: 'LGPD, art. 5º, VIII, e art. 41',
        o: [
          { t: 'Ser o fiscal da ANPD dentro da empresa.', p: 'troca', w: 'O encarregado é indicado pela própria empresa. Ele não é agente da ANPD.' },
          { t: 'Atuar como canal de comunicação entre a empresa, os titulares dos dados e a ANPD.', p: 'correta', w: 'É a definição legal: o canal entre controlador, titulares e Autoridade Nacional, além de orientar os funcionários.' },
          { t: 'Ser o chefe da área de TI, responsável pelos servidores.', p: 'troca', w: 'Não precisa ser alguém de TI. É uma função de governança e comunicação.' },
          { t: 'Responder pessoal e criminalmente por qualquer vazamento.', p: 'extrapolacao', w: 'A lei não atribui ao encarregado responsabilidade criminal automática por incidentes.' }
        ]
      },
      {
        id: 'lg6', topic: 'Sanções', c: 'A diretoria quer entender o tamanho do risco financeiro de descumprir a LGPD.',
        q: 'Qual é o limite da multa simples prevista na lei?', a: 3, src: 'LGPD, art. 52, II',
        o: [
          { t: '10% do faturamento, sem limite de valor.', p: 'extrapolacao', w: 'O percentual e a ausência de teto estão errados.' },
          { t: '4% do faturamento mundial.', p: 'troca', w: 'Esse é um parâmetro do regulamento europeu (GDPR), não da LGPD.' },
          { t: 'R$ 50 milhões por ano, somando todas as infrações.', p: 'inversao', w: 'O limite de R$ 50 milhões é por infração, não um teto anual somado.' },
          { t: 'Até 2% do faturamento no Brasil, limitada a R$ 50 milhões por infração.', p: 'correta', w: 'A multa simples é de até 2% do faturamento da empresa no Brasil no último exercício, limitada a R$ 50 milhões por infração.' }
        ]
      }
    ]
  }
);
PERSONAS.find((p) => p.id === 'escola').decks = ['neuro', 'mat', 'port', 'logica'];
PERSONAS.find((p) => p.id === 'faculdade').decks = ['neuro', 'logica', 'mat', 'port'];
PERSONAS.find((p) => p.id === 'empresa').decks = ['neuro', 'excel', 'lgpd'];
