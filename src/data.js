/* ===== Padrões de pegadinha (engenharia reversa) ===== */
const PATTERNS = {
  correta: { l: 'Correta', d: 'A alternativa que responde exatamente ao que foi pedido.' },
  inversao: { l: 'Inversão', d: 'Troca o sentido, a ordem ou a relação de causa e efeito.' },
  generalizacao: { l: 'Generalização', d: 'Transforma uma regra com exceções em regra absoluta: sempre, nunca, qualquer.' },
  restricao: { l: 'Restrição indevida', d: 'Acrescenta uma condição ou um limite que a regra não tem.' },
  extrapolacao: { l: 'Extrapolação', d: 'Vai além do que a regra diz e soma algo plausível, mas inexistente.' },
  troca: { l: 'Troca de conceito', d: 'Usa um conceito vizinho, parecido, no lugar do correto.' },
  calculo: { l: 'Erro de procedimento', d: 'Aplica o método certo de forma errada ou pula uma etapa.' }
};

/* ===== Trilhas prontas ===== */
const BUILTIN_DECKS = [
  {
    id: 'neuro', title: 'Hackeando o estudo', subtitle: 'Ciência da aprendizagem',
    blurb: 'Comece por aqui. Entenda por que ler não é estudar e como o seu cérebro realmente guarda informação.',
    color: 'navy', tag: 'Recomendado',
    questions: [
      {
        id: 'neuro1', topic: 'Ilusão de competência',
        c: 'Ana releu o mesmo resumo três vezes na véspera da prova. Ao final, sentia que dominava tudo. Na prova, deu branco em questões sobre exatamente aquele conteúdo.',
        q: 'Qual fenômeno explica melhor a sensação de Ana antes da prova?',
        a: 0, src: 'Projeto Memory, pilar II',
        o: [
          { t: 'Ilusão de competência: a familiaridade com o texto foi confundida com a capacidade de lembrar.', p: 'correta', w: 'Reler gera fluência (“isso me parece conhecido”), mas reconhecer não é recuperar. Só o esforço de lembrar sem olhar mostra o que você de fato sabe.' },
          { t: 'Efeito de espaçamento: ela estudou com intervalos longos demais.', p: 'troca', w: 'O espaçamento é uma estratégia que melhora a retenção. Além disso, Ana estudou tudo na véspera, ou seja, sem espaçamento algum.' },
          { t: 'Efeito de testagem: fazer testes antes da prova a deixou insegura.', p: 'inversao', w: 'Inverte a ciência. O efeito de testagem é justamente o remédio: testar-se aumenta a retenção. Ana não se testou, só releu.' },
          { t: 'Interferência proativa: um conteúdo antigo apagou o novo.', p: 'extrapolacao', w: 'Nada no caso indica um conteúdo anterior competindo com o novo. A alternativa cria uma causa que o enunciado não sustenta.' }
        ]
      },
      {
        id: 'neuro2', topic: 'Prática de recuperação',
        c: 'Um estudo publicado na revista Science (Karpicke & Blunt, 2011) comparou estudantes que liam um texto e depois faziam mapas conceituais com estudantes que liam e depois tentavam lembrar o conteúdo sem consultar.',
        q: 'Qual grupo teve melhor desempenho na avaliação posterior?',
        a: 1, src: 'Karpicke & Blunt (2011), Science',
        o: [
          { t: 'O grupo do mapa conceitual, porque organizar visualmente fixa melhor.', p: 'inversao', w: 'É a intuição comum, e o estudo mostrou o contrário. A prática de recuperação superou o mapeamento, inclusive em testes que pediam um mapa conceitual.' },
          { t: 'O grupo da prática de recuperação, que tentou lembrar sem consultar.', p: 'correta', w: 'O esforço ativo de buscar a resposta na memória fortaleceu o aprendizado mais do que elaborar mapas com o material à vista.' },
          { t: 'Os dois grupos tiveram resultado igual, já que ambos estudaram ativamente.', p: 'generalizacao', w: 'Trata toda atividade “ativa” como equivalente. O que fez diferença foi recuperar da memória, não apenas mexer no material.' },
          { t: 'Nenhum dos dois: só a releitura repetida melhorou a retenção.', p: 'extrapolacao', w: 'A releitura nem era um dos grupos comparados na pergunta, e é a estratégia de menor efeito na literatura.' }
        ]
      },
      {
        id: 'neuro3', topic: 'Repetição espaçada',
        c: 'João tem 6 horas disponíveis para estudar um conteúdo cobrado em uma prova daqui a três semanas.',
        q: 'Qual distribuição tende a gerar a maior retenção no dia da prova?',
        a: 2, src: 'Pilar: repetição espaçada',
        o: [
          { t: 'Seis horas seguidas na véspera, com o conteúdo fresco na memória.', p: 'inversao', w: 'Concentrar o estudo (massed practice) dá sensação de domínio no curto prazo, mas é esquecido rápido. É o oposto do que a ciência recomenda.' },
          { t: 'Três horas nos dois últimos dias, relendo o material.', p: 'restricao', w: 'Divide um pouco, mas comprime tudo no fim e usa releitura, que é passiva. Perde o efeito do espaçamento e da recuperação.' },
          { t: 'Seis sessões de uma hora, espaçadas ao longo das semanas, testando-se em cada uma.', p: 'correta', w: 'Combina os dois efeitos mais robustos da aprendizagem: espaçamento entre sessões e recuperação ativa em cada sessão.' },
          { t: 'Tanto faz a distribuição, porque o total de horas é o mesmo.', p: 'generalizacao', w: 'O total de horas é igual, mas o resultado não. A forma de distribuir o tempo muda bastante a retenção de longo prazo.' }
        ]
      },
      {
        id: 'neuro4', topic: 'Feedback imediato',
        c: 'Em um app de questões, o aluno erra uma resposta e só descobre o gabarito uma semana depois, ao conferir uma lista.',
        q: 'Qual é o principal risco desse feedback tardio?',
        a: 3, src: 'Thorndike (Lei do Efeito)',
        o: [
          { t: 'Nenhum: o importante é receber o gabarito em algum momento.', p: 'generalizacao', w: 'Ignora o tempo como variável. Durante a semana, a resposta errada fica livre para se fixar.' },
          { t: 'O aluno ficar ansioso por não saber o resultado.', p: 'troca', w: 'A ansiedade pode até existir, mas não é o principal problema de aprendizagem. A questão é o que acontece com o conceito errado na memória.' },
          { t: 'O aluno esquecer a pergunta e não conseguir mais refazê-la.', p: 'extrapolacao', w: 'Esquecer a pergunta não é o risco central. Mesmo lembrando dela, o erro já teve tempo de se consolidar.' },
          { t: 'A resposta errada se consolidar na memória e passar a competir com a correta.', p: 'correta', w: 'Sem correção imediata, o erro se fortalece (interferência proativa). O feedback na hora pega o cérebro no pico da dúvida e corrige a rota.' }
        ]
      },
      {
        id: 'neuro5', topic: 'Procrastinação',
        c: 'Pedro sabe que precisa estudar, mas toda noite decide começar “amanhã”. No momento em que adia, sente alívio imediato.',
        q: 'Segundo a lógica do desconto temporal, por que o adiamento vence?',
        a: 0, src: 'Projeto Memory, desconto hiperbólico',
        o: [
          { t: 'O cérebro supervaloriza o alívio imediato e desvaloriza a recompensa distante.', p: 'correta', w: 'É o desconto hiperbólico: quanto mais distante a recompensa (a aprovação), menor o peso dela agora. O alívio de adiar é instantâneo, por isso vence.' },
          { t: 'Pedro tem um problema de gestão do tempo e precisa de uma agenda melhor.', p: 'troca', w: 'É o “erro de diagnóstico” da apresentação. Procrastinação é principalmente regulação emocional, não falta de agenda.' },
          { t: 'Pedro é preguiçoso e falta força de vontade.', p: 'extrapolacao', w: 'Trata um mecanismo biológico como falha de caráter. O caso descreve um ciclo de alívio, não preguiça.' },
          { t: 'A recompensa futura é maior, por isso o cérebro escolhe esperar por ela.', p: 'inversao', w: 'Inverte a lógica. Se o cérebro priorizasse a recompensa futura, Pedro estudaria hoje.' }
        ]
      },
      {
        id: 'neuro6', topic: 'A batalha interna',
        c: 'Diante de uma tarefa difícil, duas regiões do cérebro “disputam” o controle: uma busca prazer imediato e fuga da dor, outra planeja e sustenta objetivos de longo prazo.',
        q: 'Qual região está mais associada ao planejamento e aos objetivos de longo prazo?',
        a: 1, src: 'Projeto Memory, a batalha interna',
        o: [
          { t: 'O sistema límbico.', p: 'inversao', w: 'É o lado oposto da disputa: emocional e reativo, busca prazer imediato e interpreta a tarefa difícil como ameaça.' },
          { t: 'O córtex pré-frontal.', p: 'correta', w: 'É a região do planejamento, do controle inibitório e da regra “desconforto hoje, conforto amanhã”.' },
          { t: 'O cerebelo.', p: 'troca', w: 'O cerebelo está ligado principalmente à coordenação motora e ao equilíbrio, não ao planejamento de metas.' },
          { t: 'O hipocampo.', p: 'troca', w: 'O hipocampo é central na formação de memórias, mas não é a região que planeja e sustenta objetivos.' }
        ]
      }
    ]
  },
  {
    id: 'port', title: 'Português para concursos', subtitle: 'Gramática que mais cai',
    blurb: 'Crase, concordância, regência, pontuação e colocação pronominal no formato das bancas.',
    color: 'orange', tag: 'Concursos',
    questions: [
      {
        id: 'port1', topic: 'Crase', c: 'Um analista revisa um relatório antes de enviá-lo à diretoria.',
        q: 'Assinale a frase em que o acento grave está empregado corretamente.', a: 2, src: 'Norma-padrão: crase',
        o: [
          { t: 'Entregou o relatório à ela no fim do dia.', p: 'generalizacao', w: 'Não há crase antes de pronome pessoal (ela). A regra “a + a” não vale aqui porque “ela” não aceita artigo.' },
          { t: 'A equipe chegou à uma conclusão rápida.', p: 'generalizacao', w: 'Não se usa crase antes de artigo indefinido (uma). A exceção é a indicação de horas: “à uma hora”.' },
          { t: 'Refiro-me às normas internas da empresa.', p: 'correta', w: 'Quem se refere, refere-se a algo (preposição “a”) + artigo “as” de “as normas” = às.' },
          { t: 'O gerente voltou à pé para o escritório.', p: 'troca', w: '“Pé” é palavra masculina e não admite o artigo “a”. Sem artigo feminino, não há crase.' }
        ]
      },
      {
        id: 'port2', topic: 'Concordância verbal', c: 'Em um e-mail corporativo, o redator precisa escolher a forma correta dos verbos impessoais.',
        q: 'Assinale a frase correta segundo a norma-padrão.', a: 1, src: 'Verbos impessoais: haver e fazer',
        o: [
          { t: 'Fazem dois anos que trabalho neste setor.', p: 'generalizacao', w: '“Fazer” indicando tempo decorrido é impessoal e fica no singular: “Faz dois anos”.' },
          { t: 'Faz dois anos que trabalho neste setor.', p: 'correta', w: 'Verbo “fazer” no sentido de tempo é impessoal, não tem sujeito, e por isso permanece no singular.' },
          { t: 'Houveram muitos problemas na entrega.', p: 'generalizacao', w: '“Haver” no sentido de existir é impessoal: “Houve muitos problemas”.' },
          { t: 'Devem haver soluções mais baratas.', p: 'calculo', w: 'Quando “haver” impessoal vem em locução, o auxiliar também fica no singular: “Deve haver soluções”.' }
        ]
      },
      {
        id: 'port3', topic: 'Regência verbal', c: 'O RH redige um comunicado sobre o treinamento obrigatório.',
        q: 'Qual frase respeita a regência verbal da norma-padrão?', a: 3, src: 'Regência: assistir, obedecer, aspirar, preferir',
        o: [
          { t: 'Prefiro mais o treinamento presencial do que o online.', p: 'extrapolacao', w: 'O verbo “preferir” já indica comparação. A forma correta é “prefiro uma coisa a outra”, sem “mais” e sem “do que”.' },
          { t: 'Todos devem obedecer o regulamento interno.', p: 'troca', w: '“Obedecer” é transitivo indireto: obedece-se a algo. O correto é “obedecer ao regulamento”.' },
          { t: 'Ele aspira o cargo de coordenador.', p: 'troca', w: 'No sentido de desejar, “aspirar” pede a preposição “a”: “aspira ao cargo”. Sem preposição, significa inalar.' },
          { t: 'Os candidatos assistiram ao treinamento inteiro.', p: 'correta', w: 'No sentido de ver ou presenciar, “assistir” é transitivo indireto: assistir a algo. “Ao treinamento” está correto.' }
        ]
      },
      {
        id: 'port4', topic: 'Pontuação', c: 'Uma ata de reunião precisa ser revisada antes de ser publicada.',
        q: 'Assinale a frase pontuada corretamente.', a: 0, src: 'Vírgula: aposto e sujeito',
        o: [
          { t: 'Maria, a nova gerente, apresentou o plano à equipe.', p: 'correta', w: '“A nova gerente” é aposto explicativo e deve vir entre vírgulas.' },
          { t: 'O diretor da empresa, aprovou o projeto ontem.', p: 'calculo', w: 'Não se separa o sujeito (o diretor da empresa) do verbo (aprovou) por vírgula.' },
          { t: 'Os funcionários que chegaram cedo, foram liberados.', p: 'calculo', w: 'Todo o trecho “os funcionários que chegaram cedo” é o sujeito. A vírgula o separa indevidamente do verbo.' },
          { t: 'A empresa comprou, cadeiras e mesas novas.', p: 'calculo', w: 'Não há vírgula entre o verbo e o seu complemento (cadeiras e mesas).' }
        ]
      },
      {
        id: 'port5', topic: 'Colocação pronominal', c: 'Na norma-padrão, algumas palavras “atraem” o pronome oblíquo para antes do verbo.',
        q: 'Assinale a frase correta quanto à colocação do pronome.', a: 2, src: 'Próclise obrigatória',
        o: [
          { t: 'Me disseram que a reunião foi adiada.', p: 'generalizacao', w: 'Na norma-padrão, não se inicia oração com pronome oblíquo átono. O correto seria “Disseram-me”.' },
          { t: 'Não disseram-me nada sobre a reunião.', p: 'troca', w: 'Palavras negativas (não) atraem o pronome: a próclise é obrigatória. O correto é “Não me disseram”.' },
          { t: 'Ninguém me avisou sobre a mudança de sala.', p: 'correta', w: 'Pronomes indefinidos como “ninguém” atraem o pronome para antes do verbo. Próclise correta.' },
          { t: 'Ninguém avisou-me sobre a mudança de sala.', p: 'troca', w: '“Ninguém” é palavra atrativa. Com ela, a ênclise (avisou-me) está incorreta.' }
        ]
      },
      {
        id: 'port6', topic: 'Uso dos porquês', c: 'Os quatro porquês são uma das pegadinhas mais comuns em provas de português.',
        q: 'Assinale a frase em que o porquê está empregado corretamente.', a: 1, src: 'Por que, por quê, porque, porquê',
        o: [
          { t: 'Você faltou à reunião porque?', p: 'troca', w: 'No fim de pergunta, usa-se “por quê”, separado e com acento.' },
          { t: 'Não sei por que ele saiu tão cedo.', p: 'correta', w: '“Por que” separado e sem acento equivale a “por qual motivo”, inclusive em perguntas indiretas como esta.' },
          { t: 'Ele saiu cedo por quê estava cansado.', p: 'troca', w: 'Para explicar uma causa, usa-se “porque”, junto e sem acento.' },
          { t: 'Ninguém entendeu o por que da decisão.', p: 'troca', w: 'Como substantivo (o motivo), escreve-se “o porquê”, junto e com acento.' }
        ]
      }
    ]
  },
  {
    id: 'dconst', title: 'Direito Constitucional', subtitle: 'Art. 5º da CF/88',
    blurb: 'Direitos e garantias fundamentais cobrados em casos práticos, do jeito que as bancas gostam.',
    color: 'navy', tag: 'Concursos',
    questions: [
      {
        id: 'dc1', topic: 'Inviolabilidade do domicílio',
        c: 'Às 23h, policiais com mandado judicial de busca e apreensão chegam à casa de Carlos. Não há flagrante delito, desastre ou pedido de socorro, e Carlos não autoriza a entrada.',
        q: 'Os policiais podem entrar na casa nesse momento?', a: 2, src: 'CF/88, art. 5º, XI',
        o: [
          { t: 'Sim, porque o mandado judicial autoriza a entrada a qualquer hora.', p: 'generalizacao', w: 'A determinação judicial só autoriza o ingresso durante o dia. “A qualquer hora” transforma a regra em absoluta.' },
          { t: 'Sim, desde que estejam acompanhados de um advogado do morador.', p: 'extrapolacao', w: 'A Constituição não prevê essa condição. A alternativa inventa um requisito plausível.' },
          { t: 'Não, pois a entrada por determinação judicial só pode ocorrer durante o dia.', p: 'correta', w: 'O art. 5º, XI, permite a entrada sem consentimento em flagrante, desastre, para prestar socorro ou, durante o dia, por determinação judicial.' },
          { t: 'Não, pois a casa nunca pode ser invadida sem o consentimento do morador.', p: 'restricao', w: 'Ignora as exceções. Em flagrante delito, desastre ou socorro, a entrada é permitida até à noite e sem consentimento.' }
        ]
      },
      {
        id: 'dc2', topic: 'Remédios constitucionais',
        c: 'Luana descobriu que um órgão público mantém em seu cadastro informações erradas sobre ela e quer ter acesso a esses dados para corrigi-los.',
        q: 'Qual é a ação constitucional adequada?', a: 0, src: 'CF/88, art. 5º, LXXII',
        o: [
          { t: 'Habeas data.', p: 'correta', w: 'Serve para conhecer e retificar informações relativas à pessoa do impetrante em registros ou bancos de dados de entidades governamentais ou de caráter público.' },
          { t: 'Habeas corpus.', p: 'troca', w: 'Protege a liberdade de locomoção (ir, vir e permanecer), não o acesso a dados pessoais.' },
          { t: 'Mandado de segurança.', p: 'troca', w: 'É residual: protege direito líquido e certo não amparado por habeas corpus ou habeas data. Aqui cabe o habeas data.' },
          { t: 'Mandado de injunção.', p: 'troca', w: 'É usado quando falta norma regulamentadora que torne viável um direito constitucional. Não é o caso.' }
        ]
      },
      {
        id: 'dc3', topic: 'Direito de reunião',
        c: 'Um grupo de moradores quer fazer uma manifestação pacífica, sem armas, em uma praça pública. Não há outra reunião convocada para o mesmo local.',
        q: 'O que a Constituição exige do grupo?', a: 3, src: 'CF/88, art. 5º, XVI',
        o: [
          { t: 'Autorização prévia da prefeitura.', p: 'inversao', w: 'A reunião independe de autorização. Exigir autorização inverte a lógica da garantia.' },
          { t: 'Autorização judicial, por se tratar de local público.', p: 'extrapolacao', w: 'Não há qualquer exigência de autorização judicial para reuniões pacíficas em locais abertos ao público.' },
          { t: 'Nada: o direito de reunião não tem nenhuma condição.', p: 'generalizacao', w: 'Há condições: ser pacífica, sem armas, não frustrar reunião anterior no mesmo local e dar prévio aviso.' },
          { t: 'Apenas prévio aviso à autoridade competente.', p: 'correta', w: 'O art. 5º, XVI, dispensa autorização e exige somente prévio aviso à autoridade competente.' }
        ]
      },
      {
        id: 'dc4', topic: 'Liberdade de associação',
        c: 'Uma associação de bairro está sendo acusada de desviar recursos. O poder público quer encerrar suas atividades definitivamente.',
        q: 'O que a Constituição exige para a dissolução compulsória da associação?', a: 1, src: 'CF/88, art. 5º, XIX',
        o: [
          { t: 'Um ato administrativo fundamentado da prefeitura.', p: 'troca', w: 'Associações só podem ser dissolvidas ou ter atividades suspensas por decisão judicial, nunca por ato administrativo.' },
          { t: 'Decisão judicial transitada em julgado.', p: 'correta', w: 'Para a dissolução compulsória, exige-se decisão judicial com trânsito em julgado. Para a mera suspensão, basta decisão judicial.' },
          { t: 'Decisão judicial liminar, por se tratar de urgência.', p: 'restricao', w: 'Liminar poderia, no máximo, suspender atividades. A dissolução exige o trânsito em julgado.' },
          { t: 'Votação da maioria dos associados.', p: 'troca', w: 'Isso seria dissolução voluntária. A pergunta trata de dissolução compulsória, imposta de fora.' }
        ]
      },
      {
        id: 'dc5', topic: 'Retroatividade da lei penal',
        c: 'Marcos foi condenado definitivamente. Anos depois, entra em vigor uma lei que reduz a pena do crime que ele cometeu.',
        q: 'A nova lei pode beneficiar Marcos?', a: 2, src: 'CF/88, art. 5º, XL',
        o: [
          { t: 'Não, porque a lei penal nunca retroage.', p: 'generalizacao', w: 'A regra tem exceção expressa: a lei penal retroage para beneficiar o réu.' },
          { t: 'Não, porque a condenação já transitou em julgado.', p: 'restricao', w: 'A retroatividade benéfica alcança inclusive fatos já decididos por sentença condenatória transitada em julgado.' },
          { t: 'Sim, porque a lei penal retroage para beneficiar o réu.', p: 'correta', w: 'O art. 5º, XL, diz que a lei penal não retroagirá, salvo para beneficiar o réu.' },
          { t: 'Sim, mas somente se ele pedir dentro de 30 dias.', p: 'extrapolacao', w: 'Não existe esse prazo na Constituição. A alternativa cria uma condição que não existe.' }
        ]
      },
      {
        id: 'dc6', topic: 'Crimes imprescritíveis',
        c: 'Em um simulado, o professor pede que os alunos identifiquem crimes que a Constituição considera, ao mesmo tempo, inafiançáveis e imprescritíveis.',
        q: 'Qual dos crimes abaixo é imprescritível?', a: 0, src: 'CF/88, art. 5º, XLII e XLIII',
        o: [
          { t: 'Racismo.', p: 'correta', w: 'A prática do racismo é crime inafiançável e imprescritível. A outra hipótese é a ação de grupos armados contra a ordem constitucional.' },
          { t: 'Tortura.', p: 'troca', w: 'Tortura é inafiançável e insuscetível de graça ou anistia, mas não é imprescritível.' },
          { t: 'Tráfico ilícito de entorpecentes.', p: 'troca', w: 'Segue o mesmo regime da tortura: inafiançável, sem graça ou anistia, mas prescritível.' },
          { t: 'Crimes hediondos.', p: 'troca', w: 'Também estão no inciso XLIII: inafiançáveis e sem graça ou anistia, mas não imprescritíveis.' }
        ]
      }
    ]
  },
  {
    id: 'logica', title: 'Raciocínio Lógico', subtitle: 'Proposições e contagem',
    blurb: 'Negações, equivalências, sequências e probabilidade, com as pegadinhas clássicas desmontadas.',
    color: 'orange', tag: 'Concursos',
    questions: [
      {
        id: 'rl1', topic: 'Negação de “todo”', c: 'Um diretor afirmou: “Todo servidor do setor é pontual.” Um colega quer provar que a afirmação é falsa.',
        q: 'Qual é a negação lógica da frase do diretor?', a: 3, src: 'Lógica de quantificadores',
        o: [
          { t: 'Nenhum servidor do setor é pontual.', p: 'inversao', w: 'É a proposição contrária, não a negação. Para derrubar “todo”, basta um contraexemplo.' },
          { t: 'Todo servidor do setor não é pontual.', p: 'inversao', w: 'Equivale a “nenhum é pontual”. Continua exigindo demais para negar a frase.' },
          { t: 'Algum servidor do setor é pontual.', p: 'troca', w: 'Isso é compatível com a frase original. Não a contradiz.' },
          { t: 'Algum servidor do setor não é pontual.', p: 'correta', w: 'A negação de “todo A é B” é “algum A não é B”. Basta um servidor impontual para a frase ser falsa.' }
        ]
      },
      {
        id: 'rl2', topic: 'Negação da conjunção', c: 'Um aluno afirma: “Estudo e passo na prova.”',
        q: 'Qual é a negação dessa proposição?', a: 1, src: 'Leis de De Morgan',
        o: [
          { t: 'Não estudo e não passo na prova.', p: 'calculo', w: 'Negou as partes, mas esqueceu de trocar o “e” pelo “ou”. É o erro mais comum em De Morgan.' },
          { t: 'Não estudo ou não passo na prova.', p: 'correta', w: 'Pela Lei de De Morgan, ~(p ∧ q) ≡ ~p ∨ ~q: nega as duas partes e troca “e” por “ou”.' },
          { t: 'Estudo ou não passo na prova.', p: 'calculo', w: 'Negou só uma das partes. As duas precisam ser negadas.' },
          { t: 'Não estudo e passo na prova.', p: 'calculo', w: 'É só um dos cenários que tornam a frase falsa, não a negação completa.' }
        ]
      },
      {
        id: 'rl3', topic: 'Negação da condicional', c: 'Considere a proposição: “Se chove, então levo guarda-chuva.”',
        q: 'Qual é a negação dessa proposição?', a: 0, src: 'Condicional: ~(p → q) ≡ p ∧ ~q',
        o: [
          { t: 'Chove e não levo guarda-chuva.', p: 'correta', w: 'A condicional só é falsa quando o antecedente é verdadeiro e o consequente é falso. Por isso, ~(p → q) ≡ p ∧ ~q.' },
          { t: 'Se não chove, então não levo guarda-chuva.', p: 'inversao', w: 'Essa é a inversa da condicional, não a sua negação. A negação nem é uma condicional.' },
          { t: 'Não chove e levo guarda-chuva.', p: 'inversao', w: 'Nesse cenário a condicional original é verdadeira, então não pode ser a negação.' },
          { t: 'Se levo guarda-chuva, então chove.', p: 'inversao', w: 'Essa é a recíproca. Também não equivale à negação.' }
        ]
      },
      {
        id: 'rl4', topic: 'Contrapositiva', c: 'Considere: “Se é concursado, então tem estabilidade.”',
        q: 'Qual proposição é logicamente equivalente a essa?', a: 2, src: 'p → q ≡ ~q → ~p',
        o: [
          { t: 'Se tem estabilidade, então é concursado.', p: 'inversao', w: 'É a recíproca (q → p). Não equivale à original: há quem tenha estabilidade por outros motivos.' },
          { t: 'Se não é concursado, então não tem estabilidade.', p: 'inversao', w: 'É a inversa (~p → ~q), também não equivalente.' },
          { t: 'Se não tem estabilidade, então não é concursado.', p: 'correta', w: 'É a contrapositiva: troca a ordem e nega as duas partes. É sempre equivalente à condicional original.' },
          { t: 'É concursado e tem estabilidade.', p: 'troca', w: 'Uma conjunção afirma as duas coisas como fato. A condicional só afirma uma relação.' }
        ]
      },
      {
        id: 'rl5', topic: 'Sequências', c: 'Observe a sequência: 2, 6, 12, 20, 30, ...',
        q: 'Qual é o próximo termo?', a: 3, src: 'Diferenças sucessivas',
        o: [
          { t: '40', p: 'calculo', w: 'Somou 10 de novo, repetindo a última diferença. As diferenças crescem de 2 em 2.' },
          { t: '36', p: 'calculo', w: 'Somou 6, como se o padrão recomeçasse. As diferenças são 4, 6, 8, 10 e a próxima é 12.' },
          { t: '44', p: 'calculo', w: 'Somou 14, pulando uma etapa do padrão.' },
          { t: '42', p: 'correta', w: 'As diferenças são 4, 6, 8, 10, a próxima é 12: 30 + 12 = 42. Também vale n × (n + 1): 6 × 7 = 42.' }
        ]
      },
      {
        id: 'rl6', topic: 'Probabilidade', c: 'Uma urna tem 3 bolas azuis e 2 vermelhas. Retiram-se 2 bolas, uma após a outra, sem reposição.',
        q: 'Qual é a probabilidade de as duas bolas serem azuis?', a: 1, src: 'Probabilidade condicional',
        o: [
          { t: '9/25', p: 'troca', w: 'Esse seria o resultado com reposição (3/5 × 3/5). Sem reposição, a segunda retirada muda.' },
          { t: '3/10', p: 'correta', w: 'Primeira azul: 3/5. Segunda azul, com 4 bolas restantes e 2 azuis: 2/4. 3/5 × 2/4 = 6/20 = 3/10.' },
          { t: '3/5', p: 'calculo', w: 'É a probabilidade de só a primeira bola ser azul. Faltou multiplicar pela segunda retirada.' },
          { t: '2/5', p: 'calculo', w: 'Corresponde a 2 azuis sobre 5 bolas, mistura indevida dos dados do problema.' }
        ]
      }
    ]
  },
  {
    id: 'excel', title: 'Excel no trabalho', subtitle: 'Treinamento corporativo',
    blurb: 'PROCV, SOMASES, referências e tabela dinâmica em situações reais de escritório. Ideal para onboarding.',
    color: 'navy', tag: 'Corporativo',
    questions: [
      {
        id: 'xl1', topic: 'PROCV e #N/D',
        c: 'A fórmula =PROCV(A2;Produtos!A:D;3;FALSO) retorna #N/D, mesmo com o código 00123 aparecendo nas duas planilhas. Em uma delas o código está alinhado à esquerda e, na outra, à direita.',
        q: 'Qual é a causa mais provável do erro?', a: 2, src: 'Excel: PROCV',
        o: [
          { t: 'Faltou fixar a referência com $ na matriz.', p: 'troca', w: 'Fixar com $ evita erros ao copiar a fórmula, mas não explica o #N/D na própria linha em que ela foi escrita.' },
          { t: 'O último argumento deveria ser VERDADEIRO.', p: 'inversao', w: 'VERDADEIRO faz correspondência aproximada e pode trazer o valor errado. Para códigos, FALSO (exata) é o correto.' },
          { t: 'Os códigos estão como texto em uma planilha e como número na outra.', p: 'correta', w: 'O alinhamento diferente denuncia tipos diferentes. "00123" (texto) e 123 (número) não são iguais para o PROCV.' },
          { t: 'O índice de coluna 3 é maior do que a matriz.', p: 'troca', w: 'A matriz A:D tem 4 colunas, então 3 é válido. Índice maior que a matriz geraria #REF!, não #N/D.' }
        ]
      },
      {
        id: 'xl2', topic: 'Referências absolutas',
        c: 'Na coluna B estão os valores das vendas e na célula C1 está a taxa de comissão, que vale para todas as linhas. A fórmula será escrita em C2 e copiada para baixo.',
        q: 'Qual fórmula deve ser escrita em C2?', a: 1, src: 'Excel: referências',
        o: [
          { t: '=$B$2*C1', p: 'inversao', w: 'Fixou a célula errada. Ao copiar, todas as linhas usariam B2 e a taxa se deslocaria.' },
          { t: '=B2*$C$1', p: 'correta', w: 'B2 deve variar a cada linha e a taxa em C1 deve ficar fixa. $C$1 trava linha e coluna.' },
          { t: '=B2*$C1', p: 'calculo', w: 'Travou só a coluna. Ao copiar para baixo, a linha muda para C2, C3... e a taxa se perde.' },
          { t: '=$B$2*$C$1', p: 'generalizacao', w: 'Travou tudo. Todas as linhas calculariam a comissão da primeira venda.' }
        ]
      },
      {
        id: 'xl3', topic: 'SOMASES',
        c: 'A coluna A tem a região, a coluna B tem o mês e a coluna C tem o valor vendido.',
        q: 'Qual fórmula soma as vendas da região Sul em março?', a: 3, src: 'Excel: SOMASES',
        o: [
          { t: '=SOMASE(A:A;"Sul";B:B;"Março";C:C)', p: 'troca', w: 'SOMASE aceita apenas um critério. Para dois ou mais, use SOMASES.' },
          { t: '=CONT.SES(A:A;"Sul";B:B;"Março")', p: 'troca', w: 'CONT.SES conta quantas linhas atendem aos critérios. Não soma valores.' },
          { t: '=SOMASES(A:A;"Sul";B:B;"Março";C:C)', p: 'calculo', w: 'Usou a ordem do SOMASE. No SOMASES, o intervalo a somar vem primeiro.' },
          { t: '=SOMASES(C:C;A:A;"Sul";B:B;"Março")', p: 'correta', w: 'Sintaxe: SOMASES(intervalo_soma; intervalo_critério1; critério1; intervalo_critério2; critério2).' }
        ]
      },
      {
        id: 'xl4', topic: 'Tabela dinâmica',
        c: 'Você recebeu uma base com 20 mil linhas de vendas e precisa, em poucos minutos, de um resumo do total por vendedor e por mês.',
        q: 'Qual recurso resolve isso de forma mais rápida e segura?', a: 0, src: 'Excel: análise de dados',
        o: [
          { t: 'Tabela dinâmica.', p: 'correta', w: 'Resume grandes volumes por linhas e colunas (vendedor × mês) em segundos, sem fórmulas e com menos risco de erro.' },
          { t: 'Filtrar vendedor por vendedor e somar manualmente.', p: 'calculo', w: 'Funciona, mas é lento e propenso a erro com dezenas de vendedores e 12 meses.' },
          { t: 'Formatação condicional.', p: 'troca', w: 'Ela destaca células visualmente, mas não agrega nem resume os dados.' },
          { t: 'Um gráfico de pizza com toda a base.', p: 'troca', w: 'Gráfico não é ferramenta de resumo. Com 20 mil linhas, nem seria legível.' }
        ]
      },
      {
        id: 'xl5', topic: 'SE aninhado',
        c: 'A nota do aluno está em A2. A regra é: 7 ou mais, “Aprovado”; de 5 a menos de 7, “Recuperação”; abaixo de 5, “Reprovado”.',
        q: 'Qual fórmula aplica a regra corretamente?', a: 2, src: 'Excel: SE',
        o: [
          { t: '=SE(A2>=5;"Recuperação";SE(A2>=7;"Aprovado";"Reprovado"))', p: 'inversao', w: 'Ordem invertida. Uma nota 9 cai no primeiro teste (>=5) e vira “Recuperação”, e “Aprovado” nunca aparece.' },
          { t: '=SE(A2>7;"Aprovado";SE(A2>5;"Recuperação";"Reprovado"))', p: 'calculo', w: 'Usou > em vez de >=. As notas 7 e 5 exatas ficariam na faixa errada.' },
          { t: '=SE(A2>=7;"Aprovado";SE(A2>=5;"Recuperação";"Reprovado"))', p: 'correta', w: 'Testa da faixa mais alta para a mais baixa. Cada SE só é avaliado se o anterior for falso.' },
          { t: '=SE(E(A2>=5;A2>=7);"Aprovado";"Reprovado")', p: 'troca', w: 'Nunca retorna “Recuperação” e a condição E é redundante. Não cobre as três faixas.' }
        ]
      },
      {
        id: 'xl6', topic: 'PROCX',
        c: 'A equipe vai migrar fórmulas antigas de PROCV para PROCX no Microsoft 365.',
        q: 'Qual é uma vantagem real do PROCX em relação ao PROCV?', a: 1, src: 'Excel: PROCX',
        o: [
          { t: 'Ele exige que os dados estejam ordenados, o que acelera a busca.', p: 'troca', w: 'Ordenação é exigência da correspondência aproximada do PROCV. O PROCX não exige isso.' },
          { t: 'Ele busca em qualquer direção, inclusive à esquerda, e usa correspondência exata por padrão.', p: 'correta', w: 'O PROCX separa a matriz de busca da de retorno, então o retorno pode estar à esquerda, e o padrão é a correspondência exata.' },
          { t: 'Ele só retorna números, o que evita erros de tipo.', p: 'restricao', w: 'O PROCX retorna textos, números e até intervalos inteiros.' },
          { t: 'Ele funciona em qualquer versão do Excel, inclusive 2010.', p: 'generalizacao', w: 'O PROCX existe no Microsoft 365 e nas versões a partir do Excel 2021. Versões antigas não o reconhecem.' }
        ]
      }
    ]
  }
];

const PERSONAS = [
  { id: 'concurso', l: 'Concurseiro', d: 'Alto volume, alta pressão', decks: ['neuro', 'port', 'dconst', 'logica'] },
  { id: 'faculdade', l: 'Universitário ou cursinho', d: 'Muita teoria, pouco tempo', decks: ['neuro', 'logica', 'port'] },
  { id: 'escola', l: 'Ensino médio', d: 'Construir a base', decks: ['neuro', 'port', 'logica'] },
  { id: 'empresa', l: 'Empresa ou treinamento', d: 'Onboarding e qualificação', decks: ['neuro', 'excel'] }
];
