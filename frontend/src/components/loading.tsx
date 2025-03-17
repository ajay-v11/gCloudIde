import {Loader2} from 'lucide-react';

function Loading() {
  return (
    <div className='flex flex-row h-screen'>
      <div className='bg-[#1e1e1e] w-1/12 h-full flex flex-col gap-4 '>
        <div className='w-4/5 h-4 bg-[#2a2a2a] rounded animate-pulse p-2 mt-10 mx-1'></div>
        <div className='w-4/5 h-4 bg-[#2a2a2a] rounded animate-pulse p-2 mx-1'></div>
        <div className='w-4/5 h-4 bg-[#2a2a2a] rounded animate-pulse p-2 mx-1'></div>
      </div>
      <div className='bg-black w-7/12 flex flex-col gap-5 text-white items-start'>
        <div className='w-2/3 h-4 bg-[#2a2a2a] rounded animate-pulse p-2 mx-2 mt-10'></div>
        <div className='w-1/3 h-4 bg-[#2a2a2a] rounded animate-pulse p-2 mx-2'></div>
        <div className='w-2/5 h-4 bg-[#2a2a2a] rounded animate-pulse p-2 mx-2'></div>
        <div className='w-3/5 h-4 bg-[#2a2a2a] rounded animate-pulse p-2 mx-2'></div>
        <div className='w-1/3 h-4 bg-[#2a2a2a] rounded animate-pulse p-2 mx-2'></div>
        <div className='flex justify-center items-center ml-96'>
          <Loader2 className='text-white animate-spin mb-4 w-10 h-10' /> Runtime
          is booting
        </div>
      </div>
      <div className='bg-slate-300 w-4/12 flex flex-col gap-5 text-white items-start'>
        <div className='w-2/3 h-4 bg-gray-400 rounded animate-pulse p-2 mx-2 mt-10'></div>
        <div className='w-1/3 h-4 bg-gray-400 rounded animate-pulse p-2 mx-2'></div>
        <div className='w-2/5 h-4 bg-gray-400 rounded animate-pulse p-2 mx-2'></div>
        <div className='w-3/5 h-4 bg-gray-400 rounded animate-pulse p-2 mx-2'></div>
        <div className='w-1/3 h-4 bg-gray-400 rounded animate-pulse p-2 mx-2'></div>
      </div>
    </div>
  );
}

export default Loading;
