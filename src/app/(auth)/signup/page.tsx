"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, User, Mail, Lock, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
type SignUpFormValues = {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  date_of_birth: string;
  avatar_url?: string;
};

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>();
  const router = useRouter();

  const onSubmit: SubmitHandler<SignUpFormValues> = async (data) => {
    setIsLoading(true);
    setPasswordError("");

    if (data.password !== data.confirm_password) {
      setPasswordError("Mật khẩu không khớp");
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Mật khẩu không khớp",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Gửi yêu cầu đăng ký
      const registerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/access/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(error.message || "Đăng ký thất bại");
      }

      toast({
        title: "Thành công",
        description: "Đăng ký tài khoản thành công",
      });

      // Gửi yêu cầu đăng nhập
      const loginResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/access/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        }
      );

      if (!loginResponse.ok) {
        const error = await loginResponse.json();
        throw new Error(error.message || "Đăng nhập thất bại");
      }

      // Chuyển hướng đến dashboard
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error instanceof Error ? error.message : "Đã có lỗi xảy ra",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row-reverse bg-gradient-to-bl from-indigo-100 via-white to-cyan-100">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center items-center lg:items-end text-center lg:text-right"
      >
        <h1 className="text-4xl lg:text-6xl font-bold text-indigo-900 mb-6">
          Start Your Journey
        </h1>
        <p className="text-xl text-indigo-700 mb-8 max-w-md">
          Join thousands of users and start managing your projects efficiently
          today.
        </p>
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-end p-4 bg-white rounded-lg shadow-md">
            <p className="text-gray-700 mr-4">Streamline your workflow</p>
            <div className="bg-indigo-100 rounded-full p-2">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-end p-4 bg-white rounded-lg shadow-md">
            <p className="text-gray-700 mr-4">Collaborate seamlessly</p>
            <div className="bg-indigo-100 rounded-full p-2">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                ></path>
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-end p-4 bg-white rounded-lg shadow-md">
            <p className="text-gray-700 mr-4">Achieve your goals</p>
            <div className="bg-indigo-100 rounded-full p-2">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12"
      >
        <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center text-indigo-900">
              Đăng ký tài khoản
            </CardTitle>
            <CardDescription className="text-center text-indigo-700">
              Điền thông tin của bạn để bắt đầu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700"
                >
                  Tên đăng nhập
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    id="username"
                    {...register("username", {
                      required: "Tên đăng nhập là bắt buộc",
                    })}
                    placeholder="johndoe"
                    className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm">
                      {errors.username.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    {...register("email", { required: "Email là bắt buộc" })}
                    placeholder="name@example.com"
                    required
                    className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Mật khẩu là bắt buộc",
                    })}
                    required
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="text-red-500 text-sm">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirm_password", {
                      required: "Xác nhận mật khẩu là bắt buộc",
                    })}
                    required
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  {errors.confirm_password && (
                    <p className="text-red-500 text-sm">
                      {errors.confirm_password.message}
                    </p>
                  )}
                  {passwordError && (
                    <p className="text-red-500 text-sm">{passwordError}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="date_of_birth"
                  className="text-sm font-medium text-gray-700"
                >
                  Ngày sinh
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...register("date_of_birth", {
                      required: "Ngày sinh là bắt buộc",
                    })}
                    required
                    className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  {errors.date_of_birth && (
                    <p className="text-red-500 text-sm">
                      {errors.date_of_birth.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="avatar_url"
                  className="text-sm font-medium text-gray-700"
                >
                  URL ảnh đại diện (tùy chọn)
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    id="avatar_url"
                    type="url"
                    {...register("avatar_url")}
                    placeholder="https://example.com/avatar.jpg"
                    className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <Button
                className="w-full h-12 text-base transition-all bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Đăng ký"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-600">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center transition-colors"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Đăng nhập
              </Link>
            </div>
            <div className="text-xs text-center text-gray-500">
              Bằng cách đăng ký, bạn đồng ý với{" "}
              <Link
                href="/privacy-policy"
                className="underline hover:text-indigo-600"
              >
                Chính sách bảo mật
              </Link>{" "}
              của chúng tôi
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
