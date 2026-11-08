# Publicar o Memory na Play Store (passo a passo)

O Memory já é um PWA completo (manifesto, ícones, service worker e offline). Para a Play Store ele vira um
"Trusted Web Activity": um app Android leve que abre o site em tela cheia, sem barra do navegador.

## Antes: o site precisa estar no ar com domínio próprio (HTTPS)
Ex.: memoryestudo.com.br apontando para a Vercel (passo 4 do guia de publicação).

## Caminho mais simples: PWABuilder (sem instalar nada)
1. Abra https://www.pwabuilder.com e cole o endereço do site. Clique em **Start**.
2. Clique em **Package for stores** → **Android** → **Generate Package**.
3. Em **Options**: Package ID `br.app.memory.estudo`, App name `Memory: estudo para concursos`, Launcher name `Memory`,
   Version `7.3`, Version code `73`. Mantenha **Signing key: Create new** e baixe o .zip.
4. Guarde em lugar seguro o arquivo `signing.keystore` e as senhas do `signing-key-info.txt` (sem eles você não atualiza o app depois).
5. Copie o arquivo `assetlinks.json` que veio no .zip para a pasta `.well-known/` do projeto (veja abaixo) e publique o site.

## Play Console
1. Crie a conta de desenvolvedor em https://play.google.com/console (taxa única de US$ 25).
2. **Criar app** → nome, idioma Português (Brasil), App, Gratuito.
3. **Testar e lançar → Produção → Criar nova versão** → envie o `.aab` do pacote.
4. Em **Integridade do app → Assinatura de apps**, copie a **impressão digital SHA-256** da chave de assinatura do Google e
   acrescente-a no `assetlinks.json` (lista `sha256_cert_fingerprints`). Sem isso o app abre com barra de endereço.
5. Preencha a ficha da loja com o texto pronto de `android/LOJA.md` e as imagens de `android/store/`.
6. Responda os questionários (classificação indicativa, segurança dos dados, público-alvo) e envie para revisão.

## Arquivo .well-known/assetlinks.json
Crie no projeto `.well-known/assetlinks.json` com o conteúdo de `android/assetlinks.modelo.json`, trocando a impressão
digital. O vercel.json já serve a pasta como estática. Confira em `https://SEU-DOMINIO/.well-known/assetlinks.json`.

## Alternativa: Bubblewrap (linha de comando)
`android/twa-manifest.json` já está preenchido; troque `TROQUE-PELO-SEU-DOMINIO` e rode `npx @bubblewrap/cli build`.
