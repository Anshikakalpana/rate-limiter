
const authMiddleware = (req: any, res: any, next: any) => {


  try {

    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key missing',
      });
    }
    
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export default authMiddleware;




export {authMiddleware} ;