/**
 * Módulo de Tablero de Ajedrez - Gestiona el tablero 8x8 y las piezas
 * Implementa movimientos válidos para todas las piezas de ajedrez
 */

// Tamaño del tablero
const BOARD_SIZE = 8;

// Colores de las piezas
const PIECE_COLORS = {
    WHITE: 'white',
    BLACK: 'black'
};

// Tipos de piezas
const PIECE_TYPES = {
    PAWN: 'pawn',
    ROOK: 'rook',
    KNIGHT: 'knight',
    BISHOP: 'bishop',
    QUEEN: 'queen',
    KING: 'king'
};

// Tipos de enroque
const CASTLING_TYPES = {
    KINGSIDE: 'kingside',   // Enroque corto (O-O)
    QUEENSIDE: 'queenside'  // Enroque largo (O-O-O)
};

// Símbolos Unicode para las piezas
const PIECE_SYMBOLS = {
    white: {
        pawn: '♙',
        rook: '♖',
        knight: '♘',
        bishop: '♗',
        queen: '♕',
        king: '♔'
    },
    black: {
        pawn: '♟',
        rook: '♜',
        knight: '♞',
        bishop: '♝',
        queen: '♛',
        king: '♚'
    }
};

/**
 * Clase Piece - Representa una pieza de ajedrez
 */
class Piece {
    constructor(type, color) {
        this.type = type;
        this.color = color;
        this.hasMoved = false;
    }

    /**
     * Obtiene el símbolo Unicode de la pieza
     */
    getSymbol() {
        return PIECE_SYMBOLS[this.color][this.type];
    }

    /**
     * Clona la pieza
     */
    clone() {
        const piece = new Piece(this.type, this.color);
        piece.hasMoved = this.hasMoved;
        return piece;
    }
}

/**
 * Clase ChessBoard - Gestiona el tablero de ajedrez
 */
class ChessBoard {
    constructor() {
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        this.initializeBoard();
    }

    /**
     * Inicializa el tablero con la posición inicial de ajedrez
     */
    initializeBoard() {
        // Limpiar tablero
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

        // Colocar piezas negras (fila 0 y 1)
        this.board[0][0] = new Piece(PIECE_TYPES.ROOK, PIECE_COLORS.BLACK);
        this.board[0][1] = new Piece(PIECE_TYPES.KNIGHT, PIECE_COLORS.BLACK);
        this.board[0][2] = new Piece(PIECE_TYPES.BISHOP, PIECE_COLORS.BLACK);
        this.board[0][3] = new Piece(PIECE_TYPES.QUEEN, PIECE_COLORS.BLACK);
        this.board[0][4] = new Piece(PIECE_TYPES.KING, PIECE_COLORS.BLACK);
        this.board[0][5] = new Piece(PIECE_TYPES.BISHOP, PIECE_COLORS.BLACK);
        this.board[0][6] = new Piece(PIECE_TYPES.KNIGHT, PIECE_COLORS.BLACK);
        this.board[0][7] = new Piece(PIECE_TYPES.ROOK, PIECE_COLORS.BLACK);

        for (let i = 0; i < BOARD_SIZE; i++) {
            this.board[1][i] = new Piece(PIECE_TYPES.PAWN, PIECE_COLORS.BLACK);
        }

        // Colocar piezas blancas (fila 6 y 7)
        for (let i = 0; i < BOARD_SIZE; i++) {
            this.board[6][i] = new Piece(PIECE_TYPES.PAWN, PIECE_COLORS.WHITE);
        }

        this.board[7][0] = new Piece(PIECE_TYPES.ROOK, PIECE_COLORS.WHITE);
        this.board[7][1] = new Piece(PIECE_TYPES.KNIGHT, PIECE_COLORS.WHITE);
        this.board[7][2] = new Piece(PIECE_TYPES.BISHOP, PIECE_COLORS.WHITE);
        this.board[7][3] = new Piece(PIECE_TYPES.QUEEN, PIECE_COLORS.WHITE);
        this.board[7][4] = new Piece(PIECE_TYPES.KING, PIECE_COLORS.WHITE);
        this.board[7][5] = new Piece(PIECE_TYPES.BISHOP, PIECE_COLORS.WHITE);
        this.board[7][6] = new Piece(PIECE_TYPES.KNIGHT, PIECE_COLORS.WHITE);
        this.board[7][7] = new Piece(PIECE_TYPES.ROOK, PIECE_COLORS.WHITE);
    }

