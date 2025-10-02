/**
 * PickUpInstantiator.ts
 * Скрипт для створення тортів (pickup objects) в грі
 */

@component
export class PickUpInstantiator extends BaseScriptComponent {
    
    @input('Asset.ObjectPrefab')
    @hint('Cake prefab for spawning')
    cakePrefab: ObjectPrefab = null;
    
    @input('number')
    @hint('Probability of spawning a cake (0.0 to 1.0)')
    spawnChance: number = 0.1; // 10% chance
    
    @input('number')
    @hint('Minimum distance between cakes')
    minDistance: number = 100; // Minimum 100 units between cakes
    
    private lastSpawnZ: number = -1000; // Track last spawn position
    private readonly xPositions: number[] = [14, 0, -14]; // Available X positions (right, center, left) - same as obstacles
    
    onAwake() {
        this.init();
    }
    
    onStart() {
        this.resetSpawnPosition();
        this.init();
    }
    
    /**
     * Reset spawn position for new cake generation
     */
    private resetSpawnPosition(): void {
        this.lastSpawnZ = -1000;
    }
    
    /**
     * Initialize - tries to spawn a cake based on probability
     */
    private init(): void {
        if (!this.cakePrefab) {
            return;
        }
        
        this.clearExistingCakes();
        this.trySpawnCake();
    }
    
    /**
     * Clear existing cakes before generating new ones
     */
    private clearExistingCakes(): void {
        const childCount = this.sceneObject.getChildrenCount();
        
        for (let i = childCount - 1; i >= 0; i--) {
            const child = this.sceneObject.getChild(i);
            if (child && child.name !== "Tile" && child.name.includes("Cake")) {
                child.destroy();
            }
        }
    }
    
    /**
     * Try to spawn a cake based on probability and distance
     */
    private trySpawnCake(): void {
        if (!this.sceneObject) {
            print("ERROR: sceneObject is null in PickUpInstantiator");
            return;
        }
    
        const transform = this.sceneObject.getTransform();
        if (!transform) {
            print("ERROR: sceneObject transform is null");
            return;
        }
    
        const currentZ = transform.getLocalPosition().z;
    
        if (Math.abs(currentZ - this.lastSpawnZ) < this.minDistance) {
            return;
        }
    
        if (Math.random() > this.spawnChance) {
            return;
        }
    
        this.spawnCake();
    }
    
    /**
     * Spawn a cake at random position
     */
    private spawnCake(): void {
        const randomXIndex = Math.floor(MathUtils.randomRange(0, this.xPositions.length));
        const randomX = this.xPositions[randomXIndex];
        
        const randomZ = MathUtils.randomRange(-20, 20);
        
        const newCake = this.cakePrefab.instantiate(this.sceneObject);
        
        // Встановлюємо позицію через Transform
        if (newCake) {
            const transform = newCake.getTransform();
            if (transform) {
                transform.setLocalPosition(new vec3(randomX, 10, randomZ));
            }
        }
        
        // Встановлюємо унікальну назву для торта
        newCake.name = "Cake_" + Date.now();
        
        this.startCakeRotation(newCake);
        
        // Отримуємо позицію через Transform
        if (this.sceneObject) {
            const transform = this.sceneObject.getTransform();
            if (transform) {
                const position = transform.getLocalPosition();
                this.lastSpawnZ = position.z;
            }
        }
    }
    
    /**
     * Start rotation animation for the cake
     */
    private startCakeRotation(cake: SceneObject): void {
        const rotationEvent = this.createEvent("UpdateEvent");
        
        const startTime = getTime();
        const rotationSpeed = 2;
        
        rotationEvent.bind(() => {
            if (!cake) {
                return;
            }
            
            const elapsedTime = getTime() - startTime;
            const rotationAngle = elapsedTime * rotationSpeed;
            
            const rotation = quat.fromEulerAngles(0, rotationAngle, 0);
            
            // Встановлюємо обертання через Transform
            if (cake) {
                const transform = cake.getTransform();
                if (transform) {
                    transform.setLocalRotation(rotation);
                }
            }
        });
    }
}
