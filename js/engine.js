/**
 * Módulo del Motor de Simulación - Gestiona el bucle principal del juego de ajedrez
 * Renderizado, control de tiempo y coordinación de componentes
 */

/**
 * Clase ChessEngine - Motor principal del juego de ajedrez
 */
class ChessEngine {
    constructor() {
        // Canvas principal
        this.canvas = document.getElementById('chessCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Componentes del juego
        this.whiteAgent = new ChessAgent(PIECE_COLORS.WHITE, 'chess_qtable_white');
        this.blackAgent = new ChessAgent(PIECE_COLORS.BLACK, 'chess_qtable_black');
        this.trainingManager = new TrainingManager(this.whiteAgent, this.blackAgent);

        // Usar el mismo tablero que TrainingManager para renderizado
        this.board = this.trainingManager.board;

        // Estado del juego
        this.isRunning = false;
        this.gameMode = 'training'; // 'training' o 'human_vs_ai'
        this.speed = 1;  // Multiplicador de velocidad (1x - 100x)
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedDeltaTime = 0.1;  // 100ms por paso (10 FPS base)
        this.movesPerFrame = 1;  // Movimientos por frame

        // Renderizado
        this.cellSize = 60;  // 480px / 8 celdas
        this.selectedCell = null;
        this.validMoves = [];

        // Configurar callbacks del entrenamiento
        this.setupTrainingCallbacks();
        this.setupHumanCallbacks();

        // Render inicial
        this.render();
    }

    /**
     * Configura los callbacks del entrenamiento
     */
    setupTrainingCallbacks() {
        this.trainingManager.onMetricsUpdate = (metrics) => {
            this.updateMetricsDisplay(metrics);
        };

        this.trainingManager.onGameComplete = (result) => {
            console.log(`Partida ${result.game} completada:`, result);
        };

        this.trainingManager.onMoveComplete = (moveInfo) => {
            this.render();
        };

        this.trainingManager.onObservationMode = (mode) => {
            this.updateObservationModeDisplay(mode);
        };
    }

    /**
     * Configura los callbacks para modo humano vs IA
     */
    setupHumanCallbacks() {
        // Callback para cuando el humano selecciona una pieza
        this.onPieceSelected = null;
        // Callback para cuando el humano realiza un movimiento
        this.onHumanMove = null;
        // Callback para cuando el juego termina en modo humano
        this.onHumanGameEnd = null;
    }

    /**
     * Cambia entre modos de juego
     */
    setGameMode(mode) {
        this.gameMode = mode;
        this.trainingManager.setGameMode(mode);
        this.updateModeButtons();
        
        if (mode === 'training') {
            // Modo de entrenamiento - deshabilitar interacción humana
            this.canvas.style.cursor = 'default';
            this.canvas.onclick = null;
        } else if (mode === 'human_vs_ai') {
            // Modo humano vs IA - habilitar interacción humana
            this.canvas.style.cursor = 'pointer';
            this.canvas.onclick = (e) => this.handleCanvasClick(e);
        }
    }

    /**
     * Actualiza los botones de modo
     */
    updateModeButtons() {
        const btnTraining = document.getElementById('btnModeTraining');
        const btnHuman = document.getElementById('btnModeHuman');
        
        if (this.gameMode === 'training') {
            btnTraining.classList.add('active');
            btnHuman.classList.remove('active');
        } else {
            btnTraining.classList.remove('active');
            btnHuman.classList.add('active');
        }
    }

    /**
     * Maneja clics en el canvas para modo humano
     */
    handleCanvasClick(e) {
        if (this.gameMode !== 'human_vs_ai') return;
        if (this.trainingManager.currentColor !== PIECE_COLORS.WHITE) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);

        if (this.selectedCell) {
            // Intentar mover la pieza seleccionada
            const move = this.validMoves.find(m => m.to.row === row && m.to.col === col);
            if (move) {
                this.executeHumanMove(move);
            }
            this.selectedCell = null;
            this.validMoves = [];
            this.render();
        } else {
            // Seleccionar una pieza
            const piece = this.board.getPiece(row, col);
            if (piece && piece.color === PIECE_COLORS.WHITE) {
                this.selectedCell = { row, col };
                this.validMoves = this.board.getAllValidMoves(PIECE_COLORS.WHITE)
                    .filter(m => m.from.row === row && m.from.col === col);
                this.render();
            }
        }
    }

