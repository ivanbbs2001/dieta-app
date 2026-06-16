# Dieta — PWA para iOS

## O que foi adicionado

| Arquivo | O que faz |
|---|---|
| `public/manifest.json` | Registra o app: nome, ícones, cor, modo fullscreen |
| `public/sw.js` | Service worker: cache offline para assets estáticos |
| `public/icons/` | Ícones em 8 tamanhos (72px → 512px) |
| `index.html` | Meta tags iOS + registro do service worker |

## Como aplicar no seu projeto

1. **Copie os arquivos** desta pasta para o seu projeto:
   - `public/manifest.json` → `public/manifest.json`
   - `public/sw.js`         → `public/sw.js`
   - `public/icons/`        → `public/icons/`
   - Substitua seu `index.html` pelo deste zip
   - Substitua seu `vite.config.js` pelo deste zip (se necessário)

2. **Faça o deploy**:
   ```bash
   npm run build
   npm run deploy
   # ou: gh-pages -d dist
   ```

3. **No iPhone** (Safari):
   - Acesse a URL do seu app (ex: `https://seu-user.github.io/dieta-app/`)
   - Toque no ícone de compartilhar **⎙**
   - Toque em **"Adicionar à Tela de Início"**
   - Confirme

Pronto: o ícone aparece na tela inicial, abre sem barra do Safari, em modo fullscreen, e funciona offline.

## Notas iOS
- Safari no iOS exige HTTPS para service workers — o GitHub Pages já usa HTTPS por padrão.
- O splash screen automático do iOS usa o `background_color` do manifest (#161616) + o ícone apple-touch-icon.
- O `status-bar-style: black-translucent` permite que o conteúdo rode atrás da status bar — as variáveis `--safe-top/bottom` no CSS compensam isso.
