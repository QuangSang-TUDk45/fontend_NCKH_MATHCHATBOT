# --- Import các thư viện cần thiết ---
from flask import Flask, request, jsonify  # Flask để tạo server API, request để xử lý yêu cầu, jsonify để trả về JSON
from flask_cors import CORS  # CORS để cho phép truy cập từ các domain khác
import pandas as pd  # Pandas để xử lý dữ liệu từ file Excel
import numpy as np  # NumPy để xử lý mảng và tính toán
from sentence_transformers import SentenceTransformer  # Thư viện để tạo embedding cho văn bản
from sklearn.metrics.pairwise import cosine_similarity  # Tính độ tương đồng cosine giữa các vector
import google.generativeai as genai  # Thư viện để gọi API Gemini
import traceback  # Để in chi tiết lỗi khi có ngoại lệ
import os  # Để làm việc với hệ thống file và biến môi trường
import ast  # Để parse chuỗi thành danh sách (dùng cho embedding)
import time  # Để thêm độ trễ giữa các yêu cầu API
from dotenv import load_dotenv  # Để tải biến môi trường từ file .env

# --- Khởi tạo Flask app ---
app = Flask(__name__)

# --- Cấu hình CORS để cho phép truy cập từ frontend ---
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://zebra-equipped-gelding.ngrok-free.app"]}})

# --- Định nghĩa các hằng số ---
SEARCH_DATA_PATH = 'f:/fontend_NCKH_MATHCHATBOT/backend/content/Data search_with_embeddings.xlsx'  # Đường dẫn đến file dữ liệu
SEARCH_ID_COL = 'ID'  # Tên cột ID trong file dữ liệu
SEARCH_CONTENT_COL = 'Nội dung'  # Tên cột nội dung trong file dữ liệu
SEARCH_TOPIC_COL = 'Chủ đề'  # Tên cột chủ đề trong file dữ liệu
SEARCH_EMBEDDING_COL = 'Embedding_MathBERT'  # Tên cột embedding trong file dữ liệu
QUERY_EMBEDDING_MODEL = 'BAAI/bge-m3'  # Mô hình embedding để mã hóa câu hỏi
TOP_K_RETRIEVAL = 15  # Số lượng kết quả tìm kiếm tối đa trả về
MAX_LEN_PER_RETRIEVED_ITEM = 100000  # Độ dài tối đa của mỗi mục tìm kiếm
MAX_TOTAL_CONTEXT_LENGTH = 1000000  # Độ dài tối đa của toàn bộ ngữ cảnh
GEMINI_MODEL_NAME = 'gemini-2.0-flash-thinking-exp-01-21'  # Tên mô hình Gemini
API_CALL_DELAY = 1  # Độ trễ giữa các yêu cầu API (giây)

# --- Tải biến môi trường từ file .env ---
load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'AIzaSyDx-IzX6g-zHtukS9QTQz5nBSfpJXq77P0')  # Lấy API key từ biến môi trường, hoặc dùng giá trị mặc định

# --- Kiểm tra API key ---
if not GEMINI_API_KEY:
    print("Lỗi: Không tìm thấy GEMINI_API_KEY. Hãy tạo file .env hoặc đặt biến môi trường.")
    exit()

# --- Cấu hình API Gemini ---
genai.configure(api_key=GEMINI_API_KEY)

# --- Hàm parse embedding từ chuỗi thành mảng NumPy ---
def parse_embedding(embedding_str):
    """
    Chuyển đổi embedding dạng chuỗi thành mảng NumPy.
    Args:
        embedding_str (str): Chuỗi chứa embedding (dạng danh sách Python).
    Returns:
        numpy.ndarray: Mảng NumPy chứa embedding, hoặc None nếu có lỗi.
    """
    if not isinstance(embedding_str, str):  # Kiểm tra nếu không phải chuỗi
        return None
    try:
        embedding_list = ast.literal_eval(embedding_str.strip())  # Parse chuỗi thành danh sách
        if not isinstance(embedding_list, list) or not all(isinstance(x, (int, float)) for x in embedding_list):
            raise ValueError("Embedding không phải là danh sách số.")
        return np.array(embedding_list, dtype=np.float32)  # Chuyển thành mảng NumPy
    except Exception as e:
        print(f"Lỗi khi parse embedding: {e}")
        return None

