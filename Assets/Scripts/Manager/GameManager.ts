/**
 * GameManager.ts
 * Центральний менеджер гри, відповідає за загальний стан гри:
 * - Управління життями та очками
 * - Контроль стану гри (старт, рестарт, геймовер)
 * - Управління UI екранами
 * - Система прогресу та швидкості
 */
@component
export class GameManager extends BaseScriptComponent {
    
    // UI екрани
    @input("SceneObject")
    @hint('Start screen UI')
    startScreen: SceneObject = null;
    
    @input("SceneObject")
    @hint('Game over screen UI')
    gameOverScreen: SceneObject = null;
    
    @input("SceneObject")
    @hint('Winner screen UI')
    winnerScreen: SceneObject = null;
    
    @input("SceneObject")
    @hint('Restart screen UI')
    restartScreen: SceneObject = null;
    
    @input("SceneObject")
    @hint('Text component to display lives count')
    livesText: SceneObject = null;
    
    @input("SceneObject")
    @hint('Text component to display score')
    scoreText: SceneObject = null;
    
    // Посилання на інші компоненти
    @input('Component.ScriptComponent')
    @hint('PlayerController component')
    playerController: ScriptComponent = null;
    
    @input('Component.ScriptComponent')
    @hint('TileManager component for tile system control')
    tileManager: ScriptComponent = null;
    
    // Стан гри
    private gameStart: boolean = false;
    private gameRunning: boolean = false;
    
    // Система життів
    private lives: number = 3;
    private isImmune: boolean = false;
    private immunityDuration: number = 2.0;
    private immunityStartTime: number = 0;
    
    // Система очок та швидкості
    private score: number = 0;
    private baseSpeed: number = 50;
    private _speedMultiplier: number = 1.0;
    private speedIncreaseInterval: number = 15;
    
    // Система штрафу за колізії
    private speedPenaltyActive: boolean = false;
    private speedPenaltyStartTime: number = 0;
    private speedPenaltyDuration: number = 2.0;
    private speedPenaltyMultiplier: number = 0.5;
    
    /**
     * Ініціалізація гри
     */
    onAwake() {
        this.init();
    }
    
    /**
     * Initialize and reset all game variables
     */
    init(): void {
        this.gameStart = false;
        this.gameRunning = false;
        
        this.lives = 3;
        this.isImmune = false;
        this.immunityStartTime = 0;
        
        this.score = 0;
        this._speedMultiplier = 1.0;
        
        this.speedPenaltyActive = false;
        this.speedPenaltyStartTime = 0;
        
        this.showStartScreen();
        
        this.updateLivesText();
        this.updateScoreText();
    }
    
    /**
     * Start the game
     */
    startGame(): void {
        this.gameStart = true;
        this.gameRunning = true;
        
        this.hideStartScreen();
        
        if (this.playerController && (this.playerController as any).startGame) {
            (this.playerController as any).startGame();
        }
    }
    
    /**
     * Restart the game
     */
    restartGame(): void {
        this.init();
        
        if (this.playerController && (this.playerController as any).init) {
            (this.playerController as any).init();
        }
        
        if (this.tileManager && (this.tileManager as any).resetTiles) {
            (this.tileManager as any).resetTiles();
        } else if (this.tileManager && (this.tileManager as any).resetHit !== undefined) {
            (this.tileManager as any).resetHit = true;
        }
    }
    
