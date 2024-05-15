'use client';

import registration from '@/app/auth/signup/actions/registration';
import verification from '@/app/auth/signup/actions/verification';
import { startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';

type Inputs = {
  email: string;
};

const SignUpForm = () => {
  const router = useRouter();

  const { register, handleSubmit } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async ({ email }) => {
    try {
      const options = await registration({ email });

      const auth = await startRegistration(options);

      const response = await verification({ auth, email, options });
      // TODO: handle the error response better
      if (!response) {
        alert('Error!');
        return;
      }

      router.replace('/dashboard');
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

      <button
        type="submit"
        className="w-full rounded bg-blue-600 py-4 text-sm font-bold text-gray-50 transition duration-200 hover:bg-blue-700"
      >
        REGISTER
      </button>
    </form>
  );
};

export default SignUpForm;
