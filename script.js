document.addEventListener('DOMContentLoaded', () => {
    const diaryInput = document.getElementById('diary-input');
    const voiceBtn = document.getElementById('voice-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const responseBox = document.getElementById('ai-response-box');

    // 음성 인식 설정 (Web Speech API)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            diaryInput.value += (diaryInput.value ? ' ' : '') + transcript;
        };

        recognition.onend = () => {
            voiceBtn.innerHTML = '<span class="icon">🎤</span> 음성으로 입력하기';
            voiceBtn.classList.remove('recording');
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech') {
                alert('음성 인식 중 오류가 발생했습니다: ' + event.error);
            }
            voiceBtn.innerHTML = '<span class="icon">🎤</span> 음성으로 입력하기';
            voiceBtn.classList.remove('recording');
        };
    }

    // 음성 입력 버튼 클릭 이벤트
    voiceBtn.addEventListener('click', () => {
        if (!recognition) {
            alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
            return;
        }

        if (voiceBtn.classList.contains('recording')) {
            recognition.stop();
        } else {
            try {
                recognition.start();
                voiceBtn.innerHTML = '<span class="icon">⏳</span> 음성인식 중...';
                voiceBtn.classList.add('recording');
            } catch (e) {
                console.error('Start error:', e);
            }
        }
    });

    // 분석 요청 버튼 클릭 이벤트
    analyzeBtn.addEventListener('click', async () => {
        const text = diaryInput.value.trim();

        if (!text) {
            alert('일기 내용을 입력해주세요.');
            return;
        }

        // 로딩 상태 표시
        analyzeBtn.disabled = true;
        analyzeBtn.innerText = 'AI가 분석 중...';
        responseBox.innerText = '당신의 감정을 이해하고 분석하고 있습니다. 잠시만 기다려주세요...';
        responseBox.classList.remove('active');

        try {
            // 백엔드 서버리스 함수(api/analyze.js) 호출
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            const data = await response.json();

            if (data.success) {
                responseBox.innerText = data.result;
                responseBox.classList.add('active');
            } else {
                throw new Error(data.error || '분석 실패');
            }
        } catch (error) {
            console.error('API Error:', error);
            responseBox.innerText = '죄송합니다. 분석 중에 오류가 발생했습니다. 나중에 다시 시도해주세요.';
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.innerText = '분석 요청하기';
        }
    });
});
