import { useEffect, useRef, useState } from 'react';
import { PhaserGame } from './game/PhaserGame';
import type { IRefPhaserGame } from './game/PhaserGame';
import { OverlayModals } from './components/OverlayModals';
import { EventBus } from './game/EventBus';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const updateScore = (newScore: number) => setScore(newScore);
    EventBus.on('update-score', updateScore);
    return () => { EventBus.removeListener('update-score', updateScore); }
  }, []);

  const onActiveScene = (scene: Phaser.Scene) => {
    console.log('Scene started:', scene.scene.key);
  }

  // Generate random stars for the background
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2
  }));

  return (
    <div className="w-screen h-screen bg-hackathon-bg flex items-center justify-center font-pixel relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!isGameRunning ? (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center z-10 w-full h-full text-center relative scanlines crt-flicker"
          >
            {/* Stars */}
            {stars.map(star => (
              <div
                key={star.id}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${star.left}%`,
                  top: `${star.top}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  animation: `twinkle ${star.duration}s ${star.delay}s ease-in-out infinite`,
                  opacity: 0.3
                }}
              />
            ))}

            {/* Animated grid lines */}
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full" style={{
                backgroundImage: 'linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
              }} />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center gap-6">
              {/* Title */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
                className="flex flex-col items-center"
              >
                <div className="text-[10px] md:text-xs text-hackathon-secondary tracking-[0.5em] mb-4">
                  WELCOME TO
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl text-hackathon-primary glow-text leading-tight">
                  QUANTUM MESH
                </h1>
                <div className="gradient-underline w-48 md:w-64 mt-4 rounded-full" />
              </motion.div>

              {/* Subtitle Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -5 }}
                animate={{ scale: 1, rotate: -2 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                className="relative"
              >
                <div className="pixel-border bg-hackathon-surface px-6 py-3 text-lg md:text-2xl text-hackathon-accent glow-purple">
                  HACKATHON 2026
                </div>
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] px-2 py-1 border-2 border-black">
                  NEW!
                </div>
              </motion.div>

              {/* Pixel character preview */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="float-anim my-4"
              >
                <div className="text-4xl">🎮</div>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-[10px] md:text-xs text-gray-400 max-w-md leading-relaxed px-4"
              >
                Navigate a retro platformer world. Defeat the Glitch Overlord.
                Register your team for the ultimate hackathon experience.
              </motion.p>

              {/* CTA Button */}
              <motion.button
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, type: 'spring' }}
                onClick={() => setIsGameRunning(true)}
                className="pixel-btn text-sm md:text-lg pulse-glow mt-4"
              >
                ▶ START GAME
              </motion.button>

              {/* How to Play */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-[8px] md:text-[10px] text-hackathon-secondary hover:text-white transition-colors cursor-pointer underline underline-offset-4 mt-2"
              >
                {showInstructions ? '▲ HIDE CONTROLS' : '▼ HOW TO PLAY'}
              </motion.button>

              <AnimatePresence>
                {showInstructions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pixel-card text-left text-[8px] md:text-[10px] leading-loose mt-2 max-w-sm">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <span className="text-hackathon-secondary">MOVE</span>
                        <span>← → or A D</span>
                        <span className="text-hackathon-secondary">JUMP</span>
                        <span>↑ W or SPACE</span>
                        <span className="text-hackathon-secondary">ATTACK</span>
                        <span>F (near boss)</span>
                        <span className="text-hackathon-secondary">INTERACT</span>
                        <span>↓ S (on pipes)</span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <p className="text-hackathon-primary">TIPS:</p>
                        <p className="text-gray-400 mt-1">• Stomp enemies from above</p>
                        <p className="text-gray-400">• Collect coins for bonus score</p>
                        <p className="text-gray-400">• Hit ? blocks from below</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="absolute -bottom-24 text-[7px] text-gray-600"
              >
                BUILT WITH PHASER 3 + REACT • © 2026 QUANTUM MESH
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="game-screen"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full relative"
          >
            <PhaserGame ref={phaserRef} currentActiveScene={onActiveScene} />
            <OverlayModals />

            {/* Top HUD Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
              <div className="flex items-center justify-between px-4 py-2 bg-black/70 backdrop-blur-sm border-b-2 border-hackathon-primary/30">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-hackathon-primary text-xs">SCORE</span>
                    <span className="text-white text-sm tabular-nums">{score.toString().padStart(6, '0')}</span>
                  </div>
                </div>
                <div className="text-hackathon-secondary text-[8px] tracking-widest">
                  QUANTUM MESH 2026
                </div>
              </div>
            </div>

            {/* Bottom Controls Hint */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="bg-black/50 backdrop-blur-sm px-4 py-1 rounded border border-white/10">
                <p className="text-gray-400 text-[8px] tracking-wider">
                  WASD / ARROWS = Move &nbsp;•&nbsp; SPACE = Jump &nbsp;•&nbsp; F = Attack
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
