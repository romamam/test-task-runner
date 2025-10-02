
@component
export class ObstacleInstantiator extends BaseScriptComponent {
    
    // @input Asset.ObjectPrefab[] obstacles
    @input('Asset.ObjectPrefab[]')
    @hint('Масив obstacle prefabs для рандомного вибору')
    obstacles: ObjectPrefab[] = [];
    
    private currentZPosition: number = 40;
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
     * Reset positions for new obstacle generation
     */
    private resetPositions(): void {
        this.currentZPosition = 40;
    }
    
    /**
     * Initialize - generates 3 obstacles on the tile
     */
    private init(): void {
        if (this.obstacles.length === 0) {
            return;
        }
        
        this.clearExistingObstacles();
        
        for (let i = 0; i < 3; i++) {
            this.instantiateObstacle();
        }
    }
    
    /**
     * Clear existing obstacles before generating new ones
     */
    private clearExistingObstacles(): void {
        const childCount = this.sceneObject.getChildrenCount();
        
        for (let i = childCount - 1; i >= 0; i--) {
            const child = this.sceneObject.getChild(i);
            if (child && child.name !== "Tile") {
                child.destroy();
            }
        }
    }
    
    /**
     * Instantiates a new obstacle at a random x position
     */
    private instantiateObstacle(): void {
        const randomObstacleIndex = Math.floor(MathUtils.randomRange(0, this.obstacles.length));
        const newObstacle = this.obstacles[randomObstacleIndex].instantiate(this.sceneObject);
        const randomXIndex = Math.floor(MathUtils.randomRange(0, this.xPositions.length));
        const transform = newObstacle.getTransform();
        if (transform) {
            transform.setLocalPosition(new vec3(this.xPositions[randomXIndex], 0, this.currentZPosition));
        }
        
        this.currentZPosition -= this.distance;
    }
}
