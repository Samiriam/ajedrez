/**
 * Módulo de UI - Gestiona la interfaz de usuario y controles
 * Botones, sliders y actualización de métricas
 */

/**
 * Clase UIManager - Gestiona la interfaz de usuario
 */
class UIManager {
    constructor(chessEngine) {
        this.chessEngine = chessEngine;
        this.setupEventListeners();
        this.updateSpeedDisplay();
        this.updateParameterDisplays();
    }

    /**
     * Configura los event listeners de los controles
     */
    setupEventListeners() {
        // Botón Iniciar/Pausar
        const btnStartPause = document.getElementById('btnStartPause');
        btnStartPause.addEventListener('click', () => {
            if (this.chessEngine.isRunning) {
                this.chessEngine.pause();
                btnStartPause.textContent = '▶️ Iniciar';
                btnStartPause.classList.remove('running');
            } else {
                this.chessEngine.start();
                btnStartPause.textContent = '⏸️ Pausar';
                btnStartPause.classList.add('running');
            }
        });

        // Botón Reset
        document.getElementById('btnReset').addEventListener('click', () => {
            this.chessEngine.reset();
            const btnStartPause = document.getElementById('btnStartPause');
            btnStartPause.textContent = '▶️ Iniciar';
            btnStartPause.classList.remove('running');
        });

        // Botón Reset Entrenamiento
        document.getElementById('btnResetTraining').addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres reiniciar todo el entrenamiento? Se perderán todos los datos de aprendizaje.')) {
                this.chessEngine.resetTraining();
                const btnStartPause = document.getElementById('btnStartPause');
                btnStartPause.textContent = '▶️ Iniciar';
                btnStartPause.classList.remove('running');
            }
        });

        // Slider de velocidad
        const speedSlider = document.getElementById('speedSlider');
        speedSlider.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            this.chessEngine.setSpeed(speed);
            this.updateSpeedDisplay();
        });

        // Slider de epsilon (exploración)
        const epsilonSlider = document.getElementById('epsilonSlider');
        epsilonSlider.addEventListener('input', (e) => {
            const epsilon = parseInt(e.target.value) / 100;
            this.chessEngine.setTrainingParameters({ epsilon });
            document.getElementById('epsilonValue').textContent = epsilon.toFixed(2);
        });

        // Slider de learning rate (tasa de aprendizaje)
        const learningRateSlider = document.getElementById('learningRateSlider');
        learningRateSlider.addEventListener('input', (e) => {
            const learningRate = parseInt(e.target.value) / 100;
            this.chessEngine.setTrainingParameters({ learningRate });
            document.getElementById('learningRateValue').textContent = learningRate.toFixed(2);
        });

        // Slider de discount (factor de descuento)
        const discountSlider = document.getElementById('discountSlider');
        discountSlider.addEventListener('input', (e) => {
            const discount = parseInt(e.target.value) / 100;
            this.chessEngine.setTrainingParameters({ discount });
            document.getElementById('discountValue').textContent = discount.toFixed(2);
        });

        // Slider de max moves
        const maxMovesSlider = document.getElementById('maxMovesSlider');
        maxMovesSlider.addEventListener('input', (e) => {
            const maxMoves = parseInt(e.target.value);
            this.chessEngine.setTrainingParameters({ maxMoves });
            document.getElementById('maxMovesValue').textContent = maxMoves;
        });

        // Botón Exportar
        document.getElementById('btnExport').addEventListener('click', () => {
            this.exportKnowledge();
        });

        // Botón Importar
        document.getElementById('btnImport').addEventListener('click', () => {
            this.importKnowledge();
        });

        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    btnStartPause.click();
                    break;
                case 'r':
                case 'R':
                    document.getElementById('btnReset').click();
                    break;
                case 't':
                case 'T':
                    document.getElementById('btnResetTraining').click();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    speedSlider.value = Math.min(parseInt(speedSlider.value) + 10, 100);
                    speedSlider.dispatchEvent(new Event('input'));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    speedSlider.value = Math.max(parseInt(speedSlider.value) - 10, 1);
                    speedSlider.dispatchEvent(new Event('input'));
                    break;
            }
        });
    }

    /**
     * Actualiza la visualización de velocidad
     */
    updateSpeedDisplay() {
        document.getElementById('speedValue').textContent = this.chessEngine.speed + 'x';
    }

    /**
     * Actualiza las visualizaciones de parámetros
     */
    updateParameterDisplays() {
        const params = this.chessEngine.getParameters();
        document.getElementById('epsilonValue').textContent = params.epsilon.toFixed(2);
        document.getElementById('learningRateValue').textContent = params.learningRate.toFixed(2);
        document.getElementById('discountValue').textContent = params.discount.toFixed(2);
        document.getElementById('maxMovesValue').textContent = params.maxMoves;
    }

    /**
     * Exporta el conocimiento a un archivo JSON
     */
    exportKnowledge() {
        const knowledge = this.chessEngine.trainingManager.exportKnowledge();
        const dataStr = JSON.stringify(knowledge, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `chess_knowledge_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Conocimiento exportado correctamente', 'success');
    }

    /**
     * Importa el conocimiento desde un archivo JSON
     */
    importKnowledge() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const knowledge = JSON.parse(event.target.result);
                    const success = this.chessEngine.trainingManager.importKnowledge(knowledge);
                    if (success) {
                        this.showNotification('Conocimiento importado correctamente', 'success');
                    } else {
                        this.showNotification('Error al importar el conocimiento', 'error');
                    }
                } catch (error) {
                    this.showNotification('Error al leer el archivo', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    /**
     * Muestra una notificación
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Actualiza el estado de los botones
     */
    updateButtonStates() {
        const btnStartPause = document.getElementById('btnStartPause');
        if (this.chessEngine.isRunning) {
            btnStartPause.textContent = '⏸️ Pausar';
            btnStartPause.classList.add('running');
        } else {
            btnStartPause.textContent = '▶️ Iniciar';
            btnStartPause.classList.remove('running');
        }
    }
}

// Inicializar UI cuando el motor esté listo
let uiManager = null;

document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que chessEngine esté inicializado
    setTimeout(() => {
        if (chessEngine) {
            uiManager = new UIManager(chessEngine);
            console.log('UI inicializada');
        }
    }, 100);
});

// Añadir estilos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
}
