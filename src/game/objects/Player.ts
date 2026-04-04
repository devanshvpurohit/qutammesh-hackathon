import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: any;
    private fKey!: Phaser.Input.Keyboard.Key;
    private shiftKey!: Phaser.Input.Keyboard.Key;

    public getCursors() { return this.cursors; }

    // ── Physics ──────────────────────────────────────────
    private readonly SPEED          = 350;
    private readonly ACCEL          = 1400;
    private readonly DRAG           = 2000;
    private readonly JUMP_FORCE     = -620;
    private readonly GRAVITY_DOWN   = 0.45;   // variable jump cut
    private readonly COYOTE_MS      = 160;
    private readonly JUMP_BUFFER_MS = 160;

    // ── State ─────────────────────────────────────────────
    private coyoteTime:  number = 0;
    private jumpBuffer:  number = 0;
    private jumpsLeft:   number = 2;          // double jump
    private onGroundPrev: boolean = false;

    // ── Attack ────────────────────────────────────────────
    private attackCooldown: number = 0;
    private readonly ATTACK_COOLDOWN_MS = 320;

    // ── Dash ──────────────────────────────────────────────
    private dashCooldown: number = 0;
    private readonly DASH_COOLDOWN_MS = 900;
    private readonly DASH_SPEED       = 700;
    private readonly DASH_DURATION_MS = 160;
    private isDashing: boolean = false;

    // ── Visual ────────────────────────────────────────────
    private trailTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setDragX(this.DRAG);
        this.setMaxVelocity(this.SPEED, 1200);

        if (scene.input.keyboard) {
            this.cursors  = scene.input.keyboard.createCursorKeys();
            this.wasdKeys = scene.input.keyboard.addKeys({
                up:    Phaser.Input.Keyboard.KeyCodes.W,
                left:  Phaser.Input.Keyboard.KeyCodes.A,
                down:  Phaser.Input.Keyboard.KeyCodes.S,
                right: Phaser.Input.Keyboard.KeyCodes.D,
            });
            this.fKey     = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
            this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        }
    }

    // ─── Called by Game scene each update ────────────────
    update() {
        const now     = this.scene.time.now;
        const onGround = !!(this.body!.blocked.down || this.body!.touching.down);

        // Reset double-jump when landing
        if (onGround && !this.onGroundPrev) {
            this.jumpsLeft = 2;
            this.coyoteTime = now + this.COYOTE_MS;
        }
        if (onGround) this.coyoteTime = now + this.COYOTE_MS;
        this.onGroundPrev = onGround;

        // Skip movement override while dashing
        if (this.isDashing) return;

        // ── Horizontal movement ──────────────────────────
        const isLeft  = this.cursors.left.isDown  || this.wasdKeys.left.isDown;
        const isRight = this.cursors.right.isDown || this.wasdKeys.right.isDown;

        if (isLeft)       { this.setAccelerationX(-this.ACCEL); this.setFlipX(true);  }
        else if (isRight) { this.setAccelerationX(this.ACCEL);  this.setFlipX(false); }
        else              { this.setAccelerationX(0); }

        // ── Jump ─────────────────────────────────────────
        const jumpJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.up)   ||
                             Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                             Phaser.Input.Keyboard.JustDown(this.wasdKeys.up);
        const jumpReleased = Phaser.Input.Keyboard.JustUp(this.cursors.up)     ||
                             Phaser.Input.Keyboard.JustUp(this.cursors.space)   ||
                             Phaser.Input.Keyboard.JustUp(this.wasdKeys.up);

        if (jumpJustDown) this.jumpBuffer = now + this.JUMP_BUFFER_MS;

        if (this.jumpBuffer > now) {
            if (this.coyoteTime > now) {
                // Normal / coyote jump
                this.setVelocityY(this.JUMP_FORCE);
                this.jumpBuffer  = 0;
                this.coyoteTime  = 0;
                this.jumpsLeft   = 1;
                this.spawnJumpPuff();
            } else if (this.jumpsLeft > 0) {
                // Double jump
                this.setVelocityY(this.JUMP_FORCE * 0.85);
                this.jumpBuffer = 0;
                this.jumpsLeft--;
                this.spawnDoubleJumpEffect();
            }
        }

        // Variable jump (cut height if released early)
        if (jumpReleased && this.body!.velocity.y < 0) {
            this.setVelocityY(this.body!.velocity.y * this.GRAVITY_DOWN);
        }

        // ── Dash (Shift) ──────────────────────────────────
        if (Phaser.Input.Keyboard.JustDown(this.shiftKey) && now > this.dashCooldown) {
            this.executeDash();
        }

        // ── Tint while in air (slight blue) ──────────────
        if (!onGround && !this.isDashing) {
            this.setTint(0xaaddff);
        } else if (!this.isDashing) {
            this.clearTint();
        }
    }

    // Called by Game scene to check F key outside Player.update()
    isAttackPressed(): boolean {
        const now = this.scene.time.now;
        if (Phaser.Input.Keyboard.JustDown(this.fKey) && now > this.attackCooldown) {
            this.attackCooldown = now + this.ATTACK_COOLDOWN_MS;
            return true;
        }
        return false;
    }

    getFacingDirection(): number {
        return this.flipX ? -1 : 1;
    }

    // ── Visual Effects ────────────────────────────────────
    private spawnJumpPuff() {
        for (let i = 0; i < 5; i++) {
            const puff = this.scene.add.circle(
                this.x + Phaser.Math.Between(-12, 12),
                this.y + 16,
                Phaser.Math.Between(3, 7),
                0xccffcc, 0.8
            );
            this.scene.tweens.add({
                targets: puff,
                y: puff.y + 20,
                alpha: 0,
                scaleX: 2,
                scaleY: 2,
                duration: 280,
                ease: 'Quad.easeOut',
                onComplete: () => puff.destroy(),
            });
        }
    }

    private spawnDoubleJumpEffect() {
        for (let i = 0; i < 8; i++) {
            const star = this.scene.add.star(
                this.x + Phaser.Math.Between(-20, 20),
                this.y + Phaser.Math.Between(-10, 10),
                4, 3, 7, 0xfbbf24
            );
            this.scene.tweens.add({
                targets: star,
                y:       star.y - Phaser.Math.Between(20, 50),
                x:       star.x + Phaser.Math.Between(-30, 30),
                alpha:   0,
                angle:   360,
                duration: 450,
                ease: 'Quad.easeOut',
                onComplete: () => star.destroy(),
            });
        }
        // Cyan ring flash
        const ring = this.scene.add.circle(this.x, this.y, 24, 0x00ffff, 0);
        ring.setStrokeStyle(3, 0x00ffff, 1);
        this.scene.tweens.add({
            targets: ring,
            scaleX: 3, scaleY: 3,
            alpha: 0,
            duration: 350,
            ease: 'Quad.easeOut',
            onComplete: () => ring.destroy(),
        });
    }

    private executeDash() {
        this.isDashing = true;
        this.dashCooldown = this.scene.time.now + this.DASH_COOLDOWN_MS;

        const dir = this.getFacingDirection();
        this.setVelocityX(this.DASH_SPEED * dir);
        this.setVelocityY(0);
        this.setTint(0x60a5fa);
        (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;

        EventBus.emit('player-dash', true);

        // Trail ghosts
        if (this.trailTimer) this.trailTimer.destroy();
        this.trailTimer = this.scene.time.addEvent({
            delay: 30,
            repeat: 4,
            callback: () => {
                const ghost = this.scene.add.image(this.x, this.y, 'player_placeholder')
                    .setAlpha(0.4).setFlipX(this.flipX).setTint(0x60a5fa);
                this.scene.tweens.add({
                    targets: ghost, alpha: 0, duration: 200,
                    onComplete: () => ghost.destroy(),
                });
            },
        });

        this.scene.time.delayedCall(this.DASH_DURATION_MS, () => {
            this.isDashing = false;
            (this.body as Phaser.Physics.Arcade.Body).allowGravity = true;
            this.clearTint();
            EventBus.emit('player-dash', false);
        });
    }
}
