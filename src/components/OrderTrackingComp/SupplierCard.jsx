import React from 'react';
import { FaBuilding, FaStar } from 'react-icons/fa';

const SupplierCard = () => {
  return (
    <div className="bg-[#103622] rounded-xl p-6 shadow-md mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#1a4a31] text-[#52f08a] flex items-center justify-center">
          <FaBuilding />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">PharmaCorp Global</h3>
          <p className="text-[10px] font-bold text-[#52f08a] uppercase tracking-widest">Verified Manufacturer</p>
        </div>
      </div>

      <div className="space-y-3 text-xs mb-6">
        <div className="flex justify-between items-center text-[#a3c4b5]">
          <span>Supplier Rating</span>
          <div className="flex text-[#52f08a] text-[10px]">
            <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
          </div>
        </div>
        <div className="flex justify-between items-center text-[#a3c4b5]">
          <span>Response Time</span>
          <span className="text-white font-bold">Avg. 15 mins</span>
        </div>
        <div className="flex justify-between items-center text-[#a3c4b5]">
          <span>Fulfillment Rate</span>
          <span className="text-[#52f08a] font-bold">99.8%</span>
        </div>
      </div>

      <button className="w-full py-3 bg-[#164a2f] hover:bg-[#1e5a3b] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-[#235e3e] transition-colors">
        View Manufacturer Profile
      </button>
    </div>
  );
};

export default SupplierCard;
