# Universo com Planeta C

Este projeto é uma simulação 3D interativa de um planeta em forma de "C" (Planeta C), com visualização orbital e exploração de superfície, desenvolvida em JavaScript usando Three.js.

## Funcionalidades

- **Visualização orbital:** Gire, aproxime e afaste a câmera ao redor do Planeta C em 3D.
- **Planeta C 3D:** O planeta é um cilindro deformado em arco, com textura lunar realista e normal map.
- **Transição de modos:** Clique no planeta para "aterrizar" e explorar a superfície.
- **Superfície explorável:** Controle um rover com as setas do teclado sobre uma planície texturizada com a superfície lunar.
- **Colônia e objetos:** Estruturas 3D (colônia, domo, antena, outdoor) e interação com outdoor (abre link).
- **Estrelas:** Fundo de estrelas em ambas as cenas.
- **Responsivo:** O canvas ocupa sempre 100% da tela, adaptando-se a qualquer tamanho de janela.

## Como usar

1. Acesse a aplicação publicada (por exemplo, no Vercel) em um navegador moderno (Chrome, Firefox, Edge, Safari).
2. Aguarde o carregamento das texturas (pode demorar alguns segundos na primeira vez).
3. **Modo órbita:**
   - Use o mouse para girar e dar zoom ao redor do planeta.
   - Clique no planeta para "aterrizar".
4. **Modo superfície:**
   - Use as setas do teclado para dirigir o rover.
   - Clique no outdoor para abrir o manual do iniciante em C.
   - Clique em "Voltar à Órbita" para retornar à visão orbital.

## Estrutura do projeto

- `Planetac.html`: Arquivo principal, contém todo o código JavaScript, HTML e CSS.
- `README.md`: Este arquivo de instruções.

## Detalhes técnicos

- **Three.js** é carregado via CDN (importmap).
- **Texturas:**
  - Textura lunar: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg
  - Normal map lunar: https://c1.staticflickr.com/9/8248/8645325193_50d559a39d_b.jpg
- **Planeta C:**
  - Criado a partir de um `CylinderGeometry` deformado em arco.
  - Mapeamento UV padrão do cilindro, com `repeat.set(4, 2)`.
  - Material: `MeshStandardMaterial` com textura e normal map.
- **Chão:**
  - `PlaneGeometry` grande, com as mesmas texturas da lua, `repeat.set(20, 20)`.
- **Responsividade:**
  - O canvas usa `width: 100vw; height: 100vh` e o renderer/câmeras são ajustados no evento de resize.
- **Fallback:**
  - Se as texturas não carregarem, o planeta e o chão aparecem em cinza.

## Possíveis problemas

- Se as texturas não aparecerem:
  - Verifique sua conexão com a internet.
  - Teste em outro navegador ou aba anônima.
  - Veja o console do navegador para mensagens de erro de CORS ou rede.

## Créditos

- Textura lunar: [three.js examples](https://github.com/mrdoob/three.js/tree/master/examples/textures/planets)
- Normal map lunar: [Flickr - NASA Goddard](https://www.flickr.com/photos/gsfc/8645325193)
- Código e modelagem: Adaptado por snows

---
