import React from 'react';

const TrackingHeader = ({ orderId, status }) => {
  return (
    <div className="mb-8 flex justify-between items-end border-b border-gray-100 pb-6">
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          MY ORDERS / <span className="text-[#08301f]">ORDER TRACKING</span>
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-[#08301f] tracking-tight">
            Order #{orderId}
          </h1>
          <div className="px-3 py-1 bg-[#52f08a] text-[#08301f] text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 bg-[#08301f] rounded-full"></span>
            {status}
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button className="px-6 py-2 bg-white text-[#08301f] text-xs font-bold uppercase tracking-widest border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          Download Invoice
        </button>
        <button className="px-6 py-2 bg-[#08301f] text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#124d33] transition-colors shadow-md shadow-[#08301f]/20">
          Contact Supplier
        </button>
      </div>
    </div>
  );
};

export default TrackingHeader;
