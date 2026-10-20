import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";
import {
  Users,
  Building2,
  CalendarDays,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Briefcase,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  FileText,
  Megaphone,
  Plus,
} from "lucide-react";
import { StatusBadge, ProgressBar, EmptyState, Badge } from "../components/UI";

export default function Dashboard() {
  const api = useApi();
  const { user } = useAuth();
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, leaves, holidays, announcementsRes] = await Promise.all([
          api.get("/api/employees/stats"),
          api.get("/api/leaves?limit=5"),
          api.get("/api/holidays"),
          api.get("/api/leaves/calendar/upcoming?mine=true"),
        ]);

        setStatsData(stats.data);
        setRecentLeaves(leaves.data?.data || []);
        setUpcomingLeaves(announcementsRes.data?.data || []);

        if (announcementsRes.data?.data) {
          api
            .get("/api/announcements")
            .then((res) => setAnnouncements(res.data?.data || []))
            .catch(() => {});
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [api, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  const totalEmployees = statsData?.total || 0;
  const activeEmployees =
    statsData?.byStatus?.find((s) => s._id === "active")?.count || 0;
  const departments = statsData?.byDepartment?.length || 0;

  const leaveStats = statsData?.byStatus || [];
  const presentCount = leaveStats?.find((s) => s._id === "present")?.count || 0;

  const primaryColor = "#4f46e5";

  const statCards = [
    {
      icon: Users,
      label: "Total Employees",
      value: totalEmployees,
      subtext: `${activeEmployees} active`,
      color: "text-primary",
      bg: "bg-primary/10",
      change: "+12%",
      positive: true,
    },
    {
      icon: Building2,
      label: "Departments",
      value: departments,
      subtext: "Active departments",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      change: "+2",
      positive: true,
    },
    {
      icon: CalendarDays,
      label: "Leave Requests",
      value: recentLeaves.length,
      subtext:
        recentLeaves.filter((l) => l.status === "pending").length + " pending",
      color: "text-amber-600",
      bg: "bg-amber-50",
      change: recentLeaves.filter((l) => l.status === "pending").length,
      positive: false,
    },
    {
      icon: Clock,
      label: "Today Attendance",
      value: "—",
      subtext: "Clock in to record attendance",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  const payrollSummary = statsData
    ? {
        total: totalEmployees,
        monthlyRunRate: totalEmployees * 8000, // rough average
        annualCost: totalEmployees * 960000,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.employee?.firstName || "there"}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {dayjs().format("dddd, MMMM D, YYYY")}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="primary">
            <span className="mr-1">{dayjs().format("MMM YYYY")}</span>
          </Badge>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="flex overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
              <p className="text-xs text-gray-400">{stat.subtext}</p>
            </div>
            {stat.change !== undefined && (
              <div
                className={`flex items-center ${stat.positive ? "text-emerald-600" : "text-red-600"}`}
              >
                {stat.positive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span className="text-sm font-semibold">{stat.change}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Leave Requests */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Leave Requests
            </h2>
            <Link
              to="/leaves"
              className="text-sm text-primary font-medium hover:underline"
            >
              View all
            </Link>
          </div>

          {recentLeaves.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No leave requests"
              description="There are no leave requests to display."
            />
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div
                  key={leave._id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {leave.employee?.fullName?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {leave.employee?.fullName || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {leave.leaveType?.name} •{" "}
                      {dayjs(leave.startDate).format("MMM D")} –{" "}
                      {dayjs(leave.endDate).format("MMM D, YYYY")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={leave.status} />
                    {leave.days && (
                      <span className="text-xs text-gray-500">
                        {leave.days}d
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                to="/attendance"
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Clock In/Out
                  </p>
                  <p className="text-xs text-gray-500">Record attendance</p>
                </div>
              </Link>
              <Link
                to="/leaves"
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Request Leave
                  </p>
                  <p className="text-xs text-gray-500">Apply for time off</p>
                </div>
              </Link>
              <Link
                to="/employees"
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Add Employee
                  </p>
                  <p className="text-xs text-gray-500">Register new staff</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Upcoming Leaves */}
          {upcomingLeaves.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                My Upcoming Leaves
              </h2>
              <div className="space-y-3">
                {upcomingLeaves.slice(0, 3).map((leave) => (
                  <div key={leave._id} className="flex items-start gap-3">
                    <div
                      className="mt-1 h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: leave.leaveType?.color || primaryColor,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {leave.leaveType?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dayjs(leave.startDate).format("MMM D")} –{" "}
                        {dayjs(leave.endDate).format("MMM D")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Announcements
                </h2>
                <Link
                  to="/announcements"
                  className="text-sm text-primary font-medium hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {announcements.slice(0, 3).map((ann) => (
                  <div
                    key={ann._id}
                    className={`rounded-lg border p-3 ${
                      ann.isPinned
                        ? "border-primary/20 bg-primary/5"
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {ann.isPinned && (
                        <svg
                          className="h-4 w-4 mt-0.5 text-primary flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.395 2.553a1 1 0 00-1.45-.385c-.197.069-1.22.366-2.026 1.08-.584.477-.912.75-1.058 1.207-.057.16-.073.51-.073.756 0 .375.067.704.19 1.013.106.272.356 1.04.97 2.415.522 1.174 1.008 1.875 1.3 2.015.397.187.77.098 1.005-.198.205-.25.183-.42.021-.547l-.003-.004c-.183-.22-.434-.345-.735-.355C10.167 6.179 9.327 6 8 6s-2.167.179-3.162.526c-.301.01-.552.136-.735.355l-.003.004c-.162.127-.184.297-.02.547.235.296.609.396.97.198.297-.14.782-.841 1.3-2.015.614-1.375 1.065-2.143 1.171-2.415.123-.308.19-.638.19-1.013 0-.246-.016-.586-.073-.756-.146-.458-.474-.73-1.058-1.207-1.014-.85-2.403-1.264-3.987-1.287-.672-.01-1.218.115-1.46.385z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ann.title}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                          {ann.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payroll summary */}
      {payrollSummary && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Payroll Summary
            </h2>
            <Link
              to="/payroll"
              className="text-sm text-primary font-medium hover:underline"
            >
              View payroll
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {payrollSummary.total}
              </p>
              <p className="text-xs text-gray-500">Employees</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-2xl font-bold text-gray-900">
                ${(payrollSummary.monthlyRunRate / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-gray-500">Monthly (est.)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                ${(payrollSummary.annualCost / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500">Annual (est.)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
