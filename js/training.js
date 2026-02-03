/**
 * Módulo de Entrenamiento - Gestiona el entrenamiento de agentes de ajedrez
 * Controla partidas, métricas y parámetros de Q-Learning
 */

/**
 * Clase TrainingManager - Gestiona el proceso de entrenamiento
 */
class TrainingManager {
    constructor(whiteAgent, blackAgent) {
        this.whiteAgent = whiteAgent;
        this.blackAgent = blackAgent;
        this.board = new ChessBoard();

        // Parámetros de entrenamiento
        this.epsilon = 0.1;           // Tasa de exploración
        this.learningRate = 0.1;      // Tasa de aprendizaje (α)
        this.discount = 0.9;          // Factor de descuento (γ)
        this.maxMoves = 200;          // Límite de movimientos por partida

        // Estado del entrenamiento
        this.currentGame = 0;
        this.currentMove = 0;
        this.currentColor = PIECE_COLORS.WHITE;
        this.isTraining = false;
        this.gameHistory = [];

        // Métricas
        this.metrics = {
            totalGames: 0,
            whiteWins: 0,
            blackWins: 0,
            draws: 0,
            totalMoves: 0,
            avgMovesPerGame: 0
        };

        // Callbacks para actualización de UI
        this.onMetricsUpdate = null;
        this.onGameComplete = null;
        this.onMoveComplete = null;
    }

    /**
     * Inicia el entrenamiento
     */
    startTraining() {
        this.isTraining = true;
    }

    /**
     * Pausa el entrenamiento
     */
    pauseTraining() {
        this.isTraining = false;
    }

    /**
     * Reinicia el entrenamiento (borra Q-tables y métricas)
     */
    resetTraining() {
        this.whiteAgent.clearKnowledge();
        this.blackAgent.clearKnowledge();
        this.metrics = {
            totalGames: 0,
            whiteWins: 0,
            blackWins: 0,
            draws: 0,
            totalMoves: 0,
            avgMovesPerGame: 0
        };
        this.currentGame = 0;
        this.currentMove = 0;
        this.gameHistory = [];
        this.startNewGame();
        this.notifyMetricsUpdate();
    }

    /**
     * Inicia una nueva partida
     */
    startNewGame() {
        this.currentGame++;
        this.currentMove = 0;
        this.currentColor = PIECE_COLORS.WHITE;
        this.board.initializeBoard();
        this.whiteAgent.reset();
        this.blackAgent.reset();
        this.gameHistory = [];
    }

    /**
     * Ejecuta un movimiento del entrenamiento
     */
    trainingStep() {
        if (!this.isTraining) {
            return { gameComplete: false, trainingComplete: false };
        }

        // Verificar límite de movimientos
        if (this.currentMove >= this.maxMoves) {
            this.endGame('draw', 'max_moves');
            return { gameComplete: true, trainingComplete: false };
        }

        // Verificar regla de 50 movimientos
        if (this.board.is50MoveRule(this.currentColor)) {
            this.endGame('draw', '50_move_rule');
            return { gameComplete: true, trainingComplete: false };
        }

        // Verificar regla de triple repetición
        if (this.board.isThreefoldRepetition()) {
            this.endGame('draw', 'threefold_repetition');
            return { gameComplete: true, trainingComplete: false };
        }

        // Obtener agente actual
        const currentAgent = this.currentColor === PIECE_COLORS.WHITE ? this.whiteAgent : this.blackAgent;
        const opponentAgent = this.currentColor === PIECE_COLORS.WHITE ? this.blackAgent : this.whiteAgent;

        // Obtener estado actual
        const currentState = currentAgent.getState(this.board);

        // Obtener movimientos válidos
        const validMoves = this.board.getAllValidMoves(this.currentColor);

        // Verificar si no hay movimientos válidos
        if (validMoves.length === 0) {
            if (this.board.isInCheck(this.currentColor)) {
                // Jaque mate
                const winner = this.currentColor === PIECE_COLORS.WHITE ? 'black' : 'white';
                this.endGame(winner, 'checkmate');
            } else {
                // Ahogado
                this.endGame('draw', 'stalemate');
            }
            return { gameComplete: true, trainingComplete: false };
        }

        // Seleccionar acción
        const action = currentAgent.selectAction(currentState, validMoves, this.epsilon);

        // Ejecutar acción
        const capturedPiece = currentAgent.executeAction(this.board, action);

        // Guardar en historial
        this.gameHistory.push({
            move: this.currentMove,
            color: this.currentColor,
            from: action.from,
            to: action.to,
            captured: capturedPiece
        });

        // Calcular recompensa
        const isCheck = this.board.isInCheck(this.currentColor === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE);
        const isCheckmate = this.board.isCheckmate(this.currentColor === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE);
        const isStalemate = this.board.isStalemate(this.currentColor === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE);
        
        const materialDiff = this.board.getMaterialValue(this.currentColor) - 
                           this.board.getMaterialValue(this.currentColor === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE);

        const reward = currentAgent.calculateReward(
            capturedPiece,
            isCheck,
            isCheckmate,
            isStalemate,
            materialDiff
        );

        currentAgent.totalReward += reward;

        // Actualizar Q-table del agente anterior
        if (currentAgent.lastState && currentAgent.lastAction) {
            const nextState = currentAgent.getState(this.board);
            const nextMoves = this.board.getAllValidMoves(
                this.currentColor === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE
            );
            
            currentAgent.updateQ(
                currentAgent.lastState,
                currentAgent.lastAction,
                reward,
                nextState,
                nextMoves,
                this.learningRate,
                this.discount
            );
        }

        // Guardar estado y acción para el siguiente turno
        currentAgent.lastState = currentState;
        currentAgent.lastAction = action;

        // Verificar fin de juego
        if (isCheckmate) {
            const winner = this.currentColor;
            this.endGame(winner, 'checkmate');
            return { gameComplete: true, trainingComplete: false };
        }

        if (isStalemate) {
            this.endGame('draw', 'stalemate');
            return { gameComplete: true, trainingComplete: false };
        }

        // Cambiar turno
        this.currentColor = this.currentColor === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE;
        this.currentMove++;

        // Notificar movimiento completado
        if (this.onMoveComplete) {
            this.onMoveComplete({
                move: this.currentMove,
                color: this.currentColor === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE,
                action: action
            });
        }

        this.notifyMetricsUpdate();

        return { gameComplete: false, trainingComplete: false };
    }

