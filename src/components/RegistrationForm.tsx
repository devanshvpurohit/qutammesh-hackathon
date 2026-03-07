import { useState } from 'react';
import { EventBus } from '../game/EventBus';
import { motion } from 'framer-motion';

interface RegistrationFormProps {
    isCredits?: boolean;
}

export const RegistrationForm = ({ isCredits }: RegistrationFormProps) => {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => {
            EventBus.emit('close-modal', isCredits ? 'credits' : 'register');
        }, 4000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
    };

    const inputClass = "w-full bg-black/60 border-2 border-white/30 p-2 text-white font-pixel text-[10px] outline-none focus:border-hackathon-primary focus:shadow-[0_0_10px_rgba(74,222,128,0.3)] transition-all";
    const labelClass = "text-[9px] text-hackathon-secondary tracking-wider uppercase";

    if (isCredits) {
        return (
            <div className="relative overflow-hidden h-[420px] flex flex-col items-center">
                <motion.div
                    initial={{ y: 420 }}
                    animate={{ y: -700 }}
                    transition={{ duration: 16, ease: "linear" }}
                    className="flex flex-col items-center gap-10 text-center"
                >
                    <div className="flex flex-col gap-3">
                        <h3 className="text-2xl text-hackathon-primary glow-text">QUANTUM MESH</h3>
                        <p className="text-sm text-hackathon-accent">A Journey Through Code</p>
                        <div className="gradient-underline w-32 mx-auto mt-2 rounded-full" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-hackathon-secondary text-[10px] tracking-widest">DESIGNED BY</p>
                        <p className="text-sm">ANTIGRAVITY AI</p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-hackathon-secondary text-[10px] tracking-widest">BUILT WITH</p>
                        <p className="text-sm text-white">PHASER 3 • REACT • VITE</p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-hackathon-secondary text-[10px] tracking-widest">SPECIAL THANKS</p>
                        <p className="text-sm text-white">PHASER ENGINE</p>
                        <p className="text-sm text-white">REACT CORE TEAM</p>
                        <p className="text-sm text-white">FRAMER MOTION</p>
                    </div>

                    <div className="mt-8">
                        <p className="text-xs text-hackathon-primary glow-text">★ SYSTEM STABILIZED ★</p>
                        <p className="text-[10px] text-gray-400 mt-2">REGISTER YOUR TEAM BELOW</p>
                    </div>
                </motion.div>

                {!isSubmitted ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 }}
                        className="absolute bottom-0 left-0 right-0 bg-hackathon-surface/95 backdrop-blur p-4 border-t-4 border-hackathon-primary"
                    >
                        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className={labelClass}>Team Name</label>
                                    <input required type="text" className={inputClass} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className={labelClass}>Team Lead</label>
                                    <input required type="text" className={inputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className={labelClass}>Contact</label>
                                    <input required type="tel" className={inputClass} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className={labelClass}>College</label>
                                    <input required type="text" className={inputClass} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className={labelClass}>Members Names</label>
                                <input required type="text" className={inputClass} placeholder="Name 1, Name 2, ..." />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className={labelClass}>Members Emails</label>
                                <input required type="text" className={inputClass} placeholder="email1, email2, ..." />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className={labelClass}>Track</label>
                                <select className={inputClass}>
                                    <option>AI / Machine Learning</option>
                                    <option>Web3 / Blockchain</option>
                                    <option>Climate Tech</option>
                                    <option>Open Innovation</option>
                                </select>
                            </div>
                            <button type="submit" className="pixel-btn bg-hackathon-primary text-black py-2 mt-1 text-[10px] sticky bottom-0">
                                🚀 REGISTER TEAM
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/95"
                    >
                        <div className="text-center">
                            <div className="text-5xl mb-4">🎉</div>
                            <h3 className="text-xl text-hackathon-primary glow-text mb-3">QUEST ACCEPTED!</h3>
                            <p className="text-xs text-gray-300">Your team has been registered.</p>
                            <p className="text-[10px] text-hackathon-accent mt-2">SEE YOU IN THE NEXT DIMENSION</p>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4 mt-4 text-left max-h-[60vh] overflow-y-auto pr-3 custom-scrollbar">
            {!isSubmitted ? (
                <>
                    <div className="bg-black/30 border border-hackathon-primary/20 p-3 rounded">
                        <p className="text-gray-300 text-[10px] leading-relaxed">
                            🏰 You've reached the final castle! Enter your team's details to secure your spot at Quantum Mesh 2026.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Team Name</label>
                            <input required type="text" className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Team Lead Name</label>
                            <input required type="text" className={inputClass} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>College / Institution</label>
                            <input required type="text" className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Contact Number</label>
                            <input required type="tel" className={inputClass} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className={labelClass}>Members Names (comma separated)</label>
                        <textarea required className={`${inputClass} h-16 resize-none`} placeholder="Name 1, Name 2, Name 3"></textarea>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className={labelClass}>Team Members Email IDs (comma separated)</label>
                        <textarea required className={`${inputClass} h-16 resize-none`} placeholder="email1@example.com, email2@example.com"></textarea>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className={labelClass}>Select Track</label>
                        <select className={inputClass}>
                            <option>AI / Machine Learning</option>
                            <option>Web3 / Blockchain</option>
                            <option>Climate Tech</option>
                            <option>Open Innovation</option>
                        </select>
                    </div>

                    <button type="submit" className="pixel-btn mt-4 bg-hackathon-primary text-black sticky bottom-0 text-xs">
                        🚀 SUBMIT REGISTRATION
                    </button>
                </>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                >
                    <div className="text-5xl mb-4">🎉</div>
                    <h3 className="text-xl text-hackathon-primary glow-text mb-3">QUEST ACCEPTED!</h3>
                    <p className="text-xs text-white">Your team is registered for Quantum Mesh 2026.</p>
                    <p className="text-[10px] text-hackathon-secondary mt-2">SEE YOU AT THE HACKATHON</p>
                </motion.div>
            )}
        </form>
    );
};
