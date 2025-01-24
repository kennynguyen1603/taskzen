"use client";

import { toast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Oauth() {
  const router = useRouter();
  const count = useRef(0);

  const searchParams = useSearchParams();
  const access_token = searchParams.get("access_token");
  const refresh_token = searchParams.get("refresh_token");
  useEffect(() => {
    if (access_token && refresh_token) {
      if (count.current === 0) {
        // 1. Thêm access_token vào localStorage và refresh_token vào cookie
        localStorage.setItem("access_token", access_token);
        // document.cookie = `refresh_token=${refresh_token}; path=/`;

        // 2. Chuyển hướng đến trang home
        router.push("/");
        count.current++;
      }
    } else {
      if (count.current === 0) {
        setTimeout(() => {
          toast({
            description: "Có lỗi xảy ra",
          });
        });
        count.current++;
      }
    }
  }, [access_token, refresh_token, router]);
  return null;
}