    /**
     * Ejecuta un movimiento humano
     */
    executeHumanMove(move) {
        const piece = this.board.getPiece(move.from.row, move.from.col);
        const capturedPiece = move.enPassant ?
            this.board.getPiece(move.capturedPawnRow, move.capturedPawnCol) :
            this.board.getPiece(move.to.row, move.to.col);
        
        // Preparar información de enroque si aplica
        const castlingInfo = move.castling ? {
            rookFrom: move.rookFrom,
            rookTo: move.rookTo
        } : null;
        
        // Preparar información de En Passant si aplica
        const enPassantInfo = move.enPassant ? {
            capturedPawnRow: move.capturedPawnRow,
            capturedPawnCol: move.capturedPawnCol
        } : null;
        
        this.board.movePiece(move.from.row, move.from.col, move.to.row, move.to.col, castlingInfo, enPassantInfo);
        
        // Promoción de peón
        if (piece.type === PIECE_TYPES.PAWN) {
            const promotionRow = piece.color === PIECE_COLORS.WHITE ? 0 : 7;
            if (move.to.row === promotionRow) {
                const promotionPiece = this.whiteAgent.choosePromotionPiece(this.board);
                this.board.setPiece(move.to.row, move.to.col, promotionPiece);
            }
        }
        
        // Registrar movimiento en historial
        const currentColor = this.trainingManager.currentColor;
        this.trainingManager.gameHistory.push({
            move: this.trainingManager.currentMove,
            color: currentColor,
            from: move.from,
            to: move.to,
            captured: capturedPiece
        });

        // Registrar movimiento humano para aprendizaje
        this.trainingManager.registerHumanMove(move, capturedPiece);

        // Cambiar turno
        const nextColor = currentColor === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE;
        this.trainingManager.currentMove++;
        this.trainingManager.currentColor = nextColor;
        
        // Notificar movimiento
        if (this.onHumanMove) {
            this.onHumanMove(move, capturedPiece);
        }
        
        this.render();

        // Verificar fin de juego y, si aplica, responder con IA
        const gameEnded = this.checkGameEnd();
        if (!gameEnded && this.gameMode === 'human_vs_ai' && this.trainingManager.currentColor === PIECE_COLORS.BLACK) {
            this.performAIMove();
        }
    }

