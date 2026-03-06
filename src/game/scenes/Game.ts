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

    constructor() {
        super('Game');
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

        // Boss Sprite
        this.generatePixelArt('boss_placeholder', {
            '0': 0x000000, '1': 0x22c55e, '2': 0xfacc15, '3': 0xef4444, '4': 0xffffff
        }, [
            "....00000000....",
            "...0111111110...",
            "..011041110410..",
            ".01110411104110.",
            ".01111111111110.",
            "0222222222222220",
            "0202222222222020",
            "0202222222222020",
            "0222222222222220",
            ".03333333333330.",
            ".03303333330330.",
            "..030033330030..",
            "...0000000000...",
            "....0.0..0.0....",
            "...00.0..0.00...",
            "...0..0..0..0..."
        ], 8);
    }

    create() {
        // World setup
        const worldWidth = 6000;
        const worldHeight = 768; // matches config height
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Background (Parallax)
        this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue

        // Add clouds
        this.backgroundClouds = this.add.tileSprite(0, 150, worldWidth, 400, 'cloud_placeholder')
            .setOrigin(0, 0)
            .setScrollFactor(0.2); // Slower scroll for background

        // Build World Layers
        this.platforms = this.physics.add.staticGroup();
        this.triggers = this.physics.add.staticGroup();

        // 1. Ground floor stretching across entire level
        const groundY = worldHeight - 32;
        for (let x = 0; x < worldWidth; x += 64) {
            this.platforms.create(x + 32, groundY, 'ground_placeholder');
        }

        // Setup the Player
        this.player = new Player(this, 100, groundY - 100, 'player_placeholder');

        // Follow player camera
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setZoom(1.2); // Zoom in slightly for better pixel effect

        // Setup collisions
        this.physics.add.collider(this.player, this.platforms);

        // Setup triggers (overlap without solid collision, or standard collisions with callbacks)
        this.physics.add.overlap(this.player, this.triggers, this.handleTrigger, undefined, this);

        // Create the zones
        this.buildZones();

        if (this.input.keyboard) {
            this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        }

        EventBus.emit('current-scene-ready', this);
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

        // Throttle emission to prevent React spam
        const now = this.time.now;
        if (trigger.lastTriggerTime && now - trigger.lastTriggerTime < 2000) {
            return;
        }

        if (type === 'qblock') {
            // Only trigger if hit from below
            if (player.body.velocity.y < 0 && player.body.y > trigger.y) {
                trigger.lastTriggerTime = now;
                // Bounce block effect
                this.tweens.add({
                    targets: trigger,
                    y: trigger.y - 10,
                    yoyo: true,
                    duration: 100,
                    onComplete: () => {
                        trigger.setTint(0xcccccc); // grey out
                        EventBus.emit('open-modal', { id: modalId, title, content });

                        this.score += 100;
                        EventBus.emit('update-score', this.score);
                        trigger.disableBody(true, false); // Keep visible but remove physics
                    }
                });
            }
        }
        else if (type === 'pipe') {
            if (downPressed) { // Enter pipe
                trigger.lastTriggerTime = now;
                EventBus.emit('open-modal', { id: modalId, title, content });
                player.setPosition(player.x, player.y - 100); // Popup effect
            }
        }
        else if (type === 'schedule') {
            trigger.lastTriggerTime = now;
            EventBus.emit('open-modal', { id: modalId, title, content });
        }
        else if (type === 'castle') {
            trigger.lastTriggerTime = now;
            EventBus.emit('open-modal', { id: 'credits', title: 'GAME COMPLETED', content: 'You defeated the final bug! The journey into Quantum Mesh begins here.' });
            EventBus.emit('level-complete');
        }
    }

    buildZones() {
        // Start Zone (0 - 800)
        this.add.text(400, 300, 'Quantum Mesh\nPress arrow keys to move ->', {
            fontFamily: '"Press Start 2P"', fontSize: '24px', color: '#000000', align: 'center'
        }).setOrigin(0.5);

        // Zone 1: About (1000 - 2000)
        this.add.text(1200, 300, 'ZONE 1: ABOUT\nJump & hit from below', {
            fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#000000', align: 'center'
        }).setOrigin(0.5);

        // Add interactive Q-blocks
        const aboutContent = [
            "Quantum Mesh is the ultimate hackathon. Build the future.",
            "Theme: Innovate to Elevate. Create solutions that matter.",
            "Everyone is welcome. Students, pros, and creatives."
        ];

        for (let i = 0; i < 3; i++) {
            const block = this.platforms.create(1100 + (i * 150), 550, 'qblock_placeholder');
            // Add an invisible trigger right below the block to detect hit-from-below easily or we could use the block body itself.
            const trigger = this.triggers.create(block.x, block.y + 16, 'qblock_placeholder');
            trigger.setVisible(false);
            trigger.setData('type', 'qblock');
            trigger.setData('modalId', 'about-' + i);
            trigger.setData('title', 'ABOUT');
            trigger.setData('content', aboutContent[i]);
        }

        // Zone 2: Schedule (Hill-like) (2200 - 3200) - NOW USES PIPES
        this.add.text(2500, 300, 'ZONE 2: SCHEDULE\nEnter the pipes', {
            fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#000000', align: 'center'
        }).setOrigin(0.5);

        const scheduleContent = ['Registration', 'Opening Ceremony', 'Hacking Time', 'Judging', 'Demo Day'];
        for (let i = 0; i < 5; i++) {
            const pipeX = 2300 + (i * 200);
            const height = i < 3 ? i : 4 - i; // Modulates height: 0, 1, 2, 1, 0
            const pipeY = (768 - 64) - (height * 64);

            // Build column down to floor
            for (let j = 0; j <= height; j++) {
                this.platforms.create(pipeX, (768 - 64) - (j * 64), 'pipe_placeholder');
            }

            const trigger = this.triggers.create(pipeX, pipeY - 64, 'qblock_placeholder');
            trigger.setVisible(false);
            trigger.setData('type', 'pipe'); // Schedule is now in pipes
            trigger.setData('modalId', 'schedule-' + i);
            trigger.setData('title', 'SCHEDULE');
            trigger.setData('content', scheduleContent[i]);
        }

        // Zone 3: Tracks (3500 - 4500) - NOW USES FLY EARTH BLOCKS IN W SHAPE
        this.add.text(4000, 200, 'ZONE 3: TRACKS\nHit fly blocks', {
            fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#000000', align: 'center'
        }).setOrigin(0.5);

        const tracksContent = ['🤖 AI Track', '🌐 Web Track', '🌱 Sustainability', '🚀 Open Innovation'];

        // Define W points relative to zone start (3600)
        // A "W" shape using 5 points
        const wPoints = [
            { x: 3600, y: 500, contentIdx: 0 },
            { x: 3800, y: 650, contentIdx: 1 },
            { x: 4000, y: 500, contentIdx: 2 },
            { x: 4200, y: 650, contentIdx: 3 },
            { x: 4400, y: 500, contentIdx: 0 } // Duplicate or extra info
        ];

        wPoints.forEach((p, i) => {
            // Using ground_placeholder for "earth block" look but floating
            this.platforms.create(p.x, p.y, 'ground_placeholder');

            const trigger = this.triggers.create(p.x, p.y + 16, 'qblock_placeholder');
            trigger.setVisible(false);
            trigger.setData('type', 'qblock'); // Keep qblock type for hit-from-below behavior
            trigger.setData('modalId', 'track-' + i);
            trigger.setData('title', 'HACKATHON TRACK');
            trigger.setData('content', tracksContent[p.contentIdx] || tracksContent[0]);
        });

        // Finale: Castle (5500)
        this.add.text(5500, 300, 'FINAL CASTLE', {
            fontFamily: '"Press Start 2P"', fontSize: '30px', color: '#000000', align: 'center'
        }).setOrigin(0.5);

        // Castle Pixel Art Generator
        this.generatePixelArt('castle_placeholder', {
            '0': 0x000000, '1': 0x64748b, '2': 0x94a3b8, '3': 0x475569, '4': 0x000000
        }, [
            "1010101010101010101",
            "1111111111111111111",
            "1222222222222222221",
            "1111111111111111111",
            "1333333333333333331",
            "1111111111111111111",
            "1222222222222222221",
            "1111111111111111111",
            "1333333333333333331",
            "1111111111111111111",
            "1222222144412222221",
            "1111111444441111111",
            "1333333444443333331",
            "1111111444441111111",
            "1222222444442222221",
            "1111111444441111111",
        ], 16);

        this.platforms.create(5500, 768 - 160, 'castle_placeholder');

        // Villain Boss
        this.bossText = this.add.text(5100, 300, 'Villain blocks the path!\nPRESS F TO DEFEAT', {
            fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#ff0000', align: 'center'
        }).setOrigin(0.5);
        this.bossText.setVisible(false);

        this.boss = this.physics.add.sprite(5100, 768 - 128, 'boss_placeholder');
        this.physics.add.collider(this.boss, this.platforms);
        this.boss.setImmovable(true);
        // Boss acts like a wall, player can't walk past without killing him
        this.physics.add.collider(this.player, this.boss);

        // Castle Trigger (Automatic) - Positioned in front of the castle door
        const castleTrigger = this.triggers.create(5400, 768 - 128, 'qblock_placeholder');
        castleTrigger.setScale(3, 5); // Make it a large detection zone
        castleTrigger.setVisible(false);
        castleTrigger.refreshBody(); // Static bodies need refresh after scale
        castleTrigger.setData('type', 'castle');
    }

    update() {
        if (this.player) {
            this.player.update();
        }

        // Boss interaction loop
        if (this.player && this.boss && !this.bossDead) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
            if (dist < 300) {
                this.bossText.setVisible(true);

                // If in range and F is pressed
                if (this.fKey && Phaser.Input.Keyboard.JustDown(this.fKey)) {
                    this.bossDead = true;
                    this.bossText.setText('BUG DEFEATED!');
                    this.boss.body!.checkCollision.none = true; // allow walking through

                    // Kill boss animation
                    this.tweens.add({
                        targets: this.boss,
                        y: this.boss.y - 400,
                        alpha: 0,
                        angle: 360,
                        duration: 1000,
                        scaleX: 0,
                        scaleY: 0,
                        onComplete: () => {
                            this.boss.destroy();
                            this.bossText.setVisible(false);
                        }
                    });
                }
            } else {
                this.bossText.setVisible(false);
            }
        }

        // Parallax effect on clouds
        if (this.backgroundClouds) {
            this.backgroundClouds.tilePositionX += 0.5;
        }
    }
}
