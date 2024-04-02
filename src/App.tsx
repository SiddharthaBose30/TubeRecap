import React, { useEffect } from 'react';

function App() {
  const popup = () => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      if (tabs && tabs.length > 0 && tabs[0].id !== undefined) { // Check if tabs[0] and its id are defined
        const activeTabId = tabs[0].id;
        chrome.tabs.sendMessage(activeTabId, { "message": "start" });
      } else {
        console.log("No active tabs found or tab ID is undefined.");
      }
    });
  };

  useEffect(() => {
    const button = document.getElementById("button1") as HTMLInputElement | null;
    if (button) {
      button.addEventListener("click", popup);
      chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message === "data_from_content") {
          var receivedData = request.data;
          console.log("Data received in popup.js:", receivedData); // Log received data
        }
      });
      // Remove event listener when component unmounts
      return () => {
        button.removeEventListener("click", popup);
      };
    }
  }, []);

  return (
    <div className="App">
      <input id="button1" type="button" value="clickme" />
    </div>
  );
}

export default App;
