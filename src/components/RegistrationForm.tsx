import { useState } from 'react';
import { EventBus } from '../game/EventBus';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export const RegistrationForm = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => {
            EventBus.emit('close-modal', 'register');
        }, 3000);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 text-left">
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
