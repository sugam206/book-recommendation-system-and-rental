'use client';

import React, { useState } from 'react';
import { BookOpen, Search, TrendingUp, Clock, Star, ArrowRight, Menu, X } from 'lucide-react';
import Link from 'next/link';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Stat {
  number: string;
  label: string;
}

interface Step {
  step: string;
  title: string;
  desc: string;
}

export default function BookRentalLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const features: Feature[] = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Smart Recommendations",
      description: "Our AI-powered system suggests books tailored to your reading preferences and history."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Flexible Rental",
      description: "Rent books for as long as you need with our flexible pricing and easy returns."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Trending Collections",
      description: "Discover what's popular and explore curated collections from expert readers."
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Quality Assured",
      description: "Every book is carefully inspected and maintained to ensure the best reading experience."
    }
  ];

  const stats: Stat[] = [
    { number: "50K+", label: "Books Available" },
    { number: "15K+", label: "Happy Readers" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "24/7", label: "Support" }
  ];

  const steps: Step[] = [
    { step: "1", title: "Browse & Discover", desc: "Explore our collection and get personalized recommendations" },
    { step: "2", title: "Rent Your Book", desc: "Choose your rental period and add books to your cart" },
    { step: "3", title: "Enjoy Reading", desc: "Books delivered to your door or pick up at our location" }
  ];

  const genres: string[] = ['Mystery', 'Science Fiction', 'Biography'];

  return (
    <div className="min-h-screen bg-[#D7B19D]">
      {/* Navigation */}
      <nav className="bg-[#402218] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-[#D7B19D]" />
              <span className="text-2xl font-bold text-[#D7B19D]">hamro kitab</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-[#D7B19D] hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-[#D7B19D] hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-[#D7B19D] hover:text-white transition-colors">Pricing</a>
              <button className="bg-[#D7B19D] text-[#402218] px-6 py-2 rounded-full font-semibold hover:bg-white transition-all transform hover:scale-105">
                <Link href="/auth/register">Get Started</Link>
              </button>
            </div>

            <button
              className="md:hidden text-[#D7B19D]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden pb-4 space-y-3">
              <Link href="#features" className="block text-[#D7B19D] hover:text-white transition-colors">Features</Link>
              <Link href="#how-it-works" className="block text-[#D7B19D] hover:text-white transition-colors">How It Works</Link>
              <Link href="#pricing" className="block text-[#D7B19D] hover:text-white transition-colors">Pricing</Link>
              <button className="w-full bg-[#D7B19D] text-[#402218] px-6 py-2 rounded-full font-semibold">
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-5xl lg:text-6xl font-bold text-[#402218] leading-tight">
                Your Perfect Book is Just a Click Away
              </h1>
              <p className="text-xl text-[#402218] opacity-90">
                Discover personalized book recommendations and rent your next great read with our intelligent system. Affordable, convenient, and tailored just for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-[#402218] text-[#D7B19D] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#502820] transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2">
                  <span>Start Reading</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="bg-white text-[#402218] px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg">
                  Browse Collection
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-[#402218] rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-[#D7B19D] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-[#402218] fill-current" />
                    <span className="text-[#402218] font-semibold text-lg">Recommended for You</span>
                  </div>
                  {genres.map((genre, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#402218]">{genre}</div>
                          <div className="text-sm text-gray-600">5 books available</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#402218]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#402218] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-[#D7B19D] mb-2">{stat.number}</div>
                <div className="text-white opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#402218] mb-4">
              Why Choose hamro kitab?
            </h2>
            <p className="text-xl text-[#402218] opacity-80 max-w-2xl mx-auto">
              Experience the future of book rental with intelligent recommendations and seamless service.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 duration-300"
              >
                <div className="bg-[#402218] text-[#D7B19D] w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-[#402218] mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-[#402218] py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#D7B19D] mb-4">
              How It Works
            </h2>
            <p className="text-xl text-white opacity-90 max-w-2xl mx-auto">
              Get started with BookWise in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, i) => (
              <div key={i} className="text-center">
                <div className="bg-[#D7B19D] text-[#402218] w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-[#D7B19D] mb-3">{item.title}</h3>
                <p className="text-white opacity-90 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#402218] mb-6">
            Ready to Start Your Reading Journey?
          </h2>
          <p className="text-xl text-[#402218] opacity-80 mb-8">
            Join thousands of readers who trust BookWise for their next great book
          </p>
          <button className="bg-[#402218] text-[#D7B19D] px-12 py-5 rounded-full font-semibold text-lg hover:bg-[#502820] transition-all transform hover:scale-105 shadow-2xl">
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#402218] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="w-8 h-8 text-[#D7B19D]" />
                <span className="text-2xl font-bold text-[#D7B19D]">BookWise</span>
              </div>
              <p className="text-[#D7B19D] opacity-80">Your intelligent book rental companion</p>
            </div>
            <div>
              <h4 className="font-bold text-[#D7B19D] mb-4">Product</h4>
              <ul className="space-y-2 text-[#D7B19D] opacity-80">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reviews</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#D7B19D] mb-4">Company</h4>
              <ul className="space-y-2 text-[#D7B19D] opacity-80">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#D7B19D] mb-4">Legal</h4>
              <ul className="space-y-2 text-[#D7B19D] opacity-80">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#D7B19D] border-opacity-30 pt-8 text-center text-[#D7B19D] opacity-80">
            <p>&copy; 2026 BookWise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}