"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    phone: "",
    telegram: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.phone && !form.telegram) {
      setError("Укажите телефон или Telegram — хотя бы один способ связи обязателен.");
      return;
    }
    if (form.password.length < 6) {
      setError("Пароль должен быть не короче 6 символов.");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(form.username)) {
      setError("Логин: 3–24 символа, латиница, цифры, _ . -");
      return;
    }

    setLoading(true);
    try {
      const { data: taken } = await supabase.rpc("username_exists", { u: form.username });
      if (taken) {
        setError("Этот логин уже занят.");
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            username: form.username,
            phone: form.phone || null,
            telegram_username: form.telegram ? form.telegram.replace(/^@/, "") : null,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        router.push("/account");
        router.refresh();
      } else {
        router.push("/login?registered=1");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось зарегистрироваться.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex flex-1 items-center justify-center py-20">
      <div className="w-full max-w-md rounded-2xl border hairline bg-charcoal p-8 sm:p-10">
        <h1 className="font-display text-3xl text-paper mb-2">Регистрация</h1>
        <p className="text-sm text-ash mb-8">
          Аккаунт нужен для покупок, заказов и отзывов на RK — Private Edition.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Почта"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <Input
            label="Логин"
            required
            placeholder="latin_letters_and_numbers"
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
          />
          <Input
            label="Пароль"
            type="password"
            required
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
          <Input
            label="Телефон"
            type="tel"
            placeholder="+7 900 000-00-00"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          <Input
            label="Telegram"
            placeholder="@username"
            value={form.telegram}
            onChange={(e) => update("telegram", e.target.value)}
            hint="Телефон или Telegram — заполните хотя бы одно поле"
          />

          {error && <p className="text-sm text-red-bright">{error}</p>}

          <Button type="submit" loading={loading} className="mt-2 w-full">
            Создать аккаунт
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ash">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-paper hover:text-red-bright transition-colors">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
