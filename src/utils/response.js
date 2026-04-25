export function successResponse(res, message, data = null, statusCode = 200) {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
}

export function errorResponse(res, message, statusCode = 400, errors = null) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
}

export function paginatedResponse(res, message, data, meta) {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta,
  });
}
