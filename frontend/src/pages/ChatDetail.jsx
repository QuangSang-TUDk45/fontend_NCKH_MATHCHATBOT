// src/pages/ChatDetail.jsx
import { useEffect, useState, useCallback, useRef } from "react"; 
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { v4 as uuidv4 } from "uuid";
import { useDropzone } from "react-dropzone";

import ImgTemp from "../assets/temp.jpeg";
import IconMenu from "../assets/menu.png";
import SideBar from "../components/SideBar";
import IconStar from "../assets/star.png";
import ImageAI from "../assets/imageAI.jpg";

import { MessageContent } from "../components/MarkdownLatexProcessor.jsx";
import MathKeyboard from "../components/MathKeyboard";

// import { addMessage, setNameChat} from "../store/chatSlice";
import { addMessage, setNameChat, fetchSheetData, selectSheetData } from "../store/chatSlice";

// import Gemini from "../services/apiGemini.js";
import { chatWithBot, identifyTopic } from "../services/apiChatbot.js"; // Import apiChatbot.js


// Component chính
const ChatDetail = () => {
  // State và Ref
  const [menuToggle, setMenuToggle] = useState(true);
  const [dataDetail, setDataDetail] = useState({ title: "Chat", messages: [] });
  const [messageDetailState, setMessageDetailState] = useState([]);
  const [inputChat, setInputChat] = useState("");
  const [isMathKeyboardOpen, setIsMathKeyboardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPinned, setIsPinned] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const keyboardRef = useRef(null);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const dropzoneRef = useRef(null);
  const [isDropzoneVisible, setIsDropzoneVisible] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.chat);
  const sheetData = useSelector(selectSheetData);
  const loading = useSelector((state) => state.chat.loading);
  const error = useSelector((state) => state.chat.error);

  const INITIAL_TEXTAREA_HEIGHT = "60px";

  // Style constants
  const styleConstants = {
    textShadowDark: "1px 1px rgba(0, 0, 0, 0.5)",
    textShadowLight: "1px 1px rgba(0, 0, 0, 0.1)",
    textColorPrimary: isDarkMode ? "#F3F4F6" : "#1F2937",
    textColorSecondary: isDarkMode ? "#94A3B8" : "#6B7280",
    backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.8)",
  };

  // Effect để fetch dữ liệu từ Google Sheets
  useEffect(() => {
    dispatch(fetchSheetData());
  }, [dispatch]);

  // Effect để cập nhật dữ liệu chat dựa trên ID
  useEffect(() => {
    if (data.length > 0) {
      const chat = data.find((chat) => chat.id === id);
      if (chat) {
        setDataDetail(chat);
        setMessageDetailState(chat.messages);
      } else {
        setDataDetail({ title: "Chat", messages: [] });
        setMessageDetailState([]);
      }
    } else {
      setDataDetail({ title: "Chat", messages: [] });
      setMessageDetailState([]);
    }
  }, [data, id]);

  // Effect để áp dụng dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Effect để tự động cuộn khi có tin nhắn mới
  useEffect(() => {
    if (isPinned && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messageDetailState, isPinned]);

  // Effect để đóng bàn phím toán học khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (keyboardRef.current && !keyboardRef.current.contains(event.target)) {
        setIsMathKeyboardOpen(false);
      }
    };
    if (isMathKeyboardOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMathKeyboardOpen]);

  // Effect để đóng dropzone khi click bên ngoài
  useEffect(() => {
    const handleClickOutsideDropzone = (event) => {
      if (dropzoneRef.current && !dropzoneRef.current.contains(event.target) && isDropzoneVisible) {
        setIsDropzoneVisible(false);
      }
    };
    if (isDropzoneVisible) {
      document.addEventListener("mousedown", handleClickOutsideDropzone);
    }
    return () => document.removeEventListener("mousedown", handleClickOutsideDropzone);
  }, [isDropzoneVisible]);

  // Xử lý drop file
  const onDrop = useCallback((acceptedFiles) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles]);
    setIsDropzoneVisible(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg", ".gif"],
      "video/*": [".mp4", ".mov"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  // Xử lý xóa file đã upload
  const handleRemoveFile = (fileToRemove) => {
    setUploadedFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  // Xử lý gửi tin nhắn
 
  const handleChatDetail = useCallback(async () => {
  if (!inputChat.trim() && uploadedFiles.length === 0) return;

  setIsLoading(true);
  setErrorMessage(""); // Reset thông báo lỗi

  try {
    let chatId = id || uuidv4();
    if (!id || dataDetail.title === "Chat") {
      let newTitle;
      try {
        // Sử dụng identifyTopic từ apiChatbot.js để đặt tên chat
        newTitle = await identifyTopic(inputChat || "file upload");
        if (!newTitle || newTitle === "Không xác định chủ đề") {
          newTitle = `Chat_${chatId.slice(0, 5)}`;
        }
      } catch (titleError) {
        console.error("Lỗi lấy tên chat từ API /identify-topic:", titleError);
        newTitle = `Chat_${chatId.slice(0, 5)}`;
      }
      dispatch(setNameChat({ newTitle, chatId }));
      setDataDetail({ id: chatId, title: newTitle, messages: [] });
      navigate(`/chat/${chatId}`); // Chuyển hướng đến /chat/:id
    }

    // Thêm tin nhắn người dùng (nếu có inputChat)
    if (inputChat.trim()) {
      dispatch(
        addMessage({
          idChat: chatId,
          userMess: inputChat,
          botMess: "",
          source: "user",
        })
      );
      setMessageDetailState((prev) => [
        ...prev,
        {
          id: uuidv4(),
          text: inputChat,
          isBot: false,
          source: "user",
          type: "text",
        },
      ]);
    }

    // Thêm thông báo về file đã gửi (nếu có file)
    if (uploadedFiles.length > 0) {
      const fileNames = uploadedFiles.map((file) => file.name).join(", ");
      const fileMessage = `Đã gửi file: ${fileNames}`;
      setMessageDetailState((prev) => [
        ...prev,
        {
          id: uuidv4(),
          text: fileMessage,
          isBot: false,
          source: "user",
          type: "text",
        },
      ]);
    }

    let chatText;
    let source;

    // **Ưu tiên 1: Kiểm tra dữ liệu từ Google Sheets (source: data)**
    // if (sheetData && Array.isArray(sheetData) && inputChat.trim()) {
    //   const matchingItem = sheetData.find((item) =>
    //     item.question.toLowerCase().includes(inputChat.toLowerCase())
    //   );
    //   if (matchingItem) {
    //     chatText = matchingItem.answer;
    //     source = "data";
    //   }
    // }

    // **Ưu tiên 2: Gọi backend API nếu không có dữ liệu từ Google Sheets (source: backend)**
    if (!chatText) {
      try {
        chatText = await chatWithBot(inputChat);
        if (chatText && typeof chatText === "string" && chatText.trim() !== "") {
          source = "backend";
        } else {
          throw new Error("Backend API trả về nội dung không hợp lệ hoặc rỗng.");
        }
        console.log("Backend response:", chatText); // Debug
      } catch (backendError) {
        console.error("Backend API error:", backendError);
        // Không set lỗi ngay, chuyển sang Gemini
      }
    }

    // **Ưu tiên 3: Gọi Gemini API nếu không có dữ liệu từ backend (source: gemini)**
//     if (!chatText) {
//       try {
//         let modifiedInput = inputChat.trim() || "";
//         if (uploadedFiles.length > 0) {
//           const fileInstruction = "Dịch nội dung file sang tiếng Việt nếu cần.";
//           modifiedInput = modifiedInput
//             ? `${modifiedInput}\n${fileInstruction}`
//             : fileInstruction;
//         }

// //         const formattingRules = `
// // Hãy trả lời bằng tiếng Việt, sử dụng cú pháp Markdown chuẩn để định dạng nội dung. Tuân thủ nghiêm ngặt các quy tắc sau:

// // 1. **Danh sách không thứ tự**: Sử dụng dấu - để tạo danh sách, luôn có một khoảng cách sau dấu - (ví dụ: - Mục 1). **Phải có dòng trống** trước và sau toàn bộ danh sách.
// // 2. **Công thức LaTeX**: Sử dụng $...$ cho công thức inline (ví dụ: $x^2$) và $$...$$ cho công thức block (ví dụ: $$x^2 + y^2 = z^2$$).
// // 3. **Không sử dụng ký tự không chuẩn**: Chỉ dùng - cho danh sách không thứ tự.
// // 4. **Định dạng rõ ràng**: Phân tách đoạn văn bằng dòng trống, trình bày từng bước giải bài toán rõ ràng với nhãn (ví dụ: **Bước 1**).
// // 5. **Độ chính xác toán học**: Đảm bảo phép tính và đạo hàm chính xác, rút gọn biểu thức đến dạng đơn giản nhất.
// // `;

// //         modifiedInput = modifiedInput
// //           ? `${modifiedInput}\n\n${formattingRules}`
// //           : formattingRules.trim();

//         chatText = await Gemini(modifiedInput, messageDetailState, uploadedFiles);
//         if (!chatText || typeof chatText !== "string" || chatText.trim() === "") {
//           throw new Error("Gemini API trả về nội dung không hợp lệ hoặc rỗng.");
//         }
//         source = "gemini";
//         console.log("Gemini response:", chatText); // Debug
//       } catch (geminiError) {
//         console.error("Gemini API error:", geminiError);
//         chatText = "Không thể lấy câu trả lời từ tất cả các nguồn. Vui lòng thử lại sau!";
//         source = "error";
//         setErrorMessage(chatText);
//       }
//     }

    // Thêm phản hồi từ bot
    dispatch(
      addMessage({ idChat: chatId, userMess: "", botMess: chatText, source })
    );
    setMessageDetailState((prev) => [
      ...prev,
      { id: uuidv4(), text: chatText, isBot: true, source, type: "text" },
    ]);

    // Reset input và file sau khi gửi
    setInputChat("");
    setUploadedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = INITIAL_TEXTAREA_HEIGHT;
    }
  } catch (error) {
    console.error("Lỗi chung:", error);
    setErrorMessage("Có lỗi xảy ra khi xử lý tin nhắn. Vui lòng thử lại sau!");
  } finally {
    setIsLoading(false);
  }
  }, [inputChat, messageDetailState, id, dataDetail.title, dispatch, sheetData, uploadedFiles, navigate]);

  // Xử lý chọn ký hiệu toán học
  const handleSymbolSelect = useCallback(({ latex, moveLeft }) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = inputChat.substring(0, start);
    const after = inputChat.substring(end);
    setInputChat(before + latex + after);

    setTimeout(() => {
      const newPos = start + latex.length - (moveLeft || 0);
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    }, 0);
  }, [inputChat]);

  // Xử lý upload file từ input
  const handleUnifiedUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      onDrop([file]);
    }
  }, [onDrop]);

  // Chuyển đổi theme
  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  // Render giao diện
  if (loading) return <div className="text-center p-4">Đang tải dữ liệu từ Google Sheets...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Lỗi: {error}</div>;

  return (
    <div
      className="text-black dark:text-white xl:w-[90%] w-full relative min-h-screen"
      style={{
        backgroundImage: `url(${ImageAI})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        filter: isDarkMode ? "brightness(0.7)" : "brightness(1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <button onClick={() => setMenuToggle(!menuToggle)} aria-label="Toggle menu">
            <img src={IconMenu} alt="menu icon" className="w-8 h-8 xl:hidden" />
          </button>
          <h1 className="text-2xl [text-shadow:_2px_2px_4px_rgba(0,0,0,0.5)] animate-colorChange">
            <span className="font-bold">MathMagica</span>
            <span className="font-normal"> AI</span>
          </h1>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          aria-label="Toggle theme"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            fill="currentColor"
            className="w-6 h-6 text-gray-600 dark:text-gray-300"
          >
            <path d="M448 256c0-106-86-192-192-192l0 384c106 0 192-86 192-192zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      {menuToggle && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <SideBar onToggle={() => setMenuToggle(!menuToggle)} />
        </div>
      )}

      {/* Nội dung chính */}
      <div className="max-w-[90%] w-full mx-auto mt-6 space-y-10">
        {id ? (
          <div
            className="flex flex-col h-[calc(100vh-150px)] border rounded-lg overflow-hidden relative"
            style={{
              backgroundColor: styleConstants.backgroundColor,
              backdropFilter: "blur(5px)",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Nút ghim cuộn */}
            <button
              onClick={() => setIsPinned((prev) => !prev)}
              className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                isPinned
                  ? "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                  : "bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700"
              }`}
              title={isPinned ? "Tắt ghim tự động cuộn" : "Bật ghim tự động cuộn"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 496 512"
                fill="currentColor"
                className="w-4 h-4 text-gray-600 dark:text-gray-300"
              >
                <path d="M496 256c0 137-111 248-248 248-25.6 0-50.2-3.9-73.4-11.1 10.1-16.5 25.2-43.5 30.8-65 3-11.6 15.4-59 15.4-59 8.1 15.4 31.7 28.5 56.8 28.5 74.8 0 128.7-68.8 128.7-154.3 0-81.9-66.9-143.2-152.9-143.2-107 0-163.9 71.8-163.9 150.1 0 36.4 19.4 81.7 50.3 96.1 4.7 2.2 7.2 1.2 8.3-3.3 .8-3.4 5-20.3 6.9-28.1 .6-2.5 .3-4.7-1.7-7.1-10.1-12.5-18.3-35.3-18.3-56.6 0-54.7 41.4-107.6 112-107.6 60.9 0 103.6 41.5 103.6 100.9 0 67.1-33.9 113.6-78 113.6-24.3 0-42.6-20.1-36.7-44.8 7-29.5 20.5-61.3 20.5-82.6 0-19-10.2-34.9-31.4-34.9-24.9 0-44.9 25.7-44.9 60.2 0 22 7.4 36.8 7.4 36.8s-24.5 103.8-29 123.2c-5 21.4-3 51.6-.9 71.2C65.4 450.9 0 361.1 0 256 0 119 111 8 248 8s248 111 248 248z" />
              </svg>
            </button>

            {/* Khu vực hiển thị tin nhắn */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              {messageDetailState.length > 0 ? (
                messageDetailState.map((item) => (
                  <div className="flex space-y-6 flex-col animate-slideDown" key={item.id}>
                    <div className="flex space-x-6 items-baseline">
                      {item.isBot ? (
                        <>
                          <img src={IconStar} alt="Bot" className="w-8 h-8" />
                          <p>
                            <span
                              className="text-sm"
                              style={{
                                color: styleConstants.textColorSecondary,
                                textShadow: isDarkMode
                                  ? styleConstants.textShadowDark
                                  : styleConstants.textShadowLight,
                              }}
                            >
                              [Source: {item.source}]
                            </span>
                            <span
                              className="ml-2"
                              style={{
                                color: styleConstants.textColorPrimary,
                                textShadow: isDarkMode
                                  ? styleConstants.textShadowDark
                                  : styleConstants.textShadowLight,
                              }}
                            >
                              <MessageContent
                                text={item.text}
                                isBot={item.isBot}
                                textColorPrimary={styleConstants.textColorPrimary}
                                textShadow={
                                  isDarkMode
                                    ? styleConstants.textShadowDark
                                    : styleConstants.textShadowLight
                                }
                              />
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p
                            className="font-semibold"
                            style={{
                              color: styleConstants.textColorPrimary,
                              textShadow: isDarkMode
                                ? styleConstants.textShadowDark
                                : styleConstants.textShadowLight,
                            }}
                          >
                            User
                          </p>
                          <p
                            style={{
                              color: styleConstants.textColorPrimary,
                              textShadow: isDarkMode
                                ? styleConstants.textShadowDark
                                : styleConstants.textShadowLight,
                            }}
                          >
                            <MessageContent
                              text={item.text}
                              isBot={item.isBot}
                              textColorPrimary={styleConstants.textColorPrimary}
                              textShadow={
                                isDarkMode
                                  ? styleConstants.textShadowDark
                                  : styleConstants.textShadowLight
                              }
                            />
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  // <div className="flex space-x-6 items-baseline">
                  //     {item.isBot ? (
                  //       <>
                  //         <img src={IconStar} alt="Bot" className="w-8 h-8" />
                  //         <p>
                  //           <span
                  //             className="text-sm"
                  //             style={{
                  //               color: styleConstants.textColorSecondary,
                  //               textShadow: isDarkMode
                  //                 ? styleConstants.textShadowDark
                  //                 : styleConstants.textShadowLight,
                  //             }}
                  //           >
                  //             [Source: {item.source}]
                  //           </span>
                  //           <span
                  //             className="ml-2"
                  //             style={{
                  //               color: styleConstants.textColorPrimary,
                  //               textShadow: isDarkMode
                  //                 ? styleConstants.textShadowDark
                  //                 : styleConstants.textShadowLight,
                  //             }}
                  //             dangerouslySetInnerHTML={{ __html: item.text }}
                  //           />
                  //         </p>
                  //       </>
                  //     ) : item.type === "image" ? (
                  //       <>
                  //         <p
                  //           className="font-semibold"
                  //           style={{
                  //             color: styleConstants.textColorPrimary,
                  //             textShadow: isDarkMode
                  //               ? styleConstants.textShadowDark
                  //               : styleConstants.textShadowLight,
                  //           }}
                  //         >
                  //           User
                  //         </p>
                  //         <div
                  //           style={{
                  //             color: styleConstants.textColorPrimary,
                  //             textShadow: isDarkMode
                  //               ? styleConstants.textShadowDark
                  //               : styleConstants.textShadowLight,
                  //           }}
                  //         >
                  //           <img
                  //             src={item.text}
                  //             alt="Uploaded image"
                  //             style={{
                  //               maxWidth: "200px",
                  //               maxHeight: "200px",
                  //               objectFit: "contain",
                  //               borderRadius: "8px",
                  //             }}
                  //           />
                  //         </div>
                  //       </>
                  //     ) : (
                  //       <>
                  //         <p
                  //           className="font-semibold"
                  //           style={{
                  //             color: styleConstants.textColorPrimary,
                  //             textShadow: isDarkMode
                  //               ? styleConstants.textShadowDark
                  //               : styleConstants.textShadowLight,
                  //           }}
                  //         >
                  //           User
                  //         </p>
                  //         <p
                  //           style={{
                  //             color: styleConstants.textColorPrimary,
                  //             textShadow: isDarkMode
                  //               ? styleConstants.textShadowDark
                  //               : styleConstants.textShadowLight,
                  //           }}
                  //         >
                  //           {item.text}
                  //         </p>
                  //       </>
                  //     )}
                  //   </div>
                ))
              ) : (
                <p
                  className="text-center"
                  style={{
                    color: styleConstants.textColorSecondary,
                    textShadow: isDarkMode
                      ? styleConstants.textShadowDark
                      : styleConstants.textShadowLight,
                  }}
                >
                  Chưa có tin nhắn nào.
                </p>
              )}
            </div>

            {/* Khu vực nhập tin nhắn và upload file */}
            <div className="p-4 border-t">
              {/* Hiển thị thông báo lỗi nếu có */}
              {errorMessage && (
                <div className="mb-4 text-red-500 text-center">{errorMessage}</div>
              )}

              {/* Dropzone */}
              {isDropzoneVisible && (
                <div
                  ref={dropzoneRef}
                  {...getRootProps()}
                  className={`border-2 border-dashed p-4 rounded-lg text-center cursor-pointer mb-1 mx-0 relative ${
                    isDragActive ? "border-green-500 bg-green-50" : "border-gray-300"
                  }`}
                  style={{ margin: "4px 0" }}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p>Thả file vào đây...</p>
                  ) : (
                    <p>Kéo và thả file vào đây, hoặc nhấn để chọn file</p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropzoneVisible(false);
                    }}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    title="Đóng khung kéo-thả"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Hiển thị danh sách file đã upload */}
              {uploadedFiles.length > 0 && (
                <div className="mb-4 mx-0">
                  <h3 className="text-lg font-semibold">File đã upload:</h3>
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center space-x-2">
                          <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                          <button
                            onClick={() => handleRemoveFile(file)}
                            className="text-red-500 hover:text-red-700"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Khu vực nhập tin nhắn */}
              <div className="relative flex items-center w-full space-x-2">
                <div className="relative flex-1 w-full">
                  <div className="relative flex items-center w-full">
                    <textarea
                      ref={textareaRef}
                      value={inputChat}
                      placeholder="Nhập câu lệnh tại đây"
                      className="p-4 rounded-lg bg-white dark:bg-primaryBg-darkDefault w-full border text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none custom-scrollbar transition-height duration-300 ease-in-out"
                      onChange={(e) => setInputChat(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleChatDetail();
                        }
                      }}
                      disabled={isLoading}
                      rows={1}
                      style={{
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                        minHeight: INITIAL_TEXTAREA_HEIGHT,
                        maxHeight: "200px",
                        resize: "none",
                        backgroundColor: styleConstants.backgroundColor,
                        backdropFilter: "blur(5px)",
                      }}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                    />
                    {!isDropzoneVisible && (
                      <button
                        className="absolute right-12 bottom-2 text-gray-500 hover:text-gray-700"
                        onClick={() => setIsDropzoneVisible(true)}
                        title="Tải lên hình ảnh hoặc tệp"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 448 512"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z" />
                        </svg>
                      </button>
                    )}
                    <input
                      type="file"
                      id="upload"
                      className="hidden"
                      onChange={handleUnifiedUpload}
                      accept="image/*,video/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    />
                    <button
                      className="absolute right-3 bottom-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setIsMathKeyboardOpen(!isMathKeyboardOpen)}
                      disabled={isLoading}
                      title="Mở bàn phím toán học"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 576 512"
                        fill="currentColor"
                        className="w-6 h-6"
                      >
                        <path d="M64 112c-8.8 0-16 7.2-16 16l0 256c0 8.8 7.2 16 16 16l448 0c8.8 0 16-7.2 16-16l0-256c0-8.8-7.2-16-16-16L64 112zM0 128C0 92.7 28.7 64 64 64l448 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zM176 320l224 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-224 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16zm-72-72c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16zm16-96l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16zm64 96c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16zm16-96l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16zm64 96c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16zm16-96l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16zm64 96c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16zm16-96l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16zm64 96c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16zm16-96l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16z" />
                      </svg>
                    </button>
                  </div>
                  {isMathKeyboardOpen && (
                    <div
                      ref={keyboardRef}
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 z-10 w-full mb-2 bg-white dark:bg-gray-800 shadow-lg p-4 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MathKeyboard onSymbolSelect={handleSymbolSelect} />
                    </div>
                  )}
                </div>
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  onClick={handleChatDetail}
                  disabled={isLoading || (!inputChat.trim() && uploadedFiles.length === 0)}
                  style={{
                    backgroundColor: "rgba(111,118,129,0.5)",
                    color: "white",
                    cursor:
                      isLoading || (!inputChat.trim() && uploadedFiles.length === 0)
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isLoading ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path
                        fill="currentColor"
                        d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path
                        fill="currentColor"
                        d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-5">
            <div className="space-y-1">
              <h2 className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 text-[30px] inline-block text-transparent bg-clip-text font-bold">
                Xin Chào
              </h2>
              <p className="text-3xl">Hôm nay tôi có thể giúp gì cho bạn</p>
            </div>
            <div className="hidden lg:flex justify-center flex-wrap gap-3">
              <div
                className="w-[200px] h-[200px] flex items-center justify-center rounded-lg"
                style={{
                  backgroundColor: styleConstants.backgroundColor,
                  backdropFilter: "blur(5px)",
                }}
              >
                <p
                  style={{
                    color: styleConstants.textColorPrimary,
                    textShadow: isDarkMode
                      ? styleConstants.textShadowDark
                      : styleConstants.textShadowLight,
                  }}
                >
                  Vẽ đồ thị
                </p>
              </div>
              <div
                className="w-[200px] h-[200px] flex items-center justify-center rounded-lg"
                style={{
                  backgroundColor: styleConstants.backgroundColor,
                  backdropFilter: "blur(5px)",
                }}
              >
                <p
                  style={{
                    color: styleConstants.textColorPrimary,
                    textShadow: isDarkMode
                      ? styleConstants.textShadowDark
                      : styleConstants.textShadowLight,
                  }}
                >
                  Gợi ý bài tập giải tích
                </p>
              </div>
              <div
                className="w-[200px] h-[200px] flex items-center justify-center rounded-lg"
                style={{
                  backgroundColor: styleConstants.backgroundColor,
                  backdropFilter: "blur(5px)",
                }}
              >
                <p
                  style={{
                    color: styleConstants.textColorPrimary,
                    textShadow: isDarkMode
                      ? styleConstants.textShadowDark
                      : styleConstants.textShadowLight,
                  }}
                >
                  Bí quyết viết thư xin việc
                </p>
              </div>
              <div
                className="w-[200px] h-[200px] flex flex-col items-center justify-center rounded-lg"
                style={{
                  backgroundColor: styleConstants.backgroundColor,
                  backdropFilter: "blur(5px)",
                }}
              >
                <p
                  style={{
                    color: styleConstants.textColorPrimary,
                    textShadow: isDarkMode
                      ? styleConstants.textShadowDark
                      : styleConstants.textShadowLight,
                  }}
                >
                  Tạo hình ảnh với AI
                </p>
                <img src={ImgTemp} alt="temp" className="w-[150px] h-[150px]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDetail;