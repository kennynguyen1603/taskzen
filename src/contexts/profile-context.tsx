"use client";

import { getAccessTokenFromLocalStorage } from "@/lib/utils";
import { createContext, useState, useEffect, ReactNode } from "react";

interface Profile {
  id: string;
  name: string;
  email: string;
}

type ProfileContextType = {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
};

export const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  setProfile: () => {},
});

type ProfileProviderProps = {
  children: ReactNode;
};

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const accessToken = getAccessTokenFromLocalStorage();
    if (accessToken) {
      fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/user/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401) {
              setProfile(null);
              localStorage.removeItem("access_token");
            }
            throw new Error("Failed to fetch profile");
          }
          return res.json();
        })
        .then((data) => {
          console.log("Fetched profile:", data);
          setProfile(data);
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
        });
    } else {
      setProfile(null);
    }
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
