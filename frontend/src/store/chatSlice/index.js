import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { fetchGoogleSheetsData } from "../../services/fetchGoogleSheets";

export const fetchSheetData = createAsyncThunk(
  "chat/fetchSheetData",
  async () => {
    const response = await fetchGoogleSheetsData();
    return response.data;
  }
);

const loadState = () => {
  const savedData = localStorage.getItem("chatData");
  return savedData ? JSON.parse(savedData) : { data: [], sheetData: [] };
};

const ChatSlice = createSlice({
  name: "chat",
  initialState: {
    ...loadState(),
    sheetData: [],
    loading: false,
    error: null,
  },
  reducers: {
    addChat: (state) => {
      state.data.push({
        id: uuidv4(),
        title: "Chat",
        messages: [],
      });
      localStorage.setItem("chatData", JSON.stringify({ data: state.data }));
    },
    addMessage: (state, action) => {
      const { idChat, userMess, botMess, source } = action.payload;
      const chat = state.data.find((chat) => chat.id === idChat);
      if (chat) {
        const newMessages = [...chat.messages];
        if (userMess) {
          newMessages.push({
            id: uuidv4(),
            text: userMess,
            isBot: false,
            source: "user",
          });
        }
        if (botMess) {
          // Không chuyển đổi Markdown sang HTML, giữ nguyên botMess
          newMessages.push({
            id: uuidv4(),
            text: botMess, // Giữ nguyên dạng Markdown/LaTeX
            isBot: true,
            source: source || "bot",
          });
        }
        chat.messages = newMessages;
        localStorage.setItem("chatData", JSON.stringify({ data: state.data }));
      }
    },
    removeChat: (state, action) => {
      state.data = state.data.filter((chat) => chat.id !== action.payload);
      localStorage.setItem("chatData", JSON.stringify({ data: state.data }));
    },
    setNameChat: (state, action) => {
      const { newTitle, chatId } = action.payload;
      const chat = state.data.find((chat) => chat.id === chatId);
      if (chat) {
        chat.title = newTitle;
        localStorage.setItem("chatData", JSON.stringify({ data: state.data }));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSheetData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSheetData.fulfilled, (state, action) => {
        state.loading = false;
        state.sheetData = action.payload;
      })
      .addCase(fetchSheetData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { addChat, removeChat, addMessage, setNameChat } = ChatSlice.actions;
export default ChatSlice.reducer;

export const selectSheetData = (state) => state.chat.sheetData;
