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
    
    @input('Component.ScriptComponent')
    @hint('TileManager component for tile system control')
    tileManager: ScriptComponent = null;
    
    @input('Component.ScriptComponent')
    @hint('GameManager component for game state management')
    gameManager: ScriptComponent = null;
    
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
        console.log("PlayerController: Initializing");
        
        this.changeDir = false;
        this.currentDir = 0;
        this.targetDir = 0;
        this.currentMoveTime = 0;
        this.step = 0;
        
        this.jump = false;
        this.jumpStartTime = 0;
        
        this.gameStart = false;
        
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
        
        console.log("PlayerController: Initialization complete");
    }
    
    /**
     * Обробка колізії з перешкодою
     */
    private handleCollision(collisionInfo: any): void {
        console.log("PlayerController: handleCollision called");
        
        // Перевіряємо імунітет через GameManager
        if (this.gameManager && (this.gameManager as any).isPlayerImmune) {
            console.log("PlayerController: Player is immune, ignoring collision");
            return;
        }
        
        console.log("PlayerController: Player is not immune, processing collision");
        
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
        // Повідомляємо GameManager про збір торта
        if (this.gameManager && (this.gameManager as any).handleCakeCollection) {
            (this.gameManager as any).handleCakeCollection();
        }
        
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
        // Повідомляємо GameManager про колізію з перешкодою
        if (this.gameManager && (this.gameManager as any).handleObstacleCollision) {
            (this.gameManager as any).handleObstacleCollision();
        }
    }
    
    /**
     * Зупинка гри
     */
    stopGame(): void {
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

        const currentSpeed = this.gameManager && (this.gameManager as any).getCurrentSpeed ? 
            (this.gameManager as any).getCurrentSpeed() : 50;
        
        if (!this.canGameStart()) {
            return;
        }
        
        this.updateImmunity();
        
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
                const currentSpeed = this.gameManager && (this.gameManager as any).getCurrentSpeed ? 
                    (this.gameManager as any).getCurrentSpeed() : 50;
                this.currentPosition.z -= (currentSpeed + 2) * deltaTime;
                
                if (this.gameManager && (this.gameManager as any).addScore) {
                    const speedMultiplier = this.gameManager && (this.gameManager as any).speedMultiplier ? 
                        (this.gameManager as any).speedMultiplier : 1.0;
                    (this.gameManager as any).addScore(deltaTime * 2.5 * speedMultiplier);
                }
            }
        } else {
            const deltaTime = getDeltaTime();
            const currentSpeed = this.gameManager && (this.gameManager as any).getCurrentSpeed ? 
                (this.gameManager as any).getCurrentSpeed() : 50;
            this.currentPosition.z -= currentSpeed * deltaTime;
            
            if (this.gameManager && (this.gameManager as any).addScore) {
                const speedMultiplier = this.gameManager && (this.gameManager as any).speedMultiplier ? 
                    (this.gameManager as any).speedMultiplier : 1.0;
                (this.gameManager as any).addScore(deltaTime * 2 * speedMultiplier);
            }
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
        if (this.gameManager) {
            const isImmune = (this.gameManager as any).isPlayerImmune;
            const immunityElapsedTime = (this.gameManager as any).immunityElapsedTime;
            const immunityDuration = 2.0; // Тривалість імунітету
            const blinkSpeed = 10.0; // Швидкість миготіння
            
            if (isImmune) {
                console.log("PlayerController: Player is immune, collider disabled, blinking");
                if (this.playerObject) {
                    const blinkValue = Math.sin(immunityElapsedTime * blinkSpeed);
                    this.playerObject.enabled = blinkValue > 0;
                }
                
                if (this.collider) {
                    this.collider.enabled = false;
                }
            } else {
                // Імунітет закінчився - повертаємо все в норму
                console.log("PlayerController: Immunity ended, restoring collider and player visibility");
                if (this.playerObject) {
                    this.playerObject.enabled = true;
                }
                
                if (this.collider) {
                    this.collider.enabled = true;
                }
            }
        }
    }
    
}
