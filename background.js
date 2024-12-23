import crypto from './crypto.js';

async function fetchJson(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        const data = await response.json();
        return await decryptLoginData(data);
    } catch (error) {
        console.error('데이터 로드 중 오류:', error);
        throw error;
    }
}

// 암호화된 데이터 복호화
async function decryptLoginData(data) {
    try {
        const decryptedData = {
            ...data,
            data: await Promise.all(data.data.map(async (account) => {
                try {
                    // pwd가 배열 형태(암호화된 상태)인지 확인
                    if (Array.isArray(account.pwd) && Array.isArray(account.iv)) {
                        console.log('복호화 시도:', account.id);
                        const decryptedPwd = await crypto.decrypt(account.pwd, account.iv);
                        console.log('복호화 성공:', account.id);
                        return {
                            ...account,
                            pwd: decryptedPwd
                        };
                    }
                    return account;
                } catch (error) {
                    console.error(`계정 ${account.id} 복호화 중 오류:`, error);
                    return account;
                }
            }))
        };
        console.log('전체 데이터 복호화 완료');
        return decryptedData;
    } catch (error) {
        console.error('데이터 복호화 중 오류:', error);
        throw error;
    }
}

// data.json 파일 생성을 위한 데이터 암호화
async function encryptDataForFile(data) {
    const encryptedData = {
        ...data,
        data: await Promise.all(data.data.map(async (account) => {
            try {
                const { encrypted, iv } = await crypto.encrypt(account.pwd);
                return {
                    ...account,
                    pwd: encrypted,
                    iv: iv
                };
            } catch (error) {
                console.error('암호화 중 오류:', error);
                return account;
            }
        }))
    };
    return encryptedData;
}

// 데이터 읽기
export async function readData() {
    try {
        const response = await fetch(chrome.runtime.getURL('data.json'));
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('데이터 파일 읽기 오류:', error);
        throw error;
    }
}

// 계정 데이터 복호화 함수
async function decryptPassword(account) {
    if (account.pwd && account.iv) {
        try {
            const decryptedPwd = await crypto.decrypt(account.pwd, account.iv);
            return {
                ...account,
                pwd: decryptedPwd
            };
        } catch (error) {
            console.error(`계정 ${account.id} 비밀번호 복호화 실패:`, error);
            return account;
        }
    }
    return account;
}

// 로그인 함수
async function login() {
    try {
        const data = await readData();
        // 모든 계정의 비밀번호 복호화
        const decryptedAccounts = await Promise.all(data.data.map(decryptPassword));
        const loginData = decryptedAccounts;

        const loginMethods = [
            { try: loginData[1].try, method: loginToNaver, params: loginData },
            { try: loginData[2].try, method: loginToCool, params: loginData },
            { try: loginData[3].try, method: loginToInven, params: loginData },
            { try: loginData[4].try, method: loginToTcafe, params: loginData[4] },
            { try: loginData[5].try, method: dcinside, params: loginData },
            { try: loginData[0].try, method: googleLogin, params: loginData },
        ];

        for (const method of loginMethods) {
            if (method.try === 1) {
                await method.method(method.params);
            }
        }
    } catch (error) {
        console.error('로그인 중 오류:', error);
    }
}

async function loginToNaver(loginData) {
    const account = await decryptPassword(loginData[1]);
    const tab = await chrome.tabs.create({ url: account.url, active: false });

    await new Promise((resolve) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
            if (tab.url.indexOf('naver.com') != -1 && changeInfo.status == 'complete') {
                const tabUrl = tab.url;
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: (data, tabUrl, loginUrl) => {
                        if (tabUrl.indexOf(loginUrl) != -1) {
                            document.querySelector('#id').value = data.id;
                            document.querySelector('#pw').value = data.pwd; // 복호화된 비밀번호 사용
                            document.querySelector('#keep')?.click();
                        }
                    },
                    args: [account, tabUrl, account.loginUrl]
                });
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        });
    });
}

