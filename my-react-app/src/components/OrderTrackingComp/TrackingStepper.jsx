import React from 'react';
import { FaCheck, FaTruck } from 'react-icons/fa';

const TrackingStepper = () => {
  return (
    <div className="bg-white p-8 rounded-xl border border-gray-100 mb-6 shadow-sm">
      <div className="flex justify-between items-center w-full px-8 relative">
        
        {/* Step 1: Pending */}
        <div className="flex flex-col items-center gap-3 relative z-10 w-32">
          <div className="w-10 h-10 rounded-full bg-[#148348] text-white flex items-center justify-center shadow-md">
            <FaCheck />
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-1">Pending</div>
            <div className="text-[10px] text-gray-400">Oct 12, 09:30 AM</div>
          </div>
        </div>

        {/* Line 1 */}
        <div className="absolute top-5 left-[calc(10%+2.5rem)] right-[calc(35%+2.5rem)] h-[2px] bg-[#148348] z-0"></div>

        {/* Step 2: Accepted */}
        <div className="flex flex-col items-center gap-3 relative z-10 w-32">
          <div className="w-10 h-10 rounded-full bg-[#148348] text-white flex items-center justify-center shadow-md">
            <FaCheck />
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-1">Accepted</div>
            <div className="text-[10px] text-gray-400">Oct 12, 11:45 AM</div>
          </div>
        </div>

        {/* Step 3: Prepared */}
        <div className="flex flex-col items-center gap-3 relative z-10 w-32">
          <div className="w-10 h-10 rounded-full bg-[#148348] text-white flex items-center justify-center shadow-md">
            <FaCheck />
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-1">Prepared</div>
            <div className="text-[10px] text-gray-400">Oct 13, 08:00 AM</div>
          </div>
        </div>

        {/* Step 4: On Delivery */}
        <div className="flex flex-col items-center gap-3 relative z-10 w-32">
          <div className="w-12 h-12 rounded-full bg-white border-4 border-[#148348] text-[#148348] flex items-center justify-center shadow-lg transform -translate-y-1">
            <FaTruck className="text-xl" />
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-[#148348] uppercase tracking-widest mb-1">On Delivery</div>
            <div className="text-[10px] font-semibold text-[#148348]">In Transit Now</div>
          </div>
        </div>

        {/* Line 2 (Gray) */}
        <div className="absolute top-5 left-[calc(65%+2.5rem)] right-[calc(10%+2.5rem)] h-[2px] bg-gray-200 z-0"></div>

        {/* Step 5: Delivered */}
        <div className="flex flex-col items-center gap-3 relative z-10 w-32 opacity-50">
          <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-300 text-gray-400 flex items-center justify-center">
            <FaCheck />
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Delivered</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrackingStepper;
