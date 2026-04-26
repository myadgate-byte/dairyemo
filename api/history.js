import { Redis } from "@upstash/redis";

const redis = new Redis({
    url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(request, response) {
    // GET 요청만 허용
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 1. 'diaryemo-*' 패턴의 모든 키 가져오기
        const keys = await redis.keys('diaryemo-*');

        if (keys.length === 0) {
            return response.status(200).json({ success: true, history: [] });
        }

        // 2. 모든 키에 해당하는 값 가져오기
        // mget은 여러 키의 값을 한 번에 가져옵니다.
        const values = await redis.mget(...keys);

        // 3. 데이터 가공 및 정렬
        const history = keys.map((key, index) => {
            const data = typeof values[index] === 'string' ? JSON.parse(values[index]) : values[index];
            return {
                id: key,
                ...data
            };
        });

        // 최신순 정렬 (ID 또는 createdAt 기준)
        history.sort((a, b) => b.id.localeCompare(a.id));

        return response.status(200).json({
            success: true,
            history: history
        });
    } catch (error) {
        console.error('History API Error:', error);
        return response.status(500).json({
            success: false,
            error: '히스토리를 가져오는 중 오류가 발생했습니다.'
        });
    }
}
