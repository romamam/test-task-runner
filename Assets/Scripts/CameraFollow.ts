@component
export class CameraFollow extends BaseScriptComponent {
    
    @input('SceneObject')
    @hint('Bitmoji object that the camera follows')
    target: SceneObject = null;
    
    @input('SceneObject')
    @hint('Camera that follows the target')
    follower: SceneObject = null;
    
    private offset: vec3 = vec3.zero();
    private initialFollowerX: number = 0;
    
    private readonly followThreshold: number = 0.1;
    private readonly smoothFactor: number = 0.3;
    
    /**
     * Initialize camera follow system by calculating initial offset and storing initial camera position
     */
    onAwake() {
        const targetTransform = this.target.getTransform();
        const followerTransform = this.follower.getTransform();
        
        const followerWorldPos = followerTransform.getWorldPosition();
        const targetWorldPos = targetTransform.getWorldPosition();
        this.offset = followerWorldPos.sub(targetWorldPos);
        
        this.initialFollowerX = followerWorldPos.x;
        
        this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
        
        print("CameraFollow initialized - offset: " + this.offset.toString());
    }
    
    /**
     * Smoothly follow the target while maintaining fixed X position and following only Z movement
     */
    private onUpdate(): void {
        if (!this.target || !this.follower) {
            return;
        }
        
        const followerTransform = this.follower.getTransform();
        const targetTransform = this.target.getTransform();
        
        let currentFollowerPos = followerTransform.getWorldPosition();
        currentFollowerPos.x = this.initialFollowerX;
        
        let targetPos = targetTransform.getWorldPosition().add(this.offset);
        
        if (currentFollowerPos.distance(targetPos) > this.followThreshold) {
            followerTransform.setWorldPosition(vec3.lerp(
                currentFollowerPos, targetPos, this.smoothFactor));
        }
        
        // print("Camera position: " + followerTransform.getWorldPosition().toString());
    }
}
