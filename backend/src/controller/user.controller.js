import express from "express";
import { loginSchema, signupSchema } from "../Schema/user.Schema";
import mongoose from "mongoose";
import User from "../models/user.models";
import { success } from "zod";

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
    // finding user 

    const existingUser = await User.findOne({username});

    if(!existingUser){
      return res.status(404).json({
        success: false,
        message: "Please signup first"
      })
    }

    // password checking
    const isPasswordMatch = await bcrypt.compare(password,User.password);

    // password not matching
    if(!isPasswordMatch){
      return res.status(403).json({
        success: false,
        message: "Invalid credentials"
      })
    }
    // token
    const token = jwt.sign({
      userId: username._id
    },process.env.JWT_SECRET,{expiresIn: "7d"})

    // send response

    return res.status(200).json({
      success: false,
      message: "Login Successfully !",
      token
    })
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
