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
    
    // Змінна для контролю руху
    private changeDir: boolean = false;
    
    // Змінні для руху
    private targetPosition: vec3 = vec3.zero();
    private currentPosition: vec3 = vec3.zero();
    private step: number = 0; // Крок для плавного руху
    
    // Змінні для системи часу руху
    private movementTime: number = 0.2; // Загальний час руху
    private currentMoveTime: number = 0; // Поточний час руху
    
    // Змінна для швидкості руху вперед
    private speed: number = 50; // Швидкість руху вперед
    
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
    
    // Змінні для скидання в init()
    private slide: boolean = false;
    
    // Змінна для контролю початку гри
    public gameStart: boolean = false;
    
    onAwake() {
        
        this.updateEvent = this.createEvent("UpdateEvent");
        this.updateEvent.bind(this.onUpdate.bind(this));
        
        // Створення Start події для автоматичного виклику init() як у туторіалі
        const startEvent = this.createEvent("OnStartEvent");
        startEvent.bind(this.init.bind(this));
        
        
        if (this.collider) {
            this.collider.onCollisionEnter.add(() => {
                print("Bitmoji collided with an obstacle!");
                
                
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
            });
        }
    }
    
    /**
     * Ініціалізація та скидання всіх змінних гри
     */
    init(): void {
        print("PlayerController: init() called via OnStartEvent");
        
        this.changeDir = false;
        this.currentDir = 0;
        this.targetDir = 0;
        this.currentMoveTime = 0;
        this.step = 0;
        
        this.jump = false;
        this.slide = false;
        this.jumpStartTime = 0;
        
        this.gameStart = false;
        
        this.currentPosition = vec3.zero();
        this.targetPosition = vec3.zero();
        
        if (this.playerObject) {
            this.playerObject.getTransform().setLocalPosition(vec3.zero());
        }
        
        if (this.animationStateManager && (this.animationStateManager as any).setParameter) {
            (this.animationStateManager as any).setParameter("fall", false);
            (this.animationStateManager as any).setParameter("idle", true);
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
        
    }
    
    /**
     * Перевіряє, чи може гра початися
     * @returns true якщо гра готова до початку, false якщо ні
     */
    canGameStart(): boolean {
        if (this.gameStart) {
            print("PlayerController: canGameStart() - gameStart is true, setting animation to run");
            // Встановлюємо анімацію на run коли гра починається
            if (this.animationStateManager && (this.animationStateManager as any).setParameter) {
                (this.animationStateManager as any).setParameter("idle", false);
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
        print("Game started - player can now move");
    }
    
    onStart() {
        // Ініціалізація тепер відбувається в init() функції
    }
    
    /**
     * Обробка свайпу вліво
     */
    leftSwipe(): void {
        print("Left swipe detected");
        
    
        if (this.changeDir) {
            print("Movement in progress - input blocked");
            return;
        }
        
        // Перевіряємо, чи playerObject призначений
        if (!this.playerObject) {
            print("ERROR: playerObject not assigned!");
            return;
        }
        
        // Оновлюємо поточну позицію
        this.currentPosition = this.playerObject.getTransform().getLocalPosition();
        
        // Перевіряємо, чи гравець не вийде за ліву межу екрану
        if (this.currentPosition.x >= 0) {
            this.changeDir = true;
            this.step = -2; // Рухаємо вліво з кроком -5
            this.targetDir = -1; // Встановлюємо цільовий напрямок вліво
            print("Moving left - current position: " + this.currentPosition.x);
        } else {
            print("Cannot move left - player is already at left boundary");
        }
    }
    
    /**
     * Обробка свайпу вправо
     */
    rightSwipe(): void {
        print("Right swipe detected");
        
        if (this.changeDir) {
            print("Movement in progress - input blocked");
            return;
        }
        
        // Перевіряємо, чи playerObject призначений
        if (!this.playerObject) {
            print("ERROR: playerObject not assigned!");
            return;
        }
        
        // Оновлюємо поточну позицію
        this.currentPosition = this.playerObject.getTransform().getLocalPosition();
        
        // Перевіряємо, чи гравець не вийде за праву межу екрану
        if (this.currentPosition.x <= 0) {
            this.changeDir = true;
            this.step = 2; // Рухаємо вправо з кроком 5
            this.targetDir = 1; // Встановлюємо цільовий напрямок вправо
            print("Moving right - current position: " + this.currentPosition.x);
        } else {
            print("Cannot move right - player is already at right boundary");
        }
    }
    
    /**
     * Handle up swipe input and trigger jump animation
     */
    upSwipe(): void {
        print("Up swipe detected - triggering jump");
        
        if (!this.animationStateManager) {
            print("ERROR: animationStateManager not assigned!");
            return;
        }
        
        this.jump = true;
        this.jumpStartTime = getTime();
        
        // Trigger jump animation using Animation State Manager
        if ((this.animationStateManager as any).setTrigger) {
            (this.animationStateManager as any).setTrigger("jump");
            print("Jump animation triggered");
        } else {
            print("ERROR: setTrigger method not found in Animation State Manager");
        }
    }
    
    /**
     * Обробка свайпу вниз (поки що порожня)
     */
    downSwipe(): void {
        print("Down swipe detected - not implemented yet");
        // TODO: Реалізувати рух вниз
    }
    
    /**
     * Update функція для безперервного руху та керування анімаціями
     */
    private onUpdate(): void {
        if (!this.canGameStart()) {
            return;
        }
        
        if (this.changeDir && this.playerObject) {
            // Оновлюємо поточну позицію з Transform
            this.currentPosition = this.playerObject.getTransform().getLocalPosition();
            
            // Перевіряємо, чи час руху досяг максимального значення
            if (this.currentMoveTime >= this.movementTime) {
                // Рух завершено - скидаємо змінні
                this.changeDir = false;
                this.currentMoveTime = 0;
                this.step = 0;
                
                print("Movement completed - final position: " + this.currentPosition.x);
            } else {
                // Рухується - оновлюємо час та позицію
                this.currentMoveTime += getDeltaTime(); // Збільшуємо час на 0.5
                
                // Оновлюємо targetPos.x додаючи step
                this.targetPosition.x += this.step;
                
                // Застосовуємо оновлену позицію до Transform гравця
                this.playerObject.getTransform().setLocalPosition(this.targetPosition);
                
                print("Moving - currentMoveTime: " + this.currentMoveTime + ", position: " + this.targetPosition.x);
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
                print("Jump completed - returned to ground");
            } else {
                const jumpProgress = elapsedTime / this.jumpDuration;
                
                this.targetPosition.y = Math.sin(jumpProgress * Math.PI) * this.jumpHeight;
                
                const deltaTime = getDeltaTime();
                this.currentPosition.z -= (this.speed + 2) * deltaTime;
            }
        } else {
            const deltaTime = getDeltaTime();
            this.currentPosition.z -= this.speed * deltaTime;
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
    
}
