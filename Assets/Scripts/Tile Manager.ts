@component
export class TileManager extends BaseScriptComponent {
    
    @input('SceneObject')
    @hint('Player object to track position')
    player: SceneObject = null;
    
    @input('Asset.ObjectPrefab')
    @hint('Regular tile prefab with obstacles')
    tilePrefab: ObjectPrefab = null;

    @input('Asset.ObjectPrefab')
    @hint('First tile prefab without obstacles')
    firstTilePrefab: ObjectPrefab = null;
    
    @input('number')
    @hint('Length of each tile')
    tileLength: number = 50;
    
    @input('number')
    @hint('Number of tiles to spawn initially')
    initialTileCount: number = 5;
    
    private grounds: SceneObject[] = [];
    private zSpawn: number = 0;
    private readonly resetDistance: number = 200;
    private firstTileSpawned: boolean = false;
    
    onAwake() {
        this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
        this.initializeTiles();
        print("TileManager initialized with " + this.initialTileCount + " tiles");
    }
    
    /**
     * Initialize initial tiles
     */
    private initializeTiles(): void {
        for (let i = 0; i < this.initialTileCount; i++) {
            if (!this.firstTileSpawned) {
                this.spawnTile(true);
                this.firstTileSpawned = true;
            } else {
                this.spawnTile(false);
            }
        }
    }
    
    /**
     * Create new tile and add it to the array
     */
    private spawnTile(isFirst: boolean = false): void {
        let prefabToUse = isFirst ? this.firstTilePrefab : this.tilePrefab;
        if (!prefabToUse) {
            print("ERROR: prefab not assigned!");
            return;
        }
        
        const newTile = prefabToUse.instantiate(this.sceneObject);
        const tilePosition = new vec3(0, -20, this.zSpawn);
        newTile.getTransform().setLocalPosition(tilePosition);
        this.grounds.push(newTile);
        this.zSpawn -= this.tileLength;
        print((isFirst ? "First " : "") + "Tile positioned at z: " + this.zSpawn);
    }
    
    /**
     * Move tile to the end of the sequence
     */
    private resetTile(tile: SceneObject): void {
        const newPosition = new vec3(0, -20, this.zSpawn);
        tile.getTransform().setLocalPosition(newPosition);
        this.zSpawn -= this.tileLength;
        print("Tile reset to z: " + this.zSpawn);
    }
    
    /**
     * Track player position and check tiles
     */
    private onUpdate(): void {
        if (!this.player) {
            return;
        }
        
        const playerPosition = this.player.getTransform().getWorldPosition();
        
        for (let i = this.grounds.length - 1; i >= 0; i--) {
            const tile = this.grounds[i];
            const tilePosition = tile.getTransform().getLocalPosition();
            
            if (tilePosition.z > playerPosition.z + this.resetDistance) {
                this.resetTile(tile);
            }
        }
    }
}
