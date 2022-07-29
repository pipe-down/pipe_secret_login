function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getChecked(checkedValue) {
    var result = false;
    console.log('getChecked = ' + document.getElementById(checkedValue).checked);
    if (document.getElementById(checkedValue).checked) {
        result = true;
    }
  return result;
}

function getElementByXpath(path) {
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}