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
        this.updateModeButtons();
        this.updateObservationStatus(chessEngine.gameMode);
        this.updateStorageModeDisplay();
        this.setupDropboxBackupListener();
    }

    /**
     * Configura los event listeners de los controles
     */
    setupEventListeners() {
        // Botones de modo de juego
        const btnModeTraining = document.getElementById('btnModeTraining');
        const btnModeHuman = document.getElementById('btnModeHuman');
        
        btnModeTraining.addEventListener('click', () => {
            this.chessEngine.setGameMode('training');
            this.updateModeButtons();
            this.updateObservationStatus('training');
        });
        
        btnModeHuman.addEventListener('click', () => {
            this.chessEngine.setGameMode('human_vs_ai');
            this.updateModeButtons();
            this.updateObservationStatus('human_vs_ai');
        });

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

        // Botón Configurar Dropbox
        document.getElementById('btnConfigDropbox').addEventListener('click', () => {
            this.configDropbox();
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
     * Configura Dropbox API
     */
    configDropbox() {
        const token = prompt('⚠️ ADVERTENCIA: Necesitas configurar Dropbox primero\n\n\nPara usar Dropbox, sigue estos pasos:\n\n1. Ve a DROPBOX_SETUP.md (instrucciones disponibles abajo)\n2. O haz clic en el enlace directo: https://www.dropbox.com/developers\n3. Crea una app y genera un access token\n4. Vuelve aquí y pega el token\n\nIngresa tu Access Token de Dropbox:', localStorage.getItem('dropbox_access_token') || '');
        
        if (token !== null && token !== '') {
            this.showLoadingProgress('Verificando conexión con Dropbox...');
            
            // Timeout para ocultar la barra si tarda demasiado
            const timeoutId = setTimeout(() => {
                this.hideLoadingProgress();
                this.showNotification('⏱️ La verificación está tardando demasiado. Intenta nuevamente.', 'warning');
            }, 30000); // 30 segundos
            
            // Verificar conexión con Dropbox
            this.chessEngine.whiteAgent.qTable.dropboxAccessToken = token;
            this.chessEngine.whiteAgent.qTable.verifyDropboxConnection().then(result => {
                clearTimeout(timeoutId);
                if (result.success) {
                    // Conexión exitosa, configurar tokens
                    this.showLoadingProgress('Cargando conocimiento desde Dropbox...');
                    this.chessEngine.whiteAgent.qTable.setDropboxToken(token);
                    this.chessEngine.blackAgent.qTable.setDropboxToken(token);
                    this.updateStorageModeDisplay();
                    this.showNotification(`✅ Dropbox configurado correctamente\n👤 Cuenta: ${result.accountInfo.name.display_name || result.accountInfo.email}`, 'success');
                    this.hideLoadingProgress();
                } else {
                    // Error de conexión
                    this.showNotification(`❌ Error de conexión con Dropbox: ${result.error}`, 'error');
                    this.hideLoadingProgress();
                }
            }).catch(error => {
                clearTimeout(timeoutId);
                this.showNotification(`❌ Error al verificar conexión: ${error.message}`, 'error');
                this.hideLoadingProgress();
            });
        }
    }

    /**
     * Muestra la barra de progreso de carga
     */
    showLoadingProgress(text = 'Cargando...') {
        const loadingProgress = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');
        if (loadingProgress && loadingText) {
            loadingText.textContent = text;
            loadingProgress.style.display = 'block';
        }
    }

    /**
     * Oculta la barra de progreso de carga
     */
    hideLoadingProgress() {
        const loadingProgress = document.getElementById('loadingProgress');
        if (loadingProgress) {
            loadingProgress.style.display = 'none';
        }
    }

    /**
     * Muestra una notificación temporal
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 420px;
            padding: 12px 16px;
            border-radius: 8px;
            background: ${colors[type] || colors.info};
            color: #fff;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
            z-index: 9999;
            white-space: pre-line;
            animation: slideIn 0.25s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.25s ease-out';
            setTimeout(() => notification.remove(), 250);
        }, 3200);
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

    /**
     * Actualiza los botones de modo
     */
    updateModeButtons() {
        const btnTraining = document.getElementById('btnModeTraining');
        const btnHuman = document.getElementById('btnModeHuman');
        
        if (this.chessEngine.gameMode === 'training') {
            btnTraining.classList.add('active');
            btnHuman.classList.remove('active');
        } else {
            btnTraining.classList.remove('active');
            btnHuman.classList.add('active');
        }
    }

    /**
     * Actualiza el estado de observación
     */
    updateObservationStatus(mode) {
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
     * Configura el listener para eventos de respaldo de Dropbox
     */
    setupDropboxBackupListener() {
        const uiManager = this;
        window.addEventListener('dropboxBackupComplete', (event) => {
            const { timestamp, path } = event.detail;
            uiManager.updateLastBackupDisplay(timestamp);
            // Mostrar notificación breve de respaldo completado
            uiManager.showNotification(`☁️ Respaldo guardado en Dropbox: ${timestamp}`, 'info');
        });
        
        window.addEventListener('dropboxBackupError', (event) => {
            const { error } = event.detail;
            uiManager.showNotification(`❌ Error al guardar en Dropbox: ${error}`, 'error');
            uiManager.updateStorageModeDisplay();
        });
    }

    /**
     * Actualiza el indicador del último respaldo
     */
    updateLastBackupDisplay(timestamp) {
        const lastBackupEl = document.getElementById('lastBackup');
        if (lastBackupEl) {
            lastBackupEl.textContent = timestamp;
        }
    }

    /**
     * Actualiza el indicador de modo de almacenamiento
     */
    updateStorageModeDisplay() {
        const storageModeTextEl = document.getElementById('storageModeText');
        const lastBackupContainer = document.getElementById('lastBackupContainer');
        if (storageModeTextEl) {
            const useDropbox = this.chessEngine.whiteAgent.qTable.useDropbox || this.chessEngine.blackAgent.qTable.useDropbox;
            
            if (useDropbox) {
                storageModeTextEl.textContent = 'Dropbox ☁️';
                storageModeTextEl.style.color = '#2ecc71';
                // Mostrar indicador de último respaldo
                if (lastBackupContainer) {
                    lastBackupContainer.style.display = 'block';
                    const lastBackup = localStorage.getItem('lastDropboxBackup');
                    if (lastBackup) {
                        this.updateLastBackupDisplay(lastBackup);
                    }
                }
            } else {
                storageModeTextEl.textContent = 'localStorage 💾';
                storageModeTextEl.style.color = '#3498db';
                // Ocultar indicador de último respaldo
                if (lastBackupContainer) {
                    lastBackupContainer.style.display = 'none';
                }
            }
        }
    }
}

// Inicializar UI cuando el motor esté listo
let uiManager = null;

// Función para inicializar la UI
function initializeUI() {
    if (chessEngine) {
        try {
            uiManager = new UIManager(chessEngine);
            console.log('UI inicializada');
        } catch (error) {
            console.error('Error al inicializar la UI:', error);
        }
    } else {
        console.error('chessEngine no está disponible');
    }
}

// Escuchar evento personalizado cuando el motor esté listo
window.addEventListener('chessEngineReady', () => {
    initializeUI();
});

// También escuchar DOMContentLoaded por si el evento ya se disparó
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para asegurar que el motor esté inicializado
    setTimeout(() => {
        if (!uiManager) {
            initializeUI();
        }
    }, 50);
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
