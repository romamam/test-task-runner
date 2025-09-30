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
    
    // Змінна для контролю руху
    private changeDir: boolean = false;
    
    // Змінні для руху
    private targetPosition: vec3 = vec3.zero();
    private currentPosition: vec3 = vec3.zero();
    private step: number = 0; // Крок для плавного руху
    
    // Змінні для системи часу руху
    private movementTime: number = 2.5; // Загальний час руху
    private currentMoveTime: number = 0; // Поточний час руху
    
    // Змінні для керування напрямком анімації
    private currentDir: number = 0; // Поточний напрямок (-1 = ліво, 0 = центр, 1 = право)
    private targetDir: number = 0; // Цільовий напрямок
    
    onAwake() {
        // Створення Update події для безперервного руху
        this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
    }
    
    onStart() {
        // Ініціалізація початкових позицій після того, як всі компоненти готові
        if (this.playerObject) {
            this.currentPosition = this.playerObject.getTransform().getLocalPosition();
            this.targetPosition = this.currentPosition;
            print("PlayerController initialized - starting position: " + this.currentPosition.x);
        } else {
            print("ERROR: playerObject not assigned in Inspector!");
        }
    }
    
    /**
     * Обробка свайпу вліво
     */
    leftSwipe(): void {
        print("Left swipe detected");
        
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
            this.step = -15; // Рухаємо вліво з кроком -5
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
            this.step = 15; // Рухаємо вправо з кроком 5
            this.targetDir = 1; // Встановлюємо цільовий напрямок вправо
            print("Moving right - current position: " + this.currentPosition.x);
        } else {
            print("Cannot move right - player is already at right boundary");
        }
    }
    
    /**
     * Обробка свайпу вгору (поки що порожня)
     */
    upSwipe(): void {
        print("Up swipe detected - not implemented yet");
        // TODO: Реалізувати рух вгору
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
                this.currentMoveTime += 0.5; // Збільшуємо час на 0.5
                
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
        
        // Оновлюємо анімацію тільки якщо напрямок змінився
        if (Math.abs(this.currentDir - previousDir) > 0.01) {
            this.updateAnimationDirection();
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
