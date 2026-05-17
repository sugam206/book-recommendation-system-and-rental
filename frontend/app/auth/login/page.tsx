"use client";

import { useState, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/app/reduxToolkit/store";
import { loginUser } from "@/app/reduxToolkit/authSlice";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSuccess(false);

        if (!formData.email || !formData.password) {
            return;
        }

        try {
            const result = await dispatch(loginUser({
                email: formData.email,
                password: formData.password,
            })).unwrap();

            setSuccess(true);

            if (result?.user?.role === "admin") {
                router.replace("/admin");
            } else if (result?.user?.hasCompletedOnboarding === false) {
                router.replace("/onboarding");

            } else {
                router.replace("/home");
            }
        } catch {
            setSuccess(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-[#D7B19D] px-8 py-6">
                        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                        <p className="text-blue-100 mt-1">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2focus:ring-[#402218]  outline-none transition-colors bg-gray-50/50"
                                placeholder="Email"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#402218]  outline-none transition-colors bg-gray-50/50"
                                placeholder="********"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-gray-600">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-[#402218] "
                                />
                                Remember me
                            </label>
                            <a
                                href="/forgot-password"
                                className="hover:text-[#402218]  hover:underline font-medium"
                            >
                                Forgot password?
                            </a>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                                Login successful! Redirecting...
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#D7B19D] text-white py-3 px-4 rounded-lg font-medium hover:ring-[#402218]  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
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
                                    Signing in...
                                </span>
                            ) : (
                                "Sign in"
                            )}
                        </button>

                        <p className="text-center text-sm text-gray-600">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="register"
                                className="font-medium hover:text-[#402218]  hover:underline"
                            >
                                Create an account
                            </Link>
                        </p>
                    </form>
                </div>

            </div>
        </div>
    );
}
