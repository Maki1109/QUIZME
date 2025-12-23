import pandas as pd
from pymongo import MongoClient, UpdateOne




DB_NAME = "test"          # Tên database bạn muốn tạo
COLLECTION_NAME = "questions" # Tên collection (tương tự bảng)

# --- 2. CẤU HÌNH MAPPING DỮ LIỆU ---
difficulty_map = {
    'Nhận biết': 'nb',
    'Thông hiểu': 'th',
    'Vận dụng': 'vd',
    'Vận dụng cao': 'vdc'
}

# Mapping đáp án từ chữ cái sang index (0, 1, 2, 3)
answer_map = {
    'A': 0, 'B': 1, 'C': 2, 'D': 3
}

def clean_data(row):
    """Chuyển đổi 1 dòng dữ liệu CSV thành Document MongoDB"""
    try:
        # 1. Xử lý độ khó (Mặc định là medium nếu không khớp)
        muc_do = str(row['difficulty']).strip()
        difficulty = difficulty_map.get(muc_do, 'medium')
        
        # 2. Xử lý đáp án đúng
        correct_char = str(row['correct_answer']).strip().upper()
        correct_index = answer_map.get(correct_char, 0)
        
        # 3. Tạo document (JSON)
        document = {
            'id': int(row['id']),
            'question': str(row['question']),
            'options': [
                str(row['A']),
                str(row['B']),
                str(row['C']),
                str(row['D'])
            ],
            'correct_answer': correct_index, # Lưu dạng số 0, 1, 2, 3
            'topic': str(row['topic']),
            'difficulty': difficulty, # easy, medium, hard, very_hard
            'explanation': str(row['explaination']) if pd.notna(row['explaination']) else ""
        }
        return document
    except Exception as e:
        # In lỗi nếu dòng nào đó bị sai format
        print(f"❌ Lỗi dòng ID {row.get('id', 'Unknown')}: {e}")
        return None

def main():
    # 1. Đọc file CSV
    csv_file = 'groknguvl.csv'
    try:
        df = pd.read_csv(csv_file)
        print(f"📖 Đã đọc {len(df)} dòng từ file CSV.")
    except FileNotFoundError:
        print(f"❌ Không tìm thấy file {csv_file}. Hãy chắc chắn file nằm cùng thư mục với script này.")
        return

    # 2. Kết nối MongoDB
    try:
        client = MongoClient(CONNECTION_STRING)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        print(f"✅ Đã kết nối tới MongoDB: {DB_NAME}.{COLLECTION_NAME}")
    except Exception as e:
        print(f"❌ Lỗi kết nối MongoDB: {e}")
        return

    # 3. Xử lý và Chuẩn bị lệnh Upsert
    print("🔄 Đang xử lý dữ liệu...")
    operations = []
    
    for index, row in df.iterrows():
        doc = clean_data(row)
        if doc:
            # Upsert: Tìm theo 'id'. 
            # - Nếu thấy: Update lại nội dung ($set).
            # - Nếu không thấy: Insert mới.
            op = UpdateOne(
                filter={'id': doc['id']}, 
                update={'$set': doc}, 
                upsert=True
            )
            operations.append(op)

    # 4. Thực thi ghi vào Database
    if operations:
        try:
            result = collection.bulk_write(operations)
            print("\n🎉 HOÀN TẤT ĐỒNG BỘ DỮ LIỆU!")
            print(f"   - Tổng số câu hỏi xử lý: {len(operations)}")
            print(f"   - Số câu tìm thấy (Matched): {result.matched_count}")
            print(f"   - Số câu được cập nhật (Modified): {result.modified_count}")
            print(f"   - Số câu thêm mới (Upserted): {result.upserted_count}")
        except Exception as e:
            print(f"❌ Lỗi khi ghi dữ liệu vào DB: {e}")
    else:
        print("⚠️ Không có dữ liệu hợp lệ để xử lý.")

if __name__ == "__main__":
    main()