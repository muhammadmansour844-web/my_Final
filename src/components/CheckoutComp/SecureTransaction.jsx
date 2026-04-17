import React from 'react';
import { FaLock, FaShieldAlt } from 'react-icons/fa';

const SecureTransaction = () => {
  return (
    <div className="mt-6 bg-[#f7f9f8] rounded-xl p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-4 text-[#105436] font-semibold text-sm">
        <FaLock className="text-xs" />
        <span>Secure Clinical Transaction</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
          {/* Mock Bank Icon/Logo */}
          <div className="w-8 h-4 bg-gray-300 rounded-sm"></div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 leading-tight">Standard Hospital Billing (Ending 4291)</p>
          <p className="text-xs text-gray-500 mt-1">Central Procurement Office • NY</p>
        </div>
        <button className="text-xs font-bold text-[#148348] uppercase tracking-wider hover:text-[#0f6035]">
          Change
        </button>
      </div>
    </div>
  );
};

export default SecureTransaction;
