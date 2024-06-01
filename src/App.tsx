import React, { useState, useEffect } from 'react';
import './App.css';
import OpenAI from 'openai'; // Import the OpenAI library

function App() {
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [summaryText, setSummaryText] = useState('');
  const [summary, setSummary] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false); // Track if summary generation is in progress

  const chunkSize = 1000;
  const overlapSize = 100;

  const openai = new OpenAI({
    apiKey: '<Your_API_KEY>', 
    dangerouslyAllowBrowser: true
  });

  const splitTranscriptIntoChunks = (text: string) => {
    const words = text.split(' ');
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize - overlapSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    return chunks;
  };

  const summarizeChunk = async (chunk: string, initialRequest: string, isInitial: boolean) => {
    const messages = isInitial
      ? [
          { role: "system", content: "You are a helpful assistant designed to summarize YouTube videos." },
          { role: "user", content: initialRequest },
          { role: "user", content: `${chunk}` }
        ]
      : [
          { role: "user", content: `${chunk}` }
        ];

    const completion = await openai.chat.completions.create({
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      model: "gpt-3.5-turbo-0125",
    });
    return completion?.choices[0]?.message?.content?.trim() ?? '';
  };

  const summarizeTranscript = async (transcriptChunks: string[], initialRequest: string) => {
    setIsGeneratingSummary(true); // Set generating summary to true
    let fullSummary = '';
    let isInitial = true;
    for (let chunk of transcriptChunks) {
      const summary = await summarizeChunk(chunk, initialRequest, isInitial);
      fullSummary += summary + ' ';
      isInitial = false; // Only the first request should include the initial context
    }
    setIsGeneratingSummary(false); // Set generating summary to false
    return fullSummary.trim();
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
      const initialRequest = "I will be providing YouTube transcript data of a video. You need to summarize it for me. I will send the data in chunks, and I want an overall summary.";
      summarizeTranscript(chunks, initialRequest)
        .then(summary => { console.log(summary); setSummaryText(summary); })
        .catch(error => console.error('Error summarizing transcript:', error));
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
      <div style={{ display: 'flex', marginTop: '-20px' }}>
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
      {!buttonVisible && summary && !isGeneratingSummary &&(
        <div className="summary">
          <div className="summary-box">
            <h2>Summary:</h2>
            <p>{summaryText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
