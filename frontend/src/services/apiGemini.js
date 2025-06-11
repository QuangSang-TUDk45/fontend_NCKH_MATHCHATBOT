// src/services/gemini/index.js
import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } from "@google/generative-ai";
  import mammoth from "mammoth";
  
  // Khởi tạo API key từ biến môi trường
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("VITE_GOOGLE_API_KEY không được định nghĩa trong file .env!");
    throw new Error("API key không được cung cấp.");
  }
  
  // Khởi tạo Google Generative AI
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Khởi tạo model
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-thinking-exp-01-21", 
  });
  
  // Cấu hình generation
  const generationConfig = {
    temperature: 1,
    topP: 0.95, 
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };
  
  // Cấu hình safety settings
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
  ];
  
  // Các loại file được Gemini API hỗ trợ
  const SUPPORTED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "text/plain",
    "video/mp4", // Thêm hỗ trợ cho video (nếu model hỗ trợ)
  ];
  
  // Hàm đọc file thành base64
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) =>
        reject(new Error(`Không thể đọc file ${file.name}: ${error.message}`));
      reader.readAsDataURL(file);
    });
  };
  
  // Hàm chuyển đổi file .docx thành văn bản
  const convertDocxToText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (error) {
          reject(new Error(`Không thể chuyển đổi file .docx: ${error.message}`));
        }
      };
      reader.onerror = (error) =>
        reject(new Error(`Không thể đọc file ${file.name}: ${error.message}`));
      reader.readAsArrayBuffer(file);
    });
  };
  
  // Hàm chính để gọi Gemini API, hỗ trợ cả text và file
  async function run(textInput, chatHistory, files = []) {
    try {
      if (!textInput && files.length === 0) {
        throw new Error("Cần cung cấp ít nhất một textInput hoặc file để xử lý.");
      }
  
      const history = (chatHistory || []).map((item) => {
        const text = item.text || item.botMess || item.userMess;
        if (!text) {
          throw new Error("Lịch sử chat chứa tin nhắn không hợp lệ (thiếu nội dung).");
        }
        return {
          role: item.isBot ? "model" : "user",
          parts: [{ text }],
        };
      });
  
      const chatSession = model.startChat({
        generationConfig,
        safetySettings,
        history,
      });
  
      const messageParts = [];
  
      if (textInput) {
        messageParts.push({ text: textInput });
      }
  
      for (const file of files) {
        const MAX_FILE_SIZE = 20 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File ${file.name} vượt quá kích thước tối đa 20MB.`);
        }
  
        let mimeType = file.type;
        if (!mimeType) {
          const extension = file.name.split(".").pop().toLowerCase();
          switch (extension) {
            case "pdf":
              mimeType = "application/pdf";
              break;
            case "docx":
              mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
              break;
            case "mp4":
              mimeType = "video/mp4";
              break;
            case "txt":
              mimeType = "text/plain";
              break;
            case "jpg":
            case "jpeg":
              mimeType = "image/jpeg";
              break;
            case "png":
              mimeType = "image/png";
              break;
            default:
              mimeType = "application/octet-stream";
          }
        }
  
        // Xử lý file .docx: chuyển đổi thành text/plain
        if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          const textContent = await convertDocxToText(file);
          messageParts.push({
            text: `Nội dung file .docx (${file.name}):\n${textContent}`,
          });
          continue; // Bỏ qua việc gửi file .docx dưới dạng inlineData
        }
  
        // Kiểm tra loại file có được hỗ trợ không
        if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
          throw new Error(
            `Loại file ${mimeType} không được hỗ trợ bởi Gemini API. Các loại file được hỗ trợ: ${SUPPORTED_MIME_TYPES.join(", ")}.`
          );
        }
  
        // Đọc file thành base64 (cho các loại file được hỗ trợ)
        const base64Data = await readFileAsBase64(file);
        messageParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
      }
  
      const result = await chatSession.sendMessage(messageParts);
      const responseText = result.response.text();
  
      return responseText;
    } catch (error) {
      console.error("Lỗi khi gọi Gemini API:", error);
      throw new Error(`Không thể nhận phản hồi từ Gemini API: ${error.message}`);
    }
  }
  
  export default run;