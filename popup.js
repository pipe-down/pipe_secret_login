function login() {
    // chrome.tabs.executeScript(null, { code: "document.querySelector('.a.on0').click();" })
    
    // chrome.tabs.executeScript(null, { file: 'jquery-1.11.3.min.js' }, function (result) {
    //     var e = jQuery.Event( 'keydown', { keyCode: 13 } );
    //     chrome.tabs.executeScript(null, { code: "$(this).trigger( e );" })
    // });
}

document.addEventListener('DOMContentLoaded', function () {
    var btn01 = document.querySelector('#btn');
    btn01.addEventListener("click", login);
});