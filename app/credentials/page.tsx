"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import Link from "next/link";

export default function CredentialsPage() {
    const { session } = useAppContext();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"request" | "verify">("request");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (session) {
            router.push("/prompt");
        }
    }, [session, router]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                data: {
                    full_name: name,
                },
                shouldCreateUser: true
            },
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setStep("verify");
            setMessage({ type: 'success', text: "Verification code sent to your email!" });
        }
        setIsLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'magiclink'
        });

        if (error) {
            setMessage({ type: 'error', text: "Invalid or expired code. Please try again." });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
                <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-md scale-in">
                {/* Back Button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
                >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-semibold">Back to home</span>
                </Link>

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 md:p-10">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                            BM
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            {step === "request" ? "Welcome Back" : "Verify Code"}
                        </h1>

                        <p className="text-gray-600 text-lg">
                            {step === "request"
                                ? "Sign in to access your roadmaps"
                                : `Enter the code sent to ${email}`}
                        </p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className={`w-12 h-1.5 rounded-full transition-all duration-500 ${step === "request" ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-200"}`}></div>
                        <div className={`w-12 h-1.5 rounded-full transition-all duration-500 ${step === "verify" ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-200"}`}></div>
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-2xl border-2 ${message.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                            } fade-in`}>
                            <div className="flex items-center gap-3">
                                {message.type === 'success' ? (
                                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <p className="font-semibold text-sm">{message.text}</p>
                            </div>
                        </div>
                    )}

                    {/* Forms */}
                    {step === "request" ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="John Doe"
                                    className="input-field"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="john@example.com"
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Send Verification Code
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">8-Digit Code</label>
                                <input
                                    required
                                    type="text"
                                    maxLength={8}
                                    placeholder="12345678"
                                    className="input-field text-center text-4xl tracking-[0.5em] font-mono font-bold"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || otp.length < 8}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Verify & Continue
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep("request"); setOtp(""); setMessage(null); }}
                                className="w-full text-center text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Try a different email
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    Protected by industry-standard encryption
                </p>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0%, 100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }
                
                .animate-blob {
                    animation: blob 7s infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}