    /**
     * Verifica si el juego terminó en modo humano
     */
    checkGameEnd() {
        const currentColor = this.trainingManager.currentColor;
        const allMoves = this.board.getAllValidMoves(currentColor);

        if (this.board.is50MoveRule()) {
            this.trainingManager.endHumanGame('draw', '50_move_rule');
            if (this.onHumanGameEnd) {
                this.onHumanGameEnd('draw', '50_move_rule');
            }
            return true;
        }

        if (this.board.isThreefoldRepetition(currentColor)) {
            this.trainingManager.endHumanGame('draw', 'threefold_repetition');
            if (this.onHumanGameEnd) {
                this.onHumanGameEnd('draw', 'threefold_repetition');
            }
            return true;
        }

        if (allMoves.length === 0) {
            if (this.board.isInCheck(currentColor)) {
                const winner = currentColor === PIECE_COLORS.WHITE ? 'black' : 'white';
                this.trainingManager.endHumanGame(winner, 'checkmate');
                if (this.onHumanGameEnd) {
                    this.onHumanGameEnd(winner, 'checkmate');
                }
            } else {
                this.trainingManager.endHumanGame('draw', 'stalemate');
                if (this.onHumanGameEnd) {
                    this.onHumanGameEnd('draw', 'stalemate');
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Ejecuta un movimiento de IA en modo humano vs IA
     */
    performAIMove() {
        if (this.gameMode !== 'human_vs_ai') return;
        if (this.trainingManager.currentColor !== PIECE_COLORS.BLACK) return;

        const currentAgent = this.blackAgent;
        const currentState = currentAgent.getState(this.board);
        const validMoves = this.board.getAllValidMoves(PIECE_COLORS.BLACK);

        if (validMoves.length === 0) {
            this.checkGameEnd();
            return;
        }

        const action = currentAgent.selectAction(currentState, validMoves, this.trainingManager.epsilon);
        const capturedPiece = currentAgent.executeAction(this.board, action);

        this.trainingManager.gameHistory.push({
            move: this.trainingManager.currentMove,
            color: PIECE_COLORS.BLACK,
            from: action.from,
            to: action.to,
            captured: capturedPiece
        });

        this.trainingManager.currentMove++;
        this.trainingManager.currentColor = PIECE_COLORS.WHITE;

        this.render();
        this.checkGameEnd();
    }

    /**
     * Inicia el juego
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            
            if (this.gameMode === 'training') {
                // Modo de entrenamiento - IA vs IA
                this.trainingManager.startTraining();
            }
            
            this.gameLoop();
        }
    }

    /**
     * Pausa el juego
     */
    pause() {
        this.isRunning = false;
        this.trainingManager.pauseTraining();
    }

    /**
     * Reinicia el juego
     */
    reset() {
        this.pause();
        this.trainingManager.startNewGame();
        this.render();
    }

    /**
     * Reinicia el entrenamiento
     */
    resetTraining() {
        this.pause();
        this.trainingManager.resetTraining();
        this.render();
    }

    /**
     * Establece la velocidad de simulación
     */
    setSpeed(speed) {
        this.speed = speed;
        // Ajustar movimientos por frame según velocidad
        if (speed <= 10) {
            this.movesPerFrame = 1;
        } else if (speed <= 50) {
            this.movesPerFrame = Math.floor(speed / 10);
        } else {
            this.movesPerFrame = Math.floor(speed / 5);
        }
    }

    /**
     * Establece los parámetros de entrenamiento
     */
    setTrainingParameters(params) {
        this.trainingManager.setParameters(params);
    }

    /**
     * Bucle principal del juego
     */
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;  // Convertir a segundos
        this.lastTime = currentTime;

        // Acumular tiempo ajustado por velocidad
        this.accumulator += deltaTime * this.speed;

        // Ejecutar pasos fijos solo en modo de entrenamiento
        if (this.gameMode === 'training') {
            while (this.accumulator >= this.fixedDeltaTime) {
                this.update();
                this.accumulator -= this.fixedDeltaTime;
            }
        }

        // Renderizar siempre
        this.render();

        // Continuar el bucle
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * Actualiza el estado del juego
     */
    update() {
        // Ejecutar múltiples movimientos por frame según velocidad
        for (let i = 0; i < this.movesPerFrame; i++) {
            const result = this.trainingManager.trainingStep();
            if (result.gameComplete) {
                break;
            }
        }
    }

    /**
     * Renderiza el juego
     */
    render() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar tablero
        this.drawBoard();

        // Dibujar piezas
        this.drawPieces();

        // Dibujar resaltados
        this.drawHighlights();

        // Dibujar información de estado
        this.drawGameState();
    }

    /**
     * Dibuja el tablero
     */
    drawBoard() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const isLight = (row + col) % 2 === 0;
                this.ctx.fillStyle = isLight ? '#f0d9b5' : '#b58863';
                this.ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
            }
        }

        // Dibujar coordenadas
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Números de filas (1-8)
        for (let i = 0; i < BOARD_SIZE; i++) {
            this.ctx.fillText(8 - i, this.cellSize / 2, i * this.cellSize + this.cellSize / 2);
        }

        // Letras de columnas (a-h)
        for (let i = 0; i < BOARD_SIZE; i++) {
            this.ctx.fillText(String.fromCharCode(97 + i), i * this.cellSize + this.cellSize / 2, BOARD_SIZE * this.cellSize + this.cellSize / 2);
        }
    }

