
@component
export class ObstacleInstantiator extends BaseScriptComponent {
    
    @input('Asset.ObjectPrefab[]')
    @hint('Obstacle prefabs')
    obstacles: ObjectPrefab[] = [];
    
    private currentZ: number = 40;
    private readonly distance: number = 45;
    private readonly xPositions: number[] = [14, 0, -14];
    
    onAwake() {
        this.init();
    }
    
    onStart() {
        this.resetPositions();
        this.init();
    }
    
    /**
     * Public method to reset positions (called by TileManager)
     */
    resetPositions(): void {
        this.clearExistingObstacles();
        this.currentZ = 40; // Встановлюємо фіксовану позицію від початку тайлу
        this.init();
    }
    
    /**
     * Initialize - generates 3 obstacles on the tile
     */
    private init(): void {
        if (this.obstacles.length === 0) return;

        for (let i = 0; i < 3; i++) {
            this.instantiateObstacle();
        }
    }
    
    /**
     * Clear existing obstacles before generating new ones
     */
    private clearExistingObstacles(): void {
        const childrenCount = this.sceneObject.getChildrenCount();
        for (let i = childrenCount - 1; i >= 0; i--) {
            const child = this.sceneObject.getChild(i);
            if (child && child.name !== "Tile") child.destroy();
        }
    }

    /**
     * Instantiates a new obstacle at a random x position
     */
    private instantiateObstacle(): void {
        const index = Math.floor(Math.random() * this.obstacles.length);
        const prefab = this.obstacles[index];
        const obstacle = prefab.instantiate(this.sceneObject);

        const xIndex = Math.floor(Math.random() * this.xPositions.length);
        const x = this.xPositions[xIndex];

        obstacle.getTransform().setLocalPosition(new vec3(x, 0, this.currentZ));

        this.currentZ -= this.distance;
    }
}
