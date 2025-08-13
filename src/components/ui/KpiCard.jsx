// import React from 'react';

// const KpiCard = ({ icon, title, value, unit, colorClass, small = false }) => (
//     <div className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-colors duration-300 ${small ? 'p-4' : 'p-6'}`}>
//         <div className={`p-3 rounded-xl ${colorClass.bg} ${small ? 'p-2' : 'p-3'}`}>
//             {React.cloneElement(icon, { className: ` ${colorClass.text} ${small ? 'w-6 h-6' : 'w-8 h-8'}` })}
//         </div>
//         <div>
//             <p className={`text-gray-600 dark:text-gray-400 font-medium ${small ? 'text-xs' : 'text-sm'}`}>{title}</p>
//             <p className={`font-bold text-gray-800 dark:text-gray-200 ${small ? 'text-2xl' : 'text-3xl'}`}>{value} {unit && <span className={small ? 'text-base' : 'text-lg'}>{unit}</span>}</p>
//         </div>
//     </div>
// );

// export default KpiCard;
