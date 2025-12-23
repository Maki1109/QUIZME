import sys
import json
import numpy as np
import pandas as pd
from pymongo import MongoClient
import os
from dotenv import load_dotenv

IRT_DISCRIMINATION = 1.0
IRT_GUESSING = 0.25

def calculate_probability(theta, difficulty):
    a, b, c = IRT_DISCRIMINATION, difficulty, IRT_GUESSING
    exponent = a * (theta - b)
    p = c + (1 - c) / (1 + np.exp(-exponent))
    return np.clip(p, 0.001, 0.999)

def calculate_information(theta, difficulty):
    a, c = IRT_DISCRIMINATION, IRT_GUESSING
    p = calculate_probability(theta, difficulty)
    q = 1 - p
    numerator = (a ** 2) * q * ((p - c) ** 2)
    denominator = p * ((1 - c) ** 2)
    return numerator / denominator if denominator != 0 else 0

def estimate_ability_mle(current_theta, responses, question_bank_df):
    if not responses: return 0.0
    theta = current_theta
    for _ in range(10): # Newton-Raphson loop
        numerator, denominator = 0, 0
        for r in responses:
            q_row = question_bank_df[question_bank_df['question_id'] == r['id']]
            if q_row.empty: continue
            b = float(q_row.iloc[0]['irt_difficulty_b'])
            u = 1 if r['correct'] else 0
            p = calculate_probability(theta, b)
            a, c = IRT_DISCRIMINATION, IRT_GUESSING
            p_star = (p - c) / (1 - c)
            w = p_star * (1 - p_star)
            numerator += a * (u - p) * p_star / p
            denominator -= (a**2) * w 
        if abs(denominator) < 1e-5: break
        change = numerator / abs(denominator)
        theta += np.clip(change, -0.5, 0.5) 
        theta = np.clip(theta, -3, 3)
    return theta

def select_next_question(current_theta, answered_ids, df_questions, weak_topics=[]):
    available = df_questions[~df_questions['question_id'].isin(answered_ids)].copy()
    if available.empty: return None
    
    candidate_pool = available
    if weak_topics:
        topic_pool = available[available['topic'].isin(weak_topics)]
        if not topic_pool.empty: candidate_pool = topic_pool

    candidate_pool['info'] = candidate_pool['irt_difficulty_b'].apply(
        lambda b: calculate_information(current_theta, b)
    )
    # Sắp xếp và lấy câu tốt nhất
    best_question = candidate_pool.sort_values('info', ascending=False).iloc[0]
    
    # Chuyển thành dict để trả về JSON
    return {
        "question_id": best_question['question_id'],
        "topic": best_question['topic'],
        "difficulty_level": best_question.get('difficulty_level', 'Medium')
    }

# Load DB (Vì mỗi lần gọi script là 1 lần chạy mới nên phải kết nối lại)
load_dotenv()
MONGO_URI = os.getenv('MONGO_URI')

def get_data_frame():
    try:
        client = MongoClient(MONGO_URI)
        db = client.get_database("quizme")
        cursor = db["questions"].find({}, {'_id': 0, 'question_id': 1, 'irt_difficulty_b': 1, 'topic': 1, 'difficulty_level': 1})
        df = pd.DataFrame(list(cursor))
        if 'irt_difficulty_b' not in df.columns: df['irt_difficulty_b'] = 0
        df['irt_difficulty_b'] = pd.to_numeric(df['irt_difficulty_b'], errors='coerce').fillna(0)
        return df
    except Exception as e:
        return pd.DataFrame() # Return empty if fail

if __name__ == "__main__":
    try:
        # 1. Đọc dữ liệu JSON từ Node.js gửi sang
        input_data = sys.stdin.read()
        request = json.loads(input_data)
        
        command = request.get('command')
        df = get_data_frame()
        
        result = {}

        if command == 'recommend':
            theta = request.get('current_theta', 0)
            answered = request.get('answered_ids', [])
            weak = request.get('weak_topics', [])
            q = select_next_question(theta, answered, df, weak)
            result = {"question": q}

        elif command == 'calculate_theta':
            theta = request.get('current_theta', 0)
            history = request.get('history', [])
            new_theta = estimate_ability_mle(theta, history, df)
            result = {"new_theta": new_theta}
        
        # 2. Trả kết quả JSON về cho Node.js
        print(json.dumps(result))
        
    except Exception as e:
        # In lỗi ra JSON để Node.js bắt được
        print(json.dumps({"error": str(e)}))