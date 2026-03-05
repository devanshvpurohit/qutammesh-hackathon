import { useEffect, useRef, useState } from 'react';
import { PhaserGame } from './game/PhaserGame';
import type { IRefPhaserGame } from './game/PhaserGame';
import { OverlayModals } from './components/OverlayModals';
import { EventBus } from './game/EventBus';

function App() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const updateScore = (newScore: number) => setScore(newScore);
    EventBus.on('update-score', updateScore);

    return () => {
      EventBus.removeListener('update-score', updateScore);
    }
  }, []);

  const onActiveScene = (scene: Phaser.Scene) => {
    console.log('Scene started:', scene.scene.key);
  }

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center font-pixel relative overflow-hidden">
      {!isGameRunning ? (
        <div className="flex flex-col items-center justify-center z-10 w-full h-full text-center">
          <h1 className="text-4xl md:text-6xl text-white mb-8 glow-text">QUANTUM MESH</h1>
          <h2 className="text-2xl md:text-4xl text-hackathon-primary mb-8 pixel-border p-4 bg-zinc-900 inline-block rotate-[-2deg]">HACKATHON 2026</h2>
          <p className="text-xl text-gray-300 mb-12">An interactive platformer experience</p>
          <button
            onClick={() => setIsGameRunning(true)}
            className="pixel-btn text-2xl animate-pulse"
          >
            PRESS START TO ENTER LEVEL
          </button>
        </div>
      ) : (
        <>
          <PhaserGame ref={phaserRef} currentActiveScene={onActiveScene} />
          <OverlayModals />

          {/* HUD */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="pixel-card py-2 px-4 shadow-none bg-black/50 border-white/50 backdrop-blur-sm">
              <p className="text-white text-xl">SCORE: {score.toString().padStart(6, '0')}</p>
            </div>
          </div>

          {/* Mobile Controls Overlay Help */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none opacity-50">
            <p className="text-white text-xs">Use WASD or Arrow Keys to move. Jump & Space to interact.</p>
          </div>
        </>
      )}
    </div>
  )
}

export default App
