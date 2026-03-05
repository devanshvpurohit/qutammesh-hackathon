import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private speed: number = 250;
    private jumpHeight: number = -600;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBounce(0.1);

        // Setup input
        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            // Add WASD as alternative
            scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
            scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
            scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        } else {
            // fallback if keyboard is missing
            this.cursors = {
                up: { isDown: false } as Phaser.Input.Keyboard.Key,
                down: { isDown: false } as Phaser.Input.Keyboard.Key,
                left: { isDown: false } as Phaser.Input.Keyboard.Key,
                right: { isDown: false } as Phaser.Input.Keyboard.Key,
                space: { isDown: false } as Phaser.Input.Keyboard.Key,
                shift: { isDown: false } as Phaser.Input.Keyboard.Key,
            };
        }
    }

    update() {
        const keyboard = this.scene.input.keyboard!;

        const isLeft = this.cursors.left.isDown || keyboard.checkDown(keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A), 0);
        const isRight = this.cursors.right.isDown || keyboard.checkDown(keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D), 0);
        const isUp = this.cursors.up.isDown || this.cursors.space.isDown || keyboard.checkDown(keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W), 0);

        if (isLeft) {
            this.setVelocityX(-this.speed);
            // Flip sprite depending on what realistic sprite logic you have later
            // this.setFlipX(true); 
        } else if (isRight) {
            this.setVelocityX(this.speed);
            // this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }

        // Jumping mechanic
        if (isUp && this.body && this.body.touching.down) {
            this.setVelocityY(this.jumpHeight);
        }
    }
}
