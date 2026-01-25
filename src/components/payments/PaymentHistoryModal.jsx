import React, { useState, useEffect } from 'react';
import { studentsApi } from '../../api/students.api';
import { paymentsApi } from '../../api/payments.api';
import { formatCurrency } from '../../api/helpers';
import Modal from '../common/Modal';
import { FiTrash2, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PaymentHistoryModal = ({ isOpen, onClose, studentId, studentName }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  const fetchHistory = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const response = await studentsApi.getPaymentHistory(studentId);
      setPayments(response.data || []);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast.error("To'lov tarixini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && studentId) {
      fetchHistory();
      setEditingId(null);
    }
  }, [isOpen, studentId]);

  const handleDelete = async (paymentId) => {
    if (window.confirm("Haqiqatan ham bu to'lovni o'chirmoqchimisiz?")) {
      try {
        await paymentsApi.delete(paymentId);
        toast.success("To'lov o'chirildi");
        setPayments(prev => prev.filter(p => p.id !== paymentId));
      } catch (error) {
        console.error("Error deleting payment:", error);
        toast.error("O'chirishda xatolik yuz berdi");
      }
    }
  };

  const startEdit = (payment) => {
    setEditingId(payment.id);
    setEditAmount(payment.amount);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
  };

  const saveEdit = async (paymentId) => {
    try {
      await paymentsApi.update(paymentId, { amount: parseFloat(editAmount) });
      toast.success("To'lov yangilandi");

      // Update local state
      setPayments(prev => prev.map(p =>
        p.id === paymentId ? { ...p, amount: parseFloat(editAmount) } : p
      ));

      setEditingId(null);
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Yangilashda xatolik yuz berdi");
    }
  };

  const getPaymentTypeLabel = (payment) => {
    // Check for category or type or paymentMethod
    const type = payment.category || payment.type || payment.paymentMethod;
    if (type === 'CASH') return 'Naqd';
    if (type === 'CARD') return 'Karta';
    return type || '-';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${studentName || "O'quvchi"} - To'lovlar tarixi`}
    >
      <div className="mt-4">
        {loading ? (
          <div className="text-center py-4">Yuklanmoqda...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">To'lovlar tarixi mavjud emas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500">Sana</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500">Summa</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500">Turi</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500">Izoh</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(payment.createdAt || payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {editingId === payment.id ? (
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      ) : (
                        `${formatCurrency(payment.amount)}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded text-xs ${
                        (payment.category === 'CASH' || payment.type === 'CASH')
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {getPaymentTypeLabel(payment)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[150px]">
                      {payment.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {editingId === payment.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => saveEdit(payment.id)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Saqlash"
                          >
                            <FiSave size={18} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            title="Bekor qilish"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(payment)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Tahrirlash"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="O'chirish"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentHistoryModal;
