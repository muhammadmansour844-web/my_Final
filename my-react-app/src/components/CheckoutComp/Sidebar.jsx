import React from 'react';
import { FaThLarge, FaBox, FaShoppingCart, FaArrowRight, FaTags, FaChartBar, FaCog, FaUserCircle } from 'react-icons/fa';

const Sidebar = () => {
  return (
    <aside className="w-64 min-h-screen flex flex-col bg-[#143d2c] text-white">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">PharmaBridge</h1>
        <p className="text-xs text-[#6fa38b] uppercase tracking-widest mt-1">Clinical Curator</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-4">
          <li>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#a3c4b5] hover:bg-[#1a4d38] rounded-lg transition-colors">
              <FaThLarge className="text-lg" />
              <span className="font-medium">Dashboard</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#a3c4b5] hover:bg-[#1a4d38] rounded-lg transition-colors">
              <FaBox className="text-lg" />
              <span className="font-medium">Products</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[#116839] text-white rounded-lg shadow-sm">
              <FaShoppingCart className="text-lg" />
              <span className="font-medium">My Orders</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#a3c4b5] hover:bg-[#1a4d38] rounded-lg transition-colors">
              <FaArrowRight className="text-lg" />
              <span className="font-medium">Incoming Orders</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#a3c4b5] hover:bg-[#1a4d38] rounded-lg transition-colors">
              <FaThLarge className="text-lg" />
              <span className="font-medium">My Products</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#a3c4b5] hover:bg-[#1a4d38] rounded-lg transition-colors">
              <FaTags className="text-lg" />
              <span className="font-medium">Promotions</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#a3c4b5] hover:bg-[#1a4d38] rounded-lg transition-colors">
              <FaChartBar className="text-lg" />
              <span className="font-medium">Reports</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#a3c4b5] hover:bg-[#1a4d38] rounded-lg transition-colors">
              <FaCog className="text-lg" />
              <span className="font-medium">Settings</span>
            </a>
          </li>
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 mt-auto border-t border-[#23503d]">
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#a3c4b5] hover:text-white transition-colors">
          <FaUserCircle className="text-2xl" />
          <span className="font-medium">User Profile</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;