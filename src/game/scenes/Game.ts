import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Player } from '../objects/Player';

export class Game extends Scene {
    private player!: Player;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private backgroundClouds!: Phaser.GameObjects.TileSprite;
    private triggers!: Phaser.Physics.Arcade.StaticGroup;
    private score: number = 0;
    private boss!: Phaser.Physics.Arcade.Sprite;
    private bossText!: Phaser.GameObjects.Text;
    private bossDead: boolean = false;
    private inputActive: boolean = true;

    // ── Damage / Lives system ─────────────────────────────
    private playerHP: number   = 5;          // HP within a life
    private playerMaxHP: number = 5;
    private playerLives: number = 3;          // total lives
    private invincible: boolean = false;
    private isDead: boolean     = false;      // mid-death-animation flag

    // HUD elements
    private hpSegments: Phaser.GameObjects.Rectangle[] = [];  // filled segments
    private hpSegBGs:   Phaser.GameObjects.Rectangle[] = [];  // bg segments
    private livesText!: Phaser.GameObjects.Text;
    private vignetteOverlay!: Phaser.GameObjects.Rectangle;   // full-screen red flash
    private lowHpWarningTimer: Phaser.Time.TimerEvent | null = null;
    private gameOverShowing: boolean = false;

    // ── Coins / Enemies ───────────────────────────────────
    private coins!: Phaser.Physics.Arcade.Group;
    private coinCount: number = 0;
    private coinText!: Phaser.GameObjects.Text;
    private enemies!: Phaser.Physics.Arcade.Group;

    // ── Boss ──────────────────────────────────────────────
    private bossHP: number = 5;
    private bossMaxHP: number = 5;
    private bossPhase: number = 1;
    private bossProjectiles!: Phaser.Physics.Arcade.Group;
    private bossAttackTimer!: Phaser.Time.TimerEvent;
    private bossCharging: boolean = false;
    private bossHealthBarBG!: Phaser.GameObjects.Rectangle;
    private bossHealthBarFill!: Phaser.GameObjects.Rectangle;
    private bossNameText!: Phaser.GameObjects.Text;

    // ── Attack system ─────────────────────────────────────
    private fireballs!: Phaser.Physics.Arcade.Group;
    private combo: number = 0;
    private comboTimer: Phaser.Time.TimerEvent | null = null;
    private comboText!: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    private getTimeOfDayColor(): string {
        // Get current hour (0-23)
        const hour = new Date().getHours();
        const minute = new Date().getMinutes();
        const timeInMinutes = hour * 60 + minute;
        
        // Map time to cycle (0-1)
        // 6 AM = 0 (dawn), 12 PM = 0.5 (noon), 6 PM = 1 (dusk), 12 AM = 0 (night)
        const cycleTime = (timeInMinutes % 1440) / 1440; // 1440 = 24 hours in minutes
        
        // Define colors for different times
        let color: string;
        
        if (cycleTime < 0.25) {
            // 12 AM - 6 AM: Night to Dawn (dark purple to orange)
            const t = cycleTime / 0.25;
            color = this.interpolateColor('#0a0010', '#ff6b35', t);
        } else if (cycleTime < 0.5) {
            // 6 AM - 12 PM: Dawn to Noon (orange to bright cyan)
            const t = (cycleTime - 0.25) / 0.25;
            color = this.interpolateColor('#ff6b35', '#87ceeb', t);
        } else if (cycleTime < 0.75) {
            // 12 PM - 6 PM: Noon to Dusk (bright cyan to orange)
            const t = (cycleTime - 0.5) / 0.25;
            color = this.interpolateColor('#87ceeb', '#ff6b35', t);
        } else {
            // 6 PM - 12 AM: Dusk to Night (orange to dark purple)
            const t = (cycleTime - 0.75) / 0.25;
            color = this.interpolateColor('#ff6b35', '#0a0010', t);
        }
        
        return color;
    }

    private interpolateColor(color1: string, color2: string, t: number): string {
        const c1 = Phaser.Display.Color.HexStringToColor(color1);
        const c2 = Phaser.Display.Color.HexStringToColor(color2);
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(c1, c2, 100, t * 100);
        return '#' + Phaser.Display.Color.RGBToString(c.r, c.g, c.b, 0, '#');
    }

