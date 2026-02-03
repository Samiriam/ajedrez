/**
 * Módulo de Agentes de Ajedrez - Implementa Q-Learning para jugadores de ajedrez
 * Persistencia del conocimiento en localStorage
 */

/**
 * Clase QTable - Gestiona la tabla Q para Q-Learning con persistencia
 */
class QTable {
    constructor(storageKey) {
        this.storageKey = storageKey;
        this.table = new Map(); // key: estado, value: array de valores Q por acción
        this.loadFromStorage();
    }

    /**
     * Genera una clave única para el estado
     */
    getStateKey(state) {
        return JSON.stringify(state);
    }

    /**
     * Obtiene los valores Q para un estado
     */
    getQValues(state) {
        const key = this.getStateKey(state);
        if (!this.table.has(key)) {
            // Inicializar con valores aleatorios pequeños
            this.table.set(key, new Map());
        }
        return this.table.get(key);
    }

    /**
     * Obtiene el valor Q para una acción específica
     */
    getQValue(state, action) {
        const actionKey = this.getActionKey(action);
        const qValues = this.getQValues(state);
        if (!qValues.has(actionKey)) {
            qValues.set(actionKey, (Math.random() - 0.5) * 0.1);
        }
        return qValues.get(actionKey);
    }

    /**
     * Actualiza el valor Q para una acción
     */
    setQValue(state, action, value) {
        const actionKey = this.getActionKey(action);
        const qValues = this.getQValues(state);
        qValues.set(actionKey, value);
    }

    /**
     * Genera una clave única para una acción
     */
    getActionKey(action) {
        return `${action.from.row},${action.from.col}-${action.to.row},${action.to.col}`;
    }

    /**
     * Obtiene el número de estados almacenados
     */
    size() {
        return this.table.size;
    }

    /**
     * Obtiene el número total de entradas Q
     */
    totalEntries() {
        let total = 0;
        for (const qValues of this.table.values()) {
            total += qValues.size;
        }
        return total;
    }

    /**
     * Limpia la tabla Q
     */
    clear() {
        this.table.clear();
        this.saveToStorage();
    }

    /**
     * Obtiene la mejor acción para un estado
     */
    getBestAction(state, actions) {
        if (actions.length === 0) return null;

        let maxQ = -Infinity;
        let bestActions = [];

        for (const action of actions) {
            const qValue = this.getQValue(state, action);
            if (qValue > maxQ) {
                maxQ = qValue;
                bestActions = [action];
            } else if (qValue === maxQ) {
                bestActions.push(action);
            }
        }

        // Si hay empate, elegir aleatoriamente
        return bestActions[Math.floor(Math.random() * bestActions.length)];
    }

    /**
     * Guarda la tabla Q en localStorage
     */
    saveToStorage() {
        try {
            const data = {};
            for (const [key, value] of this.table.entries()) {
                data[key] = Array.from(value.entries());
            }
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('No se pudo guardar en localStorage:', e);
        }
    }

    /**
     * Carga la tabla Q desde localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                for (const [key, value] of Object.entries(parsed)) {
                    this.table.set(key, new Map(value));
                }
                console.log(`Cargados ${this.size()} estados desde localStorage`);
            }
        } catch (e) {
            console.warn('No se pudo cargar desde localStorage:', e);
        }
    }

    /**
     * Exporta la tabla Q a JSON
     */
    exportToJSON() {
        const data = {};
        for (const [key, value] of this.table.entries()) {
            data[key] = Array.from(value.entries());
        }
        return JSON.stringify(data, null, 2);
    }

    /**
     * Importa la tabla Q desde JSON
     */
    importFromJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            this.table.clear();
            for (const [key, value] of Object.entries(parsed)) {
                this.table.set(key, new Map(value));
            }
            this.saveToStorage();
            return true;
        } catch (e) {
            console.error('Error al importar:', e);
            return false;
        }
    }
}

/**
 * Clase ChessAgent - Agente de ajedrez con Q-Learning
 */
class ChessAgent {
    constructor(color, storageKey) {
        this.color = color;
        this.qTable = new QTable(storageKey);
        this.lastState = null;
        this.lastAction = null;
        this.totalReward = 0;
        this.gamesPlayed = 0;
        this.gamesWon = 0;
        this.gamesLost = 0;
        this.gamesDrawn = 0;
    }

    /**
     * Genera el estado del tablero para Q-Learning
     * Simplificado para reducir el espacio de estados
     */
    getState(board) {
        // Estado simplificado: hash del tablero + color a mover
        const boardHash = board.toString();
        return {
            board: boardHash,
            color: this.color,
            material: board.getMaterialValue(this.color) - board.getMaterialValue(
                this.color === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE
            )
        };
    }

    /**
     * Selecciona una acción usando política ε-greedy
     */
    selectAction(state, actions, epsilon) {
        if (Math.random() < epsilon || actions.length === 0) {
            // Exploración: acción aleatoria
            return actions[Math.floor(Math.random() * actions.length)];
        } else {
            // Explotación: mejor acción según Q-table
            return this.qTable.getBestAction(state, actions);
        }
    }

    /**
     * Ejecuta una acción en el tablero
     */
    executeAction(board, action) {
        const piece = board.getPiece(action.from.row, action.from.col);
        const capturedPiece = board.getPiece(action.to.row, action.to.col);
        
        // Preparar información de enroque si aplica
        const castlingInfo = action.castling ? {
            rookFrom: action.rookFrom,
            rookTo: action.rookTo
        } : null;
        
        // Preparar información de En Passant si aplica
        const enPassantInfo = action.enPassant ? {
            capturedPawnRow: action.capturedPawnRow,
            capturedPawnCol: action.capturedPawnCol
        } : null;
        
        board.movePiece(action.from.row, action.from.col, action.to.row, action.to.col, castlingInfo, enPassantInfo);
        
        // Promoción de peón con opciones (basada en heurística)
        if (piece.type === PIECE_TYPES.PAWN) {
            const promotionRow = this.color === PIECE_COLORS.WHITE ? 0 : 7;
            if (action.to.row === promotionRow) {
                const promotionPiece = this.choosePromotionPiece(board);
                board.setPiece(action.to.row, action.to.col, promotionPiece);
            }
        }

        return capturedPiece;
    }

