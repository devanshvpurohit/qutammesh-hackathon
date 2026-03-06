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
        }, 3000);
    };

    // Prevent WASD/Arrows from moving player while typing in form
    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
    };

    if (isCredits) {
        return (
            <div className="relative overflow-hidden h-[400px] flex flex-col items-center">
                <motion.div
                    initial={{ y: 400 }}
                    animate={{ y: -600 }}
                    transition={{ duration: 15, ease: "linear" }}
                    className="flex flex-col items-center gap-12 text-center"
                >
                    <div className="flex flex-col gap-4">
                        <h3 className="text-3xl text-hackathon-primary">QUANTUM MESH</h3>
                        <p className="text-xl">A Journey Through Code</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-hackathon-secondary text-sm">DESIGNED BY</p>
                        <p className="text-lg">ANTIGRAVITY AI</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-hackathon-secondary text-sm">ENHANCED BY</p>
                        <p className="text-lg">THE USER</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-hackathon-secondary text-sm">SPECIAL THANKS</p>
                        <p className="text-lg text-white">PHASER ENGINE</p>
                        <p className="text-lg text-white">REACT CORE TEAM</p>
                        <p className="text-lg text-white">LUCIDE ICONS</p>
                    </div>

                    <div className="mt-12">
                        <h4 className="text-2xl text-hackathon-primary mb-2">THE FUTURE AWAITS</h4>
                        <p className="text-sm opacity-60">SEE YOU IN THE NEXT DIMENSION</p>
                    </div>
                </motion.div>

                {!isSubmitted ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="absolute bottom-4 left-0 right-0 bg-black/80 p-6 border-4 border-hackathon-primary"
                    >
                        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-hackathon-secondary">TEAM NAME:</label>
                                <input required type="text" className="bg-black border-2 border-white p-2 text-white font-pixel text-xs outline-none focus:border-hackathon-primary" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-hackathon-secondary">EMAIL:</label>
                                <input required type="email" className="bg-black border-2 border-white p-2 text-white font-pixel text-xs outline-none focus:border-hackathon-primary" />
                            </div>
                            <button type="submit" className="pixel-btn bg-hackathon-primary text-black py-2">SUBMIT TO DIMENSION</button>
                        </form>
                    </motion.div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                        <div className="text-center">
                            <h3 className="text-2xl text-hackathon-primary mb-2">QUEST ACCEPTED!</h3>
                            <p className="text-white">SEE YOU IN THE NEXT DIMENSION.</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4 mt-4 text-left">
            {!isSubmitted ? (
                <>
                    <p className="text-gray-300 text-sm mb-4">You have reached the final castle. Enter your details to secure your spot at Quantum Mesh 2026.</p>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-hackathon-secondary">Team Name:</label>
                        <input required type="text" className="bg-black border-2 border-white p-2 text-white font-pixel outline-none focus:border-hackathon-primary" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-hackathon-secondary">Email:</label>
                        <input required type="email" className="bg-black border-2 border-white p-2 text-white font-pixel outline-none focus:border-hackathon-primary" />
                    </div>
                    <button type="submit" className="pixel-btn mt-6 bg-hackathon-primary text-black">SUBMIT QUEST</button>
                </>
            ) : (
                <div className="text-center py-8">
                    <h3 className="text-2xl text-hackathon-primary mb-2">QUEST ACCEPTED!</h3>
                    <p className="text-white">See you at the hackathon.</p>
                </div>
            )}
        </form>
    );
};
