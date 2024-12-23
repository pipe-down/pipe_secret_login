document.addEventListener('DOMContentLoaded', function() {
    const loginStatus = document.getElementById('loginStatus');
    const loginButton = document.getElementById('loginButton');
    const progressIndicator = document.getElementById('progressIndicator');

    if (!loginStatus || !loginButton || !progressIndicator) {
        console.error('필요한 요소를 찾을 수 없습니다.');
        return;
    }

    function updateLoginStatus(isLoggedIn) {
        loginStatus.textContent = isLoggedIn ? '로그인 상태: 로그인됨' : '로그인 상태: 로그인되지 않음';
        loginStatus.style.backgroundColor = isLoggedIn ? '#e8f5e9' : '#fff3e0';
    }

    function setLoading(isLoading) {
        loginButton.disabled = isLoading;
        progressIndicator.classList.toggle('hidden', !isLoading);
        loginButton.textContent = isLoading ? '처리 중...' : '로그인 시작';
    }

    chrome.storage.local.get(['isLoggedIn'], function(result) {
        updateLoginStatus(result.isLoggedIn);
    });

    loginButton.addEventListener('click', async function() {
        setLoading(true);
        
        try {
            const response = await chrome.runtime.sendMessage({action: "login"});
            if (response.error) {
                console.error('로그인 시작 중 에러 발생:', response.error);
                updateLoginStatus(false);
            } else {
                console.log('로그인 프로세스 응답:', response.message);
                updateLoginStatus(true);
            }
        } catch (error) {
            console.error('메시지 전송 중 에러:', error);
            updateLoginStatus(false);
        } finally {
            setLoading(false);
        }
    });

    document.getElementById('optionsButton').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});
