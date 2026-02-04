/**
 * Módulo de Agentes de Ajedrez - Implementa Q-Learning para jugadores de ajedrez
 * Persistencia del conocimiento en localStorage
 */

// Token por defecto para entorno personal/pruebas.
const DEFAULT_DROPBOX_ACCESS_TOKEN = 'sl.u.AGRsAJy_ZX5zLZ4Kn5jm5bZexOgawlvd6vWsl3Y3QgeUlFNZR8kVHBHnvI9FfRKyLe';

/**
 * Clase QTable - Gestiona la tabla Q para Q-Learning con persistencia
 */
class QTable {
    constructor(storageKey) {
        this.storageKey = storageKey;
        this.table = new Map(); // key: estado, value: array de valores Q por acción
        const storedToken = localStorage.getItem('dropbox_access_token');
        this.dropboxAccessToken = (storedToken && storedToken.trim() !== '') ? storedToken : DEFAULT_DROPBOX_ACCESS_TOKEN;
        if (!storedToken || storedToken.trim() === '') {
            localStorage.setItem('dropbox_access_token', this.dropboxAccessToken);
        }
        this.dropboxPath = `/${storageKey}.json`;
        this.useDropbox = this.dropboxAccessToken.trim() !== '';
        this.saveInProgress = false;
        this.pendingSave = false;
        this.latestSerializedData = null;
        this.lastDropboxSaveAt = 0;
        this.dropboxSaveIntervalMs = 120000; // Evita subir archivos enormes en cada partida
        this.lastDropboxErrorAt = 0;
        this.dropboxErrorCooldownMs = 15000;
        this.loadFromStorage();
    }

    /**
     * Emite errores de Dropbox con cooldown para no saturar la UI
     */
    emitDropboxError(errorMessage) {
        const now = Date.now();
        if (now - this.lastDropboxErrorAt < this.dropboxErrorCooldownMs) {
            return;
        }

        this.lastDropboxErrorAt = now;
        window.dispatchEvent(new CustomEvent('dropboxBackupError', {
            detail: { error: errorMessage }
        }));
    }

