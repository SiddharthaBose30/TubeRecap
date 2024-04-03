import React, { useState, useEffect } from 'react';

function App() {
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const popup = () => {
    if (!buttonDisabled) {
      setButtonDisabled(true);

      chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        if (tabs && tabs.length > 0 && tabs[0].id !== undefined) {
          const activeTabId = tabs[0].id;
          chrome.tabs.sendMessage(activeTabId, { "message": "get_transcript_data" });
        } else {
          console.log("No active tabs found or tab ID is undefined.");
        }
      });

      setTimeout(() => {
        setButtonDisabled(false);
      }, 5000); // Re-enable button after 5 seconds
    }
  };

  useEffect(() => {
    const button = document.getElementById("button1") as HTMLInputElement | null;
    if (button) {
      button.addEventListener("click", popup);
      chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message === "transcript_data") {
          var receivedData = request.data;
          console.log("Data received in popup.js:", receivedData);
        }
      });

      return () => {
        button.removeEventListener("click", popup);
      };
    }
  }, []);

  return (
    <div className="App">
      <input id="button1" type="button" value="clickme" disabled={buttonDisabled} />
      {buttonDisabled && <p>Button will be re-enabled in 5 seconds</p>}
    </div>
  );
}

export default App;
