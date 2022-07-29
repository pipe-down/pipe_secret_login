async function login() {
    const url = chrome.runtime.getURL('/data.json');
    const r = await fetch(url);
    const jsonData = await r.json();

    /* 구글로그인 */
    if (jsonData["data"][0]["try"] == 1) {
        chrome.tabs.update({ url: 'https://www.youtube.com/account_playback' }, await function (tab) {
            chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
                if (changeInfo.status == 'complete') {
                    chrome.tabs.executeScript(tabId, { code: 
                        "console.log('google_login') \n"+
                        "if (document.querySelector('#identifierId')!=null) { \n"+
                        "   document.querySelector('#identifierId').value='"+jsonData["data"][0]["id"]+"'; \n"+
                        "   if (document.querySelector('#identifierId').value=='"+jsonData["data"][0]["id"]+"') { \n"+
                        "       document.querySelector('#identifierNext').click(); \n"+
                        "   } \n"+
                        "} \n"
                    })
                    chrome.tabs.executeScript(tabId, { code: 
                        "if (document.querySelector('input[type=\"password\"]')!=null) { \n"+
                        "   document.querySelector('input[type=\"password\"]').value='"+jsonData["data"][0]["pwd"]+"'; \n"+
                        "   if (document.querySelector('input[type=\"password\"]').value=='"+jsonData["data"][0]["pwd"]+"') { \n"+
                        "       document.querySelector('#passwordNext').click(); \n"+
                        "   } \n"+
                        "} \n"
                    })

                    chrome.tabs.executeScript(tabId, { code: 
                        "if ((getElementByXpath('"+jsonData["data"][0]["xpathValue"]+"')!=null && getElementByXpath('"+jsonData["data"][0]["xpathValue"]+"').className.indexOf('checked') > -1)) { \n"+
                            "getElementByXpath('"+jsonData["data"][0]["xpathValue"]+"').click(); \n"+
                        "} \n"+
                        "if (document.getElementById('toggle') != null && document.getElementById('toggle').checked || document.getElementById('toggle').ariaPressed=='true' || document.getElementById('toggle').active) { \n"+
                        "   document.getElementById('toggle').click(); \n"+
                        "} \n"
                    })
                }
            });
        })
    }

    /* 네이버 */
    if (jsonData["data"][1]["try"] == 1) {
        chrome.tabs.create({ url: 'https://nid.naver.com/nidlogin.login?mode=form&url=https%3A%2F%2Fwww.naver.com', selected: false }, await function (tab) {
            chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
                if (changeInfo.status == 'complete') {
                    chrome.tabs.executeScript(tabId, { code: 
                        "console.log('naver_login') \n"+
                        "document.querySelector('#id').value='"+jsonData["data"][1]["id"]+"'; \n"+ 
                        "document.querySelector('#pw').value='"+jsonData["data"][1]["pwd"]+"'; \n" +
                        "document.querySelector('#keep').click(); \n"
                    })
                    // chrome.tabs.executeScript(tabId, { code: "document.getElementById('log\.login').click();" })
                }
            });
        })
    }

    /* 쿨엔조이 */
    if (jsonData["data"][2]["try"] == 1) {
        chrome.tabs.create({ url: 'https://coolenjoy.net/bbs/jirum', selected: false }, await function (tab) {
            chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
                if (changeInfo.status == 'complete') {
                    chrome.tabs.executeScript(tabId, { code: 
                        "console.log('cooln_login') \n"+
                        "document.querySelector('#ol_id').value='"+jsonData["data"][2]["id"]+"'; \n" + 
                        "document.querySelector('#ol_pw').value='"+jsonData["data"][2]["pwd"]+"'; \n" +
                        "document.getElementById('ol_submit').click(); \n"
                    })
                }
            });
        })
    }

    if (jsonData["data"][3]["try"] == 1) {
        /* 인벤 */
        chrome.tabs.create({ url: 'https://member.inven.co.kr/user/scorpio/mlogin', selected: false }, function (tab) {
            setTimeout(function () {
                chrome.tabs.executeScript(tab.id, { code: 
                    "console.log('inven_login') \n"+
                    "document.querySelector('#user_id').value='"+jsonData["data"][3]["id"]+"'; \n" + 
                    "document.querySelector('#password').value='"+jsonData["data"][3]["pwd"]+"'; \n" +
                    "document.getElementById('loginBtn').click(); \n"
                })
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
            }, 3000);
        })
    }

    if (jsonData["data"][4]["try"] == 1) {
        /* 티카페 */
        chrome.tabs.create({ url: 'http://tcafe2a.com/', selected: false }, function (tab) {
            setTimeout(function () {
                chrome.tabs.executeScript(tab.id, { code: 
                    "console.log('tcafe_login') \n"+
                    "document.querySelector('#ol_id').value='"+jsonData["data"][4]["id"]+"'; \n" + 
                    "document.querySelector('#ol_pw').value='"+jsonData["data"][4]["pwd"]+"'; \n" +
                    "document.querySelector('button').click(); \n"
                })
                setTimeout(function () {
                    chrome.tabs.executeScript(tab.id, { code: "window.location.href=\"http://tcafe2a.com/community/attendance\";" })
                    setTimeout(function () {
                        chrome.tabs.executeScript(tab.id, { code: "document.querySelector(\"#cnftjr > div > form > table > tbody > tr > td > img\").click();" })
                    }, 5000);
                }, 5000);
            }, 5000);
        })
    }
}

chrome.browserAction.onClicked.addListener(function (tab) {
    login();
});