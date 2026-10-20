import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";
import {
  StatusBadge,
  Badge,
  EmptyState,
  ConfirmDialog,
} from "../components/UI";

export default function Employees() {
  const api = useApi();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    employmentType: "",
    gender: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "prefer-not-to-say",
    dob: "",
    maritalStatus: "single",
    nationality: "",
    job: {
      designation: "",
      department: "",
      employmentType: "full-time",
      employmentStatus: "active",
      workLocation: "",
    },
    salary: { basic: 0, hra: 0, currency: "USD" },
    skills: [],
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [departments, setDepartments] = useState([]);

  const canManage = ["admin", "hr"].includes(user?.role);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, search, filters]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/api/departments");
      setDepartments(res.data || []);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        limit,
        ...(search && { q: search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.department && { department: filters.department }),
        ...(filters.employmentType && {
          employmentType: filters.employmentType,
        }),
        ...(filters.gender && { gender: filters.gender }),
      });

      const res = await api.get(`/api/employees?${params}`);
      setEmployees(res.data?.data || []);
      setTotal(res.data?.meta?.total || 0);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const link = document.createElement("a");
    link.href = "/api/employees/export/csv";
    link.download = "employees.csv";
    link.click();
  };

  const handleCreate = async () => {
    setEditingEmployee(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "prefer-not-to-say",
      dob: "",
      maritalStatus: "single",
      nationality: "",
      job: {
        designation: "",
        department: "",
        employmentType: "full-time",
        employmentStatus: "active",
        workLocation: "",
      },
      salary: { basic: 0, hra: 0, currency: "USD" },
      skills: [],
    });
    setShowModal(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      gender: employee.gender || "prefer-not-to-say",
      dob: employee.dob ? dayjs(employee.dob).format("YYYY-MM-DD") : "",
      maritalStatus: employee.maritalStatus || "single",
      nationality: employee.nationality || "",
      job: {
        designation: employee.job?.designation || "",
        department:
          employee.job?.department?._id || employee.job?.department || "",
        employmentType: employee.job?.employmentType || "full-time",
        employmentStatus: employee.job?.employmentStatus || "active",
        workLocation: employee.job?.workLocation || "",
      },
      salary: {
        basic: employee.salary?.basic || 0,
        hra: employee.salary?.hra || 0,
        currency: employee.salary?.currency || "USD",
      },
      skills: employee.skills || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      if (payload.dob) payload.dob = dayjs(payload.dob).toISOString();

      if (editingEmployee) {
        const res = await api.patch(
          `/api/employees/${editingEmployee._id}`,
          payload,
        );
        setEmployees((prev) =>
          prev.map((emp) =>
            String(emp._id) === String(editingEmployee._id) ? res.data : emp,
          ),
        );
      } else {
        const res = await api.post("/api/employees", payload);
        setEmployees((prev) => [res.data.employee, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.message || "Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/api/employees/${deleteConfirm._id}`);
      setEmployees((prev) =>
        prev.filter((emp) => String(emp._id) !== String(deleteConfirm._id)),
      );
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message || "Failed to delete employee");
    }
  };

  const totalPages = Math.ceil(total / limit);

  const inputClass =
    "block w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} employee{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          {canManage && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value }));
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="probation">Probation</option>
            <option value="on-leave">On Leave</option>
            <option value="terminated">Terminated</option>
            <option value="resigned">Resigned</option>
          </select>
          <select
            value={filters.department}
            onChange={(e) => {
              setFilters((f) => ({ ...f, department: e.target.value }));
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={filters.employmentType}
            onChange={(e) => {
              setFilters((f) => ({ ...f, employmentType: e.target.value }));
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
          <select
            value={filters.gender}
            onChange={(e) => {
              setFilters((f) => ({ ...f, gender: e.target.value }));
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
          {(search || filters.status || filters.department) && (
            <button
              onClick={() => {
                setSearch("");
                setFilters({});
                setPage(1);
              }}
              className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Employee list */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-40 rounded bg-gray-200" />
                <div className="h-3 w-32 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Add your first employee to get started."
          action={
            canManage && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {employees.map((emp) => (
              <div
                key={emp._id}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Link
                    to={`/employees/${emp._id}`}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-semibold"
                  >
                    {emp.fullName?.charAt(0) || emp.firstName?.charAt(0) || "?"}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/employees/${emp._id}`}
                      className="text-base font-semibold text-gray-900 hover:text-primary hover:underline"
                    >
                      {emp.fullName || `${emp.firstName} ${emp.lastName}`}
                    </Link>
                    <p className="text-sm text-gray-500">{emp.empId}</p>
                    <p className="text-xs text-gray-400">
                      {emp.email || "No email"}
                    </p>
                  </div>
                  <StatusBadge
                    status={emp.job?.employmentStatus}
                    type="employment"
                  />
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                    <span className="truncate">
                      {emp.job?.designation || "No designation"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    <span className="truncate">
                      {emp.job?.department?.name || "No department"}
                    </span>
                  </div>
                  {emp.job?.workLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">{emp.job.workLocation}</span>
                    </div>
                  )}
                </div>

                {canManage && (
                  <div className="mt-auto flex items-center gap-1 pt-3 border-t border-gray-100">
                    <Link
                      to={`/employees/${emp._id}`}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleEdit(emp)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(emp)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.job?.designation || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        job: { ...formData.job, designation: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    value={formData.job?.department || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        job: { ...formData.job, department: e.target.value },
                      })
                    }
                    className={inputClass}
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Employment Type
                  </label>
                  <select
                    value={formData.job?.employmentType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        job: {
                          ...formData.job,
                          employmentType: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={formData.job?.employmentStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        job: {
                          ...formData.job,
                          employmentStatus: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  >
                    <option value="active">Active</option>
                    <option value="probation">Probation</option>
                    <option value="on-leave">On Leave</option>
                    <option value="notice">Notice</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.job?.workLocation || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        job: { ...formData.job, workLocation: e.target.value },
                      })
                    }
                    className={inputClass}
                    placeholder="e.g. San Francisco, Remote"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Basic Salary
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.salary?.basic || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salary: {
                          ...formData.salary,
                          basic: Number(e.target.value),
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    HRA
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.salary?.hra || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salary: {
                          ...formData.salary,
                          hra: Number(e.target.value),
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              {editingEmployee && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    To change role or reset password, use the{" "}
                    <Link to="/users" className="font-medium underline">
                      Users
                    </Link>{" "}
                    page.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? (
                    <div className="spinner h-4 w-4" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />{" "}
                      {editingEmployee ? "Update" : "Create"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to terminate ${deleteConfirm?.fullName || deleteConfirm?.firstName}? This will deactivate their account and mark them as terminated.`}
        confirmText="Terminate"
        danger
      />
    </div>
  );
}
