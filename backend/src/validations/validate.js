const validate = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);

      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.issues?.[0]?.message || error.message,
      });
    }
  };
};

export default validate;