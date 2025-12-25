# Universo com Planeta C

Este projeto é uma simulação 3D interativa imersiva ("Planeta C"), com visualização orbital, transições cinematográficas e uma superfície procedural rica, desenvolvida em Modern JavaScript e Three.js.

## Destaques Tecnológicos

### 1. Arquitetura 2.5D Híbrida (Volumétrica)
A nave (Rover) não é um modelo 3D tradicional, mas sim uma entidade volumétrica criada através de **Sprite Stacking**. 40 camadas de sprites 2D são empilhadas verticalmente e renderizadas com um shader personalizado, criando uma ilusão 3D convincente com performance extremamente leve (estilo retro-futurista).

### 2. Shaders Procedurais e VFX
- **Portal de Vórtex:** O portal da loja Adrena utiliza um `ShaderMaterial` personalizado que gera um túnel infinito animado matematicamente (sem textura de imagem), com efeitos de distorção de tempo e partículas de sucção.
- **Keying em Tempo Real:** As sprites da nave utilizam um shader de fragmento para remover o fundo branco (chroma key) e aplicar tintura baseada na profundidade da camada em tempo real.
- **Poeira e Rastros:** Sistema de partículas dinâmico que reage à velocidade da nave e à altura do terreno.

### 3. Texturas Procedurais (Geradas em Código)
Para otimizar o tempo de carregamento e o uso de memória, muitas texturas (como os painéis de circuitos do chão e da loja Adrena) são geradas algoritmicamente em tempo de execução usando o HTML Canvas API. Isso garante:
- Resolução infinita (sem pixelização).
- Cores dinâmicas (tema Cyberpunk).
- Peso de arquivo zero (sem JPGs pesados para carregar).

## Funcionalidades
- **Modo Órbita:** Visualização planetária com navios em órbita dinâmica.
- **Exploração de Superfície:**
  - Pilotagem com física de hover (flutuação).
  - Terreno deformado proceduralmente (heightmap).
  - Edifícios interativos (Loja Adrena, Templo de Treinamento).
  - Links externos integrados ao mundo 3D (clique nos prédios).

## Como Rodar
1. Servidor local: `python3 -m http.server 8080`
2. Acesse: `http://localhost:8080`

## Controles
- **WASD / Setas:** Pilotar a nave.
- **Clique:** Interagir com portais e objetos.
- **Scroll/Zoom:** Ajustar câmera em órbita.

## Stack
- **JavaScript (ES6+)**
- **Three.js (WebGL)**
- **GLSL (Shaders)**
