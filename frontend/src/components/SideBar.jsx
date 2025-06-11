import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import IconPlus from "../assets/plusIcon.png";
import IconChat from "../assets/chat.png";
import IconTrash from "../assets/remove.png";
import IconMenu from "../assets/menu.png";
import { useDispatch, useSelector } from "react-redux";
import { addChat, removeChat } from "../store/chatSlice";
import { Link, useNavigate } from "react-router-dom";

const SideBar = ({ onToggle, isDarkMode }) => {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.chat);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [language, setLanguage] = useState("vi");
  const sidebarRef = useRef(null); // Thêm ref cho Sidebar

  // Xử lý nhấp chuột bên ngoài để ẩn Sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onToggle(); // Gọi hàm để ẩn Sidebar
      }
    };

    // Chỉ thêm sự kiện khi Sidebar hiển thị (trên mobile)
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Dọn dẹp sự kiện
    };
  }, [onToggle]);

  const labels = {
    en: {
      newChat: "New Chat",
      recent: "Recent",
      login: "Login",
      register: "Register",
      logout: "Logout",
      searchPlaceholder: "Search chats",
      switchLanguage: "Switch to Vietnamese",
    },
    vi: {
      newChat: "Cuộc trò chuyện mới",
      recent: "Gần đây",
      login: "Đăng nhập",
      register: "Đăng ký",
      logout: "Đăng xuất",
      searchPlaceholder: "Tìm kiếm chat",
      switchLanguage: "Chuyển sang Tiếng Anh",
    },
  };

  const handleNewChat = () => {
    dispatch(addChat());
  };

  const handleRemoveChat = (id) => {
    dispatch(removeChat(id));
    navigate("/");
  };

  const filteredChats = data.filter((chat) =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      ref={sidebarRef} // Gắn ref vào phần tử Sidebar
      className="w-[280px] h-screen text-white p-8 flex flex-col bg-gray-800 dark:bg-gray-900"
      style={{
        backdropFilter: "blur(5px)",
      }}
    >
      <button className="flex ml-auto xl:hidden mb-4" onClick={onToggle}>
        <img src={IconMenu} alt="menu icon" className="w-10 h-10" />
      </button>
      <div className="flex-1 flex flex-col overflow-hidden">
        <input
          type="text"
          placeholder={labels[language].searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 mb-4 rounded-md bg-gray-700 dark:bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          className={`px-4 py-2 flex items-center space-x-4 rounded-md transition-colors mb-6 ${
            isDarkMode
              ? "bg-blue-600 hover:bg-blue-500"
              : "bg-blue-500 hover:bg-blue-400"
          }`}
          onClick={handleNewChat}
        >
          <img src={IconPlus} alt="plus icon" className="w-4 h-4" />
          <p className="text-white">{labels[language].newChat}</p>
        </button>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-lg font-semibold mb-4 text-gray-400">
            {labels[language].recent}:
          </p>
          <div className="flex flex-col space-y-4">
            {filteredChats.map((chat) => (
              <Link
                to={`/chat/${chat.id}`}
                className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
                key={chat?.id}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <img
                    src={IconChat}
                    alt="chat icon"
                    className="w-8 h-8 flex-shrink-0"
                  />
                  <p
                    className="truncate text-ellipsis overflow-hidden text-sm flex-1 text-white"
                    title={chat.title}
                  >
                    {chat.title}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveChat(chat.id);
                  }}
                  className="flex-shrink-0 ml-2"
                >
                  <img
                    src={IconTrash}
                    alt="trash icon"
                    className={`w-5 h-5 ${
                      isDarkMode ? "filter brightness-75" : ""
                    }`}
                  />
                </button>
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-700 my-4"></div>
        <div className="space-y-2">
          <Link
            to="/login"
            className={`w-full px-4 py-2 rounded-md transition-colors block text-center ${
              isDarkMode
                ? "bg-green-600 hover:bg-green-500"
                : "bg-green-500 hover:bg-green-400"
            }`}
          >
            <span className="text-white">{labels[language].login}</span>
          </Link>
          <Link
            to="/logout"
            className={`w-full px-4 py-2 rounded-md transition-colors block text-center ${
              isDarkMode
                ? "bg-red-600 hover:bg-red-500"
                : "bg-red-500 hover:bg-red-400"
            }`}
          >
            <span className="text-white">{labels[language].logout}</span>
          </Link>
          <button
            className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
            onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
          >
            {labels[language].switchLanguage}
          </button>
        </div>
      </div>
    </div>
  );
};

SideBar.propTypes = {
  onToggle: PropTypes.func,
  isDarkMode: PropTypes.bool.isRequired,
};

export default SideBar;