"use client";

import { useState, useContext } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { ArrowRight, Lock, Mail } from "lucide-react";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
// import { ProfileContext } from "@/contexts/profile-context";
import { setAccessTokenToLocalStorage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SiGoogle } from "react-icons/si";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // const { setProfile } = useContext(ProfileContext);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const loginResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/access/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!loginResponse.ok) {
        throw new Error("Đã có lỗi xảy ra");
      }

      const loginData = await loginResponse.json();
      const { access_token } = loginData.metadata;

      setAccessTokenToLocalStorage(access_token);

      // const profileResponse = await fetch(
      //   `${process.env.NEXT_PUBLIC_API_ENDPOINT}/user/profile`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${access_token}`,
      //     },
      //   }
      // );

      // if (!profileResponse.ok) {
      //   throw new Error("Không thể lấy thông tin người dùng");
      // }

      // const profileData = await profileResponse.json();

      // setProfile(profileData.metadata);

      toast({
        description: "Đăng nhập thành công",
      });

      router.push("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error unknown",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    router.push(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/access/login/google`);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-indigo-100 via-white to-cyan-100">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center items-center lg:items-start text-center lg:text-left"
      >
        <h1 className="text-4xl lg:text-6xl font-bold text-indigo-900 mb-6">
          Welcome Back
        </h1>
        <p className="text-xl text-indigo-700 mb-8 max-w-md">
          Log in to your account and continue your journey in efficient project
          management.
        </p>
        {/* Features */}
      </motion.div>

      {/* Right Panel */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12"
      >
        <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center text-indigo-900">
              Đăng nhập
            </CardTitle>
            <CardDescription className="text-center text-indigo-700">
              Nhập thông tin đăng nhập của bạn để tiếp tục
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    placeholder="name@example.com"
                    className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
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
                    type="password"
                    className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
              <Button
                className="w-full h-12 text-base transition-all bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 text-white font-medium rounded-lg"
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
                  "Đăng nhập"
                )}
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300"></span>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Hoặc</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base transition-all border-gray-300 hover:bg-gray-100"
                onClick={() => {
                  handleGoogleLogin();
                }}
              >
                <SiGoogle className="w-5 h-5 mr-2" />
                Đăng nhập bằng Google
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                href="/signup"
                className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center transition-colors"
              >
                Đăng ký ngay <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="text-xs text-center text-gray-500">
              Bằng cách đăng nhập, bạn đồng ý với{" "}
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
