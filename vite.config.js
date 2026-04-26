import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

// 로컬 환경에서 /api/analyze 요청을 처리하기 위한 간단한 미들웨어
export default defineConfig({
  server: {
    proxy: {
      // 이 설정은 실제 배포 시에는 영향을 주지 않으며 로컬 개발 시에만 작동합니다.
    },
    before(app) {
      // 여기에 커스텀 미들웨어를 추가하여 api/analyze.js를 실행할 수 있게 할 수 있지만,
      // 가장 간단한 방법은 vercel dev를 사용하는 것입니다.
      // 하지만 vercel dev 사용이 어려운 경우를 위해 안내를 제공합니다.
    }
  }
});
