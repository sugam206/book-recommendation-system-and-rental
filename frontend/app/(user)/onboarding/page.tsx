"use client";

import { FormEvent, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import type { AppDispatch, RootState } from "@/app/reduxToolkit/store";
import { completeOnboarding } from "@/app/reduxToolkit/profileSlice";

const GENRES = [
    "Fantasy",
    "Fiction",
    "Science Fiction",
    "Mystery",
    "Romance",
    "Thriller",
    "Biography",
    "History",
    "Self Help",
    "Poetry",
    "Adventure",
    "Horror",
];

const AUTHORS = [
    "J.K. Rowling",
    "Paulo Coelho",
    "George Orwell",
    "Agatha Christie",
    "Jane Austen",
    "Stephen King",
    "Haruki Murakami",
    "Dan Brown",
    "Khaled Hosseini",
    "Chetan Bhagat",
    "Yuval Noah Harari",
    "Rabindranath Tagore",
];

const toggleItem = (items: string[], value: string) =>
    items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

export default function OnboardingPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useSelector((state: RootState) => state.auth);
    const profileUser = useSelector((state: RootState) => state.profile.user);
    const { loading, error } = useSelector((state: RootState) => state.profile.sections.basicInfo);

    const [draftGenres, setDraftGenres] = useState<string[]>([]);
    const [draftAuthors, setDraftAuthors] = useState<string[]>([]);
    const [hasEditedPreferences, setHasEditedPreferences] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const selectedGenres = hasEditedPreferences ? draftGenres : (profileUser?.preferredGenres || []);
    const selectedAuthors = hasEditedPreferences ? draftAuthors : (profileUser?.preferredAuthors || []);

    const helperText = useMemo(() => {
        if (selectedGenres.length >= 2) {
            return "Nice. You can add authors too, or continue now.";
        }

        return "Pick at least 2 genres so we can personalize your home page.";
    }, [selectedGenres.length]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!token) {
            router.replace("/auth/login");
            return;
        }

        if (selectedGenres.length < 2) {
            setValidationError("Please choose at least 2 genres.");
            return;
        }

        setValidationError(null);

        try {
            await dispatch(completeOnboarding({
                token,
                data: {
                    preferredGenres: selectedGenres,
                    preferredAuthors: selectedAuthors,
                    hasCompletedOnboarding: true
                }
            })).unwrap();

            router.replace("/home");
        } catch {
            // redux slice exposes the API error
        }
    };

    return (
        <section className="min-h-screen py-10">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[2rem] bg-[#402218] p-8 text-[#F6E7D8] shadow-2xl lg:p-12">
                    <p className="text-sm uppercase tracking-[0.3em] text-[#D7B19D]">Welcome to Hamro Kitab</p>
                    <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight">
                        Let&apos;s tune your recommendations before you enter the library.
                    </h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-[#EBD7C6]">
                        Choose the genres you enjoy and a few authors you already trust. We&apos;ll use these picks to
                        shape your first recommendations and improve them as you rent, save, and rate books.
                    </p>

                    <div className="mt-10 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-[#8B5E3C] bg-[#4D2D1F] p-4">
                            <p className="text-3xl font-semibold">2+</p>
                            <p className="mt-2 text-sm text-[#EBD7C6]">Genres required to unlock your home feed</p>
                        </div>
                        <div className="rounded-2xl border border-[#8B5E3C] bg-[#4D2D1F] p-4">
                            <p className="text-3xl font-semibold">0-3</p>
                            <p className="mt-2 text-sm text-[#EBD7C6]">Authors optional for sharper first results</p>
                        </div>
                        <div className="rounded-2xl border border-[#8B5E3C] bg-[#4D2D1F] p-4">
                            <p className="text-3xl font-semibold">1 min</p>
                            <p className="mt-2 text-sm text-[#EBD7C6]">Quick setup before your personalized home page</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="rounded-[2rem] bg-[#F8F1E9] p-8 shadow-xl lg:p-10">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#8B5E3C]">Step 1 of 1</p>
                            <h2 className="mt-2 text-3xl font-semibold text-[#402218]">
                                Build your reading profile
                            </h2>
                        </div>
                        <div className="rounded-full bg-[#E7D2C2] px-4 py-2 text-sm font-medium text-[#6E452A]">
                            {profileUser?.username || "Reader"}
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-lg font-semibold text-[#402218]">Favorite genres</label>
                            <span className="text-sm text-[#6E452A]">{selectedGenres.length} selected</span>
                        </div>
                        <p className="mt-2 text-sm text-[#6E452A]">{helperText}</p>

                        <div className="mt-4 flex flex-wrap gap-3">
                            {GENRES.map((genre) => {
                                const active = selectedGenres.includes(genre);
                                return (
                                    <button
                                        key={genre}
                                        type="button"
                                        onClick={() => {
                                            setHasEditedPreferences(true);
                                            setDraftGenres(toggleItem(selectedGenres, genre));
                                            setDraftAuthors(selectedAuthors);
                                            setValidationError(null);
                                        }}
                                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${active
                                            ? "border-[#402218] bg-[#402218] text-[#F8F1E9]"
                                            : "border-[#C9A992] bg-white text-[#6E452A] hover:border-[#8B5E3C] hover:text-[#402218]"
                                            }`}
                                    >
                                        {genre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-10">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-lg font-semibold text-[#402218]">Favorite authors</label>
                            <span className="text-sm text-[#6E452A]">{selectedAuthors.length} selected</span>
                        </div>
                        <p className="mt-2 text-sm text-[#6E452A]">
                            Optional, but useful if you already know whose writing style you enjoy.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                            {AUTHORS.map((author) => {
                                const active = selectedAuthors.includes(author);
                                return (
                                    <button
                                        key={author}
                                        type="button"
                                        onClick={() => {
                                            setHasEditedPreferences(true);
                                            setDraftGenres(selectedGenres);
                                            setDraftAuthors(toggleItem(selectedAuthors, author));
                                        }}
                                        className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${active
                                            ? "border-[#8B5E3C] bg-[#D7B19D] text-[#402218]"
                                            : "border-[#D7C1B2] bg-[#FFF9F4] text-[#6E452A] hover:border-[#B98D72] hover:text-[#402218]"
                                            }`}
                                    >
                                        {author}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {(validationError || error) && (
                        <div className="mt-8 rounded-2xl border border-[#D99A8F] bg-[#FFF0ED] px-4 py-3 text-sm text-[#9B3D2F]">
                            {validationError || error}
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-between gap-4">
                        <p className="max-w-sm text-sm text-[#6E452A]">
                            You can update these preferences later from your profile as your taste changes.
                        </p>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-full bg-[#402218] px-6 py-3 text-sm font-semibold text-[#F8F1E9] transition hover:bg-[#5A3020] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Saving..." : "Continue to home"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
