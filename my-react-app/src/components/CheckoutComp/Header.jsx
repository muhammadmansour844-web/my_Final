import React from 'react';
import { FaSearch, FaBell } from 'react-icons/fa';

const Header = () => {
  return (
    <header className="flex items-center justify-between py-4 px-8 bg-white border-b border-gray-100">
      <div className="relative w-[500px]">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <FaSearch />
        </span>
        <input
          type="text"
          className="w-full py-2 pl-10 pr-4 bg-[#f3f5f4] border-none rounded-full focus:outline-none focus:ring-2 focus:ring-[#143d2c] text-sm text-gray-700 placeholder-gray-500"
          placeholder="Search orders, clinical supplies..."
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:text-[#143d2c] transition-colors relative">
          <FaBell className="text-xl" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#0a3523] text-white flex items-center justify-center text-sm font-semibold cursor-pointer shadow-sm">
          UD
        </div>
      </div>
    </header>
  );
};

export default Header;