    /**
     * Guarda la tabla Q en Dropbox
     */
    async saveToDropbox(serializedData) {
        try {
            console.log('💾 Guardando en Dropbox...');
            console.log('📁 Path:', this.dropboxPath);
            console.log('📊 Tamaño de la tabla:', this.size(), 'estados,', this.totalEntries(), 'entradas');

            const dataSize = serializedData.length;
            console.log('📦 Tamaño de datos:', dataSize, 'bytes');

            // Endpoint oficial de Dropbox para contenido
            const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.dropboxAccessToken}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: this.dropboxPath,
                        mode: 'overwrite',
                        autorename: false,
                        mute: true
                    })
                },
                body: serializedData
            });

            console.log('📡 Response status:', response.status, response.statusText);

            if (response.ok) {
                console.log('✅ Guardado exitoso en Dropbox:', this.dropboxPath);
                const timestamp = new Date().toLocaleString();
                localStorage.setItem('lastDropboxBackup', timestamp);
                // Emitir evento para que la UI se actualice
                window.dispatchEvent(new CustomEvent('dropboxBackupComplete', {
                        detail: { timestamp, path: this.dropboxPath }
                }));
                return true;
            } else {
                const error = await response.text();
                console.error('❌ Error al guardar en Dropbox:', response.status, error);
                if (response.status === 401 || response.status === 403) {
                    this.useDropbox = false;
                    this.emitDropboxError(`Dropbox deshabilitado por autenticación/permisos. ${response.status}: ${error}`);
                    return false;
                }
                this.emitDropboxError(`HTTP ${response.status}: ${error}`);
                return false;
            }
        } catch (e) {
            console.error('❌ Excepción al guardar en Dropbox:', e);
            this.emitDropboxError(`${e.name}: ${e.message}`);
            return false;
        }
    }

    /**
     * Verifica la conexión con Dropbox
     */
    async verifyDropboxConnection() {
        try {
            console.log('🔍 Verificando conexión con Dropbox...');
            console.log('🔑 Token:', this.dropboxAccessToken ? this.dropboxAccessToken.substring(0, 10) + '...' : 'No token');

            const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.dropboxAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: 'null'
            });
            
            console.log('📡 Response status:', response.status, response.statusText);
            
            if (response.ok) {
                const accountInfo = await response.json();
                console.log('✅ Conexión exitosa:', accountInfo);
                return { success: true, accountInfo };
            } else {
                const error = await response.text();
                console.error('❌ Error de conexión:', response.status, error);
                return { success: false, error: `HTTP ${response.status}: ${error}` };
            }
        } catch (e) {
            console.error('❌ Excepción al verificar conexión:', e);
            return { success: false, error: `${e.name}: ${e.message}` };
        }
    }

    /**
     * Carga la tabla Q desde Dropbox
     */
    async loadFromDropbox() {
        try {
            const response = await fetch('https://content.dropboxapi.com/2/files/download', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.dropboxAccessToken}`,
                    'Dropbox-API-Arg': JSON.stringify({ path: this.dropboxPath })
                },
                body: null
            });

            if (response.ok) {
                const text = await response.text();
                const parsed = JSON.parse(text);
                
                for (const [key, value] of Object.entries(parsed)) {
                    this.table.set(key, new Map(value));
                }
                
                console.log(`Cargados ${this.size()} estados desde Dropbox`);
                return true;
            } else {
                const error = await response.text();
                // 409: archivo no encontrado en Dropbox, se considera estado inicial vacío
                if (response.status !== 409) {
                    if (response.status === 401 || response.status === 403) {
                        this.useDropbox = false;
                        this.emitDropboxError(`Token de Dropbox inválido o sin permisos. Se usa localStorage. (${response.status})`);
                        return false;
                    }
                    console.error('Error al cargar desde Dropbox:', response.status, error);
                    this.emitDropboxError(`Carga Dropbox HTTP ${response.status}: ${error}`);
                }
                return false;
            }
        } catch (e) {
            console.error('Error al cargar desde Dropbox:', e);
            this.emitDropboxError(`Carga Dropbox ${e.name}: ${e.message}`);
            return false;
        }
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
     * Guarda la tabla Q en localStorage o Dropbox
     */
    async saveToStorage() {
        try {
            const data = {};
            for (const [key, value] of this.table.entries()) {
                data[key] = Array.from(value.entries());
            }

            const serializedData = JSON.stringify(data);

            if (!this.useDropbox) {
                localStorage.setItem(this.storageKey, serializedData);
                return;
            }

            this.latestSerializedData = serializedData;

            // Si ya hay un guardado en curso, encolar uno adicional
            if (this.saveInProgress) {
                this.pendingSave = true;
                return;
            }

            const now = Date.now();
            if (now - this.lastDropboxSaveAt < this.dropboxSaveIntervalMs) {
                return;
            }

            this.saveInProgress = true;
            const saved = await this.saveToDropbox(this.latestSerializedData);
            if (saved) {
                this.lastDropboxSaveAt = Date.now();
            }
            this.saveInProgress = false;

            if (this.pendingSave) {
                this.pendingSave = false;
                setTimeout(() => this.saveToStorage(), 250);
            }
        } catch (e) {
            console.warn('No se pudo guardar:', e);
            this.saveInProgress = false;
        }
    }

    /**
     * Carga la tabla Q desde localStorage o Dropbox
     */
    async loadFromStorage() {
        try {
            let loaded = false;
            
            if (this.useDropbox) {
                loaded = await this.loadFromDropbox();
            } else {
                const data = localStorage.getItem(this.storageKey);
                if (data) {
                    const parsed = JSON.parse(data);
                    for (const [key, value] of Object.entries(parsed)) {
                        this.table.set(key, new Map(value));
                    }
                    console.log(`Cargados ${this.size()} estados desde localStorage`);
                    loaded = true;
                }
            }
            
            // Si la tabla está vacía, cargar conocimiento básico
            if (!loaded || this.size() === 0) {
                this.loadBasicKnowledge();
            }
        } catch (e) {
            console.warn('No se pudo cargar:', e);
        }
    }

    /**
     * Carga conocimiento básico desde archivo JSON
     */
    async loadBasicKnowledge() {
        try {
            const response = await fetch('data/basic_chess_knowledge.json');
            if (response.ok) {
                const basicKnowledge = JSON.parse(await response.text());
                this.importBasicKnowledge(basicKnowledge);
                console.log('Cargado conocimiento básico desde archivo');
            }
        } catch (e) {
            console.warn('No se pudo cargar conocimiento básico:', e);
        }
    }

    /**
     * Importa conocimiento básico desde objeto JSON
     */
    importBasicKnowledge(basicKnowledge) {
        if (basicKnowledge.white && basicKnowledge.white.entries) {
            const storageKey = this.storageKey;
            if (storageKey.includes('white')) {
                for (const entry of basicKnowledge.white.entries) {
                    const actions = entry.actions || (entry.state ? entry.state.actions : null);
                    if (!actions) continue;

                    const stateKey = JSON.stringify(entry.state);
                    if (!this.table.has(stateKey)) {
                        this.table.set(stateKey, new Map(Object.entries(actions)));
                    }
                }
            }
        }

        if (basicKnowledge.black && basicKnowledge.black.entries) {
            const storageKey = this.storageKey;
            if (storageKey.includes('black')) {
                for (const entry of basicKnowledge.black.entries) {
                    const actions = entry.actions || (entry.state ? entry.state.actions : null);
                    if (!actions) continue;

                    const stateKey = JSON.stringify(entry.state);
                    if (!this.table.has(stateKey)) {
                        this.table.set(stateKey, new Map(Object.entries(actions)));
                    }
                }
            }
        }

        this.saveToStorage();
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
     * Configura el access token de Dropbox
     */
    setDropboxToken(token) {
        const normalizedToken = (token || '').trim();
        this.dropboxAccessToken = normalizedToken;
        this.useDropbox = normalizedToken !== '';
        localStorage.setItem('dropbox_access_token', normalizedToken);
        
        // Si se activa Dropbox, recargar desde Dropbox
        if (this.useDropbox) {
            this.loadFromStorage();
        }
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
        const capturedPiece = action.enPassant ?
            board.getPiece(action.capturedPawnRow, action.capturedPawnCol) :
            board.getPiece(action.to.row, action.to.col);
        
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
