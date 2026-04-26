import OpenAI from "openai";

// 서버 측에서만 접근 가능한 환경 변수 사용
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(request, response) {
    // POST 요청만 허용
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text } = request.body;

    if (!text) {
        return response.status(400).json({ error: '일기 내용이 없습니다.' });
    }

    try {
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

        return response.status(200).json({
            success: true,
            result: aiText
        });
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return response.status(500).json({
            success: false,
            error: 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        });
    }
}