# --- Tải dữ liệu và mô hình khi khởi động server ---
print("Đang tải dữ liệu và mô hình...")
try:
    # Đọc dữ liệu từ file Excel
    df_search = pd.read_excel(SEARCH_DATA_PATH)
    required_cols = [SEARCH_ID_COL, SEARCH_CONTENT_COL, SEARCH_TOPIC_COL, SEARCH_EMBEDDING_COL]  # Các cột bắt buộc
    if not all(col in df_search.columns for col in required_cols):
        missing = [col for col in required_cols if col not in df_search.columns]
        print(f"Lỗi: Thiếu cột {missing} trong {SEARCH_DATA_PATH}")
        exit()

    # Parse embedding và loại bỏ các hàng không hợp lệ
    df_search['embedding_vector'] = df_search[SEARCH_EMBEDDING_COL].apply(parse_embedding)
    df_search.dropna(subset=['embedding_vector', SEARCH_CONTENT_COL, SEARCH_TOPIC_COL], inplace=True)
    df_search.reset_index(drop=True, inplace=True)

    # Tạo ma trận embedding từ dữ liệu
    search_embeddings_matrix = np.vstack(df_search['embedding_vector'].values)
    available_topics_list = df_search[SEARCH_TOPIC_COL].astype(str).unique().tolist()  # Lấy danh sách chủ đề

    # Tải mô hình embedding
    query_model = SentenceTransformer(QUERY_EMBEDDING_MODEL, device='cpu')  # Dùng 'cuda' nếu có GPU
    print("Dữ liệu và mô hình đã được tải thành công.")
except Exception as e:
    print(f"Lỗi khi khởi động: {e}")
    traceback.print_exc()
    exit()

# --- Cấu hình an toàn cho Gemini API ---
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]
gemini_llm = genai.GenerativeModel(GEMINI_MODEL_NAME, safety_settings=safety_settings)  # Khởi tạo mô hình Gemini

# --- Hàm xác định chủ đề của câu hỏi ---
def identify_topic(query, topics, llm):
    """
    Xác định chủ đề của câu hỏi bằng Gemini API.
    Args:
        query (str): Câu hỏi hoặc nội dung cần xác định chủ đề.
        topics (list): Danh sách các chủ đề có sẵn.
        llm: Mô hình Gemini để tạo phản hồi.
    Returns:
        str: Chủ đề được xác định, hoặc None nếu không tìm thấy.
    """
    topics_with_fallback = topics + ["Không xác định chủ đề"]  # Thêm tùy chọn mặc định
    prompt = f"""
    Cho câu hỏi/nội dung sau: "{query}"

    Hãy xác định một chủ đề phù hợp nhất cho nội dung này từ danh sách chủ đề dưới đây:
    {chr(10).join(f"- {topic}" for topic in topics_with_fallback)}

    Chỉ trả về TÊN CHỦ ĐỀ DUY NHẤT và chính xác như trong danh sách, không thêm bất kỳ giải thích nào.
    Nếu không có chủ đề nào phù hợp, trả về "Không xác định chủ đề".
    """
    try:
        time.sleep(API_CALL_DELAY)  # Thêm độ trễ để tránh vượt giới hạn API
        response = llm.generate_content(prompt, generation_config=genai.types.GenerationConfig(temperature=0.1))
        if response.parts:
            identified_topic_raw = response.text.strip()
            for topic in topics_with_fallback:
                if identified_topic_raw.lower() == topic.lower():
                    return topic if topic != "Không xác định chủ đề" else None
            return "[Không khớp]"
        else:
            return "[Lỗi Phản Hồi]"
    except Exception as e:
        print(f"Lỗi khi xác định chủ đề: {e}")
        return None

