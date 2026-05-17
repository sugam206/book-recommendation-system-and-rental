"use client";

import "@/app/globals.css";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/app/reduxToolkit/store";
import { fetchProfileData } from "@/app/reduxToolkit/profileSlice";

import Nav from "@/components/layout/Nav";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const pathname = usePathname();
    const { token, user } = useSelector((state: RootState) => state.auth);
    const profileUser = useSelector((state: RootState) => state.profile.user);

    useEffect(() => {
        if (!token || !user) {
            router.replace("/auth/login");
            return;
        }

        dispatch(fetchProfileData(token));
    }, [token, user, dispatch, router]);

    useEffect(() => {
        if (!token || !user || user.role === "admin" || !profileUser) {
            return;
        }

        const isOnboardingPage = pathname === "/onboarding";

        if (!profileUser.hasCompletedOnboarding && !isOnboardingPage) {
            router.replace("/onboarding");
            return;
        }

        if (profileUser.hasCompletedOnboarding && isOnboardingPage) {
            router.replace("/home");
        }
    }, [pathname, profileUser, router, token, user]);

    if (!token || !user) {
        return null;
    }

    return (
        <div className="antialiased bg-[#D7B19D]">
            {pathname !== "/onboarding" && <Nav />}
            <div className={`${pathname !== "/onboarding" ? "mt-16" : ""} mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`}>
                <main className="py-2">{children}</main>
            </div>
        </div>
    );
}
