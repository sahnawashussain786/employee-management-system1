import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  Users,
  FileText,
  Edit,
  Trash2,
  AlertTriangle,
  Clock,
  CalendarDays,
  CreditCard,
  Award,
  Download,
} from "lucide-react";
import {
  StatusBadge,
  Badge,
  ProgressBar,
  EmptyState,
  ConfirmDialog,
} from "../components/UI";

export default function EmployeeDetail() {
  const { id } = useParams();
  const api = useApi();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [directReports, setDirectReports] = useState(0);
  const [assets, setAssets] = useState([]);
  const [activeLeaves, setActiveLeaves] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/employees/${id}`);
      setEmployee(res.data?.employee || null);
      setUserData(res.data?.user || null);
      setDirectReports(res.data?.directReports || 0);
      setAssets(res.data?.assets || []);
      setActiveLeaves(res.data?.activeLeaves || []);
    } catch {
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/api/employees/${deleteConfirm._id}`);
      navigate("/employees");
    } catch (err) {
      alert(err.message || "Failed to terminate employee");
    }
  };

  const handleClockIn = async () => {
    try {
      const res = await api.post("/api/attendance/clock-in");
      alert(res.message || "Clocked in successfully");
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to clock in");
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await api.post("/api/attendance/clock-out");
      alert(res.message || "Clocked out successfully");
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to clock out");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Employee not found
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          The employee you're looking for doesn't exist.
        </p>
        <Link
          to="/employees"
          className="text-primary font-medium hover:underline"
        >
          Back to Employees
        </Link>
      </div>
    );
  }

  const canManage = ["admin", "hr"].includes(user?.role);
  const isOwner = userData?._id === user?._id;
  const primaryColor = employee.job?.department?._id ? "#4f46e5" : "#6b7280";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/employees"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-semibold ring-4 ring-primary/20">
            {employee.fullName?.charAt(0) ||
              employee.firstName?.charAt(0) ||
              "?"}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {employee.fullName ||
                  `${employee.firstName} ${employee.lastName}`}
              </h1>
              <StatusBadge
                status={employee.job?.employmentStatus}
                type="employment"
              />
            </div>
            <p className="mt-1 text-gray-500">
              {employee.empId} • {employee.job?.designation || "No designation"}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
              {employee.email && (
                <a
                  href={`mailto:${employee.email}`}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {employee.email}
                </a>
              )}
              {employee.phone && (
                <a
                  href={`tel:${employee.phone}`}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {employee.phone}
                </a>
              )}
              {employee.job?.workLocation && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {employee.job.workLocation}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canManage && (
            <button
              onClick={() => navigate(`/employees/${id}/edit`)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setDeleteConfirm(employee)}
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Terminate
            </button>
          )}
          {isOwner && employee.job?.employmentStatus === "active" && (
            <div className="flex gap-2">
              <button
                onClick={handleClockIn}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Clock className="h-4 w-4" />
                Clock In
              </button>
              <button
                onClick={handleClockOut}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Clock className="h-4 w-4" />
                Clock Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-semibold text-gray-900">
                {employee.job?.department?.name || "Unassigned"}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Gross</p>
              <p className="font-semibold text-gray-900">
                $
                {(
                  (employee.salary?.basic || 0) + (employee.salary?.hra || 0)
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Direct Reports</p>
              <p className="font-semibold text-gray-900">{directReports}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Leaves</p>
              <p className="font-semibold text-gray-900">
                {activeLeaves.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </span>
                <p className="font-medium text-gray-900">{employee.fullName}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </span>
                <p className="font-medium text-gray-900">{employee.empId}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </span>
                <p className="text-gray-900">{employee.email || "—"}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </span>
                <p className="text-gray-900">{employee.phone || "—"}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </span>
                <p className="text-gray-900 capitalize">
                  {employee.gender?.replace(/-/g, " ") || "—"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date of Birth
                </span>
                <p className="text-gray-900">
                  {employee.dob
                    ? dayjs(employee.dob).format("MMMM D, YYYY")
                    : "—"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marital Status
                </span>
                <p className="text-gray-900 capitalize">
                  {employee.maritalStatus || "—"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nationality
                </span>
                <p className="text-gray-900">{employee.nationality || "—"}</p>
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Job Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </span>
                <p className="font-medium text-gray-900">
                  {employee.job?.designation || "—"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </span>
                <p className="text-gray-900">{employee.job?.title || "—"}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </span>
                <p className="text-gray-900">
                  {employee.job?.department?.name || "—"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Location
                </span>
                <p className="text-gray-900">
                  {employee.job?.workLocation || "—"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employment Type
                </span>
                <p className="text-gray-900 capitalize">
                  {employee.job?.employmentType?.replace("-", " ") || "—"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Shift
                </span>
                <p className="text-gray-900">
                  {employee.job?.workShift || "—"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joining Date
                </span>
                <p className="text-gray-900">
                  {employee.job?.joiningDate
                    ? dayjs(employee.job.joiningDate).format("MMMM D, YYYY")
                    : "—"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporting To
                </span>
                <p className="text-gray-900">
                  {employee.job?.reportingTo ? (
                    <Link
                      to={`/employees/${employee.job.reportingTo._id}`}
                      className="text-primary hover:underline"
                    >
                      {employee.job.reportingTo.fullName}
                    </Link>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Salary Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Basic Salary
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ${(employee.salary?.basic || 0).toLocaleString()}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  HRA
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ${(employee.salary?.hra || 0).toLocaleString()}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Monthly CTC
                </p>
                <p className="text-xl font-bold text-gray-900">
                  $
                  {(
                    (employee.salary?.basic || 0) + (employee.salary?.hra || 0)
                  ).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pay Frequency
                </span>
                <p className="text-gray-900 capitalize">
                  {employee.salary?.payFrequency?.replace("-", " ") || "—"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </span>
                <p className="text-gray-900">
                  {employee.salary?.currency || "USD"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Annual CTC (est.)
                </span>
                <p className="text-gray-900">
                  $
                  {(
                    ((employee.salary?.basic || 0) +
                      (employee.salary?.hra || 0)) *
                    12
                  ).toLocaleString()}
                </p>
              </div>
            </div>
            {employee.salary?.allowances?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Allowances
                </p>
                <div className="space-y-1.5">
                  {employee.salary.allowances.map((allowance, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{allowance.name}</span>
                      <span className="font-medium text-gray-900">
                        ${(allowance.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skills & Languages */}
          {(employee.skills?.length > 0 || employee.languages?.length > 0) && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {employee.skills?.map((skill, i) => (
                      <Badge key={i} variant="primary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Languages
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {employee.languages?.map((lang, i) => (
                      <Badge key={i} variant="info">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          {employee.address &&
            (employee.address.line1 || employee.address.city) && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Address
                </h2>
                <div className="text-sm text-gray-600">
                  {employee.address.line1 && <p>{employee.address.line1}</p>}
                  {employee.address.line2 && <p>{employee.address.line2}</p>}
                  <p className="mt-1">
                    {[
                      employee.address.city,
                      employee.address.state,
                      employee.address.country,
                      employee.address.zip,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}

          {/* Emergency Contact */}
          {employee.emergencyContact?.name && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Emergency Contact
              </h2>
              <div className="text-sm text-gray-600 grid gap-2 sm:grid-cols-3">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Name
                  </span>
                  <p className="font-medium text-gray-900">
                    {employee.emergencyContact.name}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Relationship
                  </span>
                  <p className="text-gray-900">
                    {employee.emergencyContact.relationship || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Phone
                  </span>
                  <p className="text-gray-900">
                    {employee.emergencyContact.phone || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                to={`/attendance?employee=${id}`}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    View Attendance
                  </p>
                  <p className="text-xs text-gray-500">
                    Check attendance records
                  </p>
                </div>
              </Link>
              <Link
                to={`/leaves?employee=${id}`}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    View Leaves
                  </p>
                  <p className="text-xs text-gray-500">Check leave history</p>
                </div>
              </Link>
              <Link
                to={`/payroll?employee=${id}`}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    View Payroll
                  </p>
                  <p className="text-xs text-gray-500">Check payslips</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Active Leaves */}
          {activeLeaves.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Active Leaves
              </h2>
              <div className="space-y-3">
                {activeLeaves.map((leave) => (
                  <div
                    key={leave._id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: leave.leaveType?.color || "#4f46e5",
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {leave.leaveType?.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {dayjs(leave.startDate).format("MMM D")} –{" "}
                      {dayjs(leave.endDate).format("MMM D, YYYY")}
                    </p>
                    <StatusBadge status={leave.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Assets */}
          {assets.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Assigned Assets
              </h2>
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div
                    key={asset._id}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {asset.name}
                      </p>
                      <p className="text-xs text-gray-500">{asset.assetTag}</p>
                    </div>
                    <Badge
                      variant={
                        asset.status === "assigned" ? "success" : "default"
                      }
                    >
                      {asset.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {employee.documents?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Documents
              </h2>
              <div className="space-y-2">
                {employee.documents.map((doc) => (
                  <a
                    key={doc._id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dayjs(doc.uploadedAt).format("MMM D, YYYY")}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Terminate Employee"
        message={`Are you sure you want to terminate ${employee.fullName}? This will mark them as terminated and deactivate their account. This action cannot be undone.`}
        confirmText="Terminate"
        danger
      />
    </div>
  );
}
