# Backend Chatbot Toán học

Đây là máy chủ backend cho ứng dụng Chatbot Toán học, cung cấp phản hồi thông minh cho các câu hỏi toán học bằng cách sử dụng mô hình ngôn ngữ tiên tiến và tìm kiếm ngữ nghĩa.

## Tính năng

- Nhận diện chủ đề cho câu hỏi toán học  
- Tìm kiếm ngữ nghĩa bằng embeddings câu  
- Tích hợp với Gemini AI để tạo phản hồi  
- API hỗ trợ CORS  
- Cơ sở tri thức dựa trên Excel với embeddings  

## Yêu cầu

- Python 3.10 hoặc cao hơn  
- GPU NVIDIA (tùy chọn, để cải thiện hiệu suất)  
- Khóa API Gemini  

## Cài đặt

1. Tạo môi trường ảo (khuyến nghị):
```bash
python -m venv venv
source venv/bin/activate  # Dành cho Linux/Mac
# HOẶC
.\venv\Scripts\activate  # Dành cho Windows
````

2. Cài đặt các gói cần thiết:

```bash
pip install -r requirements.txt
```

3. Hỗ trợ GPU (tùy chọn):

```bash
pip install torch==2.6.0 --index-url https://download.pytorch.org/whl/cu124
```

## Cấu hình môi trường

1. Tạo tệp `.env` trong thư mục backend với khóa API Gemini:

```
GEMINI_API_KEY=your_api_key_here
```

## Cấu trúc dự án

* `api_server.py` - Ứng dụng máy chủ Flask chính
* `requirements.txt` - Danh sách thư viện Python
* `content/` - Thư mục chứa dữ liệu

  * `Data search_with_embeddings.xlsx` - Cơ sở tri thức với embeddings
  * `Test_model_NCKH.ipynb` - Notebook kiểm thử mô hình

## API Endpoints

### 1. Nhận diện chủ đề

* **Endpoint:** `/identify-topic`
* **Phương thức:** POST
* **Dữ liệu gửi:** `{ "question": "Câu hỏi toán học của bạn" }`
* **Phản hồi:** `{ "topic": "Chủ đề được nhận diện" }`

### 2. Trò chuyện

* **Endpoint:** `/chat`
* **Phương thức:** POST
* **Dữ liệu gửi:** `{ "query": "Câu hỏi của bạn" }`
* **Phản hồi:** `{ "response": "Câu trả lời được tạo" }`

## Cấu hình

Cấu hình chính trong `api_server.py`:

```python
QUERY_EMBEDDING_MODEL = 'BAAI/bge-m3'  # Mô hình tạo embedding
TOP_K_RETRIEVAL = 15  # Số lượng kết quả tìm kiếm tối đa
GEMINI_MODEL_NAME = 'gemini-2.0-flash-thinking-exp-01-21'
```

## Chạy máy chủ

```bash
python api_server.py
```

Máy chủ sẽ chạy tại `localhost:5000` với chế độ debug bật.

## Chi tiết tính năng

1. **Nhận diện chủ đề**

   * Sử dụng Gemini AI để xác định chủ đề toán học của câu hỏi
   * Hỗ trợ tìm kiếm và tạo phản hồi theo ngữ cảnh

2. **Tìm kiếm ngữ nghĩa**

   * Sử dụng Sentence Transformers để tạo embeddings
   * Áp dụng cosine similarity để tìm nội dung phù hợp
   * Lọc kết quả theo chủ đề nếu có

3. **Tạo phản hồi**

   * Kết hợp ngữ cảnh truy xuất với Gemini AI để sinh câu trả lời
   * Thiết lập mức độ an toàn để kiểm soát nội dung
   * Xử lý giới hạn tốc độ gọi API

## Bảo mật

* Hỗ trợ CORS
* Cấu hình an toàn cho API Gemini
* Bảo vệ khóa API bằng biến môi trường `.env`

## Xử lý lỗi

Ứng dụng đã xử lý các lỗi thường gặp như:

* Thiếu khóa API
* Định dạng dữ liệu không hợp lệ
* Lỗi từ API bên ngoài
* Lỗi tạo embedding
* Yêu cầu không hợp lệ

## Đóng góp

Khi đóng góp cho dự án:

1. Đảm bảo cập nhật `requirements.txt` nếu có thêm phụ thuộc
2. Kiểm thử thay đổi bằng notebook đi kèm
3. Tuân theo cấu trúc mã và quy tắc tài liệu hiện có
4. Kiểm thử kỹ các API endpoint trước khi gửi pull request
