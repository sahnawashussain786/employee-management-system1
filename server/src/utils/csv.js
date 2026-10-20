/** Minimal CSV exporter (no dependency). */

function escapeCell(value) {
  if (value === null || value === undefined) return "";
  const str =
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCsv(rows, columns) {
  const cols = columns || (rows[0] ? Object.keys(rows[0]) : []);
  const header = cols.map((c) => escapeCell(c.label || c.key || c)).join(",");
  const body = rows
    .map((row) =>
      cols
        .map((c) => escapeCell(typeof c === "object" ? c.value(row) : row[c]))
        .join(","),
    )
    .join("\r\n");
  return `${header}\r\n${body}`;
}

export function sendCsv(res, filename, rows, columns) {
  const csv = toCsv(rows, columns);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(`\uFEFF${csv}`); // BOM so Excel renders UTF-8
}

export default toCsv;
