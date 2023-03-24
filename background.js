function fetchJson(url) {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    return response.json();
  });
}

async function login() {
    const url = chrome.runtime.getURL('/data.json');
    const jsonData = await fetchJson(url);
    const loginData = jsonData["data"];

    const loginMethods = [
        { try: loginData[1]["try"], method: loginToNaver, params: loginData },
        { try: loginData[2]["try"], method: loginToCool, params: loginData },
        { try: loginData[3]["try"], method: loginToInven, params: loginData },
        { try: loginData[4]["try"], method: loginToTcafe, params: loginData[4] },
        { try: loginData[5]["try"], method: dcinside, params: loginData[5] },
        { try: loginData[0]["try"], method: googleLogin, params: loginData },
    ];

    loginMethods.forEach(async (method) => {
        if (method.try === 1) {
          await method.method(method.params);
        }
    });
}

async function loginToNaver(loginData) {
  const tab = await new Promise((resolve) => {
    chrome.tabs.create({ url: loginData[1]["url"], selected: false }, resolve);
  });

  await new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
      if (tab.url.indexOf('naver.com') != -1 && changeInfo.status == 'complete') {
        const tabUrl = tab.url;
        chrome.tabs.executeScript(tabId, {
          code: `
            if ('${tabUrl}'.indexOf('${loginData[1]["loginUrl"]}') != -1) {
              document.querySelector('#id').value='${loginData[1]["id"]}';
              document.querySelector('#pw').value='${loginData[1]["pwd"]}';
              document.querySelector('#keep').click();
            }
          `
        });
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

async function loginToCool(loginData) {
  const tab = await new Promise((resolve) => {
    chrome.tabs.create({ url: loginData[2]["url"], selected: false }, resolve);
  });

  await new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
      if (tab.url.indexOf('coolenjoy.net') != -1 && changeInfo.status == 'complete') {
        chrome.tabs.executeScript(tabId, {
          code: `
            document.querySelector('#ol_id').value='${loginData[2]["id"]}';
            document.querySelector('#ol_pw').value='${loginData[2]["pwd"]}';
            document.getElementById('ol_submit').click();
          `
        });
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

async function loginToInven(loginData) {
    const tab = await new Promise((resolve) => {
        chrome.tabs.create({ url: loginData[3]["url"], selected: false }, resolve);
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
  const tab = await new Promise((resolve) => {
    chrome.tabs.create({ url: loginData.url, selected: false }, resolve);
  });

  await new Promise((resolve) => setTimeout(resolve, 5000));

  await chrome.tabs.executeScript(tab.id, {
    code: `
      document.querySelector('#ol_id').value = '${loginData.id}';
      document.querySelector('#ol_pw').value = '${loginData.pwd}';
      document.querySelector('button').click();
    `
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
    chrome.tabs.create({ url: loginData[0]["url"] }, await function (tab) {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (tab.url.indexOf('youtube.com') != -1 && changeInfo.status == 'complete') {
                const tabUrl = tab.url;
                chrome.tabs.executeScript(tabId, { code: 
                    // "console.log('google_login') \n"+
                    // "console.log('"+tabUrl+"') \n"+
                    "if ('"+tabUrl+"'.indexOf('"+loginData[0]["loginUrl"]+"') != -1 && document.querySelector('#identifierId')!=null) { \n"+
                    "   document.querySelector('#identifierId').value='"+loginData[0]["id"]+"'; \n"+
                    "   if (document.querySelector('#identifierId').value=='"+loginData[0]["id"]+"') { \n"+
                    "       document.querySelector('#identifierNext').click(); \n"+
                    "   } \n"+
                    "} \n"
                })
                chrome.tabs.executeScript(tabId, { code: 
                    "if ('"+tabUrl+"'.indexOf('"+loginData[0]["loginUrl"]+"') != -1 && document.querySelector('input[type=\"password\"]')!=null) { \n"+
                    "   document.querySelector('input[type=\"password\"]').value='"+loginData[0]["pwd"]+"'; \n"+
                    "   if (document.querySelector('input[type=\"password\"]').value=='"+loginData[0]["pwd"]+"') { \n"+
                    "       document.querySelector('#passwordNext').click(); \n"+
                    "   } \n"+
                    "} \n"
                })

                chrome.tabs.executeScript(tabId, { code: 
                    "if ('"+tabUrl+"'=='"+loginData[0]["url"]+"') { \n"+
                    "   if ((getElementByXpath('"+loginData[0]["xpathValue"]+"')!=null && getElementByXpath('"+loginData[0]["xpathValue"]+"').className.indexOf('checked') > -1)) { \n"+
                    "       getElementByXpath('"+loginData[0]["xpathValue"]+"').click(); \n"+
                    "   } \n"+
                    "   if (document.getElementById('toggle') != null && document.getElementById('toggle').checked || document.getElementById('toggle').ariaPressed=='true' || document.getElementById('toggle').active) { \n"+
                    "       document.getElementById('toggle').click(); \n"+
                    "   } \n"+
                    "} \n"
                })
            }
        });
    })
}

async function dcinside(loginData) {
  chrome.tabs.create({ url: loginData[5]["url"], selected: false }, await function (tab) {
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (tab.url.indexOf('dcinside.com') != -1 && changeInfo.status == 'complete') {
            const tabUrl = tab.url;
            chrome.tabs.executeScript(tabId, { code: 
                // "console.log('naver_login'); \n"+
                "if ('"+tabUrl+"'.indexOf('"+loginData[5]["loginUrl"]+"') != -1) { \n"+
                "   document.querySelector('#id').value='"+loginData[5]["id"]+"'; \n"+ 
                "   document.querySelector('#pw').value='"+loginData[5]["pwd"]+"'; \n" +
                "   document.querySelector('#container > div > article > section > div > div.login_inputbox > div > form > fieldset > button').click(); \n" +
                //"document.querySelector('#wait').click(); \n"
                "} \n"
            })
            // chrome.tabs.executeScript(tabId, { code: "document.getElementById('log\.login').click();" })
        }
    });
 })
}

chrome.browserAction.onClicked.addListener(function (tab) {
    login();
});