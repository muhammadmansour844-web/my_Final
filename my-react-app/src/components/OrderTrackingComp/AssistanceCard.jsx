import React from 'react';
import { FaPhoneAlt, FaCommentDots } from 'react-icons/fa';

const AssistanceCard = () => {
  return (
    <div className="bg-[#f7f9f8] p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-xs font-bold text-gray-900 mb-2">Need assistance?</h3>
      <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
        Our clinical logistics team is available 24/7 for urgent delivery inquiries.
      </p>

      <div className="space-y-3">
        <a href="tel:1-800-PHARMA-LOG" className="flex items-center gap-3 text-xs font-bold text-gray-900 hover:text-[#148348] transition-colors">
          <FaPhoneAlt className="text-gray-400" />
          1-800-PHARMA-LOG
        </a>
        <a href="#" className="flex items-center gap-3 text-xs font-bold text-gray-900 hover:text-[#148348] transition-colors">
          <FaCommentDots className="text-gray-400" />
          Live Support Chat
        </a>
      </div>
    </div>
  );
};

export default AssistanceCard;
