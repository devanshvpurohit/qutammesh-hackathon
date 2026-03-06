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

    const closeAll = () => setModals([]);

    return (
        <AnimatePresence>
            {modals.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-auto"
                >
                    <div className="flex flex-col gap-4 max-w-xl w-full mx-4">
                        {modals.map((modal, index) => (
                            <motion.div
                                key={modal.id}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -50, opacity: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="pixel-card relative text-white"
                            >
                                <button
                                    onClick={() => EventBus.emit('close-modal', modal.id)}
                                    className="absolute -top-4 -right-4 bg-red-500 border-4 border-black text-white p-2 hover:bg-red-400 z-10"
                                >
                                    <X size={24} className="stroke-[3]" />
                                </button>

                                <h2 className="text-2xl text-hackathon-primary mb-4">{modal.id === 'credits' ? 'MISSION ACCOMPLISHED' : modal.title}</h2>
                                {(modal.id === 'register' || modal.id === 'credits') ? (
                                    <RegistrationForm isCredits={modal.id === 'credits'} />
                                ) : (
                                    <p className="text-sm leading-relaxed">{modal.content}</p>
                                )}
                            </motion.div>
                        ))}

                        {modals.length > 1 && (
                            <button onClick={closeAll} className="pixel-btn mt-4 self-center">Close All</button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
