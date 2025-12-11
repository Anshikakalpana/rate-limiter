import { redis } from "../utils/redis.js";

import { Request, Response } from "express";

const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password and role are required"
      });
    }

   
    const exists = await redis.exists(`user:${email}`);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

  
    await redis.hset(`user:${email}`, {
      email,
      password,
      role
    });

  
    await redis.sadd(`user:${email}:roles`, role);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { email, role }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const storedPassword = await redis.hget(`user:${email}`, "password");
    if (!storedPassword || storedPassword !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const role = await redis.hget(`user:${email}`, "role");

    const apiKey = `gw_${Buffer.from(`${email}:${Date.now()}`).toString('base64')}`;
    
 
    await redis.setex(
      `apikey:${apiKey}`,
      24 * 60 * 60, 
      JSON.stringify({ email, role })
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        apiKey,
        email,
        role
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export { register, Login };