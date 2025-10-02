/**
 * PlayerController.ts
 * Скрипт для керування рухом гравця на основі свайпів
 * Інтегрується з Animation State Manager для керування анімаціями
 */
@component
export class PlayerController extends BaseScriptComponent {
    
    
    // Входи для Animation State Manager та гравця
    @input('Component.ScriptComponent')
    @hint('Animation State Manager компонент для керування анімаціями')
    animationStateManager: ScriptComponent = null;
    
    @input('SceneObject')
    @hint('SceneObject гравця для руху')
    playerObject: SceneObject = null;
    
    @input('Physics.ColliderComponent')
    @hint('Collider component for collision detection')
    collider: any = null;
    
    @input("SceneObject")
    startScreen: SceneObject = null;
    
    @input("SceneObject")
    gameOverScreen: SceneObject = null;
    
    @input("SceneObject")
    winnerScreen: SceneObject = null;
    
    @input("SceneObject")
    restartScreen: SceneObject = null;
    
    @input("SceneObject")
    @hint('Text component to display lives count')
    livesText: SceneObject = null;
    
    @input("SceneObject")
    @hint('Text component to display score')
    scoreText: SceneObject = null;
    
    @input('Component.ScriptComponent')
    @hint('TileManager component for tile system control')
    tileManager: ScriptComponent = null;
    
    // Змінна для контролю руху
    private changeDir: boolean = false;
    
    // Змінні для руху
    private targetPosition: vec3 = vec3.zero();
    private currentPosition: vec3 = vec3.zero();
    private step: number = 0; // Крок для плавного руху
    
    // Змінні для системи часу руху
    private movementTime: number = 0.2; // Загальний час руху
    private currentMoveTime: number = 0; // Поточний час руху
    
    // Змінні для керування напрямком анімації
    private currentDir: number = 0; // Поточний напрямок (-1 = ліво, 0 = центр, 1 = право)
    private targetDir: number = 0; // Цільовий напрямок
    
    // Змінні для системи стрибка
    private jump: boolean = false; // Чи стрибає гравець зараз
    private jumpStartTime: number = 0; // Час початку стрибка
    private jumpDuration: number = 1; // Тривалість стрибка в секундах
    private jumpHeight: number = 5; // Висота стрибка
    
    // Змінна для зберігання посилання на Update подію
    private updateEvent: any = null;
    
    // Змінна для контролю початку гри
    public gameStart: boolean = false;
    
    // Система життів
    private lives: number = 3; // Початкова кількість життів
    private isImmune: boolean = false; // Чи є імунітет
    private immunityDuration: number = 2.0; // Тривалість імунітету в секундах
    private immunityStartTime: number = 0; // Час початку імунітету
    private blinkSpeed: number = 10.0; // Швидкість миготіння
    
    private score: number = 0; // Поточні метри
    private baseSpeed: number = 50; // Базова швидкість
    private speedMultiplier: number = 2.0; // Множник швидкості
    private speedIncreaseInterval: number = 15; // Кожні 100 метрів збільшуємо швидкість
    
    // Система штрафу за колізії
    private speedPenaltyActive: boolean = false; // Чи активний штраф за швидкість
    private speedPenaltyStartTime: number = 0; // Час початку штрафу
    private speedPenaltyDuration: number = 2.0; // Тривалість штрафу в секундах
    private speedPenaltyMultiplier: number = 0.5; // Наскільки зменшується швидкість (50%)
    
    /**
     * Функція оновлення тексту життів
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
     * Функція оновлення тексту очок (метри)
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
     * Додавання метрів та перевірка пришвидшення
     */
    private addScore(points: number): void {
        this.score += points;
        this.updateScoreText();
        
        const newMultiplier = 1.0 + Math.floor(this.score / this.speedIncreaseInterval) * 0.1;
        if (newMultiplier > this.speedMultiplier) {
            this.speedMultiplier = newMultiplier;
        }
    }
    
    onAwake() {
        this.updateEvent = this.createEvent("UpdateEvent");
        this.updateEvent.bind(this.onUpdate.bind(this));
        
        const startEvent = this.createEvent("OnStartEvent");
        startEvent.bind(this.init.bind(this));
        
        if (this.collider) {
            this.collider.onCollisionEnter.add((collisionInfo: any) => {
                this.handleCollision(collisionInfo);
            });
        }
    }
    
