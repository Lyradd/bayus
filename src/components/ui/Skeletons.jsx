// import React from 'react';

// export const Skeleton = ({ className }) => <div className={`bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md ${className}`} />;

// export const KpiCardSkeleton = () => (
//     <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex items-center gap-4">
//         <Skeleton className="w-14 h-14 rounded-xl" />
//         <div className="flex-1 space-y-2">
//             <Skeleton className="h-4 w-3/4" />
//             <Skeleton className="h-8 w-1/2" />
//         </div>
//     </div>
// );

// export const ChartSkeleton = () => (
//     <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
//         <Skeleton className="h-6 w-1/3 mb-6" />
//         <Skeleton className="h-80 w-full" />
//     </div>
// );

// export const TableSkeleton = () => (
//     <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
//         <Skeleton className="h-6 w-1/3 mb-6" />
//         <div className="space-y-2">
//             {[...Array(5)].map((_, i) => (
//                 <div key={i} className="flex items-center gap-4">
//                     <Skeleton className="h-8 w-1/4" />
//                     <Skeleton className="h-8 w-1/4" />
//                     <Skeleton className="h-8 w-1/4" />
//                     <Skeleton className="h-8 w-1/4" />
//                 </div>
//             ))}
//         </div>
//     </div>
// );

// export const OverallDashboardSkeleton = () => (
//     <div className="space-y-8">
//         <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
//                 <Skeleton className="h-10 w-full" />
//                 <Skeleton className="h-10 w-full" />
//                 <Skeleton className="h-10 w-full" />
//                 <Skeleton className="h-10 w-full" />
//             </div>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             <KpiCardSkeleton />
//             <KpiCardSkeleton />
//             <KpiCardSkeleton />
//             <KpiCardSkeleton />
//         </div>
//         <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
//             <div className="lg:col-span-3"><ChartSkeleton /></div>
//             <div className="lg:col-span-2"><ChartSkeleton /></div>
//         </div>
//         <TableSkeleton />
//     </div>
// );

// export const AiAnalysisSkeleton = () => (
//     <div className="space-y-4">
//         <Skeleton className="h-6 w-1/3" />
//         <Skeleton className="h-4 w-full" />
//         <Skeleton className="h-4 w-5/6" />
//         <Skeleton className="h-4 w-full" />
//         <br />
//         <Skeleton className="h-6 w-1/4" />
//         <Skeleton className="h-4 w-full" />
//         <Skeleton className="h-4 w-4/6" />
//     </div>
// );
