import express from "express";
import { loginSchema, signupSchema } from "../Schema/user.Schema";
import mongoose from "mongoose";
import User from "../models/user.models";

// signup

export const Signup = async (req, res) => {
  try {
    // validate request body
    const parsedData = signupSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        success: false,
        errors: parsedData.error.errors,
      });
    }

    const { name, username, password } = req.body;

    // finding existing user
    const existingUser = await User.findOne({ username });

    // checking existing user
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exist",
      });
    }

    // hashed password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(200).json({
      success: true,
      message: "User signup successfully!",
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        success: false,
        error: parsedData.error.errors,
      });
    }

    const { username, password } = req.body;
    // findin user
    // password checking
    // password not matching
    // token
    // res
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
