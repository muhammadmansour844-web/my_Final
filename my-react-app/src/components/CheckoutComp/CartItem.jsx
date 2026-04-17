import React from 'react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="flex items-center gap-6 p-6 bg-white rounded-xl shadow-sm border border-gray-50">
      {/* Product Image */}
      <div className="w-24 h-24 rounded-lg bg-[#eef3f0] flex-shrink-0 overflow-hidden flex items-center justify-center p-2">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover mix-blend-multiply" 
        />
      </div>

      {/* Product Details */}
      <div className="flex-1">
        <div className="text-xs font-bold text-[#148348] uppercase tracking-wider mb-1">
          {item.category || 'Product'}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
          {item.name}
        </h3>
        <p className="text-sm text-gray-500">
          {item.description || 'Clinical Grade • Exp: 12/2025'}
        </p>
      </div>

      {/* Actions and Price */}
      <div className="flex flex-col items-end gap-3 min-w-[120px]">
        {/* Quantity Control */}
        <div className="flex items-center border border-gray-200 rounded-md">
          <button 
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            -
          </button>
          <span className="px-3 py-1 text-sm font-semibold text-gray-900 min-w-[2.5rem] text-center border-x border-gray-200">
            {item.quantity}
          </span>
          <button 
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="px-3 py-1 text-gray-600 hover:bg-gray-50"
          >
            +
          </button>
        </div>

        {/* Price */}
        <div className="text-xl font-bold text-[#105436]">
          ${(item.price * item.quantity).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </div>

        {/* Remove Button */}
        <button 
          onClick={() => onRemove(item.id)}
          className="text-xs font-bold text-[#cc292b] hover:text-red-700 uppercase tracking-wide mt-1"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem;
