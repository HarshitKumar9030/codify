/**
 * Request validation middleware using Joi schemas
 */
export function validateRequest(schema, target = 'body') {
  return (req, res, next) => {
    const dataToValidate = target === 'params' ? req.params :
                          target === 'query' ? req.query :
                          req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown fields
      convert: true // Convert types when possible
    });

    if (error) {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return next(validationError);
    }

    // Replace the original data with validated/sanitized data
    if (target === 'params') {
      req.params = value;
    } else if (target === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
}
