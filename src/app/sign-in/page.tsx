"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Home,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

function SignInForm() {
  const { signIn } = useAuth();
  const searchParams = useSearchParams();

  const from = searchParams.get("from");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handlePhoneChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, "").slice(0, 10);

    setPhone(cleanedValue);

    if (phoneError) {
      setPhoneError("");
    }

    if (loginError) {
      setLoginError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    if (passwordError) {
      setPasswordError("");
    }

    if (loginError) {
      setLoginError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validateForm = () => {
    let valid = true;

    setPhoneError("");
    setPasswordError("");
    setLoginError("");
    setSuccessMessage("");

    if (!phone.trim()) {
      setPhoneError("Phone number is required.");
      valid = false;
    } else if (!/^\d{10}$/.test(phone)) {
      setPhoneError("Please enter a valid 10-digit phone number.");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      valid = false;
    }

    return valid;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setLoginError("");
    setSuccessMessage("");

    try {
      await signIn(phone, password);

      setSuccessMessage("Login successful. Redirecting...");

      if (from) {
        window.location.href = from;
        return;
      }

      const res = await fetch("/api/auth/me");

      if (!res.ok) {
        throw new Error("Unable to verify your account.");
      }

      const data = await res.json();
      const role = data?.user?.role;

      if (role === "admin") {
        window.location.href = "/admin/dashboard";
      } else if (role === "technician") {
        window.location.href = "/technician/dashboard";
      } else {
        window.location.href = "/customer/home";
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please check your phone number and password.";

      setSuccessMessage("");

      /*
       * Convert backend errors into clear user-friendly messages.
       */
      const normalizedMessage = message.toLowerCase();

      if (
        normalizedMessage.includes("not found") ||
        normalizedMessage.includes("invalid") ||
        normalizedMessage.includes("incorrect") ||
        normalizedMessage.includes("phone") ||
        normalizedMessage.includes("password") ||
        normalizedMessage.includes("credentials")
      ) {
        setLoginError(
          "Account not found or password is incorrect. Please check your phone number and password."
        );
      } else {
        setLoginError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="absolute left-0 right-0 top-0 z-10">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-bold text-foreground"
            aria-label="Ziffix Home"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Home className="size-5" />
            </span>

            <span>Ziffix</span>
          </Link>

          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Home className="size-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex min-h-screen items-center justify-center px-4 pb-10 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
            {/* Security Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="size-8 text-primary" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
              Welcome Back
            </h1>

            <p className="mt-2 text-center text-sm text-muted-foreground">
              Enter your phone number and password to sign in
            </p>

            {/* Login Error */}
            {loginError && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-5 shrink-0" />

                <p>{loginError}</p>
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div
                role="status"
                className="mt-6 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-600"
              >
                <CheckCircle2 className="size-5 shrink-0" />

                <p>{successMessage}</p>
              </div>
            )}

            {/* Form */}
            <div className="mt-7 space-y-5">
              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Phone Number
                </label>

                <div
                  className={`flex gap-2 ${
                    phoneError
                      ? "[&>span]:border-destructive [&>input]:border-destructive"
                      : ""
                  }`}
                >
                  {/* Country code */}
                  <span
                    className={`flex h-12 items-center rounded-xl border bg-muted px-3 text-sm font-medium text-muted-foreground ${
                      phoneError ? "border-destructive" : "border-border"
                    }`}
                  >
                    +91
                  </span>

                  {/* Phone input */}
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(event) =>
                      handlePhoneChange(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSignIn();
                      }
                    }}
                    placeholder="98765 43210"
                    maxLength={10}
                    autoComplete="tel"
                    disabled={loading}
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby={
                      phoneError ? "phone-error" : undefined
                    }
                    className={`h-12 flex-1 rounded-xl ${
                      phoneError
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                  />
                </div>

                {/* Phone error */}
                {phoneError && (
                  <div
                    id="phone-error"
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive"
                  >
                    <AlertCircle className="size-3.5" />
                    <span>{phoneError}</span>
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Password
                </label>

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      handlePasswordChange(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSignIn();
                      }
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={
                      passwordError ? "password-error" : undefined
                    }
                    className={`h-12 w-full rounded-xl pr-12 ${
                      passwordError
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                  />

                  {/* Password visibility */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>

                {/* Password error */}
                {passwordError && (
                  <div
                    id="password-error"
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive"
                  >
                    <AlertCircle className="size-3.5" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {/* Sign In Button */}
              <Button
                type="button"
                onClick={handleSignIn}
                className="h-12 w-full rounded-xl"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>

              {/* Security text */}
              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Your account is securely protected</span>
              </div>
            </div>
          </div>

          {/* Sign up */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-semibold text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>

          {/* Copyright */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ziffix. All rights reserved.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}