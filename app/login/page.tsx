"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { login } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({ title: "Login successful", description: "Welcome back!" });
      router.push("/reports");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Dotted overlay (z-0) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 text-black/10 dark:text-white/10"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-lg flex items-center justify-center">
                <Image
                  src="/car.png"
                  alt="Logo"
                  width={100}
                  height={100}
                  className="opacity-80 mt-1"
                />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">Car Rental Back Office</CardTitle>
              <CardDescription>Sign in to manage your business</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Powered by */}
        <div className="mt-4 flex flex-col items-center text-xs text-muted-foreground">
          <span>Powered by</span>
          {/* Light mode logo */}
          <Image
            src="/logo1.png"
            alt="Powered by Logo"
            width={90}
            height={90}
            className="opacity-80 mt-1 dark:hidden"
          />
          {/* Dark mode logo */}
          <Image
            src="/logo.png"
            alt="Powered by Logo Dark"
            width={90}
            height={90}
            className="opacity-80 mt-1 hidden dark:block"
          />
        </div>
      </div>
    </div>
  );
}
