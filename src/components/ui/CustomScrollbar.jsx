// import React from 'react';

// export const GlobalScrollbarStyles = () => {
//     const scrollbarStyles = `
//         .custom-scrollbar::-webkit-scrollbar {
//             width: 8px;
//             height: 8px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//             background-color: transparent;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//             border-radius: 10px;
//             border: 2px solid transparent;
//             background-clip: content-box;
//         }
//         .light .custom-scrollbar::-webkit-scrollbar-thumb {
//             background-color: #cbd5e1; /* slate-300 */
//         }
//         .light .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//             background-color: #94a3b8; /* slate-400 */
//         }
//         .dark .custom-scrollbar::-webkit-scrollbar-thumb {
//             background-color: #475569; /* slate-600 */
//         }
//         .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//             background-color: #64748b; /* slate-500 */
//         }
//     `;
//     return <style>{scrollbarStyles}</style>;
// };

// const CustomScrollbar = ({ children, className, ...props }) => {
//     return (
//         <div className={`custom-scrollbar h-full overflow-y-auto ${className || ''}`} {...props}>
//             {children}
//         </div>
//     );
// };

// export default CustomScrollbar;
