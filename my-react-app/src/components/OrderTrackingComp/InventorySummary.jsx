import React from 'react';
import { FaListAlt } from 'react-icons/fa';

const InventorySummary = () => {
  return (
    <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaListAlt className="text-[#105436]" />
        <h2 className="text-sm font-bold text-[#105436] uppercase tracking-widest">Order Inventory Summary</h2>
      </div>

      <div className="space-y-4 mb-8">
        {/* Item 1 */}
        <div className="flex justify-between items-center p-4 bg-[#fcfcfc] border border-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded shadow-sm flex justify-center items-center overflow-hidden">
              <img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=50&auto=format&fit=crop" alt="Amoxicillin" className="w-full h-full object-cover mix-blend-multiply" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight mb-1">Amoxicillin 500mg</p>
              <p className="text-[10px] text-gray-500">Batch: #AX-9021 • 120 Packs</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">$1,440.00</p>
            <p className="text-[10px] text-gray-500">Ref: RX-0922</p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex justify-between items-center p-4 bg-[#fcfcfc] border border-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-900 rounded shadow-sm flex justify-center items-center overflow-hidden">
              <img src="https://images.unsplash.com/photo-1584515933487-779824d29309?w=50&auto=format&fit=crop" alt="Insulin" className="w-full h-full object-cover opacity-80" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight mb-1">Insulin Glargine Vials</p>
              <p className="text-[10px] text-gray-500">Batch: #IN-4451 • 45 Vials</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">$2,890.50</p>
            <p className="text-[10px] text-[#148348] font-bold">Cold Chain Required</p>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="space-y-3 mb-6 text-xs text-gray-500 font-medium border-t border-gray-100 pt-6">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="text-gray-900 font-bold">$4,330.50</span>
        </div>
        <div className="flex justify-between">
          <span>Cold Chain Handling</span>
          <span className="text-[#148348] font-bold">+$125.00</span>
        </div>
        <div className="flex justify-between">
          <span>Standard Logistics</span>
          <span className="text-gray-900 font-bold">Free</span>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-gray-100 pt-6">
        <span className="text-sm font-bold text-[#105436] uppercase tracking-widest">Total Amount</span>
        <span className="text-2xl font-bold text-[#105436]">$4,455.50</span>
      </div>
    </div>
  );
};

export default InventorySummary;
