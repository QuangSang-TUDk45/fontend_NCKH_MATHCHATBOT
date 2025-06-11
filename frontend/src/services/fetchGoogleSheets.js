import axios from "axios";

// Cấu hình ID của Google Sheet và API Key từ biến môi trường
const SHEET_ID = "17cwOnAQANqICa0dA-KpWVvV_vWdYRwRuB4yrKDeJ8X4";
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

// Hàm lấy danh sách các tab (sheet) trong Google Sheets
const fetchSheetTabs = async () => {
  try {
    if (!API_KEY) {
      throw new Error("API Key không được định nghĩa. Vui lòng kiểm tra file .env.");
    }

    const response = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`
    );
    const sheets = response.data.sheets;
    return sheets.map((sheet) => sheet.properties.title);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tab từ Google Sheets:", error.message);
    return [];
  }
};

// Hàm lấy dữ liệu từ một tab cụ thể
const fetchDataFromTab = async (tabName) => {
  const range = `${tabName}!A1:D`; // Lấy dữ liệu từ cột A đến D của tab
  try {
    const response = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`
    );
    const rows = response.data.values;

    // Kiểm tra nếu không có dữ liệu
    if (!rows || rows.length <= 1) {
      console.warn(`Tab ${tabName} không có dữ liệu hoặc chỉ có tiêu đề.`);
      return [];
    }

    // Chuyển đổi dữ liệu từ Google Sheets thành định dạng mong muốn
    return rows.slice(1).map((row) => ({
      id: row[0] || "", // Cột A: ID
      question: row[1] || "", // Cột B: Nội dung (câu hỏi)
      answer: row[2] || "", // Cột C: Chủ đề (đáp án)
      tokenCount: row[3] || "", // Cột D: Số token
    }));
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu từ tab ${tabName}:`, error.message);
    return [];
  }
};

// Hàm chính: Lấy dữ liệu từ tất cả các tab và gộp lại
export const fetchGoogleSheetsData = async () => {
  try {
    // Lấy danh sách các tab
    const tabs = await fetchSheetTabs();
    if (tabs.length === 0) {
      console.error("Không tìm thấy tab nào trong Google Sheets.");
      return { data: [] };
    }

    // Lấy dữ liệu từ từng tab và gộp lại
    const allDataPromises = tabs.map((tab) => fetchDataFromTab(tab));
    const allData = await Promise.all(allDataPromises);

    // Gộp dữ liệu từ tất cả các tab thành một mảng duy nhất
    const mergedData = allData.flat();

    // Kiểm tra dữ liệu sau khi gộp
    if (mergedData.length === 0) {
      console.warn("Không có dữ liệu nào được lấy từ Google Sheets.");
    }

    return { data: mergedData };
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu từ Google Sheets:", error.message);
    return { data: [] };
  }
};