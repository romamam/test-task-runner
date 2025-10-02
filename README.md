Runner Game Prototype in Lens Studio

This is a prototype of an endless runner game created in Lens Studio for Snapchat. The game uses Bitmoji as the character, includes obstacles, a lives system, score collection, and gradual acceleration. 
The mechanics are inspired by classic runners like Subway Surfers, but adapted for AR/VR experiences in Snapchat.

Description

The game starts with a start screen. The player controls Bitmoji, who runs forward automatically. You need to avoid obstacles by jumping or changing lanes using swipes or taps. Colliding with an obstacle deducts a life (total of 3). Collect "cakes" for points. 
Over time, the speed increases, making the game more challenging. After losing all lives, a game over screen appears with a restart option.

Key Mechanics:

-Automatic Running: The character moves forward with gradual acceleration.
-Controls: Swipe left/right to change lanes, swipe up to jump (integrated in PlayerController).
-Obstacles: Randomly generated on tiles (ObstacleInstantiator).
-Pickups: Cakes for points, with spawn chance (PickUpInstantiator).

-Collisions: Handled via Physics.ColliderComponent in PlayerController. On collision with obstacles: deducts a life via GameManager, 
 activates temporary immunity (2 seconds) with player blinking, and applies a speed penalty (50% speed for 2 seconds). 
 Collisions with cakes: adds 10 points and destroys the cake. Immunity prevents multiple deductions during recovery. If lives reach 0, triggers game over.

-Lives and Immunity: 3 lives, short immunity after collision with character blinking.

-UI: Start, game over, restart screens; display of lives and score.

-Restart: Without exiting the lens, via the restart button.

-Camera: Follows the player with offset (CameraFollow).

-Tile System: Infinite tile generation (TileManager) for creating the track.

The game gets harder: speed increases every 15 points (by 10%).

Scripts and Structure

The project consists of TypeScript scripts for Lens Studio. Each script handles a specific mechanic:

-GameManager.ts: Central manager. Handles game state, lives, scores, UI, acceleration, and collision penalties.

-PlayerController.ts: Player control (movement, jumps, collisions, animations). Integrates swipes and Update for smooth movement.

-TileManager.ts: Generation and reset of tiles for an endless track.

-ObstacleInstantiator.ts: Spawns obstacles on tiles (3 obstacles per tile, random positions).

-PickUpInstantiator.ts: Spawns cakes with chance (spawnChance = 0.1) and rotation.

-CameraFollow.ts: Camera follows the player with offset.

-StartButton.ts: Handles start tap.

-RestartButton.ts: Handles restart.

Screenshots

<img width="682" height="906" alt="image" src="https://github.com/user-attachments/assets/4aaba927-e701-4e6d-8615-e97726c0c163" />
<img width="667" height="778" alt="image" src="https://github.com/user-attachments/assets/888828f8-1eb7-44bc-9e76-6254edd21e27" />
<img width="684" height="762" alt="image" src="https://github.com/user-attachments/assets/df001f20-66c9-4c19-939e-11a30d52f20f" />


