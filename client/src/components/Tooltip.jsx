import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ children, content, position = 'top' }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), 500);
  };
  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  const posStyles = {
    top: { bottom: '110%', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: '110%', left: '50%', transform: 'translateX(-50%)' },
    left: { right: '110%', top: '50%', transform: 'translateY(-50%)' },
    right: { left: '110%', top: '50%', transform: 'translateY(-50%)' },
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'absolute', zIndex: 9999, ...posStyles[position] }}
            className="pointer-events-none"
          >
            <div
              className="px-2.5 py-1.5 text-xs font-mono rounded whitespace-nowrap max-w-xs"
              style={{
                background: '#0e0702',
                border: '0.5px solid rgba(107,74,46,0.5)',
                color: '#d4c9b8',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              }}
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
