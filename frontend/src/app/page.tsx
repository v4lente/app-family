import LoginForm from '@/components/auth/LoginForm';
import Header from '@/components/layout/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">

        <div className="max-w-md mx-auto bg-white shadow rounded-lg p-6 space-y-4 mt-8">
          <h2 className="text-2xl font-bold text-center text-gray-900">Bem-vindo ao Atividades da Família</h2>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
