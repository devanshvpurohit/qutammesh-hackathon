import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: any;

    public getCursors() {
        return this.cursors;
    }

    // Physics constants for fine-tuning
    private readonly SPEED = 320;
    private readonly ACCEL = 1200;
    private readonly DRAG = 1800;
    private readonly JUMP_FORCE = -550;
    private readonly VARIABLE_JUMP_MODIFIER = 0.5;

    // Feel variables
    private coyoteTime: number = 0;
    private readonly COYOTE_DURATION = 150; // ms
    private jumpBuffer: number = 0;
    private readonly JUMP_BUFFER_DURATION = 150; // ms

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setDragX(this.DRAG);
        this.setMaxVelocity(this.SPEED, 1000);

        // Setup input
        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.wasdKeys = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                right: Phaser.Input.Keyboard.KeyCodes.D
            });
        }
    }

    update() {
        const onGround = this.body!.blocked.down || this.body!.touching.down;

        // Handle Coyote Time
        if (onGround) {
            this.coyoteTime = this.scene.time.now + this.COYOTE_DURATION;
        }

        // Handle Input Detection
        const isLeft = this.cursors.left.isDown || this.wasdKeys.left.isDown;
        const isRight = this.cursors.right.isDown || this.wasdKeys.right.isDown;
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
            Phaser.Input.Keyboard.JustDown(this.wasdKeys.up);
        const jumpReleased = Phaser.Input.Keyboard.JustUp(this.cursors.up) ||
            Phaser.Input.Keyboard.JustUp(this.cursors.space) ||
            Phaser.Input.Keyboard.JustUp(this.wasdKeys.up);

        // Left/Right Movement with Acceleration
        if (isLeft) {
            this.setAccelerationX(-this.ACCEL);
            this.setFlipX(true);
        } else if (isRight) {
            this.setAccelerationX(this.ACCEL);
            this.setFlipX(false);
        } else {
            this.setAccelerationX(0);
        }

        // Jump Buffering
        if (jumpPressed) {
            this.jumpBuffer = this.scene.time.now + this.JUMP_BUFFER_DURATION;
        }

        // Execute Jump (including Coyote Time & Buffer)
        if (this.jumpBuffer > this.scene.time.now && this.coyoteTime > this.scene.time.now) {
            this.setVelocityY(this.JUMP_FORCE);
            this.jumpBuffer = 0;
            this.coyoteTime = 0;
        }

        // Variable Jump Height (cut velocity if key released early)
        if (jumpReleased && this.body!.velocity.y < 0) {
            this.setVelocityY(this.body!.velocity.y * this.VARIABLE_JUMP_MODIFIER);
        }
    }
}
