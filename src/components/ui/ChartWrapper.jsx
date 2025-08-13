// import React, { useEffect, useRef } from 'react';
// import { useTheme } from '../../contexts/ThemeContext';

// const ChartWrapper = ({ chartId, type, data, options, fallbackText }) => {
//     const chartRef = useRef(null);
//     const canvasRef = useRef(null);
//     const { theme } = useTheme();

//     useEffect(() => {
//         if (!window.Chart || !canvasRef.current) return;
//         if (chartRef.current) chartRef.current.destroy();
//         if (!data || (data.datasets && data.datasets.every(ds => ds.data.every(d => d === 0)))) {
//             return;
//         }

//         const isDark = theme === 'dark';
//         const tickColor = isDark ? '#9ca3af' : '#4b5563';
//         const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
//         const legendColor = isDark ? '#d1d5db' : '#374151';
//         const tooltipBgColor = isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(17, 24, 39, 0.95)';
//         const tooltipTitleColor = isDark ? '#f3f4f6' : '#f3f4f6';
//         const tooltipBodyColor = isDark ? '#f3f4f6' : '#f3f4f6';

//         const themeOptions = {
//             scales: {
//                 y: { ticks: { color: tickColor }, grid: { color: gridColor } },
//                 x: { ticks: { color: tickColor }, grid: { color: gridColor } }
//             },
//             plugins: {
//                 legend: { labels: { color: legendColor } },
//                 tooltip: { backgroundColor: tooltipBgColor, titleColor: tooltipTitleColor, bodyColor: tooltipBodyColor }
//             }
//         };

//         const finalOptions = { ...options, ...themeOptions };
//         if (options.scales) {
//             finalOptions.scales.y = { ...options.scales.y, ...themeOptions.scales.y };
//             finalOptions.scales.x = { ...options.scales.x, ...themeOptions.scales.x };
//         }
//         if (options.plugins) {
//             finalOptions.plugins.legend = { ...options.plugins.legend, ...themeOptions.plugins.legend };
//             finalOptions.plugins.tooltip = { ...options.plugins.tooltip, ...themeOptions.plugins.tooltip };
//         }

//         try {
//             chartRef.current = new window.Chart(canvasRef.current, { type, data, options: finalOptions });
//         } catch (error) {
//             console.error("Chart.js error:", error);
//         }
        
//         return () => {
//             if (chartRef.current) {
//                 chartRef.current.destroy();
//                 chartRef.current = null;
//             }
//         };
//     }, [type, data, options, theme]);

//     const hasData = data && data.datasets && data.datasets.some(ds => ds.data.some(d => d > 0));

//     return (
//         <div className="h-80 w-full">
//             {hasData ? (
//                 <canvas id={chartId} ref={canvasRef}></canvas>
//             ) : (
//                 <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
//                     <div className="text-center">
//                         {fallbackText.icon}
//                         <p>{fallbackText.text}</p>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ChartWrapper;
