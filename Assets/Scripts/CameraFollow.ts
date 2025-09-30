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
     * Smoothly follow the target while maintaining fixed X position and using lerp for smooth movement
     */
    private onUpdate(): void {
        if (!this.target || !this.follower) {
            return;
        }
        
        const followerTransform = this.follower.getTransform();
        const followerCurrentPos = followerTransform.getWorldPosition();
        
        followerCurrentPos.x = this.initialFollowerX;
        
        const targetTransform = this.target.getTransform();
        const targetCurrentPos = targetTransform.getWorldPosition();
        const desiredPos = targetCurrentPos.add(this.offset);
        
        const distance = followerCurrentPos.sub(desiredPos).length;
        
        if (distance > this.followThreshold) {
            const newPos = vec3.lerp(followerCurrentPos, desiredPos, this.smoothFactor);
            
            followerTransform.setWorldPosition(newPos);
            
            // print("Camera position: " + followerTransform.getWorldPosition().toString());
        }
    }
}
