/**
 * StartButton.ts
 * Script for handling the start button functionality
 * Processes Start Screen tap and launches the game
 */
@component
export class StartButton extends BaseScriptComponent {
    
    @input('Component.ScriptComponent')
    @hint('PlayerController component for game control')
    playerController: ScriptComponent = null;
    
    onAwake() {
        print("StartButton: onAwake() called");
        
        if (this.playerController) {
            (this.playerController as any).gameStart = false;
            print("StartButton: playerController found and gameStart set to false");
        } else {
            print("StartButton: ERROR - playerController not assigned!");
        }
        
        this.createEvent("TapEvent").bind(this.onTap.bind(this)); 
        print("StartButton: TapEvent and UpdateEvent created and bound");
    }
    
    /**
     * Event handler for tap events to start the game
     */
    onTap(): void {
        print("StartButton: onTap() called - TAP DETECTED!");
        
        if (!this.playerController) {
            print("StartButton: ERROR - playerController not assigned!");
            return;
        }
        
        print("StartButton: Setting gameStart to true");
        (this.playerController as any).gameStart = true;
        
        print("StartButton: Hiding button");
        this.getSceneObject().enabled = false;
        
        print("StartButton: Game started successfully");
    }
}
