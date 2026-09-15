"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const justRegistered = searchParams.get("registered") === "1";
  const next = searchParams.get("next") || "/account";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: email, error: rpcError } = await supabase.rpc("get_email_for_login", {
        identifier: identifier.trim(),
      });
      if (rpcError || !email) {
        throw new Error("Пользователь с таким логином или почтой не найден.");
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw new Error("Неверный логин или пароль.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_blocked, is_admin")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        throw new Error("Аккаунт заблокирован. Свяжитесь с поддержкой бренда.");
      }

      router.push(profile?.is_admin ? "/admin" : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex flex-1 items-center justify-center py-20">
      <div className="w-full max-w-md rounded-2xl border hairline bg-charcoal p-8 sm:p-10">
        <h1 className="font-display text-3xl text-paper mb-2">Вход</h1>
        <p className="text-sm text-ash mb-8">Войдите по логину или почте.</p>

        {justRegistered && (
          <p className="mb-6 rounded-lg border hairline bg-ink-soft px-4 py-3 text-sm text-ash">
            Регистрация почти завершена. Если на проекте включено подтверждение почты — проверьте
            письмо, затем войдите здесь.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Логин или почта"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <Input
            label="Пароль"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-red-bright">{error}</p>}

          <Button type="submit" loading={loading} className="mt-2 w-full">
            Войти
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ash">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-paper hover:text-red-bright transition-colors">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
