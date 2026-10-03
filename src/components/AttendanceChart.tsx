"use client"

import Image from "@/components/Image";
import { useTheme } from "@/context/ThemeContext";
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Sun', present: 90, absent: 10 },
  { name: 'Mon', present: 80, absent: 20 },
  { name: 'Tue', present: 75, absent: 25 },
  { name: 'Wed', present: 60, absent: 40 },
  { name: 'Thu', present: 70, absent: 40 },
];

const AttendanceChart = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#9ca3af" : "#374151";
  const gridColor = isDark ? "#374151" : "#e5e7eb";

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg p-4 h-full'>
      <div className='flex justify-between items-center'>
        <h1 className='text-lg font-semibold text-gray-800 dark:text-gray-100'>Attendance</h1>
        <Image src="/moreDark.png" alt='' width={20} height={20}/>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart width={500} height={300} data={data} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
          <XAxis dataKey="name" axisLine={false} tick={{fill: tickColor}} tickLine={false} />
          <YAxis axisLine={false} tick={{fill: tickColor}} tickLine={false}/>
          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              borderColor: isDark ? "#4b5563" : "lightgray",
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              color: isDark ? "#f3f4f6" : "#111827",
            }}
          />
          <Legend align='left' verticalAlign='top' wrapperStyle={{paddingTop:"20px", paddingBottom:"40px"}}/>
          <Bar dataKey="present" fill="#8884d8" activeBar={<Rectangle fill="pink" stroke='blue'/>} legendType='circle' radius={[10,10,0,0]}/>
          <Bar dataKey="absent" fill="#ef4444" activeBar={<Rectangle fill="gold" stroke='purple'/>} legendType='circle' radius={[10,10,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;