import { AUTO, Game as PhaserGame, Scale } from 'phaser';
import { Game } from './scenes/Game';

// Find out more information about the Game Config at:
// https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#1e1b4b',
    scale: {
        mode: Scale.RESIZE,
        autoCenter: Scale.CENTER_BOTH,
        fullscreenTarget: 'parent',
        expandParent: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000, x: 0 },
            debug: false
        }
    },
    scene: [
        Game
    ]
};

const StartGame = (parent: string) => {
    return new PhaserGame({ ...config, parent });
}

export default StartGame;
