// --- 1. 필요한 프로그램들(모듈)을 불러옵니다 ---
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

// --- 2. 기본 설정 ---
dotenv.config();
const app = express();
const port = 3001;
app.use(cors());
app.use(express.json());

// --- 3. 데이터베이스 연결 ---
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI가 .env 파일에 설정되지 않았습니다.");
  process.exit(1);
}
mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB에 성공적으로 연결되었습니다."))
  .catch((err) => console.error("❌ MongoDB 연결 오류:", err));

// --- 4. 데이터의 모양(스키마) 정의 및 모델 생성 ---
interface IUser extends mongoose.Document {
  name: string;
  channel: string;
  tags?: string[];
  job?: string;
  age?: number;
  imageUrl?: string;
}
const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  channel: { type: String, required: true, unique: true },
  tags: { type: [String], required: false },
  job: { type: String, required: false },
  age: { type: Number, required: false },
  imageUrl: { type: String, required: false },
}, { timestamps: true }); // 최신순 정렬을 위해 timestamps 옵션 추가
const User = mongoose.model<IUser>("User", userSchema);

// --- 5. API 경로(라우트) 만들기 ---

// [GET] 모든 사용자 목록 조회
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }); // 최신순으로 정렬
        res.json(users);
    } catch (error) {
        res.status(500).send("사용자 데이터를 조회하는 중 오류가 발생했습니다.");
    }
});

// [POST] 새로운 사용자 생성
app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const { name, channel, tags, job, age } = req.body;
    let imageUrl = '';
    const pexelsApiKey = process.env.PEXELS_API_KEY;
    if (pexelsApiKey) {
      try {
        const response = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(name)}&per_page=1`, {
          headers: { Authorization: pexelsApiKey },
        });
        if (response.data && response.data.photos.length > 0) {
          imageUrl = response.data.photos[0].src.medium;
        }
      } catch (imageError) {
        console.error("Pexels 이미지 검색 중 오류 발생:", imageError);
      }
    }
    const newUser = new User({ name, channel, tags, job, age, imageUrl });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error: any) {
    console.error("❌ 사용자 추가 중 오류 발생:", error);
    if (error.code === 11000) {
      return res.status(409).send("Error: Duplicate key.");
    }
    res.status(500).send("서버 내부 오류가 발생했습니다.");
  }
});

// [DELETE] 특정 사용자 삭제
app.delete("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).send("해당 ID의 사용자를 찾을 수 없습니다.");
    }
    res.status(200).send("사용자가 성공적으로 삭제되었습니다.");
  } catch (error) {
    res.status(500).send("사용자 데이터를 삭제하는 중 오류가 발생했습니다.");
  }
});

// [PUT] 특정 사용자 수정
app.put("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { name, channel, tags, job, age } = req.body;

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).send("수정할 사용자를 찾을 수 없습니다.");
    }

    let imageUrl = currentUser.imageUrl;
    if (name !== currentUser.name) {
      const pexelsApiKey = process.env.PEXELS_API_KEY;
      if (pexelsApiKey) {
        try {
          const response = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(name)}&per_page=1`, {
            headers: { Authorization: pexelsApiKey },
          });
          if (response.data && response.data.photos.length > 0) {
            imageUrl = response.data.photos[0].src.medium;
          } else {
            imageUrl = '';
          }
        } catch (imageError) {
          console.error("수정 중 이미지 재검색 오류:", imageError);
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, channel, tags, job, age, imageUrl },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error("❌ 사용자 수정 중 오류 발생:", error);
    if (error.code === 11000) {
      return res.status(409).send("수정하려는 채널 주소가 이미 다른 사용자에 의해 사용 중입니다.");
    }
    res.status(500).send("사용자 데이터를 수정하는 중 서버 내부 오류가 발생했습니다.");
  }
});

// --- 6. 서버 실행 ---
app.listen(port, () => {
  console.log(`🚀 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});