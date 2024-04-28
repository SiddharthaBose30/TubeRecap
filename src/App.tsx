import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [summary, setSummary] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(true); // New state for button visibility
  
  const popup = () => {
      setButtonVisible(false); // Hide the button
      chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        if (tabs && tabs.length > 0 && tabs[0].id !== undefined) {
          const activeTabId = tabs[0].id;
          chrome.tabs.sendMessage(activeTabId, { "message": "get_transcript_data" });
        } else {
          console.log("No active tabs found or tab ID is undefined.");
        }
      });
      setTimeout(() => {
        setSummary(true);   // Show the button after 5 seconds
      }, 5000);
  };

  useEffect(() => {
    const button = document.getElementById("button1") as HTMLInputElement | null;
    button?.addEventListener("click", popup);
    if (!buttonVisible) {
      chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message === "transcript_data") {
          setTranscriptData(request.data);
          console.log(request.data);
        }
      });

      return () => {
        button?.removeEventListener("click", popup);
      };
    }
  }, [buttonVisible]);

  return (
    <div className="container">
      <div style={{ display: 'flex', marginTop:'-20px'}}>
        <img src={'./youtube-logo.svg'} alt="YouTube Logo" className="youtube-logo" style={{ width: '49px', height: '63.5px'}} />
        <p style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '20px', fontFamily: 'Arial, sans-serif', color: 'black', marginLeft:'1px', marginRight:'4px' }}>TubeRecap</p>
      </div>
      {buttonVisible && ( // Conditionally render the button based on visibility state
        <button id="button1" style={{ marginLeft: '20px', marginTop: '0px'}}>Summarize</button>
      )}
      {!buttonVisible && !summary &&(
        <div className="loading-message">
          <p className="message">Summarizing</p>
          <div className="loader"></div>
        </div>
      )}
      <div className="summary">
  {!buttonVisible && summary && (
    <div className="summary-box">
      <h2>Summary:</h2>
      <p>{transcriptData[1]?.text}</p>
    </div>
  )}
</div>
    </div>
  );
}

export default App;
