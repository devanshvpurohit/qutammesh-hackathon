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
    private fKey!: Phaser.Input.Keyboard.Key;
    private inputActive: boolean = true;

    // NEW: Game systems
    private playerHP: number = 3;
    private playerMaxHP: number = 3;
    private invincible: boolean = false;
    private hearts: Phaser.GameObjects.Text[] = [];
    private coins!: Phaser.Physics.Arcade.Group;
    private coinCount: number = 0;
    private coinText!: Phaser.GameObjects.Text;
    private enemies!: Phaser.Physics.Arcade.Group;
    private bossHP: number = 5;
    private bossMaxHP: number = 5;
    private bossPhase: number = 1;
    private bossProjectiles!: Phaser.Physics.Arcade.Group;
    private bossAttackTimer!: Phaser.Time.TimerEvent;
    private bossCharging: boolean = false;
    private bossHealthBarBG!: Phaser.GameObjects.Rectangle;
    private bossHealthBarFill!: Phaser.GameObjects.Rectangle;
    private bossNameText!: Phaser.GameObjects.Text;

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
        this.platforms = this.physics.add.staticGroup();
        this.triggers = this.physics.add.staticGroup();
        this.coins = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.bossProjectiles = this.physics.add.group();

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
        this.physics.add.collider(this.coins, this.platforms);

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

        if (this.input.keyboard) {
            this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        }

        // HUD (Fixed to camera)
        this.createHUD();

        EventBus.emit('current-scene-ready', this);
    }

    createHUD() {
        // Hearts on the RIGHT side
        const camWidth = this.cameras.main.width;
        for (let i = 0; i < this.playerMaxHP; i++) {
            const heart = this.add.text(camWidth - 50 - i * 36, 50, '❤️', { fontSize: '20px' })
                .setScrollFactor(0)
                .setDepth(100);
            this.hearts.push(heart);
        }

        // Coin counter (in-game, small, top-left area below score)
        this.coinText = this.add.text(30, 70, '🪙 x0', {
            fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#facc15'
        }).setScrollFactor(0).setDepth(100);
    }

    updateHUD() {
        // Update hearts
        for (let i = 0; i < this.hearts.length; i++) {
            this.hearts[i].setText(i < this.playerHP ? '❤️' : '🖤');
        }
        // Update coins
        this.coinText.setText('🪙 x' + this.coinCount);
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
        // Stomp from above
        if (this.player.body!.velocity.y > 0 && this.player.y < enemy.y - 20) {
            enemy.destroy();
            this.player.setVelocityY(-400); // Stronger bounce
            this.score += 200;
            EventBus.emit('update-score', this.score);
            this.cameras.main.shake(150, 0.008);

            // Score popup with better animation
            const scoreText = this.add.text(enemy.x, enemy.y, '+200', {
                fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#4ade80'
            }).setOrigin(0.5);
            this.tweens.add({
                targets: scoreText,
                y: enemy.y - 60,
                alpha: 0,
                duration: 700,
                ease: 'Quad.easeOut',
                onComplete: (_tween: any, targets: any[]) => { targets[0].destroy(); }
            });
        } else {
            this.takeDamage();
        }
    }

    hitProjectile(_player: any, projectile: any) {
        projectile.destroy();
        this.takeDamage();
    }

    takeDamage() {
        if (this.invincible) return;

        this.playerHP--;
        this.invincible = true;
        this.updateHUD();
        EventBus.emit('update-hp', this.playerHP);

        // Flash player RED (damage indicator)
        this.player.setTint(0xff6b6b);
        this.cameras.main.shake(250, 0.015);

        // Knockback with more force
        const knockDir = this.player.flipX ? 250 : -250;
        this.player.setVelocity(knockDir, -300);

        // Invincibility frames (red blinking)
        let flashCount = 0;
        const flashTimer = this.time.addEvent({
            delay: 80,
            callback: () => {
                flashCount++;
                if (flashCount % 2 === 0) {
                    this.player.setAlpha(1);
                    this.player.clearTint();
                } else {
                    this.player.setAlpha(0.5);
                    this.player.setTint(0xff6b6b);
                }
                if (flashCount >= 18) {
                    flashTimer.destroy();
                    this.player.setAlpha(1);
                    this.player.clearTint();
                    this.invincible = false;
                }
            },
            loop: true
        });

        if (this.playerHP <= 0) {
            // Death
            this.time.delayedCall(500, () => {
                this.playerHP = this.playerMaxHP;
                this.player.setPosition(100, 500);
                this.player.setVelocity(0, 0);
                this.updateHUD();
                EventBus.emit('update-hp', this.playerHP);
                this.cameras.main.flash(600, 255, 100, 100);
            });
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

        // Start Zone (0 - 800)
        this.add.text(400, 250, '⚔️ QUANTUM MESH ⚔️', {
            fontFamily: '"Press Start 2P"', fontSize: '28px', color: '#c084fc', align: 'center'
        }).setOrigin(0.5);
        this.add.text(400, 310, 'Use ARROWS or WASD to move', {
            fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#60a5fa', align: 'center'
        }).setOrigin(0.5);
        this.add.text(400, 340, 'SPACE or W to jump', {
            fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#60a5fa', align: 'center'
        }).setOrigin(0.5);

        // Starter coins (teach player to collect)
        this.spawnCoins(200, groundY - 80, 5);

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
            "Quantum Mesh is the ultimate hackathon. Build the future.",
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

        // Boss arena platforms - EARTH THEMED (brown/dark)
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
            platform.setTint(0x5c3d2e); // Dark brown earth color
        });

        // Add earth texture overlay
        for (let i = 0; i < 6; i++) {
            this.add.rectangle(4900 + (i * 64), bossArenaY + 20, 64, 20, 0x3d2817)
                .setOrigin(0, 0)
                .setScrollFactor(1);
        }

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
        this.boss = this.physics.add.sprite(5200, 500, 'boss_placeholder');
        (this.boss.body as Phaser.Physics.Arcade.Body).allowGravity = false;
        this.boss.setImmovable(true);
        this.physics.add.collider(this.player, this.boss, () => {
            if (!this.bossDead && !this.invincible) {
                this.takeDamage();
            }
        });
        this.boss.setVisible(false);
        (this.boss.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;
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
        if (this.bossDead || !this.boss.active) return;

        // Flash boss before shooting
        this.boss.setTint(0xff00ff);
        this.time.delayedCall(200, () => {
            if (this.bossDead) return;
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
        if (this.bossDead || this.bossCharging || !this.boss.active) return;
        this.bossCharging = true;

        // Warning telegraph
        this.boss.setTint(0xff0000);
        this.bossText.setText('INCOMING!');

        this.time.delayedCall(800, () => {
            if (this.bossDead) return;

            const targetX = this.player.x;

            // Charge towards player
            this.tweens.add({
                targets: this.boss,
                x: targetX,
                duration: 600,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    if (this.bossDead) return;
                    // Slam effect
                    this.cameras.main.shake(300, 0.02);

                    // Return to original position
                    this.tweens.add({
                        targets: this.boss,
                        x: 5200,
                        duration: 1000,
                        ease: 'Quad.easeOut',
                        onComplete: () => {
                            this.boss.clearTint();
                            this.bossText.setText('PRESS F TO ATTACK!');
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
        this.time.delayedCall(150, () => { if (this.boss.active) this.boss.clearTint(); });

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
                            EventBus.emit('open-modal', { id: 'credits', title: 'GAME COMPLETED', content: 'You defeated The Glitch Overlord! The journey into Quantum Mesh begins here.' });
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

    update() {
        if (!this.inputActive) return;

        if (this.player) {
            this.player.update();

            // Update background color based on time of day
            const baseColor = this.getTimeOfDayColor();

            // Background Color Shift on Boss approach
            if (this.player.x > 4300) {
                const progress = Phaser.Math.Clamp((this.player.x - 4300) / 500, 0, 1);
                const startColor = Phaser.Display.Color.HexStringToColor(baseColor);
                const endColor = Phaser.Display.Color.HexStringToColor('#0a0010');
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(startColor, endColor, 100, progress * 100);
                this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(color.r, color.g, color.b));

                // Zoom out as player approaches boss
                const zoomProgress = Phaser.Math.Clamp((this.player.x - 4300) / 500, 0, 1);
                const targetZoom = 1.15 - (zoomProgress * 0.25); // Zoom from 1.15 to 0.9
                this.cameras.main.setZoom(targetZoom);
            } else {
                this.cameras.main.setBackgroundColor(baseColor);
                this.cameras.main.setZoom(1.15);
            }

            // Start boss fight when entering arena
            if (this.player.x > 4800 && !this.bossDead && this.boss && !this.boss.getData('fightStarted')) {
                this.startBossFight();
            }
        }

        // Player attack: F key fires fireball
        // Removed - fireball system disabled

        // Boss interaction
        if (this.player && this.boss && this.boss.active && !this.bossDead) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
            if (dist < 200) {
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
