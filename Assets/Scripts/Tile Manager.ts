/**
 * Tile Manager.ts
 * Script for managing tiles and creating infinite movement
 * Tile repositioning system for continuous player movement
 * 
 * USAGE INSTRUCTIONS:
 * 1. Assign Player Object to the player field
 * 2. Assign Tile Prefab to the tilePrefab field
 * 3. Configure tileLength (tile length) and initialTileCount (number of initial tiles)
 * 4. Tiles will automatically reposition when player moves forward
 */
@component
export class TileManager extends BaseScriptComponent {
    
    @input('SceneObject')
    @hint('Player object to track position')
    player: SceneObject = null;
    
    @input('Asset.ObjectPrefab')
    @hint('Tile prefab to instantiate')
    tilePrefab: ObjectPrefab = null;
    
    @input('number')
    @hint('Length of each tile')
    tileLength: number = 50;
    
    @input('number')
    @hint('Number of tiles to spawn initially')
    initialTileCount: number = 5;
    
    private grounds: SceneObject[] = [];
    private zSpawn: number = 0;
    private readonly resetDistance: number = 200;
    
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
            this.spawnTile();
        }
    }
    
    /**
     * Create new tile and add it to the array
     */
    private spawnTile(): void {
        if (!this.tilePrefab) {
            print("ERROR: tilePrefab not assigned!");
            return;
        }
        
        const newTile = this.tilePrefab.instantiate(this.sceneObject);
        const tilePosition = new vec3(0, -20, this.zSpawn);
        newTile.getTransform().setLocalPosition(tilePosition);
        this.grounds.push(newTile);
        this.zSpawn -= this.tileLength;
        print("Tile positioned at z: " + this.zSpawn);
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
