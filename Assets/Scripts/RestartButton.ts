/**
 * RestartButton.ts
 * Script for handling the restart button functionality
 * Processes Restart Screen tap and restarts the game through GameManager
 */
@component
export class RestartButton extends BaseScriptComponent {
    
    @input('Component.ScriptComponent')
    @hint('GameManager component for game control')
    gameManager: ScriptComponent = null;
    
    onAwake() {
        print("RestartButton: onAwake() called");
        
        if (this.gameManager) {
            print("RestartButton: gameManager found");
        } else {
            print("RestartButton: ERROR - gameManager not assigned!");
        }
        
        this.createEvent("TapEvent").bind(this.onTap.bind(this));
        print("RestartButton: TapEvent created and bound");
    }
    
    /**
     * Event handler for tap events to restart the game
     */
    onTap(): void {
        print("RestartButton: onTap() called - TAP DETECTED!");
        if (!this.gameManager) {
            print("ERROR: gameManager not assigned!");
            return;
        }
        
        if ((this.gameManager as any).isGameRunning) {
            print("RestartButton: Game still running, ignoring tap");
            return;
        }
        
        if ((this.gameManager as any).restartGame) {
            (this.gameManager as any).restartGame();
        } else {
            print("ERROR: restartGame method not found in GameManager");
        }
        
        this.getSceneObject().enabled = false;
        
        print("Game restarted successfully");
    }
}
