# ♟️ Ajedrez con Q-Learning

Un sistema de ajedrez con aprendizaje por refuerzo (Q-Learning tabular) donde las blancas y las negras aprenden a jugar automáticamente. El conocimiento se guarda automáticamente en el navegador y puede exportarse/importarse.

## 📋 Características

- **2 agentes con IA**: Blancas y Negras aprenden simultáneamente
- **Q-Learning tabular**: Los agentes aprenden y mejoran con el tiempo
- **Tablero completo 8x8**: Implementación completa de reglas de ajedrez
- **Persistencia automática**: El conocimiento se guarda en localStorage
- **Exportación/Importación**: Guarda y carga el conocimiento aprendido
- **Panel de control interactivo**: Controla velocidad, parámetros de entrenamiento y más
- **Métricas en tiempo real**: Winrate, partidas, movimientos y tamaño de Q-table
- **Sin dependencias externas**: Solo HTML5 + JavaScript puro

## 🚀 Ejecución Local

### Opción 1: Servidor HTTP simple (Python)

```bash
cd ajedrez-ql
python -m http.server 8000
```

Luego abre tu navegador en `http://localhost:8000`

### Opción 2: Servidor HTTP simple (Node.js)

```bash
cd ajedrez-ql
npx http-server -p 8000
```

Luego abre tu navegador en `http://localhost:8000`

### Opción 3: Abrir directamente

Simplemente abre el archivo `index.html` en tu navegador.

## 📂 Estructura del Proyecto

```
ajedrez-ql/
├── index.html          # Página principal
├── css/
│   └── styles.css      # Estilos de la interfaz
├── js/
│   ├── board.js        # Tablero de ajedrez y movimientos
│   ├── agents.js       # Agentes con Q-Learning
│   ├── training.js     # Sistema de entrenamiento
│   ├── engine.js       # Motor de simulación
│   └── ui.js           # Panel de control y métricas
└── README.md           # Este archivo
```

## 🎯 Cómo Usar

1. **Iniciar/Pausar**: Presiona el botón "▶️ Iniciar" o la tecla `Espacio`
2. **Reiniciar partida**: Presiona "🔄 Reset" o la tecla `R`
3. **Reset entrenamiento**: Presiona "🗑️ Reset Entrenamiento" o la tecla `T` (borra todo el aprendizaje)
4. **Ajustar velocidad**: Usa el slider o las teclas `↑`/`↓` (1x - 100x)
5. **Exportar conocimiento**: Presiona "📥 Exportar Conocimiento" para descargar un JSON
6. **Importar conocimiento**: Presiona "📤 Importar Conocimiento" para cargar un JSON

## ⚙️ Parámetros de Entrenamiento

### Exploración (ε)
- Controla la probabilidad de explorar vs explotar
- Valores típicos: 0.05 - 0.3
- Más alto = más exploración, más bajo = más explotación

### Tasa de Aprendizaje (α)
- Controla qué tan rápido se actualizan los valores Q
- Valores típicos: 0.05 - 0.2
- Más alto = aprendizaje más rápido, pero menos estable

### Factor de Descuento (γ)
- Controla la importancia de recompensas futuras
- Valores típicos: 0.85 - 0.99
- Más alto = más importancia a recompensas a largo plazo

### Máximo de Movimientos
- Límite de movimientos por partida para evitar partidas infinitas
- Valores típicos: 100 - 500

## 🧠 Sistema de Aprendizaje

### Estado del Agente
Cada agente observa:
- Hash del tablero (representación compacta)
- Color a mover
- Diferencia material entre ambos equipos

### Recompensas

**Por acción:**
- `+10 * valor de pieza` por capturar una pieza
- `+5` por dar jaque
- `+1000` por jaque mate
- `-100` por ahogado (stalemate)
- `+2 * diferencia material` por ventaja material
- `-0.1` por cada movimiento

### Reglas del Juego
- **Movimientos válidos**: Todas las piezas de ajedrez con sus movimientos estándar
- **Promoción de peón**: Los peones se promocionan automáticamente a reina
- **Jaque mate**: Fin del juego cuando el rey está en jaque y no tiene movimientos válidos
- **Ahogado**: Fin del juego cuando el rey no está en jaque pero no tiene movimientos válidos
- **Límite de movimientos**: La partida termina si se alcanza el límite configurado

## 💾 Persistencia del Conocimiento

### localStorage
El conocimiento se guarda automáticamente en el navegador en las siguientes claves:
- `chess_qtable_white`: Q-table de las blancas
- `chess_qtable_black`: Q-table de las negras

### Exportar/Importar
Puedes exportar el conocimiento aprendido a un archivo JSON y compartirlo con otros:
1. Haz clic en "📥 Exportar Conocimiento"
2. Se descargará un archivo `chess_knowledge_YYYY-MM-DD.json`
3. Para importar, haz clic en "📤 Importar Conocimiento" y selecciona el archivo

## 🔧 Personalización

### Ajustar Recompensas

En [`js/agents.js`](js/agents.js:150):

