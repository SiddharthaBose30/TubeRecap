const fetch = require('node-fetch');

const apiKey = '<API_KEY>';
const apiUrl = 'https://api.openai.com/v1/chat/completions';

async function summarizeChunk(chunk, initialRequest, previousSummaries, isInitial) {
  console.log('Received parameters:', { chunk, initialRequest, previousSummaries, isInitial });

  const messages = isInitial
    ? [
        { role: "system", content: "You are a helpful assistant designed to summarize YouTube videos." },
        { role: "user", content: initialRequest },
        { role: "user", content: `${chunk}` }
      ]
    : [
        { role: "user", content: "Here is the previous summary context: " + previousSummaries.join('\n') + "\n" + "Now in my next message or request, I will give you the next part of the video to summarize. Also, start the response like a sentence, like a whole new point but still maintaining the previous context. Also, don't include chapter numbers." },
        { role: "user", content: "Summarize the following: " + chunk }
      ];

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ messages, model: "gpt-3.5-turbo-1106" })
  };

  const response = await fetch(apiUrl, requestOptions);
  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() ?? '';
}

module.exports = async function (context, req) {
  context.log('HTTP trigger function received a request.');

  try {
    const { transcriptChunks, initialRequest } = req.body;

    context.log('Received request body:', req.body);

    if (!Array.isArray(transcriptChunks)) {
      context.res = {
        status: 400,
        body: { error: 'Invalid request body. Transcript chunks must be an array.' }
      };
      return;
    }

    let summaryPoints = [];
    let isInitial = true;

    for (let i = 0; i < transcriptChunks.length; i++) {
      const chunk = transcriptChunks[i];

      if (typeof chunk !== 'string') {
        context.log('Invalid chunk detected:', chunk);
        continue;
      }

      // Introduce a 3.54-second delay before each request
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 3540));
      }

      const summary = await summarizeChunk(chunk, initialRequest, summaryPoints, isInitial);
      summaryPoints.push(summary);
      isInitial = false;
    }

    context.res = {
      status: 200,
      body: { summaryPoints }
    };
  } catch (error) {
    context.log.error('An error occurred:', error);
    context.res = {
      status: 500,
      body: { error: 'An error occurred while summarizing the transcript.' }
    };
  }
};
