export function StatusBadge({ status, type = 'default' }) {
  const configs = {
    default: {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      cancelled: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
      active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      inactive: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
      terminated: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      draft: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
      open: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      closed: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
      onhold: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      on_hold: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    },
    attendance: {
      present: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      late: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      'work-from-home': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      halfday: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
      'half-day': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
      absent: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      leave: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
      holiday: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
      'business-trip': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    },
    employment: {
      active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      probation: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      notice: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      onleave: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
      on_leave: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
      terminated: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      resigned: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
    },
    payroll: {
      draft: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
      finalized: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    },
    performance: {
      draft: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
      'in-progress': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      inprogress: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      acknowledged: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    },
    generic: {
      yes: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      no: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      true: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      false: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
    },
  };

  const configSet = configs[type] || configs.default;
  const statusKey = status?.toLowerCase().replace(/\s+/g, '-');
  const config = configSet[statusKey] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value = 0, max = 100, color = 'bg-primary', size = 'h-2' }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full overflow-hidden rounded-full ${size}`}>
      <div
        className={`${color} h-full rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
      {Icon && <Icon className="h-12 w-12 text-gray-300 mb-4" />}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
