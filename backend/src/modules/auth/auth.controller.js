export const register = async (req, res) => {
  try {
    res.status(201).json({
      message: "Register endpoint",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};