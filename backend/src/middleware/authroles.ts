export const normal = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const role = req.user.role;

    if (role !== "buyer") {
      return res.json({
        success: false,
        message: "Access denied: only buyers can perform this action",
      });
    }

    next();
  } catch (err) {
    return res.json({
      success: false,
      message: "Error validating user role",
    });
  }
};


export const premium = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const role = req.user.role;

    if (role !== "seller") {
      return res.json({
        success: false,
        message: "Access denied: only sellers can perform this action",
      });
    }

    next();
  } catch (err) {
    return res.json({
      success: false,
      message: "Error validating user role",
    });
  }
};


export const gold = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const role = req.user.role;

    if (role !== "admin") {
      return res.json({
        success: false,
        message: "Access denied: only admin can perform this action",
      });
    }

    next();
  } catch (err) {
    return res.json({
      success: false,
      message: "Error validating user role",
    });
  }
};

