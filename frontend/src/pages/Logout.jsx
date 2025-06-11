// src/pages/Logout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Logic đăng xuất (giả lập)
    console.log("Đăng xuất...");
    navigate("/login");
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-black dark:text-white">
          Đăng xuất
        </h2>
        <p className="text-center text-black dark:text-white">
          Bạn đang được đăng xuất...
        </p>
      </div>
    </div>
  );
};

export default Logout;
