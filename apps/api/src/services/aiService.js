const { spawn } = require('child_process');
const path = require('path');

// Hàm chạy Python Script và đợi kết quả
const runPythonScript = (data) => {
  return new Promise((resolve, reject) => {
    // Đường dẫn tới file python vừa sửa
    const scriptPath = path.join(__dirname, 'cat_engine.py');
    
    // Gọi lệnh: python cat_engine.py
    const pythonProcess = spawn('python', [scriptPath]);
    
    let resultString = '';
    let errorString = '';

    // 1. Gửi dữ liệu vào Python (qua Standard Input)
    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    // 2. Nhận dữ liệu từ Python
    pythonProcess.stdout.on('data', (data) => {
      resultString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    // 3. Khi Python chạy xong
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error("Python Error Log:", errorString);
        return resolve(null); // Trả về null nếu lỗi
      }
      try {
        const jsonResult = JSON.parse(resultString);
        if (jsonResult.error) {
            console.error("Python Logic Error:", jsonResult.error);
            return resolve(null);
        }
        resolve(jsonResult);
      } catch (e) {
        console.error("Lỗi parse JSON từ Python:", e, resultString);
        resolve(null);
      }
    });
  });
};

exports.getRecommendation = async (theta, answeredIds, weakTopics) => {
  const result = await runPythonScript({
    command: 'recommend',
    current_theta: theta,
    answered_ids: answeredIds,
    weak_topics: weakTopics
  });
  
  // Python trả về: { question: ... }
  if (result && result.question) {
      return { question: result.question };
  }
  return { question: null };
};

exports.calculateTheta = async (currentTheta, history) => {
  const result = await runPythonScript({
    command: 'calculate_theta',
    current_theta: currentTheta,
    history: history
  });

  return result ? result.new_theta : currentTheta;
};