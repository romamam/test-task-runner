@component
export class PickUpInstantiator extends BaseScriptComponent {
    
    @input('Asset.ObjectPrefab')
    @hint('Cake prefab')
    cakePrefab: ObjectPrefab = null;
    
    @input('number')
    @hint('Spawn chance 0..1')
    spawnChance: number = 0.1;
    
    @input('number')
    @hint('Min distance between cakes')
    minDistance: number = 100;
    
    private lastZ: number = -1000;
    private readonly xPositions: number[] = [14, 0, -14];
    
    onAwake() {
        this.init();
    }
    
    onStart() {
        this.resetSpawnPosition();
        this.init();
    }
    
    /**
     * Public method to reset spawn position (called by TileManager)
     */
    resetSpawnPosition(): void {
        this.clearExistingCakes();
        this.lastZ = -1000; // Скидаємо позицію для нового тайлу
        this.trySpawnCake();
    }
    
    /**
     * Initialize - tries to spawn a cake based on probability
     */
    private init(): void {
        if (!this.cakePrefab) return;
        
        this.trySpawnCake();
    }
    
    /**
     * Clear existing cakes before generating new ones
     */
    private clearExistingCakes(): void {
        const count = this.sceneObject.getChildrenCount();
        for (let i = count - 1; i >= 0; i--) {
            const child = this.sceneObject.getChild(i);
            if (child && child.name.includes("Cake")) child.destroy();
        }
    }

    /**
     * Try to spawn a cake based on probability and distance
     */
    private trySpawnCake(): void {
        if (Math.random() > this.spawnChance) return;

        const randomZ = MathUtils.randomRange(-20, 20);
        if (Math.abs(randomZ - this.lastZ) < this.minDistance) return;

        const xIndex = Math.floor(Math.random() * this.xPositions.length);
        const x = this.xPositions[xIndex];

        const cake = this.cakePrefab.instantiate(this.sceneObject);
        cake.getTransform().setLocalPosition(new vec3(x, 10, randomZ));
        cake.name = "Cake_" + Date.now();

        this.lastZ = randomZ;

        // додатково можна стартувати обертання
        this.startCakeRotation(cake);
    }
    
    /**
     * Start rotation animation for the cake
     */
    private startCakeRotation(cake: SceneObject): void {
        const rotationEvent = this.createEvent("UpdateEvent");
        const startTime = getTime();
        const speed = 2;
        
        rotationEvent.bind(() => {
            const t = getTime() - startTime;
            cake.getTransform().setLocalRotation(quat.fromEulerAngles(0, t * speed, 0));
        });
    }
}