    /**
     * Obtiene la pieza en una posición
     */
    getPiece(row, col) {
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
            return null;
        }
        return this.board[row][col];
    }

    /**
     * Coloca una pieza en una posición
     */
    setPiece(row, col, piece) {
        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
            this.board[row][col] = piece;
        }
    }

    /**
     * Mueve una pieza de una posición a otra
     * @param {number} fromRow - Fila de origen
     * @param {number} fromCol - Columna de origen
     * @param {number} toRow - Fila de destino
     * @param {number} toCol - Columna de destino
     * @param {Object} castlingInfo - Información de enroque si aplica
     * @returns {boolean} - true si el movimiento fue exitoso
     */
    movePiece(fromRow, fromCol, toRow, toCol, castlingInfo = null) {
        const piece = this.getPiece(fromRow, fromCol);
        if (piece) {
            piece.hasMoved = true;
            this.setPiece(toRow, toCol, piece);
            this.setPiece(fromRow, fromCol, null);
            
            // Si es un enroque, mover también la torre
            if (castlingInfo) {
                const rook = this.getPiece(castlingInfo.rookFrom.row, castlingInfo.rookFrom.col);
                if (rook) {
                    rook.hasMoved = true;
                    this.setPiece(castlingInfo.rookTo.row, castlingInfo.rookTo.col, rook);
                    this.setPiece(castlingInfo.rookFrom.row, castlingInfo.rookFrom.col, null);
                }
            }
            
            return true;
        }
        return false;
    }

    /**
     * Obtiene los movimientos válidos para una pieza
     */
    getValidMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece) return [];

        let moves = [];

        switch (piece.type) {
            case PIECE_TYPES.PAWN:
                moves = this.getPawnMoves(row, col, piece.color);
                break;
            case PIECE_TYPES.ROOK:
                moves = this.getRookMoves(row, col, piece.color);
                break;
            case PIECE_TYPES.KNIGHT:
                moves = this.getKnightMoves(row, col, piece.color);
                break;
            case PIECE_TYPES.BISHOP:
                moves = this.getBishopMoves(row, col, piece.color);
                break;
            case PIECE_TYPES.QUEEN:
                moves = this.getQueenMoves(row, col, piece.color);
                break;
            case PIECE_TYPES.KING:
                moves = this.getKingMoves(row, col, piece.color);
                break;
        }

        return moves;
    }

    /**
     * Obtiene los movimientos válidos para un peón
     */
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === PIECE_COLORS.WHITE ? -1 : 1;
        const startRow = color === PIECE_COLORS.WHITE ? 6 : 1;

        // Movimiento hacia adelante
        const newRow = row + direction;
        if (this.isValidPosition(newRow, col) && !this.getPiece(newRow, col)) {
            moves.push({ row: newRow, col: col });

            // Movimiento doble desde la posición inicial
            if (row === startRow && !this.getPiece(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col: col });
            }
        }

        // Capturas diagonales
        for (const dc of [-1, 1]) {
            const newCol = col + dc;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.getPiece(newRow, newCol);
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    /**
     * Obtiene los movimientos válidos para una torre
     */
    getRookMoves(row, col, color) {
        return this.getLinearMoves(row, col, color, [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 }
        ]);
    }

    /**
     * Obtiene los movimientos válidos para un caballo
     */
    getKnightMoves(row, col, color) {
        const moves = [];
        const offsets = [
            { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
            { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
            { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
            { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
        ];

        for (const offset of offsets) {
            const newRow = row + offset.dr;
            const newCol = col + offset.dc;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.getPiece(newRow, newCol);
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    /**
     * Obtiene los movimientos válidos para un alfil
     */
    getBishopMoves(row, col, color) {
        return this.getLinearMoves(row, col, color, [
            { dr: -1, dc: -1 },
            { dr: -1, dc: 1 },
            { dr: 1, dc: -1 },
            { dr: 1, dc: 1 }
        ]);
    }

    /**
     * Obtiene los movimientos válidos para una reina
     */
    getQueenMoves(row, col, color) {
        const rookMoves = this.getRookMoves(row, col, color);
        const bishopMoves = this.getBishopMoves(row, col, color);
        return [...rookMoves, ...bishopMoves];
    }

    /**
     * Obtiene los movimientos válidos para un rey
     */
    getKingMoves(row, col, color) {
        const moves = [];
        const offsets = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
        ];

        for (const offset of offsets) {
            const newRow = row + offset.dr;
            const newCol = col + offset.dc;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.getPiece(newRow, newCol);
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        // Agregar movimientos de enroque si es posible
        const castlingMoves = this.getCastlingMoves(row, col, color);
        moves.push(...castlingMoves);

        return moves;
    }

    /**
     * Obtiene los movimientos de enroque válidos
     */
    getCastlingMoves(row, col, color) {
        const moves = [];

        // Verificar si el rey está en su posición inicial
        const kingRow = color === PIECE_COLORS.WHITE ? 7 : 0;
        if (row !== kingRow || col !== 4) {
            return moves; // El rey no está en su posición inicial
        }

        const king = this.getPiece(row, col);
        if (!king || king.type !== PIECE_TYPES.KING || king.hasMoved) {
            return moves; // El rey ya se ha movido
        }

        // Verificar que el rey no esté en jaque
        if (this.isInCheck(color)) {
            return moves;
        }

        // Enroque corto (kingside)
        const kingsideRookCol = 7;
        const kingsideRook = this.getPiece(row, kingsideRookCol);
        if (this.canCastle(row, color, kingsideRook, kingsideRookCol, [5, 6])) {
            moves.push({
                row: row,
                col: 6,
                castling: CASTLING_TYPES.KINGSIDE,
                rookFrom: { row: row, col: kingsideRookCol },
                rookTo: { row: row, col: 5 }
            });
        }

        // Enroque largo (queenside)
        const queensideRookCol = 0;
        const queensideRook = this.getPiece(row, queensideRookCol);
        if (this.canCastle(row, color, queensideRook, queensideRookCol, [1, 2, 3])) {
            moves.push({
                row: row,
                col: 2,
                castling: CASTLING_TYPES.QUEENSIDE,
                rookFrom: { row: row, col: queensideRookCol },
                rookTo: { row: row, col: 3 }
            });
        }

        return moves;
    }

    /**
     * Verifica si se puede realizar el enroque
     */
    canCastle(row, color, rook, rookCol, emptyCols) {
        // Verificar que la torre exista y no se haya movido
        if (!rook || rook.type !== PIECE_TYPES.ROOK || rook.hasMoved) {
            return false;
        }

        // Verificar que las casillas entre el rey y la torre estén vacías
        for (const col of emptyCols) {
            if (this.getPiece(row, col)) {
                return false;
            }
        }

        // Verificar que el rey no pase por casillas atacadas
        const kingCol = 4;
        const enemyColor = color === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE;
        
        // Para enroque corto, verificar casillas 5 y 6
        // Para enroque largo, verificar casillas 3 y 2
        const checkCols = emptyCols.slice(-2); // Las últimas 2 casillas
        
        for (const col of checkCols) {
            if (this.isSquareAttacked(row, col, enemyColor)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Verifica si una casilla está atacada por un color
     */
    isSquareAttacked(row, col, attackerColor) {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = this.getPiece(r, c);
                if (piece && piece.color === attackerColor) {
                    const moves = this.getAttackingMoves(r, c, piece);
                    if (moves.some(m => m.row === row && m.col === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Obtiene los movimientos de ataque de una pieza (sin considerar enroque o jaque)
     * Evita recursión infinita al verificar si una casilla está atacada
     */
    getAttackingMoves(row, col, piece) {
        const moves = [];

        switch (piece.type) {
            case PIECE_TYPES.PAWN:
                moves.push(...this.getPawnAttacks(row, col, piece.color));
                break;
            case PIECE_TYPES.ROOK:
                moves.push(...this.getRookMoves(row, col, piece.color));
                break;
            case PIECE_TYPES.KNIGHT:
                moves.push(...this.getKnightMoves(row, col, piece.color));
                break;
            case PIECE_TYPES.BISHOP:
                moves.push(...this.getBishopMoves(row, col, piece.color));
                break;
            case PIECE_TYPES.QUEEN:
                moves.push(...this.getQueenMoves(row, col, piece.color));
                break;
            case PIECE_TYPES.KING:
                // Para el rey, solo verificar movimientos básicos, sin enroque
                moves.push(...this.getKingBasicMoves(row, col, piece.color));
                break;
        }

        return moves;
    }

    /**
     * Obtiene los movimientos de ataque de un peón (solo capturas)
     */
    getPawnAttacks(row, col, color) {
        const moves = [];
        const direction = color === PIECE_COLORS.WHITE ? -1 : 1;
        const newRow = row + direction;

        // Solo capturas diagonales
        for (const dc of [-1, 1]) {
            const newCol = col + dc;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.getPiece(newRow, newCol);
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    /**
     * Obtiene los movimientos básicos del rey (sin enroque)
     */
    getKingBasicMoves(row, col, color) {
        const moves = [];
        const offsets = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
        ];

        for (const offset of offsets) {
            const newRow = row + offset.dr;
            const newCol = col + offset.dc;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.getPiece(newRow, newCol);
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    /**
     * Obtiene movimientos lineales (para torre, alfil, reina)
     */
    getLinearMoves(row, col, color, directions) {
        const moves = [];

        for (const dir of directions) {
            let newRow = row + dir.dr;
            let newCol = col + dir.dc;

            while (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.getPiece(newRow, newCol);
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += dir.dr;
                newCol += dir.dc;
            }
        }

        return moves;
    }

    /**
     * Verifica si una posición es válida
     */
    isValidPosition(row, col) {
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }

    /**
     * Verifica si hay jaque al rey de un color
     */
    isInCheck(color) {
        // Encontrar el rey del color
        let kingRow, kingCol;
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.type === PIECE_TYPES.KING && piece.color === color) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
            if (kingRow !== undefined) break;
        }

        if (kingRow === undefined) return false;

        // Verificar si alguna pieza enemiga puede atacar al rey
        const enemyColor = color === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE;
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === enemyColor) {
                    const moves = this.getValidMoves(row, col);
                    if (moves.some(m => m.row === kingRow && m.col === kingCol)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Obtiene todos los movimientos válidos para un color
     */
    getAllValidMoves(color) {
        const allMoves = [];

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color) {
                    const moves = this.getValidMoves(row, col);
                    for (const move of moves) {
                        const moveObj = {
                            from: { row, col },
                            to: { row: move.row, col: move.col },
                            piece: piece
                        };
                        
                        // Incluir información de enroque si aplica
                        if (move.castling) {
                            moveObj.castling = move.castling;
                            moveObj.rookFrom = move.rookFrom;
                            moveObj.rookTo = move.rookTo;
                        }
                        
                        allMoves.push(moveObj);
                    }
                }
            }
        }

        return allMoves;
    }

    /**
     * Verifica si hay jaque mate para un color
     */
    isCheckmate(color) {
        if (!this.isInCheck(color)) return false;

        const allMoves = this.getAllValidMoves(color);
        return allMoves.length === 0;
    }

    /**
     * Verifica si hay ahogado (stalemate)
     */
    isStalemate(color) {
        if (this.isInCheck(color)) return false;

        const allMoves = this.getAllValidMoves(color);
        return allMoves.length === 0;
    }

    /**
     * Clona el tablero
     */
    clone() {
        const clonedBoard = new ChessBoard();
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.getPiece(row, col);
                if (piece) {
                    clonedBoard.setPiece(row, col, piece.clone());
                }
            }
        }
        return clonedBoard;
    }

    /**
     * Convierte el tablero a una cadena para hash
     */
    toString() {
        let str = '';
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.getPiece(row, col);
                if (piece) {
                    str += piece.color[0] + piece.type[0];
                } else {
                    str += '--';
                }
            }
        }
        return str;
    }

    /**
     * Obtiene el valor material del tablero
     */
    getMaterialValue(color) {
        const pieceValues = {
            pawn: 1,
            knight: 3,
            bishop: 3,
            rook: 5,
            queen: 9,
            king: 0
        };

        let total = 0;
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color) {
                    total += pieceValues[piece.type];
                }
            }
        }

        return total;
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChessBoard,
        Piece,
        PIECE_COLORS,
        PIECE_TYPES,
        PIECE_SYMBOLS,
        BOARD_SIZE,
        CASTLING_TYPES
    };
}
