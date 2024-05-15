import Link from 'next/link';

const Header = () => {
  return (
    <div className="flex w-full flex-row justify-between bg-red-400 p-4">
      <Link className="rounded-full px-4 text-gray-200" href={'/'}>
        Home
      </Link>

      <div className="flex flex-row space-x-4">
        <Link className="rounded-full text-gray-200" href="/auth/login">
          Login
        </Link>
        <Link className="rounded-full text-gray-200" href="/auth/signup">
          Register
        </Link>
      </div>
    </div>
  );
};

export default Header;
