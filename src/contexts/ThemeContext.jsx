// import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';

// const ThemeContext = createContext();

// export const ThemeProvider = ({ children }) => {
//     const [theme, setTheme] = useState(() => {
//         if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
//             return 'dark';
//         }
//         return 'light';
//     });

//     useEffect(() => {
//         const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//         const handleChange = (e) => setTheme(e.matches ? 'dark' : 'light');
        
//         try {
//             mediaQuery.addEventListener('change', handleChange);
//         } catch (e) {
//             mediaQuery.addListener(handleChange); // Fallback for older browsers
//         }

//         return () => {
//             try {
//                 mediaQuery.removeEventListener('change', handleChange);
//             } catch (e) {
//                 mediaQuery.removeListener(handleChange);
//             }
//         };
//     }, []);

//     useEffect(() => {
//         const root = window.document.documentElement;
//         root.classList.remove(theme === 'light' ? 'dark' : 'light');
//         root.classList.add(theme);
//     }, [theme]);

//     const toggleTheme = useCallback(() => {
//         setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
//     }, []);

//     const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

//     return (
//         <ThemeContext.Provider value={value}>
//             {children}
//         </ThemeContext.Provider>
//     );
// };

// export const useTheme = () => {
//     const context = useContext(ThemeContext);
//     if (!context) {
//         throw new Error('useTheme must be used within a ThemeProvider');
//     }
//     return context;
// };
