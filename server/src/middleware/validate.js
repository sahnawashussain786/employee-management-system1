import ApiError from '../utils/ApiError.js';

/**
 * Zod validation middleware.
 * validate(schema) parses req.body; validate(schema, 'query') parses req.query.
 * On success the parsed (stripped/coerced) value replaces the source.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || source;
        if (!details[key]) details[key] = issue.message;
      }
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[source] = result.data;
    return next();
  };
}

export default validate;
