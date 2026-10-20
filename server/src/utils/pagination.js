/**
 * Mongo-style pagination helper.
 * const { page, limit, skip, sort } = paginate(req.query, { sortBy: 'createdAt', sortOrder: -1 });
 */
export function paginate(query = {}, defaults = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || defaults.sortBy || 'createdAt';
  const direction = String(query.sortOrder || defaults.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;

  return { page, limit, skip, sort: { [sortBy]: direction } };
}

export function pageMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

/** Builds `{ data, meta }` list envelopes used by the API. */
export function paginatedResponse(docs, total, page, limit) {
  return { data: docs, meta: pageMeta(total, page, limit) };
}

export default paginate;
