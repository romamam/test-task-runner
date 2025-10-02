/**
 * StartButton.ts
 * Script for handling the start button functionality
 * Processes Start Screen tap and launches the game through GameManager
 */
@component
export class StartButton extends BaseScriptComponent {
    
    @input('Component.ScriptComponent')
    @hint('GameManager component for game control')
    gameManager: ScriptComponent = null;
    
    onAwake() {
        print("StartButton: onAwake() called");
        
        if (this.gameManager) {
            print("StartButton: gameManager found");
        } else {
            print("StartButton: ERROR - gameManager not assigned!");
        }
        
        this.createEvent("TapEvent").bind(this.onTap.bind(this)); 
        print("StartButton: TapEvent created and bound");
    }
    
    /**
     * Event handler for tap events to start the game
     */
    onTap(): void {
        print("StartButton: onTap() called - TAP DETECTED!");
        
        if (!this.gameManager) {
            print("StartButton: ERROR - gameManager not assigned!");
            return;
        }
        
        if ((this.gameManager as any).isGameStarted) {
            print("StartButton: Game already started, ignoring tap");
            return;
        }
        
        print("StartButton: Starting game through GameManager");
        
        if ((this.gameManager as any).startGame) {
            (this.gameManager as any).startGame();
            print("StartButton: startGame() method called");
        }
        
        print("StartButton: Hiding button");
        this.getSceneObject().enabled = false;
        
        print("StartButton: Game started successfully");
    }
}