    /**
     * Ініціалізація та скидання всіх змінних гри
     */
    init(): void {
        this.changeDir = false;
        this.currentDir = 0;
        this.targetDir = 0;
        this.currentMoveTime = 0;
        this.step = 0;
        
        this.jump = false;
        this.jumpStartTime = 0;
        
        this.gameStart = false;
        
        this.lives = 3;
        this.isImmune = false;
        this.immunityStartTime = 0;
        
        this.score = 0;
        this.speedMultiplier = 1.0;
        
        this.speedPenaltyActive = false;
        this.speedPenaltyStartTime = 0;
        
        if (this.collider) {
            this.collider.enabled = true;
        }
        
        // Вимікаємо UpdateEvent при рестарті
        if (this.updateEvent) {
            this.updateEvent.enabled = false;
        }
        
        this.currentPosition = vec3.zero();
        this.targetPosition = vec3.zero();
        
        if (this.playerObject) {
            this.playerObject.getTransform().setLocalPosition(vec3.zero());
        }
        
        if (this.animationStateManager && (this.animationStateManager as any).setParameter) {
            (this.animationStateManager as any).setParameter("fall", false);
            (this.animationStateManager as any).setParameter("idle", true);
            
            (this.animationStateManager as any).setParameter("direction", 0.5);
        }
        
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
        
        // Показуємо StartButton після рестарту
        if (this.startScreen) {
            this.startScreen.enabled = true;
        }
        
        this.updateLivesText();
        
        this.updateScoreText();
        
        if (this.livesText) {
            this.livesText.enabled = true;
        }
        
    }
    
    /**
     * Обробка колізії з перешкодою
     */
    private handleCollision(collisionInfo: any): void {
        if (this.isImmune) {
            return;
        }
        
        const collidedObject = this.getCollisionObject(collisionInfo);
        
        if (collidedObject) {
            this.handleCollisionByType(collidedObject);
        } else {
            this.handleObstacleCollision();
        }
    }
    
    /**
     * Отримує SceneObject з collisionInfo
     */
    private getCollisionObject(collisionInfo: any): SceneObject | null {
        if (collisionInfo.collision && 
            collisionInfo.collision.collider && 
            collisionInfo.collision.collider.sceneObject) {
            
            return collisionInfo.collision.collider.sceneObject;
        }
        
        return null;
    }
    
    /**
     * Обробляє колізію залежно від типу об'єкта
     */
    private handleCollisionByType(sceneObject: SceneObject): void {
        const objectName = sceneObject.name.toLowerCase();
        const parentName = sceneObject.getParent() ? sceneObject.getParent().name.toLowerCase() : "";
        
        // Перевіряємо чи це торт
        if (objectName.includes("cake") || parentName.includes("cake")) {
            this.handleCakeCollection(sceneObject);
        }
        // Перевіряємо чи це перешкода
        else if (objectName.includes("obstacle") || 
                 parentName.includes("obstacle") || 
                 parentName.includes("high") || 
                 parentName.includes("short")) {
            this.handleObstacleCollision();
        }
        // Невідомий тип - вважаємо перешкодою
        else {
            this.handleObstacleCollision();
        }
    }
    
    /**
     * Обробка колізії з тортом
     */
    private handleCakeCollection(sceneObject: SceneObject): void {
        // Додаємо бали
        this.addScore(10);
        
        // Видаляємо торт зі сцени
        if (sceneObject) {
            if (sceneObject.getParent()) {
                sceneObject.getParent().destroy();
            } else {
                sceneObject.destroy();
            }
        }
    }
    
