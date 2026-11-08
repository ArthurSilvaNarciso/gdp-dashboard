/* ================= Privacidade e termos (LGPD) =================
   Preencha LEGAL.org (nome ou razão social de quem mantém o app), LEGAL.doc (CPF/CNPJ, opcional) e LEGAL.email
   (canal do encarregado de dados) antes do lançamento. Os textos foram escritos para este app; peça uma revisão jurídica. */
const LEGAL = { org: 'Projeto Memory', doc: '', email: '', updated: '05/11/2026' };
const legalContact = () => (LEGAL.email ? `pelo e-mail <b>${esc(LEGAL.email)}</b>` : 'pelo canal de contato informado na página do Memory');
const LEGAL_DOCS = {
  privacidade: () => ({
    title: 'Política de privacidade',
    body: `
<p>Esta política explica quais dados o Memory trata, por que, com quem compartilha e como você exerce seus direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD). Controlador: <b>${esc(LEGAL.org)}</b>${LEGAL.doc ? ', ' + esc(LEGAL.doc) : ''}. Contato do encarregado: ${legalContact()}.</p>
<h3>1. Sem conta, tudo fica no seu aparelho</h3>
<p>Você pode usar o Memory sem criar conta. Nesse caso, nome, objetivo, respostas, progresso e avatar ficam salvos apenas no armazenamento local do navegador e não são enviados aos nossos servidores.</p>
<h3>2. Dados que tratamos quando você cria conta</h3>
<ul>
<li><b>Cadastro:</b> nome, e-mail e senha. A senha é guardada só como hash (bcrypt), nunca em texto.</li>
<li><b>Estudo:</b> respostas, nível de confiança, progresso, sequência, moedas, avatar, trilhas que você cria e turmas de que participa.</li>
<li><b>Material enviado para a IA:</b> o texto de PDFs ou anotações que você escolhe enviar para gerar questões, e as perguntas feitas ao tutor.</li>
<li><b>Segurança:</b> endereço IP, data e hora de acessos e de ações importantes (login, troca de senha, exclusão).</li>
<li><b>Notificações:</b> se você ativar, o endereço de entrega de notificações do seu navegador e o horário escolhido.</li>
<li><b>Erros do app:</b> quando algo quebra no seu aparelho, registramos a mensagem técnica do erro, a tela, a versão do app e o tipo de navegador, sem nome, e-mail ou conteúdo seu, para corrigir o problema. Esses registros são apagados em 90 dias.</li>
<li><b>Estatísticas anônimas:</b> contamos, por dia, quantas vezes algumas ações acontecem no app (por exemplo, ciclos concluídos e aulas estudadas), sem ligar a contagem a nenhuma pessoa. Você pode desligar no Perfil.</li>
</ul>
<p>Não usamos cookies de publicidade nem ferramentas de rastreamento de terceiros. O único cookie é o de sessão, necessário para manter você conectado.</p>
<h3>3. Para que usamos e com qual base legal</h3>
<ul>
<li>Criar e manter sua conta, sincronizar o progresso e oferecer turmas e ligas: <b>execução de contrato</b> (art. 7º, V).</li>
<li>Gerar questões e respostas com IA a partir do material que você envia: <b>execução de contrato</b>, a seu pedido.</li>
<li>Prevenir fraudes, abuso e acessos indevidos: <b>legítimo interesse</b> (art. 7º, IX) e <b>cumprimento de obrigação legal</b> (art. 7º, II; Marco Civil da Internet, art. 15).</li>
<li>Enviar lembretes de estudo: <b>consentimento</b> (art. 7º, I), que você pode retirar a qualquer momento no Perfil.</li>
</ul>
<h3>4. Com quem compartilhamos</h3>
<p>Só com fornecedores necessários para o serviço funcionar, que tratam os dados em nosso nome: hospedagem (Vercel), banco de dados (Neon), inteligência artificial (Anthropic, apenas o conteúdo enviado para gerar questões ou falar com o tutor) e envio de e-mails de recuperação de senha. Alguns ficam fora do Brasil; a transferência internacional segue o art. 33 da LGPD. Professores das turmas que você entra veem seu nome, avatar e desempenho naquela turma. Participantes da sua liga semanal veem seu primeiro nome, avatar e XP da semana. Não vendemos dados.</p>
<h3>5. Por quanto tempo guardamos</h3>
<p>Enquanto a conta existir. Ao excluir a conta, apagamos cadastro, progresso, trilhas e participação em turmas e ligas. Registros de acesso são mantidos por no mínimo 6 meses, como exige o Marco Civil da Internet (art. 15), e apagados após 12 meses.</p>
<h3>6. Seus direitos (art. 18)</h3>
<p>Você pode confirmar e acessar seus dados, corrigir, pedir portabilidade, eliminar, revogar consentimentos e obter informações sobre compartilhamento. No próprio app: <b>Perfil → Conta → Baixar meus dados</b> (cópia completa em JSON) e <b>Excluir conta</b>. Para outros pedidos, fale com o encarregado ${legalContact()}. Você também pode reclamar à ANPD.</p>
<h3>7. Segurança</h3>
<p>Conexão sempre criptografada (HTTPS), senhas com hash, sessões revogáveis, limite de tentativas de login e registro de ações sensíveis. Em caso de incidente com risco relevante, você e a ANPD serão comunicados (art. 48).</p>
<h3>8. Crianças e adolescentes</h3>
<p>Menores de 12 anos só podem criar conta com consentimento de um dos pais ou responsável (art. 14, § 1º). Adolescentes devem usar o app com conhecimento dos responsáveis.</p>
<p class="tiny">Atualizada em ${esc(LEGAL.updated)}. Mudanças relevantes serão avisadas no app.</p>`
  }),
  termos: () => ({
    title: 'Termos de uso',
    body: `
<p>Ao usar o Memory, você concorda com estes termos. Serviço mantido por <b>${esc(LEGAL.org)}</b>${LEGAL.doc ? ', ' + esc(LEGAL.doc) : ''}.</p>
<h3>1. O que é o Memory</h3>
<p>Um app de estudo por recuperação ativa e repetição espaçada, com questões próprias, trilhas criadas por você, turmas, ligas e recursos de inteligência artificial. As questões são autorais e de caráter educativo: não são questões oficiais de bancas nem garantem aprovação.</p>
<h3>2. Sua conta</h3>
<p>Use dados verdadeiros, guarde sua senha e não compartilhe a conta. Você é responsável pelo que acontece nela. Podemos suspender contas usadas para fraude, abuso, spam ou para burlar limites.</p>
<h3>3. Conteúdo que você envia</h3>
<p>Você mantém os direitos sobre PDFs, anotações e trilhas que cria e declara ter direito de usá-los. Ao compartilhar uma trilha por código ou com uma turma, autoriza quem recebe a estudá-la no app. Não envie conteúdo ilegal, ofensivo, protegido sem autorização ou com dados pessoais de terceiros.</p>
<h3>4. Inteligência artificial</h3>
<p>Questões e explicações geradas por IA podem conter erros. Confira com o material oficial e use o botão <b>Reportar problema</b> quando encontrar algo errado. Há limites diários de uso para manter o serviço estável.</p>
<h3>5. Turmas e ligas</h3>
<p>Professores podem ver o desempenho dos alunos da turma. Nas ligas, seu primeiro nome, avatar e XP da semana aparecem para os participantes. Respeite os outros usuários.</p>
<h3>6. Disponibilidade</h3>
<p>Trabalhamos para manter o app no ar e seus dados seguros, mas o serviço é oferecido como está, podendo passar por manutenção, mudanças ou interrupções. Recomendamos baixar seus dados periodicamente.</p>
<h3>7. Encerramento</h3>
<p>Você pode excluir sua conta quando quiser em Perfil → Conta. Estes termos podem ser atualizados; mudanças relevantes serão avisadas no app. Fica eleito o foro do domicílio do usuário, nos termos do Código de Defesa do Consumidor.</p>
<p class="tiny">Atualizados em ${esc(LEGAL.updated)}. Dúvidas: ${legalContact()}.</p>`
  })
};
function legalSheet(doc) {
  const d = (LEGAL_DOCS[doc] || LEGAL_DOCS.privacidade)();
  return `<div class="legal"><div class="sec"><h2>${d.title}</h2></div><div class="legal-body">${d.body}</div>
    <button class="btn btn-primary btn-block" data-act="legal-back">${ui.legalFrom === 'auth' ? 'Voltar ao cadastro' : 'Fechar'}</button></div>`;
}
Object.assign(ACT, {
  'legal': (d) => { ui.legalFrom = document.querySelector('[data-form="auth"]') ? 'auth' : null; if (ui.legalFrom && typeof readAuth === 'function') readAuth(); ui.sheet = legalSheet(d.doc); renderSheet(); const sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; },
  'legal-back': () => { if (ui.legalFrom === 'auth') { ui.legalFrom = null; paintAuth(); } else { ui.sheet = null; renderSheet(); } }
});
