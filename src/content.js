// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === "start") {
      console.log("Message received in content.js:", request);
      // Process the message or perform actions
  
      // Send a message to the popup script
      chrome.runtime.sendMessage({ message: "data_from_content", data: "Data from content.js" }, function(response) {
        console.log("Message sent from content.js to popup.js");
      });
    }
  });
  