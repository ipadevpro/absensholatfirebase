"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoonStar, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError("Email atau password salah");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  return (
    <div className="bg-background min-h-dvh flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-border/80 bg-card p-8 shadow-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-emerald-100/80 text-emerald-800 border border-emerald-200/60 flex items-center justify-center shadow-sm mb-3">
            <MoonStar className="h-6 w-6 text-emerald-800" />
          </div>
          <h1 className="font-semibold text-2xl tracking-tight text-foreground">
            Absen Sholat
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            SMP PGII 1 Bandung
          </p>
          <p className="text-xs text-muted-foreground/80 mt-2">
            Masuk ke sistem presensi ibadah harian
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div 
              id="login-error"
              role="alert" 
              aria-live="polite" 
              className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-xs flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              disabled={isLoading}
              autoComplete="email"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
              placeholder="nama@sekolah.sch.id"
              className="rounded-lg border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-foreground/80">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              minLength={6}
              disabled={isLoading}
              autoComplete="current-password"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
              placeholder="••••••••"
              className="rounded-lg border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary text-primary-foreground font-medium h-10 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </Button>
        </form>
      </div>

      {/* Footer Attribution */}
      <footer className="text-xs text-muted-foreground/60 text-center mt-6">
        Dikembangkan oleh Devi Saidulloh, S.Pd., Gr.
      </footer>
    </div>
  );
}
