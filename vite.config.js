import { defineConfig } from 'vite';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  server: {
    port: 5173,
    proxy: {},
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/analyze' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            try {
              const { text } = JSON.parse(body);
              
              const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
              });

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

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, result: aiText }));
            } catch (error) {
              console.error('Local API Error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
            }
          });
        } else {
          next();
        }
      });
    }
  }
});
