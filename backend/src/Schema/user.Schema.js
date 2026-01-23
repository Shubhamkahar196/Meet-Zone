import { z } from "zod";


export const signupSchema = z.object({
    name: z.string().min(3,"Name too short"),
    username: z.string().min(5,"Username must be more than 5 characters"),
    password: z.string().min(6,"Password must be more than 6 characters")
})





export const loginSchema = z.object({
  username: z.string().min(5,"Username must be more than 5 characters"),
    password: z.string().min(6,"Password must be more than 6 characters")
});

