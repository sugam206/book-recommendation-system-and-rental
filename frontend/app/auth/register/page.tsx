"use client";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/app/reduxToolkit/store";
import { registerUser } from "@/app/reduxToolkit/authSlice";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setValidationError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            setValidationError("All fields are required");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setValidationError("Passwords do not match");
            return;
        }

        if (formData.password.length < 8) {
            setValidationError("Password must be at least 8 characters");
            return;
        }

        setValidationError(null);

        try {
            await dispatch(registerUser({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
            })).unwrap();
            router.replace("/onboarding");
        } catch {
            // API error is already handled in redux state (`error`)
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-[#D7B19D] px-8 py-6">
                        <h1 className="text-2xl font-bold text-white">Create an account</h1>
                        <p className="text-blue-100 mt-1">Sign up to get started</p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Full name
                            </label>
                            <input
                                id="name"
                                name="username"
                                type="text"
                                autoComplete="name"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#402218]  outline-none transition-colors bg-gray-50/50"
                                placeholder="Enter your full name"
                                disabled={loading}
                            />
                        </div>

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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#402218]  outline-none transition-colors bg-gray-50/50"
                                placeholder="Enter your email"
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
                                autoComplete="new-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#402218]  outline-none transition-colors bg-gray-50/50"
                                placeholder="********"
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#402218]  outline-none transition-colors bg-gray-50/50"
                                placeholder="********"
                                disabled={loading}
                            />
                        </div>

                        {validationError && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{validationError}</div>
                        )}

                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#D7B19D] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#D7B19D]  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? "Creating account..." : "Sign up"}
                        </button>

                        <p className="text-center text-sm text-gray-600">
                            Already have an account?{" "}
                            <Link href="login" className="font-medium  hover:text-[#402218]  hover:underline">
                                Log in
                            </Link>
                        </p>
                    </form>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                    By signing up, you agree to our <a href="/terms" className="underline hover:text-gray-700">Terms</a> and{" "}
                    <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}
