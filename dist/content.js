chrome.runtime.onMessage.addListener((function(e,s,n){"start"===e.message&&(console.log("Message received in content.js:",e),chrome.runtime.sendMessage({message:"data_from_content",data:"Data from content.js"},(function(e){console.log("Message sent from content.js to popup.js")})))}));