    /**
     * Finaliza una partida y actualiza métricas
     */
    endGame(result, reason) {
        const gameResult = {
            game: this.currentGame,
            result: result,
            reason: reason,
            moves: this.currentMove,
            history: [...this.gameHistory]
        };

        // Actualizar métricas globales
        this.metrics.totalGames++;
        this.metrics.totalMoves += this.currentMove;
        this.metrics.avgMovesPerGame = this.metrics.totalMoves / this.metrics.totalGames;

        if (result === 'white') {
            this.metrics.whiteWins++;
            this.whiteAgent.recordGameResult('win');
            this.blackAgent.recordGameResult('loss');
        } else if (result === 'black') {
            this.metrics.blackWins++;
            this.whiteAgent.recordGameResult('loss');
            this.blackAgent.recordGameResult('win');
        } else {
            this.metrics.draws++;
            this.whiteAgent.recordGameResult('draw');
            this.blackAgent.recordGameResult('draw');
        }

        // Guardar conocimiento
        this.whiteAgent.saveKnowledge();
        this.blackAgent.saveKnowledge();

        // Notificar actualización de métricas ANTES de iniciar nueva partida
        this.notifyMetricsUpdate();

        // Notificar fin de partida
        if (this.onGameComplete) {
            this.onGameComplete(gameResult);
        }

        // Iniciar nueva partida
        this.startNewGame();
    }

    /**
     * Ejecuta múltiples pasos de entrenamiento
     */
    trainingBatch(steps) {
        let gameComplete = false;
        for (let i = 0; i < steps && !gameComplete; i++) {
            const result = this.trainingStep();
            gameComplete = result.gameComplete;
        }
        return { gameComplete };
    }

    /**
     * Obtiene las métricas actuales
     */
    getMetrics() {
        const whiteStats = this.whiteAgent.getStats();
        const blackStats = this.blackAgent.getStats();

        return {
            currentGame: this.currentGame,
            currentMove: this.currentMove,
            currentColor: this.currentColor,
            totalGames: this.metrics.totalGames,
            whiteWins: this.metrics.whiteWins,
            blackWins: this.metrics.blackWins,
            draws: this.metrics.draws,
            totalMoves: this.metrics.totalMoves,
            avgMovesPerGame: this.metrics.avgMovesPerGame,
            whiteWinrate: this.metrics.totalGames > 0 ? (this.metrics.whiteWins / this.metrics.totalGames) * 100 : 0,
            blackWinrate: this.metrics.totalGames > 0 ? (this.metrics.blackWins / this.metrics.totalGames) * 100 : 0,
            whiteAgent: whiteStats,
            blackAgent: blackStats
        };
    }

    /**
     * Notifica actualización de métricas
     */
    notifyMetricsUpdate() {
        if (this.onMetricsUpdate) {
            this.onMetricsUpdate(this.getMetrics());
        }
    }

    /**
     * Establece los parámetros de entrenamiento
     */
    setParameters(params) {
        if (params.epsilon !== undefined) this.epsilon = params.epsilon;
        if (params.learningRate !== undefined) this.learningRate = params.learningRate;
        if (params.discount !== undefined) this.discount = params.discount;
        if (params.maxMoves !== undefined) this.maxMoves = params.maxMoves;
    }

    /**
     * Obtiene los parámetros actuales
     */
    getParameters() {
        return {
            epsilon: this.epsilon,
            learningRate: this.learningRate,
            discount: this.discount,
            maxMoves: this.maxMoves
        };
    }

    /**
     * Exporta el conocimiento de ambos agentes
     */
    exportKnowledge() {
        return {
            white: this.whiteAgent.exportKnowledge(),
            black: this.blackAgent.exportKnowledge(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Importa el conocimiento a ambos agentes
     */
    importKnowledge(knowledge) {
        let success = true;
        if (knowledge.white) {
            success = success && this.whiteAgent.importKnowledge(knowledge.white);
        }
        if (knowledge.black) {
            success = success && this.blackAgent.importKnowledge(knowledge.black);
        }
        return success;
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TrainingManager };
}
