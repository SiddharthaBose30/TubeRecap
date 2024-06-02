import React, { useState, useEffect } from 'react';
import './App.css';
import OpenAI from 'openai';

function App() {
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);
  const [summary, setSummary] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false); // Track if summary generation is in progress

  const chunkSize = 1000;
  const overlapSize = 100;

  const openai = new OpenAI({
    apiKey: '<Your_API_Key>',
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

  const summarizeChunk = async (chunk: string, initialRequest: string, previousSummaries: string[], isInitial: boolean) => {
    const messages = isInitial
      ? [
          { role: "system", content: "You are a helpful assistant designed to summarize YouTube videos." },
          { role: "user", content: initialRequest },
          { role: "user", content: `${chunk}` }
        ]
      : [
          { role: "user", content: "Here is the previous summary context: " + previousSummaries.join('\n') +"\n"+"Now in my next message or request, I will give you the next part of the video to summarize. Also, start the response like a sentence, like a whole new point but still maintaining the previous context. Also, don't include chapter numbers."},
          { role: "user", content: "Summarize the following: " + chunk }
        ];

    const completion = await openai.chat.completions.create({
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      model: "gpt-3.5-turbo-0125",
    });
    return completion?.choices[0]?.message?.content?.trim() ?? '';
  };

  const summarizeTranscript = async (transcriptChunks: string[], initialRequest: string) => {
    setIsGeneratingSummary(true);
    let summaryPoints: string[] = [];
    let isInitial = true;
    for (let chunk of transcriptChunks) {
      const summary = await summarizeChunk(chunk, initialRequest, summaryPoints, isInitial);
      summaryPoints.push(summary);
      isInitial = false;
    }
    setIsGeneratingSummary(false);
    return summaryPoints;
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
      summarizeTranscript(chunks, initialRequest)
        .then(summaryPoints => { console.log(summaryPoints); setSummaryPoints(summaryPoints); })
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
