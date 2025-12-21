"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleMode = (next: Mode) => {
    setMode(next);
    setMessage(null);
  };

  const handleCredentialsSignIn = async () => {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/",
    });

    if (error) {
      setMessage(error.message ?? "Invalid credentials");
      return;
    }

    if (data?.redirect && data.url) {
      window.location.href = data.url;
      return;
    }

    setMessage("Signed in! Redirecting to your workspace…");
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1000);
  };

  const handleRegister = async () => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: name.trim() || email.split("@")[0] || "User",
    });

    if (error) {
      setMessage(error.message ?? "Unable to register");
      return;
    }

    if (data?.token) {
      setMessage("Account created. Redirecting…");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
      return;
    }

    setMessage("Account created. You can sign in now.");
    setMode("login");
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      if (mode === "login") {
        await handleCredentialsSignIn();
      } else {
        await handleRegister();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setMessage("Opening Google sign-in…");
    const { data, error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });

    if (error) {
      setMessage(error.message ?? "Unable to sign in with Google");
      return;
    }

    if (data?.redirect && data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <Card className="w-full max-w-lg gap-4 shadow-lg border-border/50">
        <CardHeader>
          <CardTitle>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Sign in with your email and password or continue with Google."
              : "Register with an email and password. You can link Google later."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
              />
            </div>

            {message && (
              <div className="rounded-md border border-border/60 bg-muted/50 px-3 py-2 text-sm text-foreground">
                {message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? "Please wait..."
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </Button>
          </form>

          <div className="relative py-2 text-center text-xs uppercase tracking-wide text-muted-foreground">
            <span className="bg-card px-2">or</span>
            <div className="absolute left-0 right-0 top-1/2 -z-10 h-px bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={submitting}
          >
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Need an account?" : "Already registered?"}{" "}
            <button
              type="button"
              onClick={() =>
                toggleMode(mode === "login" ? "register" : "login")
              }
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {mode === "login" ? "Create one" : "Sign in instead"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
