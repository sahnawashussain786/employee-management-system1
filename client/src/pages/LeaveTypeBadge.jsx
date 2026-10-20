export function LeaveTypeBadge({ color, name }) {
  return (
    <span
      className="text-xs font-medium text-white px-2 py-1 rounded"
      style={{ backgroundColor: color || '#4f46e5' }}
    >
      {name}
    </span>
  );
}
