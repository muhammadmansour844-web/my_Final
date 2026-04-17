import React from 'react';
import { FaMapMarkerAlt, FaIdCard, FaHome } from 'react-icons/fa';

const DeliveryDetails = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      {/* Map Placeholder */}
      <div className="h-40 bg-gray-200 relative w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop" 
          alt="Map" 
          className="w-full h-full object-cover opacity-80 mix-blend-multiply" 
        />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <FaMapMarkerAlt className="text-3xl text-[#dcb14a] drop-shadow-md" />
        </div>
        
        {/* Arrival Card Overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#105436] text-white flex items-center justify-center">
            <FaHome className="text-sm" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-none">Estimated Arrival</div>
            <div className="text-sm font-bold text-[#105436]">Today, before 06:00 PM</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Destination Details</h3>
        
        {/* Address */}
        <div className="flex items-start gap-3 mb-6">
          <FaMapMarkerAlt className="text-gray-400 mt-1" />
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">St. Jude Medical Center</p>
            <p className="text-xs text-gray-500">Central Pharmacy, Level 4</p>
            <p className="text-xs text-gray-500">202 Clinical Drive, Suite B</p>
            <p className="text-xs text-gray-500">Chicago, IL 60611</p>
          </div>
        </div>

        {/* Recipient */}
        <div className="flex items-start gap-3">
          <FaIdCard className="text-gray-400 mt-1" />
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">Recipient</p>
            <p className="text-xs text-gray-500 mb-1">Chief Pharm. Sarah Miller</p>
            <p className="text-[10px] font-bold text-[#148348]">Authorized ID Required</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetails;
