const Joi = require("joi");

// Common validation schemas
const schemas = {
  // Activity logging validation
  activity: Joi.object({
    activity_type: Joi.string()
      .valid(
        "login",
        "logout",
        "create",
        "update",
        "delete",
        "view",
        "export",
        "import",
        "approval"
      )
      .required(),
    table_name: Joi.string().optional(),
    record_id: Joi.string().optional(),
    description: Joi.string().required().max(500),
    user_name: Joi.string().required().max(255),
    user_role: Joi.string().optional().max(100),
    additional_data: Joi.object().optional(),
  }),

  // Query parameters validation
  queryParams: {
    limit: Joi.number().integer().min(1).max(500).default(10),
    page: Joi.number().integer().min(1).default(1),
    period: Joi.number().integer().min(1).max(365).default(30),
    type: Joi.string().optional(),
    priority: Joi.string()
      .valid("low", "medium", "high", "critical")
      .optional(),
    status: Joi.string().optional(),
    category: Joi.string().optional(),
  },
};

// Validation middleware factory
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        type: detail.type,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
        timestamp: new Date().toISOString(),
      });
    }

    req[source] = value;
    next();
  };
};

// Specific validation middleware
const validateActivity = validate(schemas.activity, "body");

const validateQueryParams = (req, res, next) => {
  const { limit, page, period, type, priority, status, category } = req.query;

  const querySchema = Joi.object({
    limit: schemas.queryParams.limit,
    page: schemas.queryParams.page,
    period: schemas.queryParams.period,
    type: schemas.queryParams.type,
    priority: schemas.queryParams.priority,
    status: schemas.queryParams.status,
    category: schemas.queryParams.category,
  });

  const { error, value } = querySchema.validate(req.query, {
    allowUnknown: true,
    stripUnknown: false,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
      type: detail.type,
    }));

    return res.status(400).json({
      success: false,
      message: "Query parameter validation error",
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  // Update req.query with validated values
  Object.keys(value).forEach((key) => {
    req.query[key] = value[key];
  });

  next();
};

module.exports = {
  validate,
  validateActivity,
  validateQueryParams,
  schemas,
};