    /**
     * Handle collision with obstacles
     */
    handleObstacleCollision(): void {
        if (this.isPlayerImmune) {
            return;
        }
        
        this.lives--;
        
        if (this.lives < 0) {
            this.lives = 0;
        }
        
        this.updateLivesText();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.activateImmunity();
            this.activateSpeedPenalty();
        }
    }
    
    /**
     * Handle cake collection
     */
    handleCakeCollection(): void {
        this.addScore(10);
    }
    
    /**
     * End the game
     */
    private gameOver(): void {
        this.gameRunning = false;
        
        if (this.playerController && (this.playerController as any).stopGame) {
            (this.playerController as any).stopGame();
        }
        
        this.showGameOverScreen();
    }
    
    /**
     * Activate immunity after collision
     */
    private activateImmunity(): void {
        this.isImmune = true;
        this.immunityStartTime = getTime();
    }
    
    /**
     * Activate speed penalty after collision
     */
    private activateSpeedPenalty(): void {
        this.speedPenaltyActive = true;
        this.speedPenaltyStartTime = getTime();
    }
    
    /**
     * Update speed penalty
     */
    updateSpeedPenalty(): void {
        if (!this.speedPenaltyActive) {
            return;
        }
        
        const elapsedTime = getTime() - this.speedPenaltyStartTime;
        
        if (elapsedTime >= this.speedPenaltyDuration) {
            this.speedPenaltyActive = false;
        }
    }
    
    /**
     * Calculate current speed with penalty
     */
    getCurrentSpeed(): number {
        let speed = this.baseSpeed * this._speedMultiplier;
        
        if (this.speedPenaltyActive) {
            const elapsedTime = getTime() - this.speedPenaltyStartTime;
            const penaltyProgress = Math.min(elapsedTime / this.speedPenaltyDuration, 1.0);
            
            const penaltyMultiplier = this.speedPenaltyMultiplier + (1.0 - this.speedPenaltyMultiplier) * penaltyProgress;
            speed *= penaltyMultiplier;
        }
        
        return speed;
    }
    
    /**
     * Add score and check speed increase
     */
    addScore(points: number): void {
        this.score += points;
        this.updateScoreText();
        
        const newMultiplier = 1.0 + Math.floor(this.score / this.speedIncreaseInterval) * 0.1;
        if (newMultiplier > this._speedMultiplier) {
            this._speedMultiplier = newMultiplier;
        }
    }
    
    /**
     * Update lives text
     */
    private updateLivesText(): void {
        if (this.livesText) {
            const textComponent = this.livesText.getComponent("Component.Text");
            if (textComponent && textComponent.text !== undefined) {
                textComponent.text = "Lives: " + this.lives;
            }
        }
    }
    
    /**
     * Update score text
     */
    private updateScoreText(): void {
        if (this.scoreText) {
            const textComponent = this.scoreText.getComponent("Component.Text");
            if (textComponent && textComponent.text !== undefined) {
                textComponent.text = "Score: " + Math.floor(this.score) + "m";
            }
        }
    }
    
    /**
     * Show start screen
     */
    private showStartScreen(): void {
        if (this.startScreen) {
            this.startScreen.enabled = true;
        }
        if (this.gameOverScreen) {
            this.gameOverScreen.enabled = false;
        }
        if (this.winnerScreen) {
            this.winnerScreen.enabled = false;
        }
        if (this.restartScreen) {
            this.restartScreen.enabled = false;
        }
        
        if (this.livesText) {
            this.livesText.enabled = true;
        }
    }
    
    /**
     * Hide start screen
     */
    private hideStartScreen(): void {
        if (this.startScreen) {
            this.startScreen.enabled = false;
        }
    }
    
    /**
     * Show game over screen
     */
    private showGameOverScreen(): void {
        if (this.gameOverScreen) {
            this.gameOverScreen.enabled = true;
        }
        if (this.restartScreen) {
            this.restartScreen.enabled = true;
        }
    }
    
    // Getters for accessing private variables
    get isGameRunning(): boolean {
        return this.gameRunning;
    }
    
    get isGameStarted(): boolean {
        return this.gameStart;
    }
    
    get currentLives(): number {
        return this.lives;
    }
    
    get currentScore(): number {
        return this.score;
    }
    
    get isPlayerImmune(): boolean {
        if (!this.isImmune) {
            return false;
        }
        
        const elapsedTime = getTime() - this.immunityStartTime;
        if (elapsedTime >= this.immunityDuration) {
            this.isImmune = false;
            return false;
        }
        
        return true;
    }
    
    get immunityElapsedTime(): number {
        return getTime() - this.immunityStartTime;
    }
    
    get immunityRemainingTime(): number {
        return Math.max(0, this.immunityDuration - this.immunityElapsedTime);
    }
    
    get speedMultiplier(): number {
        return this._speedMultiplier;
    }
}
