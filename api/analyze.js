import OpenAI from "openai";
import { Redis } from "@upstash/redis";

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Redis 클라이언트 초기화
// Vercel/Upstash Redis는 보통 UPSTASH_REDIS_REST_URL 및 UPSTASH_REDIS_REST_TOKEN을 사용하지만,
// 사용자가 명시한 REDIS_URL이 있을 경우를 대비하여 유연하게 설정합니다.
const redis = new Redis({
    url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text } = request.body;

    if (!text) {
        return response.status(400).json({ error: '일기 내용이 없습니다.' });
    }

    try {
        // 1. OpenAI를 통한 일기 분석
        const completion = await openai.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `너는 심리 상담가야. 사용자가 작성한 일기 내용을 읽고, 사용자의 감정을 한 단어(예: 기쁨, 슬픔, 분노, 불안, 평온)로 요약해줘. 그리고 그 감정에 공감해주고, 따뜻한 응원의 메시지를 2~3문장으로 작성해줘. 답변 형식은
[오늘의 감정: 단어]
[공감과 응원의 메시지]
와 같이 줄바꿈을 포함해서 보내줘.` 
                },
                { role: "user", content: text }
            ],
            model: "gpt-4o-mini",
        });

        const aiText = completion.choices[0].message.content;

        // 2. Redis에 데이터 저장
        // 고유 ID 생성 (diaryemo-YYYYMMDDHHMMSS)
        const now = new Date();
        const timestamp = now.getFullYear().toString() + 
                         (now.getMonth() + 1).toString().padStart(2, '0') + 
                         now.getDate().toString().padStart(2, '0') + 
                         now.getHours().toString().padStart(2, '0') + 
                         now.getMinutes().toString().padStart(2, '0') + 
                         now.getSeconds().toString().padStart(2, '0');
        
        const redisKey = `diaryemo-${timestamp}`;
        const diaryData = {
            originalText: text,
            aiResponse: aiText,
            createdAt: now.toISOString()
        };

        // Redis에 저장 (JSON 형식으로 저장)
        await redis.set(redisKey, JSON.stringify(diaryData));

        return response.status(200).json({
            success: true,
            result: aiText,
            savedKey: redisKey // 저장된 키 정보 반환 (확인용)
        });
    } catch (error) {
        console.error('API or Redis Error:', error);
        return response.status(500).json({
            success: false,
            error: '분석 또는 저장 중 오류가 발생했습니다.'
        });
    }
}
