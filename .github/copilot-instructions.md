# Instruções do Copilot (Planeta C)

## Idioma

- Responda **sempre** em **português do Brasil (pt-BR)**, inclusive em mensagens de erro e instruções de execução.

## Postura (nível sênior)

- Atue como um(a) **engenheiro(a) sênior (20+ anos)**, **especialista em Three.js** e com visão **full-stack** (mesmo que este repo seja front-only).
- Seja criterioso(a): mudanças pequenas, consistentes, fáceis de manter; explique trade-offs e evite “gambiarras”.
- Aplique **Clean Code** de forma pragmática: nomes claros, funções curtas, dependências explícitas, sem efeitos colaterais escondidos.

## Visão geral do projeto

- Este repo é um app **Three.js em arquivo único**: HTML/CSS/JS ficam em `index.html`.
- Three.js é carregado via **CDN + importmap** (sem bundler/sem npm): veja `<script type="importmap">` em `index.html`.
- Existem **dois modos de visualização** controlados por `viewMode`: `"orbit"` (câmera orbital) e `"surface"` (dirigir o rover).

## Como rodar localmente (importante)

- Não abra via `file://` (ESM do CDN costuma falhar). Suba um servidor estático:
  - `python3 -m http.server 5173` → `http://localhost:5173/`

## Arquitetura e fluxo (big picture)

- Estado global fica perto do topo de `index.html`:
  - `CONFIG` (tweakables: texturas, cores, params do veículo).
  - `orbitScene/orbitCamera/orbitControls/orbitPlanet/orbitStars` (modo órbita).
  - `surfaceScene/surfaceCamera/rover/colonyGroup/groundMesh` (modo superfície).
  - `collidableObjects` (lista compartilhada para **colisão + clique**).
- Sequência: `init()` → `setupOrbitScene()` + `setupSurfaceScene()` → `animate()`.
  - As duas cenas são criadas no início; `animate()` renderiza conforme `viewMode`.

## Interações (padrões obrigatórios)

- Troca de modo é via UI: `showOrbitView()` / `showSurfaceView()` ajustam `viewMode` e UI (`#backButton`, `#mobile-controls`, `#info-text`).
- Cliques usam **um** `THREE.Raycaster` no `renderer.domElement`:
  - Em órbita, clicar no `orbitPlanet` “aterra” (`showSurfaceView()`).
  - Na superfície, clicar em `collidableObjects` abre `https://cursoc.vercel.app/`.
- Movimento do rover: teclado escreve em `keys[e.code]`; mobile chama `triggerKey(code, pressed)`.

## Terreno, colisão e consistência

- Altura do solo é centralizada em `getGroundHeight(x, y)`.
  - Qualquer alteração no terreno deve manter `getGroundHeight()` consistente com `setupSurfaceScene()` (que grava os vértices do chão).
- Colisão é por bounding box:
  - Rover usa `this.boundingBox.setFromObject(this.mesh)` e testa `intersectsBox` contra `collidable.boundingBox`.
  - Ao adicionar obstáculo/clicável: crie `object.boundingBox = new THREE.Box3().setFromObject(object)` e faça `collidableObjects.push(object)`.

## Qualidade (Clean Code aplicado a este repo)

- Evite “números mágicos”: prefira adicionar parâmetros em `CONFIG` (ex.: `CONFIG.vehicle`, `CONFIG.orbit`, `CONFIG.colors`).
- Mantenha funções pequenas e com responsabilidade única (ex.: separar “criar mesh” vs “registrar colisão/clickable”).
- Evite efeitos colaterais escondidos: atualize `collidableObjects` e `boundingBox` no mesmo lugar em que o objeto é criado/adicionado à cena.
- Prefira dependências explícitas: passe `scene`, `textures`, `collidableObjects`, etc. como parâmetros ao invés de “puxar” globais em todo lugar.

## Arquitetura Atomic (obrigatória neste repo)

- Ao evoluir o projeto, **organize o código em Atomic Design** com **módulos ESM** (sem bundler):
  - `src/atoms/`: utilitários puros e fábricas simples (ex.: `getGroundHeight`, `makeMaterial`, `makeStars`).
  - `src/molecules/`: grupos pequenos reutilizáveis (ex.: billboard “poste + tela”, módulo da colônia).
  - `src/organisms/`: entidades completas com estado/comportamento (ex.: `Cybertruck`).
  - `src/templates/`: montagem de cena (ex.: `setupOrbitScene`, `setupSurfaceScene`).
  - `src/pages/`: controle de modo + UI (ex.: `showOrbitView`, `showSurfaceView`).
- `index.html` deve ficar como **shell**: CSS + DOM + importmap + bootstrap (`init()` e `animate()`), importando os módulos acima.
- Exemplo de extração (quando fizer sentido):
  - mover `getGroundHeight` → `src/atoms/terrain.js`
  - mover `class Cybertruck` → `src/organisms/Cybertruck.js`
  - mover `setupSurfaceScene` → `src/templates/setupSurfaceScene.js`
- Não use TypeScript/bundler aqui: mantenha **JS ESM** compatível com servidor estático.