```javascript
calculateReward(capturedPiece, isCheck, isCheckmate, isStalemate, materialDiff) {
    let reward = 0;
    if (capturedPiece) {
        const pieceValues = {
            pawn: 1, knight: 3, bishop: 3,
            rook: 5, queen: 9, king: 0
        };
        reward += pieceValues[capturedPiece.type] * 10;  // Ajusta aquí
    }
    // ... resto del código
    return reward;
}
```

### Ajustar Parámetros de Entrenamiento

En [`js/training.js`](js/training.js:15):

```javascript
// Parámetros por defecto
this.epsilon = 0.1;           // Tasa de exploración
this.learningRate = 0.1;      // Tasa de aprendizaje
this.discount = 0.9;          // Factor de descuento
this.maxMoves = 200;          // Límite de movimientos
```

### Ajustar Tamaño del Tablero

En [`js/board.js`](js/board.js:5):

```javascript
const BOARD_SIZE = 8;  // Cambia para diferentes tamaños
```

## 📊 Métricas Disponibles

- **Partida actual**: Número de la partida en curso
- **Movimiento actual**: Número de movimientos en la partida
- **Turno actual**: Color a mover (Blancas/Negras)
- **Total partidas**: Número total de partidas jugadas
- **Victorias blancas**: Número de partidas ganadas por blancas
- **Victorias negras**: Número de partidas ganadas por negras
- **Tablas**: Número de partidas terminadas en empate
- **Total movimientos**: Número total de movimientos ejecutados
- **Promedio movimientos/partida**: Promedio de movimientos por partida
- **Winrate blancas**: Porcentaje de victorias de blancas
- **Winrate negras**: Porcentaje de victorias de negras
- **Tamaño Q-table**: Número de estados aprendidos por cada equipo
- **Total de entradas**: Número total de entradas Q por cada equipo

## 🎓 Conceptos de Aprendizaje por Refuerzo

### Q-Learning
El algoritmo Q-Learning aprende una función Q(s,a) que representa el valor esperado de tomar la acción a en el estado s:

```
Q(s,a) = Q(s,a) + α * (r + γ * max(Q(s',a')) - Q(s,a))
```

Donde:
- `s`: Estado actual
- `a`: Acción tomada
- `r`: Recompensa recibida
- `s'`: Nuevo estado
- `α`: Tasa de aprendizaje
- `γ`: Factor de descuento

### Política ε-Greedy
Para equilibrar exploración y explotación:
- Con probabilidad ε: elegir acción aleatoria (explorar)
- Con probabilidad 1-ε: elegir mejor acción según Q-table (explotar)

## 🌐 Alojamiento como Página Estática

### GitHub Pages

1. Crea un repositorio en GitHub
2. Sube los archivos del proyecto
3. Ve a Settings > Pages
4. Selecciona la rama `main` y guarda
5. Tu sitio estará disponible en `https://tu-usuario.github.io/ajedrez-ql/`

### Netlify

1. Instala Netlify CLI: `npm install -g netlify-cli`
2. En la carpeta del proyecto: `netlify deploy --prod`
3. Sigue las instrucciones

### Vercel

1. Instala Vercel CLI: `npm install -g vercel`
2. En la carpeta del proyecto: `vercel --prod`
3. Sigue las instrucciones

## 🔄 Evolución Futura

Posibles mejoras para el proyecto:

1. **Deep Q-Networks (DQN)**: Reemplazar Q-table tabular con una red neuronal
2. **AlphaZero-style**: Usar Monte Carlo Tree Search (MCTS) con redes neuronales
3. **Self-play mejorado**: Implementar técnicas modernas de auto-aprendizaje
4. **Enroque**: Implementar movimientos de enroque
5. **Captura al paso**: Implementar la regla de captura al paso
6. **Torneos**: Modo torneo entre diferentes versiones de la IA

## 📝 Notas Técnicas

### Espacio de Estados
El espacio de estados de ajedrez es extremadamente grande (~10^43 estados posibles). Por esta razón:
- Se usa una representación simplificada del estado
- El aprendizaje es más lento que en juegos más simples
- Se recomienda entrenar por muchas partidas (miles o millones)

### Rendimiento
- El Q-Learning tabular puede consumir mucha memoria
- Se recomienda usar un navegador moderno con suficiente RAM
- La velocidad de entrenamiento depende de la potencia del CPU

## 🐛 Solución de Problemas

### El conocimiento no se guarda
- Verifica que tu navegador permita localStorage
- Limpia la caché del navegador si es necesario

### El juego es lento
- Reduce la velocidad en el slider
- Reduce el número de movimientos por frame en [`js/engine.js`](js/engine.js:25)

### Los agentes no mejoran
- Aumenta la tasa de exploración (ε)
- Aumenta la tasa de aprendizaje (α)
- Entrena por más tiempo (miles de partidas)

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso educativo y personal.

## 👨‍💻 Autor

Desarrollado como prototipo de aprendizaje por refuerzo en ajedrez.

## 🙏 Agradecimientos

- Inspirado en proyectos de ajedrez con IA
- Basado en algoritmos de Q-Learning estándar
- Implementado con HTML5 Canvas y JavaScript puro

---

**¡Disfruta experimentando con el aprendizaje por refuerzo en ajedrez! ♟️🧠**
