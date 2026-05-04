import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export const Card: React.FC<HTMLMotionProps<"div">> = ({ className = '', children, ...props }) => {
  return (
    <motion.div 
      className={`p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 ${className}`} 
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
