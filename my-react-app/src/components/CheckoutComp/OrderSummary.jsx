import React, { useState } from 'react';
import { FaCreditCard, FaBuilding, FaShieldAlt, FaArrowRight } from 'react-icons/fa';

const OrderSummary = ({ subtotal, taxRate = 0.17, onPlaceOrder, isProcessing }) => {
  const [promoCode, setPromoCode] = useState('PHARMA24');
  
  const deliveryFee = 0; // FREE
  const estimatedTax = subtotal * taxRate;
  const totalAmount = subtotal + deliveryFee + estimatedTax;

  const formatCurrency = (amount) => {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sticky top-8">
      <h2 className="text-xl font-bold text-[#0f3424] mb-6">Order Summary</h2>

      {/* Breakdown */}
      <div className="space-y-4 mb-6 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Delivery Fee</span>
          <span className="font-bold text-[#148348]">FREE</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Estimated Tax ({taxRate * 100}%)</span>
          <span className="font-semibold text-gray-900">{formatCurrency(estimatedTax)}</span>
        </div>
      </div>

      {/* Promotion Code */}
      <div className="mb-6"> 
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Promotion Code
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 bg-[#f3f5f4] border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#143d2c]"
          />
          <button className="px-4 py-2 border border-gray-200 rounded-md text-xs font-bold text-gray-700 hover:bg-gray-50">
            APPLY
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-end border-t border-gray-100 pt-6 mb-8">
        <span className="text-base font-bold text-gray-900">Total Amount</span>
        <span className="text-3xl font-bold text-[#148348]">{formatCurrency(totalAmount)}</span>
      </div>

      {/* Action Button */}
      <button 
        onClick={onPlaceOrder}
        disabled={isProcessing || subtotal === 0}
        className="w-full bg-[#10432a] hover:bg-[#0a2e1c] text-white py-4 rounded-lg font-bold tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mb-6 shadow-md shadow-[#10432a]/20"
      >
        {isProcessing ? 'PROCESSING...' : 'PLACE SECURE ORDER'}
        {!isProcessing && <FaArrowRight />}
      </button>

      {/* Trust Badges */}
      <div className="flex justify-center gap-6 text-gray-400">
        <FaCreditCard className="text-xl" />
        <FaBuilding className="text-xl" />
        <FaShieldAlt className="text-xl" />
      </div>
    </div>
  );
};

export default OrderSummary;
