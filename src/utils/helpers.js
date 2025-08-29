// export const loadScript = (src) => {
//     return new Promise((resolve, reject) => {
//         if (document.querySelector(`script[src="${src}"]`)) {
//             resolve();
//             return;
//         }
//         const script = document.createElement('script');
//         script.src = src;
//         script.async = true;
//         script.onload = resolve;
//         script.onerror = reject;
//         document.head.appendChild(script);
//     });
// };

// const monthMapping = {
//     'januari': 1, 'jan': 1, 'februari': 2, 'feb': 2, 'maret': 3, 'mar': 3, 'april': 4, 'apr': 4, 'mei': 5,
//     'juni': 6, 'jun': 6, 'juli': 7, 'jul': 7, 'agustus': 8, 'agu': 8, 'ags': 8, 'september': 9, 'sep': 9,
//     'oktober': 10, 'okt': 10, 'november': 11, 'nov': 11, 'desember': 12, 'des': 12
// };

// export const getMonthNumber = (monthName) => {
//     if (!monthName) return 0;
//     const lowerMonth = String(monthName).toLowerCase().trim();
//     return monthMapping[lowerMonth] || 0;
// };
// export const formatDate = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return '';
//     return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
// };