    private generatePixelArt(key: string, palette: Record<string, number>, pixels: string[], scale: number = 4) {
        const graphics = this.add.graphics();
        pixels.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                const char = row[x];
                if (char !== '.' && palette[char] !== undefined) {
                    graphics.fillStyle(palette[char]);
                    graphics.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        });
        graphics.generateTexture(key, pixels[0].length * scale, pixels.length * scale);
        graphics.destroy();
    }

    preload() {
        // Player Sprite (12x16)
        this.generatePixelArt('player_placeholder', {
            '0': 0x000000, '1': 0x4ade80, '2': 0xffffff, '3': 0x1e1b4b, '4': 0x60a5fa
        }, [
            "....0000....",
            "...011110...",
            "..01211210..",
            "..01211210..",
            "..01111110..",
            "...011110...",
            "....0000....",
            "...044440...",
            "..04444440..",
            ".0040440400.",
            ".0304444030.",
            "..0.0000.0..",
            "....0..0....",
            "...00..00...",
            "...00..00...",
            "............"
        ], 3);

        // Ground Block (16x16)
        this.generatePixelArt('ground_placeholder', {
            '0': 0x000000, '1': 0x4ade80, '2': 0x22c55e, '3': 0x8b4513, '4': 0xa0522d
        }, [
            "0000000000000000",
            "0111111111111110",
            "0122212221222120",
            "0111111111111110",
            "0000000000000000",
            "0344434443444340",
            "0433343334333430",
            "0344434443444340",
            "0433343334333430",
            "0344434443444340",
            "0433343334333430",
            "0344434443444340",
            "0433343334333430",
            "0344434443444340",
            "0433343334333430",
            "0000000000000000"
        ], 4);

        // Q-Block (16x16)
        this.generatePixelArt('qblock_placeholder', {
            '0': 0x000000, '1': 0xfacc15, '2': 0xc2410c, '3': 0xffffff
        }, [
            "0000000000000000",
            "0111111111111110",
            "0122222222222210",
            "0121111111111210",
            "0121000000001210",
            "0121033333301210",
            "0121033003301210",
            "0121000003301210",
            "0121000033001210",
            "0121000330001210",
            "0121000330001210",
            "0121000000001210",
            "0121000330001210",
            "0121000000001210",
            "0122222222222210",
            "0000000000000000"
        ], 4);

        // Pipe (16x16 - scales up)
        this.generatePixelArt('pipe_placeholder', {
            '0': 0x000000, '1': 0x22c55e, '2': 0x16a34a, '3': 0x4ade80
        }, [
            "0000000000000000",
            "0111113111111110",
            "0222221222222220",
            "0111113111111110",
            "0000000000000000",
            ".01111311111110.",
            ".02222122222220.",
            ".01111311111110.",
            ".02222122222220.",
            ".01111311111110.",
            ".02222122222220.",
            ".01111311111110.",
            ".02222122222220.",
            ".01111311111110.",
            ".02222122222220.",
            ".01111311111110."
        ], 4);

        // Cloud (32x24 for more spacing)
        this.generatePixelArt('cloud_placeholder', {
            '0': 0xffffff, '1': 0xe0e7ff
        }, [
            "................................",
            "................................",
            "..............000...............",
            ".............00000..............",
            "............0001000.............",
            "..........00001110000...........",
            ".........0000111110000..........",
            "........001111111111000.........",
            "........0111111111111100........",
            "........0111111111111110........",
            ".........01111111111110.........",
            "..........000000000000..........",
            "................................",
            "................................",
            "................................"
        ], 8);

        // Boss Sprite: THE GLITCH OVERLORD
        this.generatePixelArt('boss_placeholder', {
            '0': 0x000000, '1': 0x06b6d4, '2': 0x8b5cf6, '3': 0xef4444, '4': 0xffffff
        }, [
            "....00000000....",
            "...0111111110...",
            "..012222222210..",
            ".01244111144210.",
            ".01244111144210.",
            "011222222222110.",
            "011111111111110.",
            "011111111111110.",
            ".0333333333330..",
            "..03333333330...",
            "...000000000....",
            "....03.0.30.....",
            "....0..0..0.....",
            "................",
            "................",
            "................"
        ], 12);

        // Coin (8x8)
        this.generatePixelArt('coin', {
            '0': 0x000000, '1': 0xfacc15, '2': 0xfef08a, '3': 0xca8a04
        }, [
            "..0000..",
            ".013310.",
            "01233210",
            "01233210",
            "01233210",
            "01233210",
            ".013310.",
            "..0000.."
        ], 4);

        // Enemy Goomba-like (12x12)
        this.generatePixelArt('enemy', {
            '0': 0x000000, '1': 0xef4444, '2': 0xffffff, '3': 0x991b1b
        }, [
            "....0000....",
            "...011110...",
            "..01111110..",
            ".0113111310.",
            ".0112011200.",
            "..01111110..",
            "...011110...",
            "..03333330..",
            ".0333333300.",
            ".0300000030.",
            "..00....00..",
            "............"
        ], 4);

        // Boss projectile (6x6)
        this.generatePixelArt('boss_projectile', {
            '0': 0x000000, '1': 0x8b5cf6, '2': 0xc084fc
        }, [
            ".0000.",
            "012210",
            "012110",
            "011210",
            "012210",
            ".0000."
        ], 6);

        // Player Fireball (8x8)
        this.generatePixelArt('fireball', {
            '0': 0x000000, '1': 0xff4400, '2': 0xffaa00, '3': 0xffff88
        }, [
            "..0000..",
            ".011110.",
            "01233210",
            "01233310",
            "01333210",
            "01233110",
            ".011110.",
            "..0000.."
        ], 4);
    }

    create() {
        // World setup
        const worldWidth = 6000;
        const worldHeight = 768;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Input management for Modals
        EventBus.on('modal-active', (active: boolean) => {
            this.inputActive = !active;
            if (this.input.keyboard) {
                this.input.keyboard.enabled = !active;
            }
        });

        // Background (Parallax) with gradient effect
        this.cameras.main.setBackgroundColor(this.getTimeOfDayColor()); // Dynamic color based on time

        // Add clouds with better parallax
        this.backgroundClouds = this.add.tileSprite(0, 100, worldWidth, 400, 'cloud_placeholder')
            .setOrigin(0, 0)
            .setScrollFactor(0.15)
            .setAlpha(0.7);
        
        // Add stars for atmosphere
        for (let i = 0; i < 50; i++) {
            const starX = Math.random() * worldWidth;
            const starY = Math.random() * 300;
            const starSize = Math.random() * 2 + 1;
            this.add.rectangle(starX, starY, starSize, starSize, 0xffffff)
                .setScrollFactor(0.1)
                .setAlpha(Math.random() * 0.6 + 0.3);
        }

        // Build World Layers
        this.platforms      = this.physics.add.staticGroup();
        this.triggers       = this.physics.add.staticGroup();
        this.coins          = this.physics.add.group();
        this.enemies        = this.physics.add.group();
        this.bossProjectiles= this.physics.add.group();
        this.fireballs      = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            runChildUpdate: false,
        });

        // 1. Ground floor stretching across entire level
        const groundY = worldHeight - 32;
        for (let x = 0; x < worldWidth; x += 64) {
            this.platforms.create(x + 32, groundY, 'ground_placeholder');
        }

        // Setup the Player
        this.player = new Player(this, 100, groundY - 100, 'player_placeholder');

        // Follow player camera with smooth lerp
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setZoom(1.15);

        // Setup collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.coins,   this.platforms);

        // Fireballs hit platforms (destroy)
        this.physics.add.collider(this.fireballs, this.platforms, (fb: any) => {
            this.spawnImpactPuff(fb.x, fb.y, 0xff6600);
            fb.destroy();
        });

        // Fireballs hit enemies
        this.physics.add.overlap(this.fireballs, this.enemies, (fb: any, enemy: any) => {
            this.spawnImpactPuff(enemy.x, enemy.y, 0xff4400);
            fb.destroy();
            enemy.destroy();
            this.registerKill(enemy.x, enemy.y, 150);
        }, undefined, this);



        // Setup triggers
        this.physics.add.overlap(this.player, this.triggers, this.handleTrigger, undefined, this);

        // Coin collection
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this);

        // Enemy collision
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this);

        // Boss projectile collision
        this.physics.add.overlap(this.player, this.bossProjectiles, this.hitProjectile, undefined, this);

        // Create the zones
        this.buildZones();

        // HUD (Fixed to camera)
        this.createHUD();

        EventBus.emit('current-scene-ready', this);
    }

    createHUD() {
        const W = this.cameras.main.width;

        // ── Full-screen red vignette overlay (starts invisible) ─────────────
        this.vignetteOverlay = this.add.rectangle(W / 2, this.cameras.main.height / 2,
            W, this.cameras.main.height, 0xff0000, 0)
            .setScrollFactor(0).setDepth(200).setInteractive(false);

        // ── HP Bar (top-left) ───────────────────────────────────────────────
        const segW = 28, segH = 14, segGap = 4;
        const barX = 18, barY = 18;
        this.add.text(barX, barY, 'HP', {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#aaaaaa'
        }).setScrollFactor(0).setDepth(101);

        for (let i = 0; i < this.playerMaxHP; i++) {
            const sx = barX + 26 + i * (segW + segGap);
            // Background slot
            const bg = this.add.rectangle(sx, barY + 6, segW, segH, 0x330000)
                .setOrigin(0, 0.5).setScrollFactor(0).setDepth(101)
                .setStrokeStyle(1, 0x660000);
            // Filled segment
            const seg = this.add.rectangle(sx + 2, barY + 6, segW - 4, segH - 4, 0xff3333)
                .setOrigin(0, 0.5).setScrollFactor(0).setDepth(102);
            this.hpSegBGs.push(bg);
            this.hpSegments.push(seg);
        }

        // ── Lives counter ────────────────────────────────────────────────────
        this.livesText = this.add.text(barX, barY + 22, `♥ x${this.playerLives}`, {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ff6666'
        }).setScrollFactor(0).setDepth(101);

        // ── Coin counter ─────────────────────────────────────────────────────
        this.coinText = this.add.text(barX, barY + 40, '🪙 x0', {
            fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#facc15'
        }).setScrollFactor(0).setDepth(101);

        // ── Combo counter ─────────────────────────────────────────────────────
        this.comboText = this.add.text(W / 2, 70, '', {
            fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ff6600',
            stroke: '#000', strokeThickness: 4,
        }).setScrollFactor(0).setDepth(101).setOrigin(0.5);

        // ── Control hint (fades after 5 s) ────────────────────────────────────
        const hint = this.add.text(W / 2, 4,
            '← → MOVE  |  SPACE JUMP  |  SHIFT DASH  |  F FIRE',
            { fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#888888' }
        ).setScrollFactor(0).setDepth(101).setOrigin(0.5);
        this.time.delayedCall(5000, () =>
            this.tweens.add({ targets: hint, alpha: 0, duration: 800, onComplete: () => hint.destroy() })
        );
    }

    updateHUD() {
        // HP segments — filled = green→yellow→red based on HP ratio
        const ratio = this.playerHP / this.playerMaxHP;
        const segColor = ratio > 0.6 ? 0x33ee44 : ratio > 0.3 ? 0xffd000 : 0xff2222;
        for (let i = 0; i < this.hpSegments.length; i++) {
            this.hpSegments[i].setFillStyle(i < this.playerHP ? segColor : 0x220000);
        }
        // Lives
        if (this.livesText) this.livesText.setText(`♥ x${this.playerLives}`);
        // Coins
        if (this.coinText) this.coinText.setText('🪙 x' + this.coinCount);

        // Low-HP pulse warning on the bar when 1 HP left
        if (this.playerHP <= 1 && !this.isDead) {
            this.startLowHpWarning();
        } else {
            this.stopLowHpWarning();
        }
    }

    collectCoin(_player: any, coin: any) {
        coin.destroy();
        this.coinCount++;
        this.score += 50;
        EventBus.emit('update-score', this.score);
        EventBus.emit('update-coins', this.coinCount);
        this.updateHUD();

        // Coin pop particles
        this.tweens.add({
            targets: this.add.text(coin.x, coin.y, '+50', {
                fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#facc15'
            }).setOrigin(0.5),
            y: coin.y - 50,
            alpha: 0,
            duration: 600,
            onComplete: (_tween: any, targets: any[]) => { targets[0].destroy(); }
        });
    }

    hitEnemy(_player: any, enemy: any) {
        // Dash = immune window
        if (this.invincible) return;

        // Stomp from above — kill enemy, bounce player
        if (this.player.body!.velocity.y > 0 && this.player.y < enemy.y - 10) {
            this.spawnImpactPuff(enemy.x, enemy.y, 0xff4400);
            enemy.destroy();
            this.player.setVelocityY(-480);  // satisfying bounce
            this.registerKill(enemy.x, enemy.y, 200);
            this.cameras.main.shake(100, 0.008);
        } else {
            // Side/bottom collision — take 1 damage
            this.takeDamage(1, enemy);
        }
    }

    hitProjectile(_player: any, projectile: any) {
        if (this.invincible) return;
        projectile.destroy();
        // Boss projectiles deal 2 damage
        this.takeDamage(2, null);
    }

    // ═══════════════════════════════════════════════════════
    //   DAMAGE SYSTEM — full remake
    // ═══════════════════════════════════════════════════════

    /**
     * @param amount   HP to remove (1 = normal, 2 = heavy)
     * @param source   The enemy/object that caused damage (for knockback direction)
     */
    takeDamage(amount: number = 1, source: any) {
        if (this.invincible || this.isDead || this.gameOverShowing) return;

        this.invincible = true;
        this.playerHP   = Math.max(0, this.playerHP - amount);
        this.updateHUD();
        EventBus.emit('update-hp', this.playerHP);

        // ── 1. Screen vignette flash ─────────────────────────────────
        this.vignetteOverlay.setAlpha(amount >= 2 ? 0.55 : 0.35);
        this.tweens.add({
            targets: this.vignetteOverlay,
            alpha: 0,
            duration: 600,
            ease: 'Quad.easeOut',
        });

        // ── 2. Camera shake (heavier for 2-damage hits) ──────────────
        this.cameras.main.shake(amount >= 2 ? 400 : 220, amount >= 2 ? 0.025 : 0.012);

        // ── 3. Knockback away from source ────────────────────────────
        const knockXDir = source
            ? (this.player.x < source.x ? -1 : 1)   // away from enemy
            : (this.player.flipX ? 1 : -1);           // away from facing dir (projectile)
        const knockPower = amount >= 2 ? 380 : 260;
        this.player.setVelocity(knockXDir * knockPower, -320);

        // ── 4. Player flash (red blink iframes) ──────────────────────
        this.player.setTint(0xff2222);
        let flashCount = 0;
        const IFRAMES = amount >= 2 ? 26 : 18;   // longer iframes for heavy hits
        const flashTimer = this.time.addEvent({
            delay: 70,
            loop: true,
            callback: () => {
                flashCount++;
                if (flashCount % 2 === 0) { this.player.setAlpha(1); this.player.clearTint(); }
                else                      { this.player.setAlpha(0.4); this.player.setTint(0xff2222); }
                if (flashCount >= IFRAMES) {
                    flashTimer.destroy();
                    this.player.setAlpha(1);
                    this.player.clearTint();
                    this.invincible = false;
                }
            },
        });

        // ── 5. Damage number popup ───────────────────────────────────
        const dmgLabel = this.add.text(this.player.x, this.player.y - 30,
            `-${amount} HP`, {
                fontFamily: '"Press Start 2P"',
                fontSize: amount >= 2 ? '14px' : '11px',
                color: amount >= 2 ? '#ff2222' : '#ff8888',
                stroke: '#000', strokeThickness: 3,
            }
        ).setOrigin(0.5).setDepth(150);
        this.tweens.add({
            targets: dmgLabel, y: dmgLabel.y - 55, alpha: 0,
            duration: 900, ease: 'Quad.easeOut',
            onComplete: () => dmgLabel.destroy(),
        });

        // ── 6. Death check ───────────────────────────────────────────
        if (this.playerHP <= 0) {
            this.handleDeath();
        }
    }

    handleDeath() {
        if (this.isDead) return;
        this.isDead    = true;
        this.invincible = true;
        this.playerLives--;

        // Freeze all input
        this.inputActive = false;
        if (this.input.keyboard) this.input.keyboard.enabled = false;

        // ── Death animation: spin + fall ─────────────────────────────
        (this.player.body as Phaser.Physics.Arcade.Body).allowGravity = true;
        this.player.setVelocity(0, -200);
        this.tweens.add({
            targets: this.player,
            angle:   720,
            alpha:   0,
            y:       this.player.y + 300,
            duration: 1100,
            ease: 'Quad.easeIn',
        });

        // ── Big red flash then decide: respawn or game over ──────────
        this.cameras.main.flash(300, 255, 30, 30);
        this.cameras.main.shake(400, 0.03);

        this.time.delayedCall(1400, () => {
            if (this.playerLives <= 0) {
                this.showGameOver();
            } else {
                this.respawnPlayer();
            }
        });
    }

    respawnPlayer() {
        // Restore HP for new life
        this.playerHP  = this.playerMaxHP;
        this.isDead    = false;
        this.invincible = false;
        this.updateHUD();
        EventBus.emit('update-hp', this.playerHP);

        // Reset player
        this.player.setAngle(0).setAlpha(1);
        this.player.setPosition(100, 550);
        this.player.setVelocity(0, 0);
        (this.player.body as Phaser.Physics.Arcade.Body).allowGravity = true;

        // Re-enable input
        this.inputActive = true;
        if (this.input.keyboard) this.input.keyboard.enabled = true;

        // Spawn-in flash
        this.cameras.main.flash(500, 50, 255, 80);

        // Brief immortality after respawn
        this.invincible = true;
        this.time.delayedCall(1500, () => { this.invincible = false; });

        // RESPAWN text
        const W = this.cameras.main.width;
        const respawnLabel = this.add.text(W / 2, this.cameras.main.height / 2 - 40,
            `RESPAWN!\n♥ x${this.playerLives} LIVES LEFT`, {
                fontFamily: '"Press Start 2P"', fontSize: '20px',
                color: '#4ade80', stroke: '#000', strokeThickness: 4,
                align: 'center',
            }
        ).setScrollFactor(0).setDepth(201).setOrigin(0.5);
        this.tweens.add({
            targets: respawnLabel, alpha: 0, delay: 1800, duration: 600,
            onComplete: () => respawnLabel.destroy(),
        });
    }

    showGameOver() {
        this.gameOverShowing = true;
        this.inputActive     = false;
        if (this.input.keyboard) this.input.keyboard.enabled = false;

        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        // Dark overlay
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
            .setScrollFactor(0).setDepth(300);
        this.tweens.add({ targets: overlay, alpha: 0.85, from: 0, duration: 600 });

        // GAME OVER text
        const goText = this.add.text(W / 2, H / 2 - 80, 'GAME OVER', {
            fontFamily: '"Press Start 2P"', fontSize: '36px',
            color: '#ff2222', stroke: '#000', strokeThickness: 6,
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: goText, alpha: 1, y: H / 2 - 90, duration: 700, ease: 'Back.easeOut' });

        // Pulse
        this.tweens.add({ targets: goText, scaleX: 1.05, scaleY: 1.05, yoyo: true, repeat: -1, duration: 600, delay: 700 });

        // Score
        this.add.text(W / 2, H / 2 - 20, `SCORE: ${String(this.score).padStart(7, '0')}`, {
            fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#facc15',
            stroke: '#000', strokeThickness: 3,
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);

        // Coins
        this.add.text(W / 2, H / 2 + 10, `COINS: ${this.coinCount}`, {
            fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#fbbf24',
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);

        // Retry button
        const retryBtn = this.add.text(W / 2, H / 2 + 55, '[ PRESS R TO RETRY ]', {
            fontFamily: '"Press Start 2P"', fontSize: '13px',
            color: '#4ade80', stroke: '#000', strokeThickness: 3,
            backgroundColor: '#1a1a1a', padding: { x: 14, y: 8 },
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.tweens.add({ targets: retryBtn, alpha: 0.4, yoyo: true, repeat: -1, duration: 500 });

        const restart = () => {
            this.scene.restart();
            EventBus.emit('update-score', 0);
            EventBus.emit('update-coins', 0);
            EventBus.emit('update-hp', 5);
        };
        retryBtn.on('pointerdown', restart);
        if (this.input.keyboard) {
            this.input.keyboard.enabled = true;
            this.input.keyboard.once('keydown-R', restart);
        }
    }

    // ── Low-HP pulsing warning ────────────────────────────────────────────
    startLowHpWarning() {
        if (this.lowHpWarningTimer) return;
        this.lowHpWarningTimer = this.time.addEvent({
            delay: 500, loop: true,
            callback: () => {
                this.tweens.add({
                    targets: this.vignetteOverlay,
                    alpha: 0.18,
                    yoyo: true,
                    duration: 250,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        if (this.vignetteOverlay.alpha < 0.1) this.vignetteOverlay.setAlpha(0);
                    },
                });
            },
        });
    }

    stopLowHpWarning() {
        if (this.lowHpWarningTimer) {
            this.lowHpWarningTimer.destroy();
            this.lowHpWarningTimer = null;
        }
    }

    spawnEnemy(x: number, patrolLeft: number, patrolRight: number) {
        const enemy = this.enemies.create(x, 680, 'enemy') as Phaser.Physics.Arcade.Sprite;
        enemy.setBounce(0);
        enemy.setCollideWorldBounds(true);
        (enemy.body as Phaser.Physics.Arcade.Body).setSize(40, 40);
        enemy.setVelocityX(80);

        // Patrol logic
        enemy.setData('patrolLeft', patrolLeft);
        enemy.setData('patrolRight', patrolRight);
    }

    spawnCoins(startX: number, startY: number, count: number, arcHeight: number = 0) {
        for (let i = 0; i < count; i++) {
            const coinX = startX + i * 50;
            const coinY = startY - (arcHeight > 0 ? Math.sin((i / (count - 1)) * Math.PI) * arcHeight : 0);
            const coin = this.coins.create(coinX, coinY, 'coin') as Phaser.Physics.Arcade.Sprite;
            coin.setBounceY(0.3);
            (coin.body as Phaser.Physics.Arcade.Body).allowGravity = false;

            // Floating animation
            this.tweens.add({
                targets: coin,
                y: coin.y - 8,
                yoyo: true,
                repeat: -1,
                duration: 400 + Math.random() * 300,
                ease: 'Sine.easeInOut'
            });
        }
    }

    handleTrigger(player: any, trigger: any) {
        if (!trigger.active) return;

        const type = trigger.getData('type');
        const modalId = trigger.getData('modalId');
        const title = trigger.getData('title') || 'INFO';
        const content = trigger.getData('content');

        // Key checks
        const cursors = this.player.getCursors();
        const downPressed = cursors.down.isDown || this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S).isDown || this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN).isDown;

        // Throttle
        const now = this.time.now;
        if (trigger.lastTriggerTime && now - trigger.lastTriggerTime < 2000) {
            return;
        }

        if (type === 'qblock') {
            if (player.body.velocity.y < 0 && player.body.y > trigger.y) {
                trigger.lastTriggerTime = now;
                this.tweens.add({
                    targets: trigger,
                    y: trigger.y - 10,
                    yoyo: true,
                    duration: 100,
                    onComplete: () => {
                        trigger.setTint(0xcccccc);
                        EventBus.emit('open-modal', { id: modalId, title, content });
                        this.score += 100;
                        EventBus.emit('update-score', this.score);
                        trigger.disableBody(true, false);
                    }
                });
            }
        }
        else if (type === 'trackblock') {
            if (downPressed) {
                trigger.lastTriggerTime = now;
                trigger.disableBody(true, false);
                EventBus.emit('open-modal', { id: modalId, title, content });
                this.score += 100;
                EventBus.emit('update-score', this.score);
            }
        }
        else if (type === 'pipe') {
            if (downPressed) {
                trigger.lastTriggerTime = now;
                EventBus.emit('open-modal', { id: modalId, title, content });
                player.setPosition(player.x, player.y - 100);
            }
        }
        else if (type === 'schedule') {
            if (downPressed) {
                trigger.lastTriggerTime = now;
                EventBus.emit('open-modal', { id: modalId, title, content });
            }
        }
        else if (type === 'castle') {
            trigger.lastTriggerTime = now;
            EventBus.emit('open-modal', { id: 'credits', title: 'GAME COMPLETED', content: 'You defeated the final bug! The journey into Quantum Mesh begins here.' });
            EventBus.emit('level-complete');
        }
    }

    buildZones() {
        const groundY = 768 - 32;

        // ── START ZONE (0 – 800) ──────────────────────────────
        this.add.text(400, 220, '⚔️ CODE QUEST ⚔️', {
            fontFamily: '"Press Start 2P"', fontSize: '28px', color: '#c084fc', align: 'center'
        }).setOrigin(0.5);
        this.add.text(400, 275, '← → MOVE  |  SPACE JUMP  |  SHIFT DASH', {
            fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#60a5fa', align: 'center'
        }).setOrigin(0.5);
        this.add.text(400, 305, 'F KEY = SHOOT FIREBALL  |  JUMP×2 = DOUBLE JUMP', {
            fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#4ade80', align: 'center'
        }).setOrigin(0.5);
        this.add.text(400, 340, 'STOMP ENEMIES FROM ABOVE OR SHOOT THEM!', {
            fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#fbbf24', align: 'center'
        }).setOrigin(0.5);

        // Starter coins + a starter enemy to show off combat
        this.spawnCoins(200, groundY - 80, 5);
        this.spawnEnemy(600, 500, 750);

        // ====== Zone 1: About (1000 - 2000) ======
        this.add.text(1200, 280, '🏰 ZONE 1: THE ANCIENT HALLS 🏰', {
            fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#4ade80', align: 'center'
        }).setOrigin(0.5);
        // Action instruction sign
        this.add.text(1200, 320, '[ JUMP \u2191 HIT ? BLOCKS FROM BELOW ]', {
            fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#fbbf24',
            backgroundColor: '#fef08a', padding: { x: 8, y: 4 }, align: 'center'
        }).setOrigin(0.5);

        const aboutContent = [
            "CodeQuest is the ultimate hackathon. Build the future.",
            "Theme: Innovate to Elevate. Create solutions that matter.",
            "Everyone is welcome. Students, pros, and creatives."
        ];

        for (let i = 0; i < 3; i++) {
            const block = this.platforms.create(1100 + (i * 150), 550, 'qblock_placeholder');
            const trigger = this.triggers.create(block.x, block.y + 16, 'qblock_placeholder');
            trigger.setVisible(false);
            trigger.setData('type', 'qblock');
            trigger.setData('modalId', 'about-' + i);
            trigger.setData('title', 'ABOUT');
            trigger.setData('content', aboutContent[i]);

            // Coins ABOVE each Q-block
            this.spawnCoins(block.x - 25, block.y - 80, 2);

            // Small arrow hint on FIRST block only
            if (i === 0) {
                const hint = this.add.text(block.x, block.y + 50, '\u2191 JUMP', {
                    fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ef4444',
                    align: 'center'
                }).setOrigin(0.5);
                this.tweens.add({ targets: hint, y: hint.y - 6, yoyo: true, repeat: -1, duration: 600 });
            }
        }

        // Zone 1 enemies
        this.spawnEnemy(1400, 1300, 1500);
        this.spawnEnemy(1700, 1600, 1900);

        // Elevated platforms with coins on top
        this.platforms.create(1800, 550, 'ground_placeholder');
        this.platforms.create(1864, 550, 'ground_placeholder');
        this.spawnCoins(1780, 480, 3);

        // ====== Zone 2: Schedule (2200 - 3200) ======
        this.add.text(2500, 280, '🌙 ZONE 2: THE SHADOW PIPES 🌙', {
            fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#4ade80', align: 'center'
        }).setOrigin(0.5);
        // Action instruction sign
        this.add.text(2500, 320, '[ PRESS \u2193 ON PIPES TO READ ]', {
            fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#fbbf24',
            backgroundColor: '#1a0033', padding: { x: 8, y: 4 }, align: 'center'
        }).setOrigin(0.5);

        const scheduleContent = ['Registration', 'Opening Ceremony', 'Hacking Time', 'Judging', 'Demo Day'];
        for (let i = 0; i < 5; i++) {
            const pipeX = 2300 + (i * 200);
            const height = i < 3 ? i : 4 - i;
            const pipeY = (768 - 64) - (height * 64);

            for (let j = 0; j <= height; j++) {
                this.platforms.create(pipeX, (768 - 64) - (j * 64), 'pipe_placeholder');
            }

            const trigger = this.triggers.create(pipeX, pipeY - 64, 'qblock_placeholder');
            trigger.setVisible(false);
            trigger.setData('type', 'pipe');
            trigger.setData('modalId', 'schedule-' + i);
            trigger.setData('title', 'SCHEDULE');
            trigger.setData('content', scheduleContent[i]);

            // Coins ABOVE each pipe
            this.spawnCoins(pipeX - 25, pipeY - 120, 2);

            // Small arrow hint on FIRST pipe only
            if (i === 0) {
                const hint = this.add.text(pipeX, pipeY - 40, '\u2193 PRESS', {
                    fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ef4444',
                    align: 'center'
                }).setOrigin(0.5);
                this.tweens.add({ targets: hint, y: hint.y - 6, yoyo: true, repeat: -1, duration: 600 });
            }
        }

        // Zone 2 enemies (between pipes)
        this.spawnEnemy(2450, 2350, 2550);
        this.spawnEnemy(2850, 2750, 2950);

        // ====== Zone 3: Tracks (3500 - 4500) ======
        this.add.text(4000, 180, '✨ ZONE 3: THE CRYSTAL REALM ✨', {
            fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#4ade80', align: 'center'
        }).setOrigin(0.5);
        // Action instruction sign
        this.add.text(4000, 220, '[ PRESS \u2193 ON PLATFORMS TO READ ]', {
            fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#fbbf24',
            backgroundColor: '#1a0033', padding: { x: 8, y: 4 }, align: 'center'
        }).setOrigin(0.5);

        const tracksContent = ['🤖 AI Track', '🌐 Web Track', '🌱 Sustainability', '🚀 Open Innovation'];

        const wPoints = [
            { x: 3600, y: 500, contentIdx: 0 },
            { x: 3800, y: 650, contentIdx: 1 },
            { x: 4000, y: 500, contentIdx: 2 },
            { x: 4200, y: 650, contentIdx: 3 },
            { x: 4400, y: 500, contentIdx: 0 }
        ];

        wPoints.forEach((p, i) => {
            const platform = this.platforms.create(p.x, p.y, 'ground_placeholder');
            platform.setScale(1.5);
            platform.refreshBody();

            const trigger = this.triggers.create(p.x, p.y, 'qblock_placeholder');
            trigger.setScale(2.5);
            trigger.refreshBody();
            trigger.setVisible(false);
            trigger.setData('type', 'trackblock');
            trigger.setData('modalId', 'track-' + i);
            trigger.setData('title', 'HACKATHON TRACK');
            trigger.setData('content', tracksContent[p.contentIdx] || tracksContent[0]);

            // Coins ABOVE each W-platform
            this.spawnCoins(p.x - 25, p.y - 100, 3);

            // Small arrow hint on FIRST platform only
            if (i === 0) {
                const hint = this.add.text(p.x, p.y - 40, '\u2193 PRESS', {
                    fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ef4444',
                    align: 'center'
                }).setOrigin(0.5);
                this.tweens.add({ targets: hint, y: hint.y - 6, yoyo: true, repeat: -1, duration: 600 });
            }
        });

        // Zone 3 enemies
        this.spawnEnemy(3700, 3600, 3800);
        this.spawnEnemy(4100, 4000, 4250);
        this.spawnEnemy(4350, 4250, 4450);

        // ====== Boss Arena (4800+) ======
        this.buildBossArena();
    }

    buildBossArena() {
        // Warning sign
        this.add.text(4650, 350, '⚡ BEWARE ⚡\nTHE GLITCH OVERLORD', {
            fontFamily: '"Press Start 2P"', fontSize: '16px', color: '#c084fc', align: 'center'
        }).setOrigin(0.5);

        // Boss arena platforms
        const bossArenaY = 550;
        const platforms = [
            { x: 4900, y: bossArenaY },
            { x: 4964, y: bossArenaY },
            { x: 5100, y: bossArenaY - 100 },
            { x: 5164, y: bossArenaY - 100 },
            { x: 5250, y: bossArenaY },
            { x: 5314, y: bossArenaY }
        ];

        platforms.forEach(p => {
            const platform = this.platforms.create(p.x, p.y, 'ground_placeholder');
            platform.setTint(0x444444); // Dark gray
        });

        // Boss Name (above arena, fixed to world)
        this.bossNameText = this.add.text(5075, 250, 'THE GLITCH OVERLORD', {
            fontFamily: '"Press Start 2P"', fontSize: '16px', color: '#06b6d4', align: 'center'
        }).setOrigin(0.5);
        this.bossNameText.setVisible(false);

        // Boss Text
        this.bossText = this.add.text(5075, 280, 'PRESS F TO ATTACK!', {
            fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#fbbf24', align: 'center'
        }).setOrigin(0.5);
        this.bossText.setVisible(false);

        // Boss Health Bar
        this.bossHealthBarBG = this.add.rectangle(5075, 310, 300, 20, 0x333333).setStrokeStyle(2, 0xffffff);
        this.bossHealthBarFill = this.add.rectangle(5075, 310, 296, 16, 0x8b5cf6);
        this.bossHealthBarBG.setVisible(false);
        this.bossHealthBarFill.setVisible(false);

        // Boss Sprite
        this.boss = this.physics.add.sprite(5200, 350, 'boss_placeholder');
        (this.boss.body as Phaser.Physics.Arcade.Body).allowGravity = false;
        this.boss.setImmovable(true);
        this.physics.add.collider(this.player, this.boss, () => {
            if (!this.bossDead && !this.invincible) {
                // Boss body touch = heavy 2-HP hit
                this.takeDamage(2, this.boss);
            }
        });
        this.boss.setVisible(false);
        (this.boss.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;

        // Fireballs hit boss (MUST be added here, after boss is instantiated)
        this.physics.add.overlap(this.fireballs, this.boss, (fb: any) => {
            if (!this.bossDead && this.boss.active && this.boss.getData('fightStarted')) {
                fb.destroy();
                this.damageBoss();
                this.registerKill(this.boss.x, this.boss.y, 0);
            }
        }, undefined, this);
    }

    startBossFight() {
        if (this.boss.getData('fightStarted')) return;
        this.boss.setData('fightStarted', true);
        this.boss.setVisible(true);
        (this.boss.body as Phaser.Physics.Arcade.Body).checkCollision.none = false;
        this.bossNameText.setVisible(true);
        this.bossText.setVisible(true);
        this.bossHealthBarBG.setVisible(true);
        this.bossHealthBarFill.setVisible(true);

        // Camera zoom for drama
        this.cameras.main.setZoom(1.0);
        this.cameras.main.flash(400, 150, 50, 200);
        this.cameras.main.shake(300, 0.015);

        // Boss entrance animation
        this.tweens.add({
            targets: this.boss,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 300,
            yoyo: true,
            ease: 'Back.easeOut'
        });

        // Boss idle float
        this.tweens.add({
            targets: this.boss,
            y: this.boss.y - 50,
            yoyo: true,
            repeat: -1,
            duration: 1800,
            ease: 'Sine.easeInOut'
        });

        // Start attack pattern
        this.bossAttackCycle();
    }

    bossAttackCycle() {
        if (this.bossDead) return;

        const attackDelay = this.bossPhase === 1 ? 2500 : 1500;

        this.bossAttackTimer = this.time.addEvent({
            delay: attackDelay,
            callback: () => {
                if (this.bossDead) return;

                const attacks = this.bossPhase === 1
                    ? ['shoot']
                    : ['shoot', 'shoot', 'charge'];
                const attack = attacks[Math.floor(Math.random() * attacks.length)];

                if (attack === 'shoot') {
                    this.bossShoot();
                } else if (attack === 'charge') {
                    this.bossCharge();
                }
            },
            loop: true
        });
    }

    bossShoot() {
        if (this.bossDead || !this.boss || !this.boss.active) return;

        // Flash boss before shooting
        this.boss.setTint(0xff00ff);
        this.time.delayedCall(200, () => {
            if (this.bossDead || !this.boss || !this.boss.active) return;
            this.boss.clearTint();

            // Fire 3 projectiles in spread pattern
            const angles = this.bossPhase === 1 ? [-10, 0, 10] : [-20, -10, 0, 10, 20];
            angles.forEach(angle => {
                const proj = this.bossProjectiles.create(this.boss.x - 30, this.boss.y, 'boss_projectile') as Phaser.Physics.Arcade.Sprite;
                (proj.body as Phaser.Physics.Arcade.Body).allowGravity = false;
                const speed = this.bossPhase === 1 ? 250 : 350;
                const rad = Phaser.Math.DegToRad(180 + angle);
                proj.setVelocity(Math.cos(rad) * speed, Math.sin(rad) * speed);

                // Spin projectile
                this.tweens.add({
                    targets: proj,
                    angle: 360,
                    repeat: -1,
                    duration: 500
                });

                // Auto-destroy after 3 seconds
                this.time.delayedCall(3000, () => { if (proj.active) proj.destroy(); });
            });
        });
    }

    bossCharge() {
        if (this.bossDead || this.bossCharging || !this.boss || !this.boss.active) return;
        this.bossCharging = true;

        // Warning telegraph
        this.boss.setTint(0xff0000);
        this.bossText.setText('INCOMING!');

        this.time.delayedCall(800, () => {
            if (this.bossDead || !this.boss || !this.boss.active) return;

            const targetX = this.player.x;

            // Charge towards player
            this.tweens.add({
                targets: this.boss,
                x: targetX,
                duration: 600,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    if (this.bossDead || !this.boss || !this.boss.active) return;
                    // Slam effect
                    this.cameras.main.shake(300, 0.02);

                    // Return to original position
                    this.tweens.add({
                        targets: this.boss,
                        x: 5200,
                        duration: 1000,
                        ease: 'Quad.easeOut',
                        onComplete: () => {
                            if (!this.boss || !this.boss.active) return;
                            this.boss.clearTint();
                            if (this.bossText && this.bossText.active) {
                                this.bossText.setText('PRESS F TO ATTACK!');
                            }
                            this.bossCharging = false;
                        }
                    });
                }
            });
        });
    }

    damageBoss() {
        if (this.bossDead) return;

        this.bossHP--;

        // Update health bar with smooth animation
        const hpPercent = this.bossHP / this.bossMaxHP;
        this.tweens.add({
            targets: this.bossHealthBarFill,
            scaleX: hpPercent,
            duration: 300,
            ease: 'Quad.easeOut'
        });

        // Change bar color based on HP
        if (hpPercent <= 0.3) {
            this.bossHealthBarFill.setFillStyle(0xff6b6b); // Red
        } else if (hpPercent <= 0.6) {
            this.bossHealthBarFill.setFillStyle(0xfbbf24); // Yellow
        }

        // Flash boss white on hit with scale
        this.boss.setTint(0xffffff);
        this.tweens.add({
            targets: this.boss,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 100,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
        this.time.delayedCall(150, () => { if (this.boss && this.boss.active && !this.bossDead) this.boss.clearTint(); });

        // Feedback text with scale
        const dmgText = this.add.text(this.boss.x, this.boss.y - 60, 'HIT!', {
            fontFamily: '"Press Start 2P"', fontSize: '18px', color: '#ff6b6b'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: dmgText,
            y: dmgText.y - 50,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 600,
            ease: 'Quad.easeOut',
            onComplete: () => { dmgText.destroy(); }
        });

        // Screen shake on hit
        this.cameras.main.shake(200, 0.015);

        // Phase 2 at 50% HP
        if (this.bossHP <= Math.floor(this.bossMaxHP / 2) && this.bossPhase === 1) {
            this.bossPhase = 2;
            this.bossText.setText('PHASE 2: ENRAGED!');
            this.boss.setTint(0xff4444);
            this.cameras.main.flash(600, 255, 50, 50);
            this.cameras.main.shake(400, 0.02);

            // Restart attack cycle with faster speed
            if (this.bossAttackTimer) this.bossAttackTimer.destroy();
            this.bossAttackCycle();
        }

        // Boss defeated
        if (this.bossHP <= 0) {
            this.bossDead = true;
            if (this.bossAttackTimer) this.bossAttackTimer.destroy();

            // Cancel any mid-air or charging tweens on the boss so it doesn't slam into us while dying
            this.tweens.killTweensOf(this.boss);

            this.bossText.setText('SYSTEM STABILIZED!');
            this.bossHealthBarFill.setScale(0, 1);

            // Destroy all projectiles
            this.bossProjectiles.clear(true, true);

            // Epic death animation
            this.tweens.add({
                targets: this.boss,
                y: this.boss.y - 500,
                alpha: 0,
                angle: 1800,
                duration: 2500,
                scaleX: 0.2,
                scaleY: 0.2,
                ease: 'Back.easeIn',
                onComplete: () => {
                    this.boss.destroy();
                    this.bossNameText.setVisible(false);
                    this.bossHealthBarBG.setVisible(false);
                    this.bossHealthBarFill.setVisible(false);

                    // Victory flash
                    this.cameras.main.flash(1200, 100, 200, 100);

                    this.time.delayedCall(1500, () => {
                        this.bossText.setText('VICTORY!');
                        this.time.delayedCall(2000, () => {
                            EventBus.emit('open-modal', { id: 'credits', title: 'GAME COMPLETED', content: 'You defeated The Glitch Overlord! The CodeQuest journey begins here — register your team!' });
                            EventBus.emit('level-complete');
                        });
                    });
                }
            });

            // Score bonus
            this.score += 1000;
            EventBus.emit('update-score', this.score);
        }
    }

    // ── FIREBALL ATTACK ───────────────────────────────────────────────────
    firePlayerBall() {
        if (!this.player || !this.player.active) return;

        const dir = this.player.getFacingDirection();
        const offsetX = dir === 1 ? 28 : -28;

        const fb = this.fireballs.create(
            this.player.x + offsetX,
            this.player.y - 4,
            'fireball'
        ) as Phaser.Physics.Arcade.Image;

        if (!fb) return;
        (fb.body as Phaser.Physics.Arcade.Body).allowGravity = false;
        fb.setVelocityX(dir * 600);
        fb.setDepth(5);

        // Spin the fireball
        this.tweens.add({ targets: fb, angle: 360 * dir, repeat: -1, duration: 300 });

        // Trailing glow particles
        const trail = this.time.addEvent({
            delay: 30, repeat: 20,
            callback: () => {
                if (!fb.active) { trail.destroy(); return; }
                const glow = this.add.circle(fb.x, fb.y, 5, 0xff6600, 0.5);
                this.tweens.add({
                    targets: glow, scaleX: 0, scaleY: 0, alpha: 0, duration: 200,
                    onComplete: () => glow.destroy(),
                });
            },
        });

        // Muzzle flash at player
        const flash = this.add.star(this.player.x + offsetX, this.player.y - 4, 6, 4, 14, 0xffdd00);
        this.tweens.add({ targets: flash, alpha: 0, scaleX: 0, scaleY: 0, duration: 200, onComplete: () => flash.destroy() });

        // Auto-destroy fireball after 2.5 s
        this.time.delayedCall(2500, () => { if (fb.active) { this.spawnImpactPuff(fb.x, fb.y, 0xff6600); fb.destroy(); } });

        // Attack animation: brief white flash on player
        this.player.setTint(0xffff88);
        this.time.delayedCall(80, () => { if (this.player.active) this.player.clearTint(); });
    }

    // ── IMPACT PARTICLES ─────────────────────────────────────────────────
    spawnImpactPuff(x: number, y: number, color: number) {
        const count = 8;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = Phaser.Math.Between(60, 140);
            const puff  = this.add.circle(x, y, Phaser.Math.Between(3, 7), color, 1);
            this.tweens.add({
                targets: puff,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scaleX: 0.2, scaleY: 0.2,
                duration: Phaser.Math.Between(250, 450),
                ease: 'Quad.easeOut',
                onComplete: () => puff.destroy(),
            });
        }
        this.cameras.main.shake(80, 0.006);
    }

    // ── COMBO KILL COUNTER ───────────────────────────────────────────────
    registerKill(x: number, y: number, basePoints: number) {
        if (basePoints > 0) {
            this.score += basePoints;
            EventBus.emit('update-score', this.score);
        }

        this.combo++;
        const multiplier = Math.min(this.combo, 8);
        const points = basePoints > 0 ? basePoints * multiplier : 0;
        if (points > 0) {
            this.score += points - basePoints; // already added basePoints above
            EventBus.emit('update-score', this.score);
        }

        // Score popup
        const colors = ['#4ade80', '#fbbf24', '#f97316', '#ef4444', '#c084fc'];
        const colorIdx = Math.min(this.combo - 1, colors.length - 1);
        const popupText = this.combo > 1
            ? `x${this.combo} COMBO!\n+${basePoints * multiplier}`
            : `+${basePoints}`;

        const popup = this.add.text(x, y - 20, popupText, {
            fontFamily: '"Press Start 2P"',
            fontSize:   this.combo > 1 ? '16px' : '12px',
            color:      colors[colorIdx],
            align: 'center',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: popup, y: popup.y - 70, alpha: 0,
            scaleX: this.combo > 1 ? 1.3 : 1,
            scaleY: this.combo > 1 ? 1.3 : 1,
            duration: 800, ease: 'Quad.easeOut',
            onComplete: () => popup.destroy(),
        });

        // Camera zoom-punch on high combos
        if (this.combo >= 3) {
            this.cameras.main.shake(120, 0.01);
        }

        // Update HUD combo label
        if (this.combo > 1 && this.comboText) {
            this.comboText.setText(`${this.combo}x COMBO!`).setAlpha(1);
            this.tweens.add({ targets: this.comboText, alpha: 0, delay: 1200, duration: 600 });
        }

        // Reset combo timer
        if (this.comboTimer) this.comboTimer.destroy();
        this.comboTimer = this.time.delayedCall(2500, () => { this.combo = 0; });
    }

    update() {
        if (!this.inputActive) return;

        if (this.player) {
            this.player.update();

            // ── F-key FIREBALL ATTACK ────────────────────────────
            if (this.player.isAttackPressed()) {
                this.firePlayerBall();
            }

            // Background shift + zoom on boss approach
            const baseColor = this.getTimeOfDayColor();
            if (this.player.x > 4300) {
                const progress = Phaser.Math.Clamp((this.player.x - 4300) / 500, 0, 1);
                const startColor = Phaser.Display.Color.HexStringToColor(baseColor);
                const endColor   = Phaser.Display.Color.HexStringToColor('#0a0010');
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(startColor, endColor, 100, progress * 100);
                this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                const zoomProgress = Phaser.Math.Clamp((this.player.x - 4300) / 500, 0, 1);
                this.cameras.main.setZoom(1.15 - zoomProgress * 0.25);
            } else {
                this.cameras.main.setBackgroundColor(baseColor);
                this.cameras.main.setZoom(1.15);
            }

            // Start boss fight
            if (this.player.x > 4800 && !this.bossDead && this.boss && !this.boss.getData('fightStarted')) {
                this.startBossFight();
            }
        }

        // Boss proximity hint
        if (this.player && this.boss && this.boss.active && !this.bossDead) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
            if (dist < 220) {
                this.bossText.setText('PRESS F TO ATTACK!');
            }
        }

        // Enemy patrol logic
        this.enemies.children.each((enemy: any) => {
            if (!enemy.active) return null;
            const left = enemy.getData('patrolLeft');
            const right = enemy.getData('patrolRight');
            if (enemy.x <= left) {
                enemy.setVelocityX(80);
                enemy.setFlipX(false);
            } else if (enemy.x >= right) {
                enemy.setVelocityX(-80);
                enemy.setFlipX(true);
            }
            return null;
        });

        // Parallax effect on clouds
        if (this.backgroundClouds) {
            this.backgroundClouds.tilePositionX += 0.5;
        }
    }
}
