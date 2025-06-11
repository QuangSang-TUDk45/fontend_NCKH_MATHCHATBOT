## Install lib

npm create vite@latest
npm i
npm i react-router-dom
npm install @reduxjs/toolkit
npm install react-redux
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# nếu lỗi tailwind

npm uninstall tailwindcss postcss autoprefixer
npm install -D tailwindcss@3.3.3 postcss autoprefixer
npx tailwindcss init -p


npm install html-to-md
pip install markdown pykatex
---
# React
- Vai trò: Thư viện chính để xây dựng UI(Giao diện người dùng) theo kiểu components-based(dựa trên các thành phần)
- Tại sao cần: Cung cấp các công cụ cơ bản như: useState, useEffect, useContext,...
- Giải thích:
  - react: "Bộ não" để tạo giao diện(UI)
  - Cho phép bạn viết component - từng khối nhỏ giao diện như nút bấm, bảng, form,...
  - Giúp cập nhật giao diện "tự động" khi dữ liệu thay đổi


# React-dom/client
- Vai trò: Kết nối React với DOM thật trong trình duyệt
- Tại sao cần DOM:
Đoạn ReactDOM.createRoot(document.getElementById("root")).render(<App />) là cách để render ứng dụng React vào trang HTML
- Giải thích:
  - react-dom/client "Cầu nối" giữa React và trang wed thật
  - Giúp hiển thị giao diện React vào trang wed HTML(nơi có div id ="root")

# .App.jsx
- Vai trò: Thành phần gốc của ứng dụng React, chứa các component con khác
- Tại sao cần: Là nơi định nghĩa layout tổng thể hoặc các route con
- Giải thích:
  - Thành phần chính (component gốc): Là nơi bắt đầu hiển thị giao diện của bạn
  - Bạn sẽ "thiết kế giao diện chính ở đây", hoặc chi nhỏ thành nhiều phần

# React-router-dom
- Vai trò: Thư viện định tuyến (routing) cho React trong môi trường trình duyệt
- Các thành phần chính được dùng:
  - createBrowserRouter: Tạo router dựa trên URL trình duyệt
  - RouteProvider: Dùng để bọc toàn bộ ứng dụng với routing context.
  - Navigate: Dùng để chuyển hướng người dùng (redirect)
- Giải thích:
  - react-router-dom: Điều hướng giữa các trang trong React(SPA)
  - Giúp bạn làm wed nhiều trang như: /home, /about,/login,...
  - Không cần reload trang khi chuyển trang (rất mượt)
  - createBrowserRouter: định nghĩa các "đường dẫn"
  - routerProvider: bọc toàn bộ app để sử dụng router
  - Navigate: Chuyển trang bằng code

# React-redux
- Vai trò: Kết nối Redux store với ứng dụng React
- Tại sao cần: Provider giúp truyền store xuống toàn bộ component trong ứng dụng, giúp mọi component có thể truy cập hoặc cập nhật trạng thái toàn cục
- Giải thích:
  - Quản lý "trạng thái chung" của toàn bộ ứng dụng
  - bạn có thể hình dung như: mọi component đều cần chia sẻ 1 số dữ liệu  - Redux giúp quản lý dữ liệu đó ở 1 nơi duy nhất
  - Provider  giúp các thành phần trong app kết nối tới Redux store

---
# ChatDetail.jsx

##  Hook và hàm từ trong React
- useState:Tạo biến lưu trữ dữ liệu bên trong component(vd: nội dung tin nhắn)
- useEffect: Chạy một đoạn code khi component được render, thường dung để "gọi API hoặc thiết lập dữ liệu ban đầu".
- useCallback: Tối ưu hiệu suất, ghi nhớ hàm nếu không có gì thay đổi
- useRef: tạo một biến không bị reset lại khi component re-reder(thường dùng để thao tác DOM, như scroll xuống cuối khung chat)

## Hàm điều hướng từ React Router
- useParams: Lấy "tham số từ URL", vd: /chat/123 thì lấy được 123
- useNavigate: Giúp chuyển trang bằng code, vd: navigate('/home')

## Redux - quản lý state toàn ứng dụng
- useDispatch: Gửi hành động(action) để thay đổi Redux store
- useSelector: Lấy dữ liệu từ Redux store
- addMessage, setNameChat, fetchSheetData, selectSheetData: Đây là hàm định nghĩa trong chatSlice.js - một phần của Redux logic để xử lý dữ liệu chat

## Thự viện tạo ID tự động
- uuidv4() dùng đẻ tạo một ID duy nhất(unique), thường dùng cho mỗi tin nhắn

## Component riêng
- Sidebar: là thanh bên(menu trái) để chọn các cuộc trò chuyện
- MathKeyBoard: là phím gõ công thức toán học

## Gọi API từ file dịch vụ
- Gemini: API kết nối AI Google Gemini(dùng sãn)
- chatWithBot: Hàm gọi chatbot chính (Tự định nghĩa)
- identifyTopic: Xác định chủ đề của đoạn chat

## Drag anh Drop - kéo thả tệp
- Thư viện hỗ trợ người dung kéo tệp vào khung chat, vd để gửi hình ảnh hoặc file
- useDropzone là hook dùng để xử lý thao tác kéo thả

## Hiển thị nội dung markdown
- component có khả năng render Markdown + công thức toán học
- Thường dùng để hiện thị nội dung từ bot hoặc người dùng một cách rõ ràng, đẹp

---
# MarkdownLatexProcessor.jsx
## Turndown
- Biến HTML thành Markdown
- Turndown là một thư viện giúp chuyển đổi nội dung HTML(thường do AI hoặc rich text edit tạo ra) thành định dạng markdown

## react-markdown
- Hiển thị nội dung markdown trong react
- Cho phep bạn "render chuỗi markdown thành HTML" trong giao diện React

## remark - math
- Hổ trợ công thức toán học(Latex) trong markdown
- Đây là plugin cho ReactMarkdown để hiểu cú pháp. vd: $a^2 + b^2 = c^2$

## rehype-katex
- Hiển thị công thức toán học bằng Katex
- Đây là plugin giúp render công thức toán học ra HTML đẹp như trong sách giáo khoa
- Nó hoạt đọng sau remarkMath 

## katex/dist/katex.min.css
- CSS cho Katex - để hiển thị đúng style cho công thức toán học
- import CSS giúp công thức toán học hiển thị đẹp
- Nếu quên, công thức có thể hiện sai, hoặc chỉ thấy plain text

## useMemo from react
- Hook tối ưu hiệu suất cho React
- useMemo() dùng để tính toán và nhớ lại giá trị, tránh tính lại mỗi lần component render
- Dùng khi bạn có xử lý nặng (vd: convert Markdown, phân tích HTML...)

# Tổng kết
turndown                 - HTML ->  Markdown
react-markdown           - Markdown -> HTML(hiển thị trong React)
remark-math              - Hiểu công thức Toán trong Markdown($...$) 
rehype-katex             - Hiển thị công thức Toán bằng Katex
katex.min.css            - Giao diện cho Katex
useMemo                  - Ghi nhớ giá trị tính toán, tránh re-render

# fetchGoogleSheets.js
## axios là gì?
- `axios` là một thư viện giúp bạn "giao tiếp với server" bằng các phương thức như sau:
  - GET: lấy dữ liệu
  - POST: gửi dữ liệu
  - PUT: cập nhật dữ liệu
  - DELETE: xóa dữ liệu
- Nó giống như fetch nhưng dễ dùng hơn có nhiều tính năng hơn



