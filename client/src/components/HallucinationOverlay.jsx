import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

export default function HallucinationOverlay() {
  const { state, dispatch } = useGame();
  const { hallucinationVisible, hallucination } = state;

  useEffect(() => {
    if (hallucinationVisible) {
      const timer = setTimeout(() => {
        dispatch({ type: 'DISMISS_HALLUCINATION' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [hallucinationVisible, dispatch]);

  return (
    <AnimatePresence>
      {hallucinationVisible && hallucination && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(88,28,135,0.15) 0%, transparent 70%)' }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, filter: 'blur(8px)' }}
            animate={{ scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ scale: 1.05, opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.4 }}
            className="max-w-md mx-4 text-center pointer-events-auto"
            onClick={() => dispatch({ type: 'DISMISS_HALLUCINATION' })}
          >
            <div
              className="border rounded-sm p-6 backdrop-blur-sm cursor-pointer"
              style={{
                borderColor: 'rgba(124,58,237,0.4)',
                backgroundColor: 'rgba(10,4,20,0.85)',
                boxShadow: '0 0 40px rgba(88,28,135,0.3), inset 0 0 40px rgba(88,28,135,0.05)'
              }}
            >
              <motion.p
                animate={{
                  x: [0, -2, 2, -1, 1, 0],
                  opacity: [1, 0.8, 1, 0.9, 1]
                }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="font-gothic text-purple-300 text-base leading-relaxed"
                style={{ textShadow: '0 0 20px rgba(124,58,237,0.6)' }}
              >
                {hallucination}
              </motion.p>
              <p className="text-cave-600 text-xs mt-4 font-mono">[click to dismiss]</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
