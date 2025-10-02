/**
 * RestartButton.ts
 * Script for handling the restart button functionality
 * Processes Restart Screen tap and restarts the game
 */
@component
export class RestartButton extends BaseScriptComponent {
    
    @input('Component.ScriptComponent')
    @hint('PlayerController component for game control')
    playerController: ScriptComponent = null;
    
    onAwake() {
        print("RestartButton: onAwake() called");
        
        if (this.playerController) {
            print("RestartButton: playerController found");
        } else {
            print("RestartButton: ERROR - playerController not assigned!");
        }
        
        this.createEvent("TapEvent").bind(this.onTap.bind(this));
        print("RestartButton: TapEvent created and bound");
    }
    
    /**
     * Event handler for tap events to restart the game
     */
    onTap(): void {
        print("RestartButton: onTap() called - TAP DETECTED!");
        if (!this.playerController) {
            print("ERROR: playerController not assigned!");
            return;
        }
        
        if ((this.playerController as any).lives > 0) {
            print("RestartButton: Game still running, ignoring tap");
            return;
        }
        
        if ((this.playerController as any).restartGame) {
            (this.playerController as any).restartGame();
        } else {
            print("ERROR: restartGame method not found in PlayerController");
        }
        
        this.getSceneObject().enabled = false;
        
        print("Game restarted successfully");
    }
}
