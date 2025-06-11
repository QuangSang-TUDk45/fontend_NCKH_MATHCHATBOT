// src/services/apiChatbot.js

const API_BASE_URL = "http://localhost:5000"; // Đảm bảo URL này đúng với backend của bạn


// // --- Định nghĩa URL cơ sở cho API ---
// const API_BASE_URL = "https://zebra-equipped-gelding.ngrok-free.app"; // Sử dụng ngrok URL của backend

// --- Hàm gọi API /chat để trò chuyện với bot ---
export const chatWithBot = async (query) => {
  /**
   * Gửi yêu cầu đến endpoint /chat để nhận câu trả lời từ bot.
   * @param {string} query - Câu hỏi hoặc nội dung người dùng gửi.
   * @returns {Promise<string>} - Câu trả lời từ bot.
   * @throws {Error} - Nếu có lỗi trong quá trình gọi API.
   */
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return data.response;
};

// --- Hàm gọi API /identify-topic để xác định chủ đề ---
export const identifyTopic = async (question) => {
  /**
   * Gửi yêu cầu đến endpoint /identify-topic để xác định chủ đề của câu hỏi.
   * @param {string} question - Câu hỏi hoặc nội dung cần xác định chủ đề.
   * @returns {Promise<string>} - Chủ đề được xác định.
   * @throws {Error} - Nếu có lỗi trong quá trình gọi API.
   */
  const response = await fetch(`${API_BASE_URL}/identify-topic`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return data.topic;
};