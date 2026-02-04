
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
  });

  const { login, signup, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    let result;

    if (isLogin) {
      result = await login(formData.username, formData.password);
    } else {
      result = await signup(formData.name, formData.username, formData.password);
    }

    if (result.success) {
      if (isLogin) {
        toast.success("Login successful");
        navigate("/dashboard");
      } else {
        toast.success("Account created — please login");
        setIsLogin(true);
      }

      setFormData({ name: "", username: "", password: "" });

    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {isLogin ? "Login" : "Sign Up"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Login to your account" : "Create new account"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {!isLogin && (
              <div>
                <Label>Name</Label>
                <Input name="name" value={formData.name} onChange={handleChange} />
              </div>
            )}

            <div>
              <Label>Username</Label>
              <Input name="username" value={formData.username} onChange={handleChange} />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" name="password" value={formData.password} onChange={handleChange} />
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Login" : "Signup"}
            </Button>
          </form>

          <p className="text-center mt-4 text-sm">
            {isLogin ? "No account?" : "Already have account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-blue-400"
            >
              {isLogin ? "Signup" : "Login"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