async function loginToCool(loginData) {
    const account = await decryptPassword(loginData[2]);
    const tab = await new Promise((resolve) => {
        chrome.tabs.create({ url: account.url, selected: false }, resolve);
    });

    await new Promise((resolve) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
            if (tab.url.indexOf('coolenjoy.net') != -1 && changeInfo.status == 'complete') {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: (data) => {
                        document.querySelector('#ol_id').value = data.id;
                        document.querySelector('#ol_pw').value = data.pwd;
                        document.getElementById('ol_submit').click();
                    },
                    args: [account]
                });
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        });
    });
}

async function loginToInven(loginData) {
    const account = await decryptPassword(loginData[3]);
    const tab = await new Promise((resolve) => {
        chrome.tabs.create({ url: account.url, selected: false }, resolve);
    });
    await new Promise((resolve) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
          if (tab.url.indexOf('inven.co.kr') != -1 && changeInfo.status == 'complete') {
            chrome.tabs.executeScript(tabId, {
              code: `
                document.querySelector('#user_id').value='${loginData[3]["id"]}';
                document.querySelector('#password').value='${loginData[3]["pwd"]}';
                document.getElementById('loginBtn').click();
                setTimeout(function () {
                    chrome.tabs.executeScript(tab.id, { code: "document.getElementById('btn-extend').click();" })
                    setTimeout(function () {
                        chrome.tabs.executeScript(tab.id, { code: "document.getElementById('btn-extend').click();" })
                        setTimeout(function () {
                            chrome.tabs.executeScript(tab.id, { code: "document.getElementById('btn-ok').click();" })
                            setTimeout(function () {
                                chrome.tabs.executeScript(tab.id, { code: "document.getElementById('btn-ok').click();" })
                            }, 3000);
                        }, 3000);
                    }, 3000);
                }, 2000);
              `
            });
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        });
    });
}

async function loginToTcafe(loginData) {
    const account = await decryptPassword(loginData[4]);
    const tab = await new Promise((resolve) => {
        chrome.tabs.create({ url: account.url, selected: false }, resolve);
    });

    await new Promise((resolve) => setTimeout(resolve, 15000));

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (data) => {
            document.querySelector('#ol_id').value = data.id;
            document.querySelector('#ol_pw').value = data.pwd;
            document.querySelector('button').click();
        },
        args: [account]
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    await chrome.tabs.executeScript(tab.id, {
        code: "window.location.href='http://tcafe2a.com/community/attendance';"
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    await chrome.tabs.executeScript(tab.id, {
        code: "document.querySelector('#cnftjr > div > form > table > tbody > tr > td > img').click();"
    });
}

async function googleLogin(loginData) {
    const account = await decryptPassword(loginData[0]);
    const tab = await chrome.tabs.create({ url: account.url, active: true });

    await new Promise((resolve) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
            if (changeInfo.status === 'complete') {
                const tabUrl = tab.url;
                
                if (tabUrl.includes('accounts.google.com')) {
                    setTimeout(() => {
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            func: (data) => {
                                const emailInput = document.querySelector('input[type="email"]');
                                if (emailInput) {
                                    emailInput.value = data.id;
                                    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                                    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                                    
                                    setTimeout(() => {
                                        const nextButton = document.querySelector('#identifierNext');
                                        if (nextButton) nextButton.click();
                                    }, 500);
                                }

                                const pwInput = document.querySelector('input[type="password"]');
                                if (pwInput) {
                                    pwInput.value = data.pwd; // 복호화된 비밀번호 사용
                                    pwInput.dispatchEvent(new Event('input', { bubbles: true }));
                                    pwInput.dispatchEvent(new Event('change', { bubbles: true }));
                                    
                                    setTimeout(() => {
                                        const passwordNext = document.querySelector('#passwordNext');
                                        if (passwordNext) passwordNext.click();
                                    }, 500);
                                }
                            },
                            args: [account] // 복호화된 계정 정보 전달
                        });
                    }, 1000);
                }

                // YouTube 설정 페이지
                if (tabUrl === loginData[0]["url"]) {
                    setTimeout(() => {
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            func: (xpathValue) => {
                                function getElementByXpath(path) {
                                    return document.evaluate(path, document, null, 
                                        XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                }

                                const checkbox = getElementByXpath(xpathValue);
                                if (checkbox && checkbox.className.includes('checked')) {
                                    checkbox.click();
                                }

                                const toggle = document.getElementById('toggle');
                                if (toggle && (toggle.checked || toggle.ariaPressed === 'true' || toggle.active)) {
                                    toggle.click();
                                }
                            },
                            args: [loginData[0]["xpathValue"]]
                        });
                        
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }, 1500);
                }
            }
        });
    });
}

