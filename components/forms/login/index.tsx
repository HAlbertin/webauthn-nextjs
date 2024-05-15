'use client';

import login from '@/app/auth/login/actions/login';
import verification from '@/app/auth/login/actions/verification';
import { startAuthentication } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';

type Inputs = {
  email: string;
};

const LoginForm = () => {
  const router = useRouter();

  const { register, handleSubmit } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async ({ email }) => {
    try {
      const options = await verification({ email });
      const authRes = await startAuthentication(options);

      const response = await login({ email, authRes, options });
      // TODO: handle the error response better
      if (response) {
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form className="flex flex-col space-y-2" onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email')}
        className="w-full rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 focus:outline-none"
        type="text"
        placeholder="Email"
      />

      <button className="w-full rounded bg-blue-600 py-4 text-sm font-bold text-gray-50 transition duration-200 hover:bg-blue-700">
        LOGIN
      </button>
    </form>
  );
};

export default LoginForm;
