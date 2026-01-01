require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');
const cloudinary = require('cloudinary').v2;

// 1. Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const MONGO_URI = process.env.MONGO_URI; //
const client = new MongoClient(MONGO_URI);

async function importData() {
  try {
    await client.connect();
    console.log("✅ Đã kết nối MongoDB");
    const db = client.db(); // Tên db lấy từ URI
    const questionCollection = db.collection('questions');

    // Xóa dữ liệu cũ theo yêu cầu của bạn
    await questionCollection.deleteMany({});
    console.log("🗑️ Đã xóa sạch dữ liệu câu hỏi cũ");

    const questionsToImport = [];

    // 2. Đọc file CSV
    fs.createReadStream('answer_bank.csv')
      .pipe(csv())
      .on('data', (row) => {
        questionsToImport.push(row);
      })
      .on('end', async () => {
        console.log(`📄 Tìm thấy ${questionsToImport.length} câu hỏi trong CSV. Bắt đầu lấy URL ảnh...`);

        const finalData = [];

        for (const item of questionsToImport) {
          // 3. Tìm kiếm URL ảnh trên Cloudinary bằng tên file gốc
          // Ví dụ: Tìm "DE_02_Q03" để lấy URL có mã "_i5ly83"
          const publicIdMatch = item.image_filename.split('.')[0];
          
          try {
            const searchResult = await cloudinary.search
              .expression(`public_id:${publicIdMatch}*`) // Tìm kiếm theo tiền tố
              .execute();

            let imageUrl = "";
            if (searchResult.resources.length > 0) {
              // Lấy URL đã được tối ưu hóa (f_auto, q_auto)
              imageUrl = searchResult.resources[0].secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
            } else {
              console.warn(`⚠️ Không tìm thấy ảnh cho ID: ${publicIdMatch}`);
              imageUrl = "https://via.placeholder.com/800x400?text=No+Image+Found";
            }

            // 4. Định dạng lại dữ liệu để khớp với Model
            finalData.push({
              question_id: item.question_id,
              image_url: imageUrl,
              question_type: item.question_type,
              topic: item.topic,
              difficulty_level: item.difficulty_level,
              irt_difficulty_b: parseFloat(item.irt_difficulty_b),
              correct_answer: item.correct_answer,
              createdAt: new Date()
            });

            console.log(`✅ Đã xử lý: ${item.question_id}`);
          } catch (err) {
            console.error(`❌ Lỗi khi tìm ảnh ${publicIdMatch}:`, err.message);
          }
        }

        // 5. Chèn vào MongoDB
        if (finalData.length > 0) {
          await questionCollection.insertMany(finalData);
          console.log(`🚀 Thành công! Đã đưa ${finalData.length} câu hỏi lên MongoDB Atlas.`);
        }
        
        await client.close();
        process.exit(0);
      });

  } catch (error) {
    console.error("❌ Lỗi hệ thống:", error);
    process.exit(1);
  }
}

importData();