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
    {
      name: 'Total',
      count: total,
      fill: '#FF0000',
    },
    {
      name: 'Girls',
      count: girls,
      fill: '#FAE27c',
    },
    {
      name: 'Boys',
      count: boys,
      fill: '#C3EBFA',
    },
  ];
  const boysPercentage = total > 0 ? Math.round((boys / total) * 100) : 0;
  const girlsPercentage = total > 0 ? Math.round((girls / total) * 100) : 0;

  return (
    <div className='bg-yellow-500 w-full h-full p-4 rounded-md'>
      {/* TITLE */}
      <div className='flex justify-between items-center'>
        <h1 className='text-lg font-semibold'>Students</h1>
        <Image src="/moreDark.png" alt='' width={20} height={20}/>
      </div>
      {/* CHART */}
      <div className='relative w-full h-[75%] '>
        <ResponsiveContainer>
        <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={32} data={data}>
          <RadialBar
          background
          dataKey="count"
          />

        </RadialBarChart>
        </ResponsiveContainer>
        <Image src="/maleFemale.png" alt=''width={50} height={50} className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'/>

      </div>
      {/* BOTTOM */}
      <div className='flex justify-center gap-16'>
        <div className=' flex flex-col gap-1'>
          <div className='w-5 h-5 bg-lamaSky rounded-full'/>
          <h1 className='font-bold'>{boys}</h1>
          <h2 className='text-xs text-gray-700'>Boys({boysPercentage}%)</h2>
        </div>
        <div className=' flex flex-col gap-1'>
          <div className='w-5 h-5 bg-lamaYellow rounded-full'/>
          <h1 className='font-bold'>{girls}</h1>
          <h2 className='text-xs text-gray-700'>Girls({girlsPercentage}%)</h2>
        </div>
      </div>
    </div>
  );
};

export default CountChart;