    /**
     * Elige la pieza de promoción de peón basada en heurística
     * @param {ChessBoard} board - Tablero actual
     * @returns {Piece} - Pieza de promoción elegida
     */
    choosePromotionPiece(board) {
        // Heurística simple: elegir basado en material y posición
        const opponentColor = this.color === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE;
        const myMaterial = board.getMaterialValue(this.color);
        const opponentMaterial = board.getMaterialValue(opponentColor);
        const materialAdvantage = myMaterial - opponentMaterial;

        // Preferir reina en la mayoría de casos
        if (materialAdvantage > 2) {
            return new Piece(PIECE_TYPES.QUEEN, this.color);
        }
        
        // Si estamos en desventaja material, elegir pieza más fuerte disponible
        const availablePieces = [
            PIECE_TYPES.QUEEN,
            PIECE_TYPES.ROOK,
            PIECE_TYPES.BISHOP,
            PIECE_TYPES.KNIGHT
        ];

        // Prioridad basada en la situación del tablero
        // En desventaja material, preferir piezas más fuertes
        // En ventaja o igualdad, preferir reina
        if (materialAdvantage >= 0) {
            return new Piece(PIECE_TYPES.QUEEN, this.color);
        }

        // En desventaja material leve, preferir reina o torre
        if (materialAdvantage >= -2) {
            return Math.random() < 0.7 ? 
                new Piece(PIECE_TYPES.QUEEN, this.color) :
                new Piece(PIECE_TYPES.ROOK, this.color);
        }

        // En desventaja material moderada, elegir aleatoriamente entre reina, torre y alfil
        if (materialAdvantage >= -4) {
            const options = [PIECE_TYPES.QUEEN, PIECE_TYPES.ROOK, PIECE_TYPES.BISHOP];
            return new Piece(options[Math.floor(Math.random() * options.length)], this.color);
        }

        // En desventaja material severa, elegir aleatoriamente entre todas las opciones
        return new Piece(availablePieces[Math.floor(Math.random() * availablePieces.length)], this.color);
    }

    /**
     * Calcula la recompensa para una acción
     */
    calculateReward(capturedPiece, isCheck, isCheckmate, isStalemate, materialDiff) {
        let reward = 0;

        // Recompensa por capturar piezas
        if (capturedPiece) {
            const pieceValues = {
                pawn: 1,
                knight: 3,
                bishop: 3,
                rook: 5,
                queen: 9,
                king: 0
            };
            reward += pieceValues[capturedPiece.type] * 10;
        }

        // Recompensa por dar jaque
        if (isCheck) {
            reward += 5;
        }

        // Recompensa por jaque mate
        if (isCheckmate) {
            reward += 1000;
        }

        // Penalización por ahogado
        if (isStalemate) {
            reward -= 100;
        }

        // Recompensa por ventaja material
        reward += materialDiff * 2;

        // Pequeña penalización por cada movimiento
        reward -= 0.1;

        return reward;
    }

    /**
     * Actualiza la Q-table usando la ecuación de Bellman
     */
    updateQ(state, action, reward, nextState, nextActions, learningRate, discount) {
        const currentQ = this.qTable.getQValue(state, action);
        
        let maxNextQ = 0;
        if (nextActions.length > 0) {
            maxNextQ = Math.max(...nextActions.map(a => this.qTable.getQValue(nextState, a)));
        }

        // Ecuación de Bellman
        const newQ = currentQ + learningRate * (reward + discount * maxNextQ - currentQ);
        this.qTable.setQValue(state, action, newQ);
    }

    /**
     * Reinicia el agente para una nueva partida
     */
    reset() {
        this.lastState = null;
        this.lastAction = null;
        this.totalReward = 0;
    }

    /**
     * Registra el resultado de una partida
     */
    recordGameResult(result) {
        this.gamesPlayed++;
        if (result === 'win') {
            this.gamesWon++;
        } else if (result === 'loss') {
            this.gamesLost++;
        } else {
            this.gamesDrawn++;
        }
    }

    /**
     * Obtiene estadísticas del agente
     */
    getStats() {
        const winrate = this.gamesPlayed > 0 ? (this.gamesWon / this.gamesPlayed) * 100 : 0;
        return {
            color: this.color,
            gamesPlayed: this.gamesPlayed,
            gamesWon: this.gamesWon,
            gamesLost: this.gamesLost,
            gamesDrawn: this.gamesDrawn,
            winrate: winrate,
            qTableSize: this.qTable.size(),
            totalEntries: this.qTable.totalEntries()
        };
    }

    /**
     * Guarda el conocimiento en localStorage
     */
    saveKnowledge() {
        this.qTable.saveToStorage();
    }

    /**
     * Limpia el conocimiento
     */
    clearKnowledge() {
        this.qTable.clear();
        this.gamesPlayed = 0;
        this.gamesWon = 0;
        this.gamesLost = 0;
        this.gamesDrawn = 0;
    }

    /**
     * Exporta el conocimiento a JSON
     */
    exportKnowledge() {
        return this.qTable.exportToJSON();
    }

    /**
     * Importa el conocimiento desde JSON
     */
    importKnowledge(jsonString) {
        return this.qTable.importFromJSON(jsonString);
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QTable,
        ChessAgent
    };
}
