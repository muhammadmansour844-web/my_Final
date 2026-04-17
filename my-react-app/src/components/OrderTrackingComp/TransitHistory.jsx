import React from 'react';

const TransitHistory = () => {
  return (
    <div className="bg-[#f7f9f8] p-8 rounded-xl border border-gray-100 shadow-sm">
      <h2 className="text-xs font-bold text-[#105436] uppercase tracking-widest mb-8">Detailed Transit History</h2>

      <div className="relative pl-6 border-l-2 border-gray-200 space-y-10">
        
        {/* Event 1 */}
        <div className="relative">
          <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-[#148348] border-4 border-[#e7f1eb]"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-bold text-gray-900">Arrived at Regional Distribution Hub</h3>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-900 uppercase">Today</span>
              <span className="block text-[10px] text-gray-500">02:15 PM</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed pr-8">
            Package processed through sorting facility. Cold chain sensors confirmed at stable 4°C.
          </p>
        </div>

        {/* Event 2 */}
        <div className="relative">
          <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-gray-300 border-4 border-[#f7f9f8]"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-bold text-gray-900">Departed Manufacturer Facility</h3>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-900 uppercase">Oct 13</span>
              <span className="block text-[10px] text-gray-500">08:00 AM</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed pr-8">
            Global Logistics Express vehicle #GL-772 picked up consignment from PharmaCorp HQ.
          </p>
        </div>

        {/* Event 3 */}
        <div className="relative">
          <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-gray-300 border-4 border-[#f7f9f8]"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-bold text-gray-900">Verification & Quality Check Complete</h3>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-900 uppercase">Oct 12</span>
              <span className="block text-[10px] text-gray-500">03:40 PM</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed pr-8">
            Batch numbers verified against procurement order. Documentation sealed.
          </p>
        </div>

      </div>
    </div>
  );
};

export default TransitHistory;
