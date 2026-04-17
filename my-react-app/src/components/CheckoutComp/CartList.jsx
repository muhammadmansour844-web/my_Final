import React from 'react';
import CartItem from './CartItem';
import { FaTruck } from 'react-icons/fa';

const CartList = ({ items, onUpdateQuantity, onRemove, onClearAll }) => {
  return (
    <div className="flex-1 pr-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0f3424]">
          Your Cart ({items.length} items)
        </h2>
        <button 
          onClick={onClearAll}
          className="text-sm font-semibold text-[#148348] hover:text-[#0f6035]"
        >
          Clear all
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-4 mb-8">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            Your cart is empty.
          </div>
        ) : (
          items.map(item => (
            <CartItem 
              key={item.id} 
              item={item} 
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Delivery Notice */}
      <div className="flex items-center gap-4 p-4 bg-[#e7f1eb] rounded-lg border border-[#cbe4d5]">
        <FaTruck className="text-[#105436] text-xl flex-shrink-0" />
        <p className="text-sm text-[#2a4e3c]">
          Your order qualifies for <span className="font-bold text-[#105436]">Priority Clinical Express Delivery</span>. Estimated arrival: Tomorrow, 9:00 AM.
        </p>
      </div>
    </div>
  );
};

export default CartList;