    /**
     * Обробка колізії з перешкодою
     */
    private handleObstacleCollision(): void {
        this.lives--;
        
        if (this.lives < 0) {
            this.lives = 0;
        }
        
        this.updateLivesText();
        
        if (this.lives <= 0) {
            if (this.updateEvent) {
                this.updateEvent.enabled = false;
            }
            
            if (this.playerObject) {
                const currentPos = this.playerObject.getTransform().getLocalPosition();
                currentPos.y = 0;
                this.playerObject.getTransform().setLocalPosition(currentPos);
            }
            
            if (this.animationStateManager && (this.animationStateManager as any).setParameter) {
                (this.animationStateManager as any).setParameter("fall", true);
            }
            
            if (this.gameOverScreen) {
                this.gameOverScreen.enabled = true;
            }
            
            if (this.restartScreen) {
                this.restartScreen.enabled = true;
            }
        } else {
            this.activateImmunity();
            this.activateSpeedPenalty();
        }
    }
    /**
     * Активація імунітету після колізії
     */
    private activateImmunity(): void {
        this.isImmune = true;
        this.immunityStartTime = getTime();
        
        if (this.collider) {
            this.collider.enabled = false;
        }
    }
    
    /**
     * Активація штрафу за швидкість після колізії
     */
    private activateSpeedPenalty(): void {
        this.speedPenaltyActive = true;
        this.speedPenaltyStartTime = getTime();
    }
    
    /**
     * Оновлення штрафу за швидкість
     */
    private updateSpeedPenalty(): void {
        if (!this.speedPenaltyActive) {
            return;
        }
        
        const elapsedTime = getTime() - this.speedPenaltyStartTime;
        
        if (elapsedTime >= this.speedPenaltyDuration) {
            this.speedPenaltyActive = false;
        }
    }
    
    /**
     * Розрахунок поточної швидкості з урахуванням штрафу
     */
    private getCurrentSpeed(): number {
        let speed = this.baseSpeed * this.speedMultiplier;
        
        if (this.speedPenaltyActive) {
            const elapsedTime = getTime() - this.speedPenaltyStartTime;
            const penaltyProgress = Math.min(elapsedTime / this.speedPenaltyDuration, 1.0);
            
            // Поступове відновлення швидкості (від 50% до 100%)
            const penaltyMultiplier = this.speedPenaltyMultiplier + (1.0 - this.speedPenaltyMultiplier) * penaltyProgress;
            speed *= penaltyMultiplier;
        }
        
        return speed;
    }
    
    /**
     * Перевіряє, чи може гра початися
     * @returns true якщо гра готова до початку, false якщо ні
     */
    canGameStart(): boolean {
        if (this.gameStart) {
            // Встановлюємо анімацію на run коли гра починається
            if (this.animationStateManager && (this.animationStateManager as any).setParameter) {
                (this.animationStateManager as any).setParameter("idle", false);
                (this.animationStateManager as any).setParameter("run", true);
                
                (this.animationStateManager as any).setParameter("direction", 0.5);
            }
            
            if (this.livesText) {
                this.livesText.enabled = true;
            }
            
            return true;
        }
        return false;
    }
    
    /**
     * Start the game and set animation to run
     */
    startGame(): void {
        this.gameStart = true;
        
        if (this.updateEvent) {
            this.updateEvent.enabled = true;
        }
    }
    
    /**
     * Restart the game - reset everything and start over
     */
    restartGame(): void {
        if (this.tileManager && (this.tileManager as any).resetHit !== undefined) {
            (this.tileManager as any).resetHit = true;
        }
        
        this.init();
    }
    
    /**
     * Обробка свайпу вліво
     */
    leftSwipe(): void {
        if (this.changeDir) {
            return;
        }
        
        if (!this.playerObject) {
            return;
        }
        
        this.currentPosition = this.playerObject.getTransform().getLocalPosition();
        
        if (this.currentPosition.x >= 0) {
            this.changeDir = true;
            this.step = -2;
            this.targetDir = -1;
        }
    }
    
    /**
     * Обробка свайпу вправо
     */
    rightSwipe(): void {
        if (this.changeDir) {
            return;
        }
        
        if (!this.playerObject) {
            return;
        }
        
        this.currentPosition = this.playerObject.getTransform().getLocalPosition();
        
        if (this.currentPosition.x <= 0) {
            this.changeDir = true;
            this.step = 2;
            this.targetDir = 1;
        }
    }
    
    /**
     * Handle up swipe input and trigger jump animation
     */
    upSwipe(): void {
        if (!this.animationStateManager) {
            return;
        }
        
        this.jump = true;
        this.jumpStartTime = getTime();
        
        if ((this.animationStateManager as any).setTrigger) {
            (this.animationStateManager as any).setTrigger("jump");
        }
    }
    
