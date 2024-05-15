const DashboardPage = () => {
  return (
    <div className="flex flex-col space-y-4">
      <p className="text-center text-4xl font-bold text-gray-200">
        Dashboard! You are logged in! Yey!
      </p>

      <p className="text-center font-bold text-gray-200">
        If you access Home, Login or Register, you will be redirected to the
        dashboard :)
      </p>
    </div>
  );
};

export default DashboardPage;