async function dcinside(loginData) {
    const account = await decryptPassword(loginData[5]);
    const tab = await chrome.tabs.create({ url: account.url, selected: false });

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (tab.url.indexOf('dcinside.com') != -1 && changeInfo.status == 'complete') {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (data) => {
                    if (window.location.href.includes(data.loginUrl)) {
                        document.querySelector('#id').value = data.id;
                        document.querySelector('#pw').value = data.pwd;
                        document.querySelector('#container > div > article > section > div > div.login_inputbox > div > form > fieldset > button').click();
                    }
                },
                args: [account]
            });
        }
    });
}

// 확장 프로그램 아이콘 클릭 시 바로 실행
chrome.action.onClicked.addListener((tab) => {
    login();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "login") {
    login()
      .then(() => sendResponse({ message: "로그인 프로세스 시작됨" }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // 비동기 응답을 위해 true 반환
  }
});

// 데이터 암호화 및 저장
async function encryptAndSaveData(data) {
    const key = await crypto.generateKey();
    const encryptedData = [];
    
    // 키를 전하게 저장
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    const keyArray = Array.from(new Uint8Array(exportedKey));
    chrome.storage.local.set({ 'encryptionKey': keyArray });

    // 각 계정의 비밀번호 암호화
    for (const account of data) {
        const encrypted = await crypto.encrypt(account.pwd, key);
        encryptedData.push({
            ...account,
            pwd: encrypted.encrypted,
            iv: encrypted.iv
        });
    }

    // 암호화된 데이터 저장
    chrome.storage.local.set({ 'encryptedAccounts': encryptedData });
}

// 데이터 복호화 및 사용
async function getDecryptedData() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['encryptionKey', 'encryptedAccounts'], async function(result) {
            const key = await window.crypto.subtle.importKey(
                "raw",
                new Uint8Array(result.encryptionKey),
                "AES-GCM",
                true,
                ["encrypt", "decrypt"]
            );

            const decryptedData = [];
            for (const account of result.encryptedAccounts) {
                const decryptedPwd = await crypto.decrypt(account.pwd, key, account.iv);
                decryptedData.push({
                    ...account,
                    pwd: decryptedPwd
                });
            }
            resolve(decryptedData);
        });
    });
}

// 데이터 저장
async function writeData(data) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ accountData: data }, () => {
            resolve(true);
        });
    });
}

// 계정 데이터 암호화
async function encryptAccount(account) {
    if (!account.pwd) return account;
    const { encrypted, iv } = await crypto.encrypt(account.pwd);
    return {
        ...account,
        pwd: encrypted,
        iv: iv
    };
}

// 계정 데이터 복호화
async function decryptAccount(account) {
    if (account.pwd && account.iv) {
        try {
            const decryptedPwd = await crypto.decrypt(account.pwd, account.iv);
            return {
                ...account,
                pwd: decryptedPwd
            };
        } catch (error) {
            console.error(`계정 ${account.id} 복호화 중 오류:`, error);
            return account;
        }
    }
    return account;
}

// 전체 데이터 복호화
async function decryptData(data) {
    const decryptedAccounts = await Promise.all(
        data.data.map(decryptAccount)
    );
    return { ...data, data: decryptedAccounts };
}