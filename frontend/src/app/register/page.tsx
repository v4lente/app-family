import RegisterForm from '@/components/auth/RegisterForm';

export default function Register() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-2xl font-bold text-center mb-8">Criar Conta</h2>
          <RegisterForm />
        </div>
      </main>
    </div>
  );
}
