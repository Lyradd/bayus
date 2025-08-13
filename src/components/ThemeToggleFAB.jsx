// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Moon, Sun } from 'lucide-react';
// import { useTheme } from '../contexts/ThemeContext';

// const ThemeToggleFAB = () => {
//     const { theme, toggleTheme } = useTheme();

//     return (
//         <button
//             onClick={toggleTheme}
//             className={`fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 ${
//                 theme === 'light' 
//                 ? 'bg-slate-800' 
//                 : 'bg-white'
//             }`}
//             aria-label="Toggle theme"
//         >
//             <AnimatePresence mode="wait" initial={false}>
//                 <motion.div
//                     key={theme}
//                     initial={{ y: -20, opacity: 0 }}
//                     animate={{ y: 0, opacity: 1 }}
//                     exit={{ y: 20, opacity: 0 }}
//                     transition={{ duration: 0.2 }}
//                 >
//                     {theme === 'light' ? <Moon className="w-6 h-6 text-white" /> : <Sun className="w-6 h-6 text-yellow-500" />}
//                 </motion.div>
//             </AnimatePresence>
//         </button>
//     );
// };

// export default ThemeToggleFAB;
