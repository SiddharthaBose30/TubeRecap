import { YoutubeTranscript } from 'youtube-transcript';

// Function to fetch and process transcript
function fetchAndProcessTranscript(videoId: string, retries: number = 3) {
    const fetchTranscript = () => {
        return new Promise((resolve, reject) => {
            YoutubeTranscript.fetchTranscript(videoId)
                .then((response) => {
                    if (response) {
                        resolve(response);
                    } else {
                        console.log('Transcript not found, retrying...');
                        if (retries > 0) {
                            setTimeout(() => resolve(fetchTranscript()), 1000); // Retry after 1 second
                        } else {
                            reject('Max retries reached. Transcript not found.');
                        }
                    }
                })
                .catch((error) => {
                    reject('Error fetching transcript:' + error);
                });
        });
    };

    return fetchTranscript();
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === "get_transcript_data") {
        //fetch Transcript Data from URL 
        fetchAndProcessTranscript(window?.location?.href)
            .then((transcript) => {
                // Send a message to the popup script
                chrome.runtime.sendMessage({ message: "transcript_data", data: transcript }, function(response) {
                    console.log("Transcript Data sent to Popup.HTML");
                });
            })
            .catch((error) => {
                console.error(error);
            });
    }
});
