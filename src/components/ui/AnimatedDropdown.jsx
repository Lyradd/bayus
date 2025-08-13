// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ChevronDown } from 'lucide-react';

// const AnimatedDropdown = ({ options, selectedValue, onValueChange, placeholder, includeAllOption = false }) => {
//     const [isOpen, setIsOpen] = useState(false);
//     const dropdownRef = useRef(null);

//     useEffect(() => {
//         const handleClickOutside = (event) => {
//             if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//                 setIsOpen(false);
//             }
//         };
//         document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, []);

//     const handleSelect = (value) => {
//         onValueChange(value);
//         setIsOpen(false);
//     };

//     const displayValue = !selectedValue || selectedValue === 'semua' ? placeholder : selectedValue;

//     return (
//         <div className="relative w-full" ref={dropdownRef}>
//             <button
//                 onClick={() => setIsOpen(!isOpen)}
//                 className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-sky-500 flex justify-between items-center transition-colors duration-300"
//             >
//                 <span className="truncate">{displayValue}</span>
//                 <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
//                     <ChevronDown className="w-5 h-5" />
//                 </motion.div>
//             </button>
//             <AnimatePresence>
//                 {isOpen && (
//                     <motion.ul
//                         initial={{ opacity: 0, y: -10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         exit={{ opacity: 0, y: -10 }}
//                         className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar"
//                     >
//                         {includeAllOption && (
//                             <li
//                                 onClick={() => handleSelect('semua')}
//                                 className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-sky-100 dark:hover:bg-sky-800 cursor-pointer"
//                             >
//                                 {placeholder}
//                             </li>
//                         )}
//                         {options.map(option => (
//                             <li
//                                 key={option}
//                                 onClick={() => handleSelect(option)}
//                                 className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-sky-100 dark:hover:bg-sky-800 cursor-pointer"
//                             >
//                                 {option}
//                             </li>
//                         ))}
//                     </motion.ul>
//                 )}
//             </AnimatePresence>
//         </div>
//     );
// };

// export default AnimatedDropdown;
