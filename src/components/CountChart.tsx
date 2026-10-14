import React from "react";
import Image from "@/components/Image";
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface CountChartProps {
  boys?: number;
  girls?: number;
}

const CountChart: React.FC<CountChartProps> = ({ boys = 0, girls = 0 }) => {
  const total = boys + girls;
  const data = [
    { name: 'Total', count: total, fill: '#485262' },
    { name: 'Girls', count: girls, fill: '#D32F45' },
    { name: 'Boys', count: boys, fill: '#707E94' },
  ];
  const boysPercentage = total > 0 ? Math.round((boys / total) * 100) : 0;
  const girlsPercentage = total > 0 ? Math.round((girls / total) * 100) : 0;

  return (
    <div className='bg-white dark:bg-gray-800 w-full h-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-sm'>
      {/* TITLE */}
      <div className='flex justify-between items-center'>
        <h1 className='text-lg font-bold text-black dark:text-white'>Students</h1>
        <Image src="/moreDark.png" alt='' width={20} height={20} className="dark:brightness-0 dark:invert" />
      </div>
      {/* CHART */}
      <div className='relative w-full h-[75%]'>
        <ResponsiveContainer>
          <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={32} data={data}>
            <RadialBar background dataKey="count" />
          </RadialBarChart>
        </ResponsiveContainer>
        <Image src="/maleFemale.png" alt='' width={50} height={50} className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'/>
      </div>
      {/* BOTTOM */}
      <div className='flex justify-center gap-16'>
        <div className='flex flex-col items-center gap-1'>
          <div className='w-4 h-4 bg-[#707E94] rounded-full shadow-xs'/>
          <h1 className='font-bold text-black dark:text-white text-base'>{boys}</h1>
          <h2 className='text-xs font-semibold text-gray-700 dark:text-gray-300'>Boys ({boysPercentage}%)</h2>
        </div>
        <div className='flex flex-col items-center gap-1'>
          <div className='w-4 h-4 bg-[#D32F45] rounded-full shadow-xs'/>
          <h1 className='font-bold text-black dark:text-white text-base'>{girls}</h1>
          <h2 className='text-xs font-semibold text-gray-700 dark:text-gray-300'>Girls ({girlsPercentage}%)</h2>
        </div>
      </div>
    </div>
  );
};

export default CountChart;