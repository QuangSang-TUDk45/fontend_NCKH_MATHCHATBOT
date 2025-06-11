# Ứng dụng Chatbot Toán học

Một ứng dụng chatbot thông minh tập trung vào lĩnh vực Toán học, hỗ trợ người dùng với các câu hỏi toán học. Giao diện được xây dựng bằng React và máy chủ phía sau sử dụng Python Flask.

## Tổng quan dự án

Đây là một chatbot toán học toàn diện kết hợp giữa công nghệ web hiện đại và trí tuệ nhân tạo để cung cấp các phản hồi thông minh cho câu hỏi toán học của người dùng.

## Cấu trúc dự án

```

├── frontend/               # Ứng dụng frontend dùng React
│   ├── src/               # Mã nguồn
│   │   ├── components/    # Các thành phần React
│   │   ├── pages/         # Các trang trong ứng dụng
│   │   ├── services/      # Dịch vụ gọi API
│   │   └── store/         # Quản lý trạng thái
│   └── public/            # Tài nguyên tĩnh
│
├── backend/               # Ứng dụng backend dùng Flask
│   ├── api\_server.py      # Ứng dụng máy chủ chính
│   ├── content/           # Dữ liệu và mô hình
│   └── requirements.txt   # Các gói phụ thuộc Python

````

## Tính năng chính

- Xử lý câu hỏi toán học
- Tìm kiếm ngữ nghĩa
- Tạo phản hồi bằng trí tuệ nhân tạo Gemini
- Giao diện trò chuyện thời gian thực
- Thiết kế đáp ứng đa thiết bị
- Câu trả lời theo từng chủ đề cụ thể
- Hỗ trợ bàn phím toán học
- Hiển thị công thức Toán học bằng LaTeX

## Công nghệ sử dụng

### Frontend

- React kết hợp Vite
- Tailwind CSS để thiết kế giao diện
- MathJax để hiển thị công thức LaTeX
- Tích hợp Google API
- Hệ thống quản lý trạng thái hiện đại

### Backend

- Python Flask
- Sentence Transformers
- Gemini AI
- Pandas để xử lý dữ liệu
- NumPy để tính toán

## Bắt đầu dự án

1. Clone dự án:
```bash
git clone <repository-url>
cd fontend_NCKH_MATHCHATBOT
````

2. Thiết lập backend:

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

3. Thiết lập frontend:

```bash
cd frontend
npm install
```

4. Khởi chạy ứng dụng:

Backend:

```bash
cd backend
python api_server.py
```

Frontend:

```bash
cd frontend
npm run dev
```

## Biến môi trường

### Backend

```env
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend

```env
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key
```

## Chi tiết tính năng

1. **Xử lý toán học**

   * Hiểu chính xác các câu hỏi toán học
   * Hỗ trợ nhiều chủ đề toán học
   * Hiển thị công thức bằng LaTeX

2. **Tích hợp trí tuệ nhân tạo**

   * Sử dụng Gemini để tạo câu trả lời
   * Tìm kiếm ngữ nghĩa để truy xuất nội dung phù hợp
   * Nhận diện chủ đề của câu hỏi

3. **Giao diện người dùng**

   * Bàn phím toán học tương tác
   * Giao diện trò chuyện thời gian thực
   * Thiết kế đáp ứng với mọi thiết bị

4. **Quản lý dữ liệu**

   * Cơ sở dữ liệu được lưu trong file Excel
   * Tìm kiếm vector embedding
   * Phân loại nội dung theo chủ đề

## Đóng góp

1. Fork repository
2. Tạo nhánh mới cho tính năng bạn muốn thêm
3. Thực hiện thay đổi
4. Gửi pull request

## Yêu cầu hệ thống

* Node.js 16 trở lên cho frontend
* Python 3.10 trở lên cho backend
* GPU NVIDIA (tùy chọn) để cải thiện hiệu suất
