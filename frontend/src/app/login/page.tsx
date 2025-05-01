"use client";
import LoginForm from "../../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">Entrar</h2>
        <LoginForm />
      </div>
    </div>
  );
}