    /**
     * Dibuja las piezas
     */
    drawPieces() {
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.board.getPiece(row, col);
                if (piece) {
                    const x = col * this.cellSize + this.cellSize / 2;
                    const y = row * this.cellSize + this.cellSize / 2;

                    // Color de la pieza
                    this.ctx.fillStyle = piece.color === PIECE_COLORS.WHITE ? '#fff' : '#000';
                    
                    // Sombra para mejor visibilidad
                    this.ctx.shadowColor = piece.color === PIECE_COLORS.WHITE ? '#000' : '#fff';
                    this.ctx.shadowBlur = 2;
                    
                    this.ctx.fillText(piece.getSymbol(), x, y);
                    
                    // Resetear sombra
                    this.ctx.shadowBlur = 0;
                }
            }
        }
    }

    /**
     * Dibuja resaltados (celda seleccionada, movimientos válidos)
     */
    drawHighlights() {
        // Celda seleccionada
        if (this.selectedCell) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.fillRect(
                this.selectedCell.col * this.cellSize,
                this.selectedCell.row * this.cellSize,
                this.cellSize,
                this.cellSize
            );
        }

        // Movimientos válidos
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        for (const move of this.validMoves) {
            this.ctx.fillRect(
                move.to.col * this.cellSize,
                move.to.row * this.cellSize,
                this.cellSize,
                this.cellSize
            );
        }

        // Resaltar última jugada
        const history = this.trainingManager.gameHistory;
        if (history.length > 0) {
            const lastMove = history[history.length - 1];
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.fillRect(
                lastMove.from.col * this.cellSize,
                lastMove.from.row * this.cellSize,
                this.cellSize,
                this.cellSize
            );
            this.ctx.fillRect(
                lastMove.to.col * this.cellSize,
                lastMove.to.row * this.cellSize,
                this.cellSize,
                this.cellSize
            );
        }
    }

    /**
     * Dibuja información del estado del juego
     */
    drawGameState() {
        const boardHeight = BOARD_SIZE * this.cellSize;
        const infoY = boardHeight + 10;

        // Indicador de estado
        const statusText = this.isRunning ? '▶️ ENTRENANDO' : '⏸️ PAUSADO';
        const statusColor = this.isRunning ? '#2ecc71' : '#f39c12';

        this.ctx.fillStyle = statusColor;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(statusText, 10, infoY);

        // Turno actual
        const turnText = this.trainingManager.currentColor === PIECE_COLORS.WHITE ? '⚪ Blancas' : '⚫ Negras';
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillText(`Turno: ${turnText}`, 150, infoY);

        // Velocidad
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.fillText(`Velocidad: ${this.speed}x`, 300, infoY);

        // Partida actual
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillText(`Partida: ${this.trainingManager.currentGame}`, 450, infoY);

        // Movimiento actual
        this.ctx.fillStyle = '#1abc9c';
        this.ctx.fillText(`Movimiento: ${this.trainingManager.currentMove}`, 600, infoY);
    }

    /**
     * Actualiza la visualización de métricas
     */
    updateMetricsDisplay(metrics) {
        document.getElementById('currentGame').textContent = metrics.currentGame;
        document.getElementById('currentMove').textContent = metrics.currentMove;
        document.getElementById('currentColor').textContent = metrics.currentColor === PIECE_COLORS.WHITE ? 'Blancas' : 'Negras';
        document.getElementById('totalGames').textContent = metrics.totalGames;
        document.getElementById('whiteWins').textContent = metrics.whiteWins;
        document.getElementById('blackWins').textContent = metrics.blackWins;
        document.getElementById('draws').textContent = metrics.draws;
        document.getElementById('totalMoves').textContent = metrics.totalMoves;
        document.getElementById('avgMovesPerGame').textContent = metrics.avgMovesPerGame.toFixed(1);
        document.getElementById('whiteWinrate').textContent = metrics.whiteWinrate.toFixed(1) + '%';
        document.getElementById('blackWinrate').textContent = metrics.blackWinrate.toFixed(1) + '%';
        document.getElementById('whiteQSize').textContent = metrics.whiteAgent.qTableSize;
        document.getElementById('blackQSize').textContent = metrics.blackAgent.qTableSize;
        document.getElementById('whiteTotalEntries').textContent = metrics.whiteAgent.totalEntries;
        document.getElementById('blackTotalEntries').textContent = metrics.blackAgent.totalEntries;
        
        // Actualizar estadísticas humanas si están disponibles
        const humanWinsEl = document.getElementById('humanWins');
        const humanGamesEl = document.getElementById('humanGames');
        if (humanWinsEl && humanGamesEl) {
            humanWinsEl.textContent = metrics.humanWins || 0;
            humanGamesEl.textContent = metrics.humanGames || 0;
        }
    }

    /**
     * Actualiza la visualización del modo de observación
     */
    updateObservationModeDisplay(mode) {
        const observationStatusEl = document.getElementById('observationStatus');
        if (observationStatusEl) {
            if (mode === 'human_vs_ai') {
                observationStatusEl.textContent = '👁️ OBSERVANDO';
                observationStatusEl.style.color = '#e74c3c';
            } else {
                observationStatusEl.textContent = '🔄 ENTRENANDO';
                observationStatusEl.style.color = '#2ecc71';
            }
        }
    }

    /**
     * Obtiene estadísticas del juego
     */
    getStats() {
        return {
            isRunning: this.isRunning,
            speed: this.speed,
            currentGame: this.trainingManager.currentGame,
            currentMove: this.trainingManager.currentMove,
            currentColor: this.trainingManager.currentColor,
            metrics: this.trainingManager.getMetrics(),
            parameters: this.trainingManager.getParameters()
        };
    }

    /**
     * Obtiene los parámetros de entrenamiento
     */
    getParameters() {
        return this.trainingManager.getParameters();
    }
}

// Instancia global del motor
let chessEngine = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    try {
        chessEngine = new ChessEngine();
        console.log('Motor de ajedrez inicializado');
        console.log('Usa chessEngine para controlar el juego');
        
        // Disparar evento personalizado para indicar que el motor está listo
        window.dispatchEvent(new CustomEvent('chessEngineReady'));
    } catch (error) {
        console.error('Error al inicializar el motor de ajedrez:', error);
    }
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChessEngine };
}
