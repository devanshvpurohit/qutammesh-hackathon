import { useEffect, useState } from 'react';
import { EventBus } from '../game/EventBus';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { RegistrationForm } from './RegistrationForm';

interface ModalData {
    id: string;
    title: string;
    content: string;
}

export const OverlayModals = () => {
    const [modals, setModals] = useState<ModalData[]>([]);

    useEffect(() => {
        const handleOpen = (data: ModalData) => {
            setModals(prev => {
                if (prev.find(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
        };

        const handleClose = (id: string) => {
            setModals(prev => prev.filter(m => m.id !== id));
        };

        EventBus.on('open-modal', handleOpen);
        EventBus.on('close-modal', handleClose);

        return () => {
            EventBus.removeListener('open-modal');
            EventBus.removeListener('close-modal');
        };
    }, []);

    useEffect(() => {
        EventBus.emit('modal-active', modals.length > 0);
    }, [modals]);

    const closeAll = () => setModals([]);

    // Get modal icon based on title
    const getIcon = (title: string) => {
        if (title.includes('ABOUT')) return '📋';
        if (title.includes('SCHEDULE')) return '📅';
        if (title.includes('TRACK')) return '🚀';
        if (title.includes('COMPLETED') || title.includes('MISSION')) return '🏆';
        return '💡';
    };

    return (
        <AnimatePresence>
            {modals.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAll} />

                    <div className="flex flex-col gap-4 max-w-xl w-full mx-4 relative z-10">
                        {modals.map((modal, index) => (
                            <motion.div
                                key={modal.id}
                                initial={{ y: 80, opacity: 0, scale: 0.9 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: -40, opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                                className="relative bg-hackathon-surface border-4 border-white/80 p-6 text-white"
                                style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.8), 0 0 40px rgba(74,222,128,0.1)' }}
                            >
                                {/* Close button */}
                                <button
                                    onClick={() => EventBus.emit('close-modal', modal.id)}
                                    className="absolute -top-3 -right-3 bg-red-500 border-3 border-black text-white p-1.5 hover:bg-red-400 transition-colors z-10 cursor-pointer"
                                    style={{ boxShadow: '3px 3px 0px rgba(0,0,0,1)' }}
                                >
                                    <X size={18} className="stroke-[3]" />
                                </button>

                                {/* Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl">{getIcon(modal.title)}</span>
                                    <div>
                                        <h2 className="text-lg md:text-xl text-hackathon-primary glow-text">
                                            {modal.id === 'credits' ? '🏆 MISSION ACCOMPLISHED' : modal.title}
                                        </h2>
                                        <div className="gradient-underline w-full mt-1 rounded-full" />
                                    </div>
                                </div>

                                {/* Body */}
                                {(modal.id === 'register' || modal.id === 'credits') ? (
                                    <RegistrationForm isCredits={modal.id === 'credits'} />
                                ) : (
                                    <div className="bg-black/30 border border-white/10 p-4 rounded">
                                        <p className="text-xs md:text-sm leading-relaxed text-gray-200">{modal.content}</p>
                                    </div>
                                )}

                                {/* Press any key hint */}
                                <div className="mt-4 text-center">
                                    <p className="text-[8px] text-gray-500 tracking-wider">CLICK ✕ TO CLOSE</p>
                                </div>
                            </motion.div>
                        ))}

                        {modals.length > 1 && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={closeAll}
                                className="pixel-btn mt-2 self-center text-xs"
                            >
                                CLOSE ALL
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
