import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Page = 'about' | 'themes' | 'schedule' | 'register';
type Currency = 'usd' | 'inr';

export function Website() {
  const [currentPage, setCurrentPage] = useState<Page>('about');
  const [currency, setCurrency] = useState<Currency>('usd');

  const navItems: { id: Page; label: string }[] = [
    { id: 'about', label: 'ABOUT' },
    { id: 'themes', label: 'THEMES' },
    { id: 'schedule', label: 'SCHEDULE' },
    { id: 'register', label: 'REGISTER' },
  ];

  return (
    <div className="w-screen h-screen bg-hackathon-bg text-white font-pixel flex flex-col">
      {/* Header */}
      <div className="bg-hackathon-surface border-b-4 border-white z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl text-hackathon-primary glow-text">QUANTUM MESH</h1>
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrency('usd')}
                className={`pixel-btn text-xs ${currency === 'usd' ? 'bg-hackathon-primary text-black' : 'bg-hackathon-surface text-hackathon-primary border-2 border-hackathon-primary'}`}
              >
                USD
              </button>
              <button
                onClick={() => setCurrency('inr')}
                className={`pixel-btn text-xs ${currency === 'inr' ? 'bg-hackathon-primary text-black' : 'bg-hackathon-surface text-hackathon-primary border-2 border-hackathon-primary'}`}
              >
                INR
              </button>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="pixel-btn text-xs md:text-sm"
            >
              ← BACK TO GAME
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-hackathon-surface border-b-2 border-white/30">
        <div className="max-w-6xl mx-auto px-6 flex gap-2 md:gap-4 overflow-x-auto py-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`pixel-btn text-xs md:text-sm whitespace-nowrap ${
                currentPage === item.id
                  ? 'bg-hackathon-primary text-black'
                  : 'bg-hackathon-surface text-hackathon-primary border-2 border-hackathon-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <AnimatePresence mode="wait">
            {currentPage === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Hero Section */}
                <motion.div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl text-hackathon-primary glow-text mb-4">
                    ABOUT HACKATHON
                  </h2>
                  <div className="gradient-underline w-48 md:w-64 mx-auto rounded-full" />
                </motion.div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                  <div className="pixel-card text-center">
                    <div className="text-3xl mb-2">📅</div>
                    <div className="text-hackathon-secondary text-sm mb-2">DATE</div>
                    <div className="text-white">May 1-2, 2026</div>
                  </div>
                  <div className="pixel-card text-center">
                    <div className="text-3xl mb-2">⏱️</div>
                    <div className="text-hackathon-secondary text-sm mb-2">DURATION</div>
                    <div className="text-white">24 Hours</div>
                  </div>
                  <div className="pixel-card text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="text-hackathon-secondary text-sm mb-2">PRIZES</div>
                    <div className="text-white">$5000+</div>
                  </div>
                  <div className="pixel-card text-center">
                    <div className="text-3xl mb-2">👥</div>
                    <div className="text-hackathon-secondary text-sm mb-2">TEAM SIZE</div>
                    <div className="text-white">1-4 Members</div>
                  </div>
                </div>

                {/* About Section */}
                <div className="pixel-card mb-12">
                  <h3 className="text-2xl text-hackathon-primary mb-4">🎮 WHAT IS QUANTUM MESH?</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Quantum Mesh is a 24-hour hackathon celebrating retro technology and modern innovation. 
                    Teams will compete to build creative projects while navigating our interactive pixel-art 
                    platformer game. Whether you're a seasoned hacker or just starting out, there's a place 
                    for you in our community.
                  </p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    This is more than just a coding competition - it's a celebration of creativity, collaboration, 
                    and the spirit of making. Join hundreds of developers, designers, and innovators for an 
                    unforgettable weekend.
                  </p>
                </div>

                {/* Why Attend */}
                <div className="pixel-card">
                  <h3 className="text-2xl text-hackathon-accent mb-4">✨ WHY ATTEND?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-l-4 border-hackathon-primary pl-4">
                      <p className="text-hackathon-primary font-bold mb-2">🚀 Build Amazing Projects</p>
                      <p className="text-gray-300 text-sm">Create something incredible in just 24 hours</p>
                    </div>
                    <div className="border-l-4 border-hackathon-secondary pl-4">
                      <p className="text-hackathon-secondary font-bold mb-2">🤝 Network & Collaborate</p>
                      <p className="text-gray-300 text-sm">Meet talented developers and make lasting connections</p>
                    </div>
                    <div className="border-l-4 border-hackathon-accent pl-4">
                      <p className="text-hackathon-accent font-bold mb-2">🏅 Win Prizes</p>
                      <p className="text-gray-300 text-sm">Compete for $5000+ in prizes and recognition</p>
                    </div>
                    <div className="border-l-4 border-yellow-400 pl-4">
                      <p className="text-yellow-400 font-bold mb-2">🎓 Learn & Grow</p>
                      <p className="text-gray-300 text-sm">Expand your skills and learn from industry experts</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentPage === 'themes' && (
              <motion.div
                key="themes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl text-hackathon-primary glow-text mb-4">
                    HACKATHON TRACKS
                  </h2>
                  <div className="gradient-underline w-48 md:w-64 mx-auto rounded-full" />
                </motion.div>

                {/* Main Theme */}
                <div className="pixel-card mb-8 bg-gradient-to-r from-hackathon-surface to-hackathon-surface border-4 border-hackathon-primary">
                  <h3 className="text-3xl text-hackathon-primary mb-4">🎯 MAIN THEME: INNOVATE TO ELEVATE</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Create solutions that matter. Build the future with innovation at its core.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    Whether you're a student, professional, or creative - everyone is welcome to participate 
                    and showcase their skills in one of our specialized tracks.
                  </p>
                </div>

                {/* Tracks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="pixel-card">
                    <h4 className="text-xl text-hackathon-secondary mb-3">🤖 AI TRACK</h4>
                    <p className="text-gray-300 text-sm">
                      Build intelligent solutions using machine learning, AI, and automation. 
                      Create chatbots, predictive models, or AI-powered applications.
                    </p>
                  </div>
                  <div className="pixel-card">
                    <h4 className="text-xl text-hackathon-accent mb-3">🌐 WEB TRACK</h4>
                    <p className="text-gray-300 text-sm">
                      Develop web applications, progressive web apps, or interactive experiences. 
                      Use any framework or technology you prefer.
                    </p>
                  </div>
                  <div className="pixel-card">
                    <h4 className="text-xl text-green-400 mb-3">🌱 SUSTAINABILITY TRACK</h4>
                    <p className="text-gray-300 text-sm">
                      Create solutions that address environmental challenges. Build apps for 
                      climate action, renewable energy, or eco-friendly innovations.
                    </p>
                  </div>
                  <div className="pixel-card">
                    <h4 className="text-xl text-yellow-400 mb-3">🚀 OPEN INNOVATION TRACK</h4>
                    <p className="text-gray-300 text-sm">
                      Think outside the box. Build anything that doesn't fit other categories - 
                      hardware, art, music, or experimental projects welcome.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {currentPage === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl text-hackathon-primary glow-text mb-4">
                    SCHEDULE
                  </h2>
                  <p className="text-gray-400 mb-4">May 1-2, 2026</p>
                  <div className="gradient-underline w-48 md:w-64 mx-auto rounded-full" />
                </motion.div>

                {/* Day 1 */}
                <div className="pixel-card mb-8">
                  <h3 className="text-2xl text-hackathon-secondary mb-6">📅 DAY 1 - MAY 1</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-white/20 pb-3">
                      <span className="text-hackathon-primary font-bold">9:00 AM</span>
                      <span className="text-gray-300">Doors Open & Registration</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/20 pb-3">
                      <span className="text-hackathon-primary font-bold">10:00 AM</span>
                      <span className="text-gray-300">Opening Ceremony & Theme Reveal</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/20 pb-3">
                      <span className="text-hackathon-primary font-bold">11:00 AM</span>
                      <span className="text-gray-300">Hacking Begins!</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/20 pb-3">
                      <span className="text-hackathon-primary font-bold">1:00 PM</span>
                      <span className="text-gray-300">Lunch Break</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/20 pb-3">
                      <span className="text-hackathon-primary font-bold">2:00 PM</span>
                      <span className="text-gray-300">Hacking Continues</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/20 pb-3">
                      <span className="text-hackathon-primary font-bold">7:00 PM</span>
                      <span className="text-gray-300">Dinner Break</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-hackathon-primary font-bold">8:00 PM</span>
                      <span className="text-gray-300">Hacking Continues (Late Night)</span>
                    </div>
                  </div>
                </div>

                {/* Day 2 */}
                <div className="pixel-card">
                  <h3 className="text-2xl text-hackathon-accent mb-6">📅 DAY 2 - MAY 2</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-white/20 pb-3">
                      <span className="text-hackathon-accent font-bold">8:00 AM</span>
                      <span className="text-gray-300">Breakfast & Final Hacking</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/20 pb-3">
                      <span className="text-hackathon-accent font-bold">11:00 AM</span>
                      <span className="text-gray-300">Final Submissions Deadline</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/20 pb-3">
                      <span className="text-hackathon-accent font-bold">11:30 AM</span>
                      <span className="text-gray-300">Judging Begins</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/20 pb-3">
                      <span className="text-hackathon-accent font-bold">12:30 PM</span>
                      <span className="text-gray-300">Lunch & Demos</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-hackathon-accent font-bold">2:00 PM</span>
                      <span className="text-gray-300">Awards Ceremony & Closing</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentPage === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl text-hackathon-primary glow-text mb-4">
                    REGISTER NOW
                  </h2>
                  <div className="gradient-underline w-48 md:w-64 mx-auto rounded-full" />
                </motion.div>

                {/* Registration Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="pixel-card">
                    <h3 className="text-2xl text-hackathon-secondary mb-4">📋 REGISTRATION DETAILS</h3>
                    <div className="space-y-3 text-gray-300">
                      <p><span className="text-hackathon-primary">Team Size:</span> 1-4 members</p>
                      <p><span className="text-hackathon-primary">Cost per Head:</span> {currency === 'usd' ? '$50' : '₹250'}</p>
                      <p><span className="text-hackathon-primary">Deadline:</span> April 25, 2026</p>
                      <p><span className="text-hackathon-primary">Format:</span> Virtual & In-Person</p>
                    </div>
                  </div>

                  <div className="pixel-card">
                    <h3 className="text-2xl text-hackathon-accent mb-4">🎯 REQUIREMENTS</h3>
                    <div className="space-y-2 text-gray-300 text-sm">
                      <p>✓ Valid email address</p>
                      <p>✓ Team name</p>
                      <p>✓ Team member names</p>
                      <p>✓ Experience level</p>
                      <p>✓ Agree to Code of Conduct</p>
                    </div>
                  </div>
                </div>

                {/* Prizes */}
                <div className="pixel-card mb-8">
                  <h3 className="text-2xl text-yellow-400 mb-6">🏆 PRIZE POOL</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-hackathon-surface border-4 border-yellow-400 p-6 text-center">
                      <div className="text-4xl mb-3">🥇</div>
                      <div className="text-yellow-400 font-bold mb-2 text-lg">1ST PLACE</div>
                      <div className="text-3xl text-white">
                        {currency === 'usd' ? '$2500' : '₹2,00,000'}
                      </div>
                      <p className="text-gray-400 text-xs mt-2">+ Trophies</p>
                    </div>
                    <div className="bg-hackathon-surface border-4 border-gray-400 p-6 text-center">
                      <div className="text-4xl mb-3">🥈</div>
                      <div className="text-gray-400 font-bold mb-2 text-lg">2ND PLACE</div>
                      <div className="text-3xl text-white">
                        {currency === 'usd' ? '$1500' : '₹1,20,000'}
                      </div>
                      <p className="text-gray-400 text-xs mt-2">+ Trophies</p>
                    </div>
                    <div className="bg-hackathon-surface border-4 border-orange-600 p-6 text-center">
                      <div className="text-4xl mb-3">🥉</div>
                      <div className="text-orange-600 font-bold mb-2 text-lg">3RD PLACE</div>
                      <div className="text-3xl text-white">
                        {currency === 'usd' ? '$1000' : '₹80,000'}
                      </div>
                      <p className="text-gray-400 text-xs mt-2">+ Trophies</p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="pixel-card text-center">
                  <p className="text-gray-300 mb-6">Ready to join the hackathon?</p>
                  <a
                    href="https://quantum-mesh.dev/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pixel-btn text-lg pulse-glow inline-block"
                  >
                    REGISTER YOUR TEAM
                  </a>
                  <p className="text-gray-500 text-xs mt-6">
                    Questions? Email us at hello@quantum-mesh.dev
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-hackathon-surface border-t-2 border-white/30 text-center py-4 text-gray-600 text-xs">
        <p>© 2026 QUANTUM MESH • BUILT WITH REACT + PHASER 3</p>
      </div>
    </div>
  );
}
