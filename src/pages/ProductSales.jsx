import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productSalesApi } from '../api/productSales.api';
import Modal from '../components/common/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const ProductSales = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initial form state
  const initialFormState = {
    productName: '',
    description: '',
    quantity: 1,
    unitPrice: '',
    category: 'BOOK',
    studentId: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch sales
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['productSales', filterCategory, startDate, endDate],
    queryFn: async () => {
      let data = [];
      if (startDate && endDate) {
        const response = await productSalesApi.getByDateRange(startDate, endDate);
        data = response.data;
      } else {
        const response = await productSalesApi.getAll();
        data = response.data;
      }

      // Filter by category client-side if needed, or check if backend supports combining filters.
      // The current backend implementation has separate endpoints for category and date range.
      // For now, we'll filter by category on the client side if date range is active,
      // or if we fetched all.

      if (filterCategory) {
          // If we are using the getByCategory endpoint, we could use that, but it doesn't support date range.
          // So the strategy is: Fetch by Date Range (or All) -> Filter by Category in Frontend.
          data = data.filter(sale => sale.category === filterCategory);
      }

      return data;
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: productSalesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['productSales']);
      toast.success('Muvaffaqiyatli qo\'shildi');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productSalesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productSales']);
      toast.success('Muvaffaqiyatli yangilandi');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: productSalesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['productSales']);
      toast.success('O\'chirildi');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  const handleOpenModal = (sale = null) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        productName: sale.productName,
        description: sale.description || '',
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        category: sale.category,
        studentId: sale.studentId || ''
      });
    } else {
      setEditingSale(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
    setFormData(initialFormState);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSale) {
      updateMutation.mutate({ id: editingSale.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const categories = [
    { value: 'BOOK', label: 'Kitoblar' },
    { value: 'PEN', label: 'Qalamlar' },
    { value: 'NOTEBOOK', label: 'Daftarlar' },
    { value: 'STATIONERY', label: 'Kantselyariya' },
    { value: 'UNIFORM', label: 'Forma' },
    { value: 'OTHER', label: 'Boshqa' }
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tushumlar</h1>
          <p className="text-gray-600">Qo'shimcha daromadlar (kitoblar, kantselyariya va boshqalar)</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Yangi tushum
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
          >
            <option value="">Barchasi</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boshlanish sanasi</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tugash sanasi</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        {(filterCategory || startDate || endDate) && (
          <button
            onClick={() => {
              setFilterCategory('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-red-600 hover:text-red-700 font-medium px-3 py-2"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Mahsulot</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Kategoriya</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Miqdor</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Narx</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Jami</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Sana</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">Yuklanmoqda...</td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">Ma'lumot topilmadi</td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{sale.productName}</div>
                      {sale.description && <div className="text-sm text-gray-500">{sale.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${sale.category === 'BOOK' ? 'bg-blue-100 text-blue-800' :
                          sale.category === 'PEN' ? 'bg-green-100 text-green-800' :
                          sale.category === 'NOTEBOOK' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {categories.find(c => c.value === sale.category)?.label || sale.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{sale.quantity}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(sale.unitPrice)}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(sale.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {format(new Date(sale.createdAt), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenModal(sale)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Haqiqatan ham o\'chirmoqchimisiz?')) {
                              deleteMutation.mutate(sale.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSale ? 'Tushumni tahrirlash' : 'Yangi tushum qo\'shish'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mahsulot nomi</label>
            <input
              type="text"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Masalan: Ingliz tili kitobi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Miqdor</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Narx (donasi)</label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif (ixtiyoriy)</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {editingSale ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductSales;
