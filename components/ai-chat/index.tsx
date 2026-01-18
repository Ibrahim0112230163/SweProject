'use client';

import { useState } from 'react';
import { ChatButton } from './chat-button';
import { ChatBox } from './chat-box';
import { AnimatePresence, motion } from 'framer-motion';

export function FloatingAIChat() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="origin-bottom-right"
                    >
                        <ChatBox />
                    </motion.div>
                )}
            </AnimatePresence>
            <ChatButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        </div>
    );
}
