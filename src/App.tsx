import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);
  const [summary, setSummary] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const chunkSize = 1000;
  const overlapSize = 100;

  const splitTranscriptIntoChunks = (text: string) => {
    const words = text.split(' ');
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize - overlapSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    return chunks;
  };

  const summarizeTranscript = async (transcriptChunks: string[], initialRequest: string) => {
    setIsGeneratingSummary(true);
    try {
      const response = await fetch('https://tuberecapopenaiapis.azurewebsites.net/api/HttpTrigger1?code=4HPNm4sXWrZyDghWMT56WICdvilYYeNklONTt2GmEuzhAzFuP5lM1g%3D%3D', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcriptChunks, initialRequest })
      });
      const data = await response.json();
      setSummaryPoints(data.summaryPoints);
    } catch (error) {
      console.error('Error summarizing transcript:', error);
    }
    setIsGeneratingSummary(false);
  };

  const popup = () => {
    setButtonVisible(false);
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      if (tabs && tabs.length > 0 && tabs[0].id !== undefined) {
        const activeTabId = tabs[0].id;
        chrome.tabs.sendMessage(activeTabId, { "message": "get_transcript_data" });
      } else {
        console.log("No active tabs found or tab ID is undefined.");
      }
    });

    setTimeout(() => {
      setSummary(true);
    }, 5000);
  };

  useEffect(() => {
    if (transcriptData.length > 0) {
      const transcriptText = transcriptData.map(item => item.text).join(' ');
      const chunks = splitTranscriptIntoChunks(transcriptText);
      const initialRequest = "I will be providing YouTube transcript data of a video. You need to summarize it for me. I will send the data in chunks, and I want an overall summary. Now remember, every summary response you give me, make sure to make a proper point of its own. Don't just follow up from previous chunks. Make it a new point with proper beginning and end.";
      summarizeTranscript(chunks, initialRequest);
    }
  }, [transcriptData]);

  useEffect(() => {
    const button = document.getElementById("button1") as HTMLInputElement | null;
    button?.addEventListener("click", popup);
    if (!buttonVisible) {
      chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
      <div className="header">
        <img src={'./youtube-logo.svg'} alt="YouTube Logo" className="youtube-logo" style={{ width: '49px', height: '63.5px' }} />
        <p style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '20px', fontFamily: 'Arial, sans-serif', color: 'black', marginLeft: '1px', marginRight: '4px' }}>TubeRecap</p>
      </div>
      {buttonVisible && (
        <button id="button1" style={{ marginLeft: '20px', marginTop: '0px' }}>Summarize</button>
      )}
      {!buttonVisible && isGeneratingSummary && (
        <div className="loading-message">
          <p className="message">Summarizing</p>
          <div className="loader"></div>
        </div>
      )}
      {!buttonVisible && summary && !isGeneratingSummary && (
        <div className="summary">
          <div className="summary-box">
            <h2>Summary</h2>
            {summaryPoints.map((point, index) => (
              <div key={index} className="summary-point">
                <div className="chapter-number">Part {index + 1}</div>
                <p>{point}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
