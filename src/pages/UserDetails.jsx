import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiUser } from 'react-icons/fi';

const UserDetails = () => {
  const { id } = useParams();

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <FiArrowLeft />
          <span>Foydalanuvchilarga qaytish</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <FiUser className="text-3xl text-gray-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Foydalanuvchi ma'lumotlari</h1>
            <p className="text-gray-500">ID: {id}</p>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg">
          Ushbu sahifa tez orada ishga tushiriladi.
        </div>
      </div>
    </div>
  );
};

export default UserDetails;