# --- Hàm tìm kiếm nội dung liên quan dựa trên embedding ---
def search_relevant_content(query, query_model, df_search_full, search_embeddings_full, available_topics_list, topic=None, top_k=5):
    """
    Tìm kiếm nội dung liên quan dựa trên embedding và chủ đề.
    Args:
        query (str): Câu hỏi cần tìm kiếm.
        query_model: Mô hình embedding để mã hóa câu hỏi.
        df_search_full (pandas.DataFrame): DataFrame chứa dữ liệu tìm kiếm.
        search_embeddings_full (numpy.ndarray): Ma trận embedding của dữ liệu.
        available_topics_list (list): Danh sách các chủ đề có sẵn.
        topic (str, optional): Chủ đề để lọc dữ liệu.
        top_k (int): Số lượng kết quả trả về.
    Returns:
        tuple: (danh sách nội dung tìm kiếm, DataFrame đã lọc).
    """
    try:
        # Mã hóa câu hỏi thành embedding
        query_embedding = query_model.encode(query, convert_to_numpy=True, normalize_embeddings=True).reshape(1, -1)
    except Exception as e:
        print(f"Lỗi khi tạo embedding cho câu hỏi: {e}")
        return [], None

    # Lọc dữ liệu theo chủ đề nếu có
    df_filtered = df_search_full
    search_embeddings_filtered = search_embeddings_full
    if topic and topic in available_topics_list:
        df_filtered = df_search_full[df_search_full[SEARCH_TOPIC_COL] == topic]
        if df_filtered.empty:
            df_filtered = df_search_full
        else:
            filtered_indices = df_filtered.index.tolist()
            search_embeddings_filtered = search_embeddings_full[filtered_indices]

    if df_filtered.empty:
        return [], df_filtered

    # Tính độ tương đồng cosine giữa câu hỏi và dữ liệu
    similarities = cosine_similarity(query_embedding, search_embeddings_filtered)[0]
    top_k_local_indices = np.argsort(similarities)[-top_k:][::-1]  # Lấy top k chỉ số có độ tương đồng cao nhất
    retrieved_content = [
        {
            'id': df_filtered.iloc[i][SEARCH_ID_COL],
            'content': df_filtered.iloc[i][SEARCH_CONTENT_COL],
            'topic': df_filtered.iloc[i][SEARCH_TOPIC_COL],
            'score': similarities[i]
        }
        for i in top_k_local_indices
    ]
    return retrieved_content, df_filtered

# --- Hàm tạo câu trả lời cuối cùng từ Gemini API ---
def generate_final_response(query, retrieved_items, llm):
    """
    Tạo câu trả lời bằng Gemini với ngữ cảnh từ nội dung tìm kiếm.
    Args:
        query (str): Câu hỏi của người dùng.
        retrieved_items (list): Danh sách các nội dung tìm kiếm liên quan.
        llm: Mô hình Gemini để tạo phản hồi.
    Returns:
        str: Câu trả lời được tạo.
    """
    # Tạo chuỗi ngữ cảnh từ các nội dung tìm kiếm
    context_str = ""
    if retrieved_items:
        context_str += "Dưới đây là một số nội dung được tìm thấy có thể liên quan:\n"
        for i, item in enumerate(retrieved_items):
            content_snippet = item.get('content', '[Nội dung bị thiếu]')
            if len(content_snippet) > MAX_LEN_PER_RETRIEVED_ITEM:
                content_snippet = content_snippet[:MAX_LEN_PER_RETRIEVED_ITEM] + "... [Cắt bớt]"
            context_str += f"\n--- Ngữ cảnh {i+1} (ID: {item.get('id', 'N/A')}, Chủ đề: {item.get('topic', 'N/A')}, Độ tương đồng: {item.get('score', 0.0):.4f}) ---\n{content_snippet}\n"
        context_str += "\n---\n"
    else:
        context_str = "Không tìm thấy nội dung nào liên quan trong dữ liệu để làm ngữ cảnh.\n"

    # Cắt ngắn ngữ cảnh nếu vượt quá giới hạn
    if len(context_str) > MAX_TOTAL_CONTEXT_LENGTH:
        context_str = context_str[:MAX_TOTAL_CONTEXT_LENGTH] + "\n... [TỔNG NGỮ CẢNH ĐÃ BỊ CẮT BỚT] ..."

    # Tạo prompt cho Gemini
    prompt = f"""Bạn là một trợ lý trả lời câu hỏi chuyên sâu về toán học, dựa trên tài liệu được cung cấp.
Người dùng hỏi: "{query}"

{context_str}
Dựa vào câu hỏi của người dùng và tài liệu được cung cấp:

1.  **Ưu tiên trả lời câu hỏi một cách đầy đủ và chính xác nhất có thể.**
2.  Nếu tài liệu **trực tiếp và rõ ràng** trả lời câu hỏi, hãy **tổng hợp và trình bày** thông tin đó trong phần **"Nội dung được chứng thực từ tài liệu:"**. Sử dụng thông tin từ tài liệu để xây dựng câu trả lời logic và dễ hiểu, **không sao chép nguyên văn**. (Không để Số thứ tự ngữ cảnh và ID vào)
3.  Nếu tài liệu **không đủ thông tin, không rõ ràng, hoặc chỉ liên quan một phần** đến câu hỏi, hãy sử dụng kiến thức chung của bạn để **bổ sung thông tin còn thiếu, giải thích chi tiết hơn, hoặc hoàn thiện câu trả lời**. Phần này được trình bày trong **"Nội dung bổ sung từ Gemini:"**.
4.  Nếu **hoàn toàn không có tài liệu** hoặc tài liệu **hoàn toàn không liên quan** đến câu hỏi, hãy trả lời dựa trên kiến thức nền tảng của bạn và chỉ sử dụng phần **"Nội dung bổ sung từ Gemini:"**.
5.  **Trình bày câu trả lời rõ ràng, mạch lạc**. Phân tách rõ hai phần "Nội dung được chứng thực từ tài liệu:" và "Nội dung bổ sung từ Gemini:" nếu cả hai đều có nội dung. Nếu chỉ có một loại nội dung, chỉ cần hiển thị phần đó với tiêu đề tương ứng. Đảm bảo câu trả lời dễ hiểu và đi thẳng vào vấn đề.
6.  **Sử dụng định dạng toán học (ví dụ: dùng LaTeX trong Markdown nếu có thể) cho các công thức và ký hiệu.** **Kiểm tra kỹ cú pháp LaTeX để tránh lỗi định dạng (ví dụ: không lặp lại \begin và \end trong cùng một khối công thức). Nếu phát hiện lỗi LaTeX trong tài liệu hoặc câu hỏi, hãy sửa chữa và trình bày lại công thức đúng cú pháp là thêm trước $$: $$\begin , thêm  sau $$: \end$$**
7.  Nếu trong nội dung chứng thực câu trả lời có liên kết đến tài liệu khác, đặc biệt là liên kết đến Google Drive, hãy **giữ nguyên liên kết đó trong câu trả lời**. Đảm bảo liên kết được trình bày rõ ràng, dễ truy cập, và đi kèm mô tả ngắn gọn về nội dung liên kết (ví dụ: "Xem chi tiết tại [Google Drive](link)"). Với đường dẫn là màu xanh.


Câu trả lời của bạn:
"""
    try:
        time.sleep(API_CALL_DELAY)  # Thêm độ trễ
        response = llm.generate_content(prompt)
        if response.parts:
            return response.text.strip()
        else:
            return "Không có câu trả lời từ Gemini."
    except Exception as e:
        print(f"Lỗi khi tạo câu trả lời: {e}")
        return f"Đã xảy ra lỗi khi tạo câu trả lời: {e}"

