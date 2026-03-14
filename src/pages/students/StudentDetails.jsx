import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiPhone,
  FiCalendar,
  FiBook,
  FiDollarSign,
  FiTrash2,
  FiCreditCard,
  FiEdit2,
  FiSave,
  FiX
} from "react-icons/fi";

import { studentsApi } from "../../api/students.api";
import { paymentsApi } from "../../api/payments.api";
import { formatCurrency, formatDate } from "../../api/helpers";

const StudentDetails = () => {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [groups, setGroups] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [studentRes, paymentsRes] = await Promise.all([
          studentsApi.getById(id),
          paymentsApi.getByStudent(id)
        ]);

        setStudent(studentRes.data);
        setGroups(studentRes.data?.groups || []);
        setPaymentHistory(paymentsRes.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Maʼlumotlarni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  /* ================= PAYMENT HELPERS ================= */
  const getPaymentTypeInfo = (payment) => {
    const raw =
      payment.category ||
      payment.type ||
      payment.paymentMethod ||
      payment.paymentType;

    const type = raw ? raw.toUpperCase() : "";

    if (type === "CASH") {
      return {
        label: "Naqd",
        className: "bg-green-100 text-green-700",
        icon: <FiDollarSign />
      };
    }

    if (type === "CARD") {
      return {
        label: "Karta",
        className: "bg-blue-100 text-blue-700",
        icon: <FiCreditCard />
      };
    }

    return {
      label: raw || "-",
      className: "bg-gray-100 text-gray-700",
      icon: null
    };
  };

  /* ================= ACTIONS ================= */
  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("To‘lovni o‘chirmoqchimisiz?")) return;

    try {
      await paymentsApi.delete(paymentId);
      setPaymentHistory((prev) => prev.filter((p) => p.id !== paymentId));
      toast.success("To‘lov o‘chirildi");
    } catch {
      toast.error("O‘chirishda xatolik");
    }
  };

  const startEdit = (payment) => {
    setEditingId(payment.id);
    setEditAmount(payment.amount);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
  };

  const saveEdit = async (paymentId) => {
    try {
      await paymentsApi.update(paymentId, {
        amount: Number(editAmount)
      });

      setPaymentHistory((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, amount: Number(editAmount) } : p
        )
      );

      toast.success("To‘lov yangilandi");
      setEditingId(null);
    } catch {
      toast.error("Yangilashda xatolik");
    }
  };

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center text-gray-500">
        O‘quvchi topilmadi
      </div>
    );
  }

  /* ================= RENDER ================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-1">
        {student.firstName} {student.lastName}
      </h1>
      <p className="text-gray-500 mb-6">O‘quvchi profili</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PROFILE */}
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold mb-3">
              {student.firstName?.[0]}
            </div>
            <h2 className="font-bold text-lg">
              {student.firstName} {student.lastName}
            </h2>
          </div>

          <div className="space-y-3 text-gray-600">
            <div className="flex gap-2 items-center">
              <FiPhone />
              <span>{student.phoneNumber || "-"}</span>
            </div>
            <div className="flex gap-2 items-center">
              <FiCalendar />
              <span>
                {new Date(student.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <FiCalendar />
              <span>
                To'lov kuni: {student.paymentDayOfMonth || "-"}
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <FiCalendar />
              <span>
                Keyingi to'lov: {formatDate(student.nextDueDate)}
              </span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="lg:col-span-2 space-y-6">
          {/* GROUPS */}
          <div className="bg-white p-6 rounded-xl border">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FiBook /> Guruhlar
            </h3>

            {groups.length ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {groups.map((g) => (
                  <div key={g.id} className="border rounded p-4">
                    <h4 className="font-semibold">
                      <Link to={`/groups/${g.id}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors gap-1 inline-flex items-center">
                        {g.name}
                      </Link>
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <span className="font-medium text-gray-700">O'qituvchi:</span> {g.teacherName || "Noma'lum"}
                    </p>
                    {g.tuitionFee != null && (
                      <p className="text-sm text-blue-600 font-medium mt-1">
                        {formatCurrency(g.tuitionFee)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Guruh yo‘q</p>
            )}
          </div>

          {/* PAYMENTS */}
          <div className="bg-white p-6 rounded-xl border">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FiDollarSign /> To‘lovlar
            </h3>

            {paymentHistory.length ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left">Sana</th>
                    <th className="px-3 py-2 text-left">To'lov muddati</th>
                    <th className="px-3 py-2 text-left">Summa</th>
                    <th className="px-3 py-2 text-left">Turi</th>
                    <th className="px-3 py-2 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((p) => {
                    const type = getPaymentTypeInfo(p);

                    return (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">
                          {new Date(p.createdAt || p.date).toLocaleDateString()}
                        </td>

                        <td className="px-3 py-2">
                          {formatDate(p.paymentDueDate || p.dueDate)}
                        </td>

                        <td className="px-3 py-2 font-medium">
                          {editingId === p.id ? (
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) =>
                                setEditAmount(e.target.value)
                              }
                              className="w-24 border rounded px-2 py-1"
                            />
                          ) : (
                            formatCurrency(p.amount)
                          )}
                        </td>

                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${type.className}`}
                          >
                            {type.icon}
                            {type.label}
                          </span>
                        </td>

                        <td className="px-3 py-2 text-right">
                          {editingId === p.id ? (
                            <>
                              <button
                                onClick={() => saveEdit(p.id)}
                                className="text-green-600 mr-2"
                              >
                                <FiSave />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-gray-500"
                              >
                                <FiX />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(p)}
                                className="text-blue-600 mr-2"
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(p.id)}
                                className="text-red-600"
                              >
                                <FiTrash2 />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">To‘lovlar yo‘q</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
