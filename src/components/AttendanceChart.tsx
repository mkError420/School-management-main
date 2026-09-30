"use client"

import Image from 'next/image';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// #region Sample data
const data = [
  {
    name: 'Sun',
    present: 90,
    absent: 10,
    
  },
  {
    name: 'Mon',
    present: 80,
    absent: 20,
    
  },
  {
    name: 'Tue',
    present: 75,
    absent: 25,
    
  },
  {
    name: 'Wed',
    present: 60,
    absent: 40,
    
  },
  {
    name: 'Thu',
    present: 70,
    absent: 40,
    
  },
  
];
const AttendanceChart = () => {
  return (
    <div className='bg-white rounded-lg p-4 h-full'>
      <div className='flex justify-between items-center'>
        <h1 className='text-lg font-semibold'>Attendence</h1>
        <Image src="/moreDark.png" alt='' width={20} height={20}/>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart width={500}
          height={300}
          data={data}
          barSize={20}
          /* margin={{ top: 5, right: 30, left: 20, bottom: 5 }}  */
          >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke='#ddd'/>
          <XAxis dataKey="name" axisLine={false} tick={{fill:"black"}} tickLine={false} />
          <YAxis  axisLine={false} tick={{fill:"black"}} tickLine={false}/>
          <Tooltip contentStyle={{borderRadius:"10px", borderColor:"lightgray"}} />
          <Legend align='left' verticalAlign='top' wrapperStyle={{paddingTop:"20px", paddingBottom:"40px"}}/>
          <Bar dataKey="present" fill="#8884d8" activeBar={<Rectangle fill="pink" stroke='blue'/>} 
          legendType='circle'
          radius={[10,10,0,0]}
          />
          <Bar dataKey="absent" fill="red" activeBar={<Rectangle fill="gold" stroke='purple'/>}
          legendType='circle'
          radius={[10,10,0,0]}
          />
        </BarChart>
        
      </ResponsiveContainer> 
      </div>
  )
}

export default AttendanceChart