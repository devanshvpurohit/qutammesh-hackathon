import { useEffect, useState, useRef } from 'react';
import { EventBus } from '../game/EventBus';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { RegistrationForm } from './RegistrationForm';

interface ModalData {
    id: string;
    title: string;
    content: string;
}

/* ───── Typewriter hook ───── */
function useTypewriter(text: string, speed: number = 30) {
    const [displayed, setDisplayed] = useState('');
    const indexRef = useRef(0);

    useEffect(() => {
        setDisplayed('');
        indexRef.current = 0;
        const timer = setInterval(() => {
            indexRef.current++;
            setDisplayed(text.slice(0, indexRef.current));
            if (indexRef.current >= text.length) clearInterval(timer);
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return displayed;
}

/* ───── Zelda-style Dialogue Box (non-blocking) ───── */
const DialogueBox = ({ data, onDone }: { data: ModalData; onDone: () => void }) => {
    const typed = useTypewriter(data.content, 30);
    const [isExiting, setIsExiting] = useState(false);
    const isFinished = typed === data.content;

    // Auto-dismiss after content is typed + short pause
    useEffect(() => {
        const totalTime = data.content.length * 30 + 3500; // typing time + 3.5s pause
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onDone, 400);
        }, totalTime);
        return () => clearTimeout(timer);
    }, [data.content, onDone]);

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={isExiting ? { y: 20, opacity: 0 } : { y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-[90%] max-w-2xl mx-auto absolute bottom-8 left-0 right-0 z-40 pointer-events-none"
        >
            <div
                className="relative bg-black/50 backdrop-blur-lg text-white px-6 py-5 font-pixel leading-loose"
                style={{
                    border: '4px solid #b45309', // Dark gold/wood border
                    borderRadius: '4px',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 10px 25px rgba(0,0,0,0.6)',
                    minHeight: '120px',
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(180,83,9,0.1) 100%)'
                }}
            >
                {/* Corner Accents */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-600/60" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-600/60" />
                <div className="absolute bottom-1 left-1 w-2 h-2 bg-yellow-600/60" />
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-600/60" />

                <div className="text-[10px] text-yellow-500 mb-3 tracking-widest uppercase">
                    {data.title}
                </div>

                <p className="text-xs md:text-sm text-gray-200">
                    {typed}
                </p>

                {/* Blinking Triangle (Press A to continue vibe) */}
                {isFinished && (
                    <motion.div
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute bottom-4 right-5 text-yellow-500 text-xs"
                    >
                        ▼
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

/* ───── Main Overlay Component ───── */
export const OverlayModals = () => {
    const [cloud, setCloud] = useState<ModalData | null>(null);
    const [cloudKey, setCloudKey] = useState(0);
    const [blockingModal, setBlockingModal] = useState<ModalData | null>(null);

    useEffect(() => {
        const handleOpen = (data: ModalData) => {
            // Credits / Register = blocking modal
            if (data.id === 'credits' || data.id === 'register') {
                setBlockingModal(data);
                EventBus.emit('modal-active', true);
                return;
            }

            // Everything else = cloud notification (non-blocking, IMMEDIATE override)
            setCloud(data);
            setCloudKey(prev => prev + 1); // force re-mount for fresh typewriter
        };

        const handleClose = (id: string) => {
            if (blockingModal?.id === id) {
                setBlockingModal(null);
                EventBus.emit('modal-active', false);
            }
        };

        EventBus.on('open-modal', handleOpen);
        EventBus.on('close-modal', handleClose);

        return () => {
            EventBus.removeListener('open-modal');
            EventBus.removeListener('close-modal');
        };
    }, [blockingModal]);

    const handleCloudDone = () => {
        setCloud(null);
    };

    return (
        <>
            {/* ──── Zelda Dialogue Layer (NON-BLOCKING) ──── */}
            <AnimatePresence>
                {cloud && (
                    <DialogueBox
                        key={cloudKey}
                        data={cloud}
                        onDone={handleCloudDone}
                    />
                )}
            </AnimatePresence>

            {/* ──── Blocking Modal Layer (registration / credits ONLY) ──── */}
            <AnimatePresence>
                {blockingModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto"
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => {
                                setBlockingModal(null);
                                EventBus.emit('modal-active', false);
                            }}
                        />

                        <motion.div
                            initial={{ y: 80, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -40, opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="relative bg-hackathon-surface border-4 border-white/80 p-6 text-white max-w-xl w-full mx-4 z-10"
                            style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.8), 0 0 40px rgba(74,222,128,0.1)' }}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => {
                                    EventBus.emit('close-modal', blockingModal.id);
                                }}
                                className="absolute -top-3 -right-3 bg-red-500 border-3 border-black text-white p-1.5 hover:bg-red-400 transition-colors z-10 cursor-pointer"
                                style={{ boxShadow: '3px 3px 0px rgba(0,0,0,1)' }}
                            >
                                <X size={18} className="stroke-[3]" />
                            </button>

                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">🏆</span>
                                <div>
                                    <h2 className="text-lg md:text-xl text-hackathon-primary glow-text">
                                        {blockingModal.id === 'credits' ? 'MISSION ACCOMPLISHED' : blockingModal.title}
                                    </h2>
                                    <div className="gradient-underline w-full mt-1 rounded-full" />
                                </div>
                            </div>

                            {/* Body */}
                            <RegistrationForm isCredits={blockingModal.id === 'credits'} />

                            <div className="mt-4 text-center">
                                <p className="text-[8px] text-gray-500 tracking-wider">CLICK ✕ TO CLOSE</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
