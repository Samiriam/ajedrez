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
     */
    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (piece) {
            piece.hasMoved = true;
            this.setPiece(toRow, toCol, piece);
            this.setPiece(fromRow, fromCol, null);
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
                        allMoves.push({
                            from: { row, col },
                            to: move,
                            piece: piece
                        });
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
        BOARD_SIZE
    };
}