# --- Endpoint /identify-topic: Xác định chủ đề của câu hỏi ---
@app.route('/identify-topic', methods=['POST'])
def api_identify_topic():
    """
    Xác định chủ đề của câu hỏi.
    Request body: { "question": "Câu hỏi hoặc nội dung" }
    Returns:
        JSON: { "topic": "Chủ đề được xác định" } hoặc { "error": "Thông báo lỗi" }
    """
    try:
        data = request.get_json()  # Lấy dữ liệu JSON từ yêu cầu
        query = data.get('question', '')  # Lấy tham số question
        if not query:
            return jsonify({'error': 'Thiếu tham số question'}), 400

        # Xác định chủ đề
        topic = identify_topic(query, available_topics_list, gemini_llm)
        return jsonify({'topic': topic})
    except Exception as e:
        error_message = f"Lỗi khi xác định chủ đề: {e}"
        print(error_message)
        traceback.print_exc()
        return jsonify({'error': error_message}), 500

# --- Endpoint /chat: Xử lý câu hỏi từ người dùng ---
@app.route('/chat', methods=['POST'])
def api_chat():
    """
    Xử lý câu hỏi và trả về câu trả lời từ chatbot.
    Request body: { "query": "Câu hỏi của người dùng" }
    Returns:
        JSON: { "response": "Câu trả lời" } hoặc { "error": "Thông báo lỗi" }
    """
    try:
        data = request.get_json()  # Lấy dữ liệu JSON từ yêu cầu
        query = data.get('query', '')  # Lấy tham số query
        if not query:
            return jsonify({'error': 'Thiếu tham số query'}), 400

        # Xác định chủ đề của câu hỏi
        identified_topic = identify_topic(query, available_topics_list, gemini_llm)
        # Tìm kiếm nội dung liên quan
        retrieved_items, _ = search_relevant_content(
            query, query_model, df_search, search_embeddings_matrix, available_topics_list,
            topic=identified_topic, top_k=TOP_K_RETRIEVAL
        )
        # Tạo câu trả lời từ Gemini
        response = generate_final_response(query, retrieved_items, gemini_llm)
        return jsonify({'response': response})
    except Exception as e:
        error_message = f"Lỗi chatbot: {e}"
        print(error_message)
        traceback.print_exc()
        return jsonify({'error': error_message}), 500

# --- Chạy server ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)  # Chạy server trên localhost:5000 với chế độ debug