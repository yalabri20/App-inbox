// CleverTap Web SDK Initialization
var clevertap = {event:[], profile:[], account:[], onUserLogin:[], notifications:[]};
clevertap.account.push({"id": "8R7-Z6K-4W7Z"}); // Using your Project ID from Dashboard

var sdkReady = false;

console.log("Starting CleverTap SDK load...");

(function () {
  var wzrk = document.createElement('script');
  wzrk.type = 'text/javascript';
  wzrk.async = true;
  wzrk.src = 'https://static.clevertap.com/js/clevertap.min.js'; // Using static domain since cdn seems inaccessible

  wzrk.onload = function() {
    console.log("CleverTap SDK loaded successfully");
    sdkReady = true;
    
    // Enable the button
    if (typeof enableButton === 'function') {
      enableButton();
    }
  };

  wzrk.onerror = function() {
    console.error("Failed to load CleverTap SDK");
    document.getElementById('userData').innerHTML = '<p>Error: Failed to load CleverTap SDK</p>';
  };

  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(wzrk, s);
})();