    /**
     * Update функція для безперервного руху та керування анімаціями
     */
    private onUpdate(): void {

        const currentSpeed = this.getCurrentSpeed();
        
        if (!this.canGameStart()) {
            return;
        }
        
        this.updateImmunity();
        this.updateSpeedPenalty(); // Оновлюємо штраф за швидкість
        
        if (this.changeDir && this.playerObject) {
            // Оновлюємо поточну позицію з Transform
            this.currentPosition = this.playerObject.getTransform().getLocalPosition();
            
            // Перевіряємо, чи час руху досяг максимального значення
            if (this.currentMoveTime >= this.movementTime) {
                // Рух завершено - скидаємо змінні
                this.changeDir = false;
                this.currentMoveTime = 0;
                this.step = 0;
            } else {
                // Рухується - оновлюємо час та позицію
                this.currentMoveTime += getDeltaTime(); // Збільшуємо час на 0.5
                
                // Оновлюємо targetPos.x додаючи step
                this.targetPosition.x += this.step;
                
                // Застосовуємо оновлену позицію до Transform гравця
                this.playerObject.getTransform().setLocalPosition(this.targetPosition);
            }
        } else {
            // Якщо немає руху, скидаємо targetDir до 0
            this.targetDir = 0;
        }
        
        // Плавна інтерполяція між поточним та цільовим напрямком
        const previousDir = this.currentDir;
        this.currentDir = MathUtils.lerp(this.currentDir, this.targetDir, 0.3);
              
        if (Math.abs(this.currentDir - previousDir) > 0.01) {
            this.updateAnimationDirection();
        }
        
        // Обробка стрибка
        if (this.jump) {
            const elapsedTime = getTime() - this.jumpStartTime;
            
            if (elapsedTime >= this.jumpDuration) {
                this.jump = false;
                this.targetPosition.y = 0;
            } else {
                const jumpProgress = elapsedTime / this.jumpDuration;
                
                this.targetPosition.y = Math.sin(jumpProgress * Math.PI) * this.jumpHeight;
                
                const deltaTime = getDeltaTime();
                const currentSpeed = this.getCurrentSpeed();
                this.currentPosition.z -= (currentSpeed + 2) * deltaTime;
                
                this.addScore(deltaTime * 2.5 * this.speedMultiplier);
            }
        } else {
            const deltaTime = getDeltaTime();
            const currentSpeed = this.getCurrentSpeed();
            this.currentPosition.z -= currentSpeed * deltaTime;
            
            this.addScore(deltaTime * 2 * this.speedMultiplier);
        }
        
        this.targetPosition.z = this.currentPosition.z;
        
        if (this.playerObject) {
            this.playerObject.getTransform().setLocalPosition(this.targetPosition);
        }
    }
    
    /**
     * Оновлення анімації на основі поточного напрямку
     */
    private updateAnimationDirection(): void {
        if (!this.animationStateManager) {
            return;
        }
        
        // Якщо гравець рухається, використовуємо напрямок руху
        if (this.changeDir) {
            // Нормалізуємо currentDir з діапазону [-1, 1] до [0, 1]
            const normalizedDirection = (this.currentDir + 1) / 2;
            
            // Встановлюємо параметр напрямку в Animation State Manager
            if ((this.animationStateManager as any).setParameter) {
                (this.animationStateManager as any).setParameter("direction", normalizedDirection);
            }
        } else {
            // Якщо гравець не рухається, повертаємо до центральної анімації (Run)
            if ((this.animationStateManager as any).setParameter) {
                (this.animationStateManager as any).setParameter("direction", 0.5);
            }
        }
    }
    
    /**
     * Оновлення імунітету та миготіння
     */
    private updateImmunity(): void {
        if (this.isImmune) {
            const elapsedTime = getTime() - this.immunityStartTime;
            
            if (elapsedTime >= this.immunityDuration) {
                this.isImmune = false;
                
                if (this.playerObject) {
                    this.playerObject.enabled = true;
                }
                
                if (this.collider) {
                    this.collider.enabled = true;
                }
            } else {
                if (this.playerObject) {
                    const blinkValue = Math.sin(elapsedTime * this.blinkSpeed);
                    this.playerObject.enabled = blinkValue > 0;
                }
            }
        }
    }
    
}
