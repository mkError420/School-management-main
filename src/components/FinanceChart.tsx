"use client"

import Image from "@/components/Image";
import { useTheme } from "@/context/ThemeContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', income: 4000, expense: 2400 },
  { name: 'Feb', income: 3000, expense: 1398 },
  { name: 'Mar', income: 2000, expense: 9800 },
  { name: 'Apr', income: 2780, expense: 3908 },
  { name: 'May', income: 1890, expense: 4800 },
  { name: 'Jun', income: 2390, expense: 3800 },
  { name: 'Jul', income: 3490, expense: 4300 },
  { name: 'Aug', income: 3490, expense: 4300 },
  { name: 'Sep', income: 3490, expense: 4300 },
  { name: 'Oct', income: 3490, expense: 4300 },
  { name: 'Nov', income: 3490, expense: 4300 },
  { name: 'Dec', income: 3490, expense: 4300 },
];

const FinanceChart = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#9ca3af" : "#374151";
  const gridColor = isDark ? "#374151" : "#e5e7eb";

  return (
    <div className='bg-white dark:bg-gray-800 w-full h-full p-4 rounded-md'>
      <div className='flex justify-between items-center'>
        <h1 className='text-lg font-semibold text-gray-800 dark:text-gray-100'>Finance</h1>
        <Image src="/moreDark.png" alt='' width={20} height={20}/>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
          <XAxis dataKey="name" axisLine={false} tick={{fill: tickColor}} tickLine={false} tickMargin={13}/>
          <YAxis axisLine={false} tick={{fill: tickColor}} tickLine={false}/>
          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              borderColor: isDark ? "#4b5563" : "#e5e7eb",
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              color: isDark ? "#f3f4f6" : "#111827",
            }}
          />
          <Legend align='center' verticalAlign='top' wrapperStyle={{paddingTop:"10px", paddingBottom:"30px"}}/>
          <Line type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={3}/>
          <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinanceChart;