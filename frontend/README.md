## Install lib

```bash
npm create vite@latest
npm i
npm i react-router-dom
npm install @reduxjs/toolkit
npm install react-redux
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Nếu lỗi tailwind:

```bash
npm uninstall tailwindcss postcss autoprefixer
npm install -D tailwindcss@3.3.3 postcss autoprefixer
npx tailwindcss init -p
```

Cài thêm:

```bash
npm install html-to-md
pip install markdown pykatex
```

---

## React

React là thư viện chính để xây dựng UI (giao diện người dùng) theo mô hình component-based (dựa trên các thành phần). Cung cấp các công cụ cơ bản như `useState`, `useEffect`, `useContext`,...

React giống như “bộ não” giúp tạo và quản lý giao diện. Cho phép bạn viết các component nhỏ như nút bấm, bảng, form,... Giao diện sẽ tự động cập nhật mỗi khi dữ liệu thay đổi.

---

## React-dom/client

Là cầu nối giữa React và DOM thực của trình duyệt. Câu lệnh `ReactDOM.createRoot(document.getElementById("root")).render(<App />)` giúp React render toàn bộ ứng dụng vào thẻ `div#root` trong file HTML.

---

## App.jsx

Là thành phần gốc của ứng dụng React. Đây là nơi định nghĩa layout tổng thể hoặc chứa các định tuyến (route). App.jsx là điểm bắt đầu hiển thị UI của bạn.

---

## React-router-dom

Thư viện định tuyến cho ứng dụng React trên trình duyệt. Cho phép điều hướng giữa các "trang" như `/home`, `/about`, `/login` mà không cần reload. Sử dụng `createBrowserRouter`, `RouterProvider`, và `Navigate`.

---

## React-redux

Cung cấp cách kết nối Redux store với các component trong React. `Provider` giúp chia sẻ trạng thái toàn cục (global state) cho toàn ứng dụng. Mọi component có thể đọc và ghi dữ liệu thông qua Redux store.

---

## ChatDetail.jsx

### Các Hook của React

* `useState`: Tạo biến lưu dữ liệu nội bộ trong component.
* `useEffect`: Chạy khi component render, thường dùng gọi API hoặc khởi tạo dữ liệu.
* `useCallback`: Ghi nhớ hàm nếu dependency không thay đổi (tối ưu hiệu suất).
* `useRef`: Tạo biến không reset khi re-render, thường để thao tác DOM như scroll.

### Hook từ React Router

* `useParams`: Lấy tham số từ URL, ví dụ `/chat/123` sẽ lấy được `123`.
* `useNavigate`: Chuyển trang bằng code.

### Redux

* `useDispatch`: Gửi hành động để cập nhật store.
* `useSelector`: Lấy dữ liệu từ Redux store.
* `addMessage`, `setNameChat`, `fetchSheetData`, `selectSheetData`: Các hàm logic xử lý trạng thái từ `chatSlice.js`.

### Tạo ID tự động

* `uuidv4()`: Tạo một ID duy nhất cho mỗi tin nhắn.

### Các component riêng

* `Sidebar`: Thanh điều hướng bên trái.
* `MathKeyBoard`: Bàn phím gõ công thức toán học.

### Gọi API

* `Gemini`: Kết nối AI Gemini.
* `chatWithBot`: Hàm chính gọi chatbot.
* `identifyTopic`: Xác định chủ đề đoạn chat.

### Drag and Drop

* `useDropzone`: Hook xử lý kéo thả file (ảnh, tài liệu) vào chat.

### Hiển thị Markdown

* Dùng để render nội dung rõ ràng, có hỗ trợ công thức toán học.

---

## MarkdownLatexProcessor.jsx

### Turndown

Chuyển đổi HTML thành Markdown. Hữu ích khi AI trả về HTML và bạn muốn chuyển nó về định dạng đơn giản hơn.

### react-markdown

Dùng để render chuỗi Markdown trong React thành HTML thật sự trên trình duyệt.

### remark-math

Hiểu cú pháp toán học viết bằng LaTeX trong Markdown như `$a^2 + b^2 = c^2$`.

### rehype-katex

Render công thức toán học đẹp mắt bằng thư viện KaTeX.

### katex.min.css

CSS đi kèm với KaTeX giúp công thức hiển thị đúng chuẩn. Nếu thiếu file CSS, công thức sẽ hiển thị sai.

### useMemo (React)

Hook tối ưu hiệu suất. Dùng để lưu lại giá trị tính toán như chuyển HTML sang Markdown để không bị tính lại mỗi lần render.

### Tổng kết:

* **Turndown**: HTML → Markdown
* **react-markdown**: Markdown → HTML trong React
* **remark-math**: Hiểu công thức toán học viết bằng `$...$`
* **rehype-katex**: Render công thức toán học bằng KaTeX
* **katex.min.css**: Hiển thị công thức đúng định dạng
* **useMemo**: Ghi nhớ kết quả xử lý nặng, tránh re-render

---



## Axios

`axios` là thư viện HTTP giúp giao tiếp frontend ↔ backend.
Các phương thức chính: `GET`, `POST`, `PUT`, `DELETE`.
Dễ dùng hơn `fetch` và có nhiều tính năng hơn.

---

## Kiến trúc tích hợp API

### Giao tiếp Frontend - Backend

Ứng dụng giao tiếp theo mô hình RESTful API thông qua 2 file chính:

---

### `frontend/src/services/apiChatbot.js`

Xử lý tất cả các cuộc gọi từ frontend đến backend:

```js
chatWithBot(query)         // POST /chat
identifyTopic(question)    // POST /identify-topic
```

Sử dụng fetch API, xử lý lỗi, và định dạng phản hồi. Kết nối tới `http://localhost:5000` hoặc qua ngrok để test từ xa.

---

### `backend/api_server.py`

Máy chủ Flask chứa các API:

```python
@app.route('/chat', methods=['POST'])           # Gọi AI
@app.route('/identify-topic', methods=['POST']) # Nhận diện chủ đề
```

Hỗ trợ CORS, tích hợp AI Gemini, sử dụng sentence transformers cho tìm kiếm ngữ nghĩa, phân tích chủ đề và tạo phản hồi.

---

### Luồng dữ liệu

1. **Frontend gửi yêu cầu** → `apiChatbot.js` POST đến backend
2. **Backend xử lý** → bằng mô hình AI và cơ sở dữ liệu Excel
3. **Trả phản hồi về Frontend** → giao diện cập nhật

---

### Bảo mật

* Kiểm soát truy cập CORS
* Quản lý API key qua biến môi trường
* Xử lý lỗi, xác thực
* Giới hạn tốc độ gọi API

---

### Hiệu suất

* Tối ưu mô hình embedding
* Caching thông minh
* Gom nhóm các cuộc gọi API
* Cơ chế retry lỗi

---

### Cải tiến tương lai

* Hỗ trợ WebSocket để chat thời gian thực
* Tăng cường bảo mật nâng cao
* Lưu cache câu trả lời AI
* Cân bằng tải (load balancing)


