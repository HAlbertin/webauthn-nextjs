import LoginForm from '@/components/forms/login';

const LoginPage = () => {
  return (
    <section className="flex h-full items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded bg-gray-900 p-6">
        <div>
          <p className="text-gray-400">Sign In</p>
        </div>

        <LoginForm />
      </div>
    </section>
  );
};

export default LoginPage;
