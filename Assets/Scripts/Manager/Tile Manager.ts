@component
export class TileManager extends BaseScriptComponent {
    
    @input('SceneObject')
    @hint('Player object to track position')
    player: SceneObject = null;
    
    @input('Component.ScriptComponent')
    @hint('PlayerController component for game state')
    playerController: ScriptComponent = null;
    
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
    
    private tiles: SceneObject[] = [];
    private zSpawn: number = 0;
    @input('number')
    @hint('Distance after which tiles are reset (larger = tiles disappear later)')
    resetDistance: number = 300;
    private firstTileSpawned: boolean = false;
    private resetHit: boolean = false;
    
    onAwake() {
        this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
        this.createEvent("OnStartEvent").bind(this.onStart.bind(this));
        print("TileManager initialized");
    }
    
    /**
     * Initialize tile system on game start/restart
     */
    onStart(): void {
        print("TileManager: onStart() called - resetting tile system");
        this.resetTiles();
    }
    
    /**
     * Public method to reset tiles (called by GameManager)
     */
    resetTiles(): void {
        print("TileManager: resetTiles() called");
        
        // видаляємо старі тайли
        this.tiles.forEach(tile => {
            if (tile) {
                tile.destroy();
            }
        });
        this.tiles = [];
        this.zSpawn = 0;
        this.firstTileSpawned = false;
        this.resetHit = false;

        // створюємо стартові тайли
        for (let i = 0; i < this.initialTileCount; i++) {
            this.spawnTile(!this.firstTileSpawned);
            this.firstTileSpawned = true;
        }
        
        print("TileManager: Tile system reset and initialized");
    }
    
    /**
     * Create new tile and add it to the array
     */
    private spawnTile(isFirst: boolean = false): void {
        const prefab = isFirst ? this.firstTilePrefab : this.tilePrefab;
        if (!prefab) {
            print("ERROR: prefab not assigned!");
            return;
        }

        const tile = prefab.instantiate(this.sceneObject);
        tile.getTransform().setLocalPosition(new vec3(0, 0, this.zSpawn));
        this.tiles.push(tile);

        // Ініціалізуємо obstacles і pickups на тайлі
        // Компоненти будуть ініціалізовані автоматично через onStart()

        this.zSpawn -= this.tileLength;
        print((isFirst ? "First " : "") + "Tile positioned at z: " + this.zSpawn);
    }

    /**
     * Move tile to the end of the sequence
     */
    private resetTile(tile: SceneObject): void {
        tile.getTransform().setLocalPosition(new vec3(0, 0, this.zSpawn));
        this.zSpawn -= this.tileLength;

        // перегенеруємо obstacles та pickups
        // Компоненти будуть перегенеровані автоматично через onStart()

        print("Tile reset to z: " + this.zSpawn);
    }
    
    /**
     * Track player position and check tiles
     */
    private onUpdate(): void {
        if (!this.player) return;

        if (this.resetHit) {
            print("TileManager: Reset detected, calling resetTiles()");
            this.resetTiles();
            this.resetHit = false;
            return;
        }

        const playerPosition = this.player.getTransform().getWorldPosition();

        this.tiles.forEach(tile => {
            const tilePosition = tile.getTransform().getLocalPosition();
            
            // Тайл має бути переміщений, коли гравець пройшов його
            // (tilePosition.z більше playerPosition.z означає, що тайл позаду гравця)
            if (tilePosition.z > playerPosition.z + this.resetDistance) {
                print(`Tile reset: tileZ=${tilePosition.z}, playerZ=${playerPosition.z}, distance=${tilePosition.z - playerPosition.z}`);
                this.resetTile(tile);
            }
        });
    }
}
