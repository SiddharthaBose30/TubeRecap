chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === "data_from_content") {
      console.log("Message received in background script:", request); // Log received message
      // Forward the message to popup.js
      chrome.runtime.sendMessage({ message: "data_from_content", data: request.data }, function(response) {
        console.log("Message forwarded to popup script");
      });
    }
  });
  