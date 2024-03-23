document.addEventListener('DOMContentLoaded', () => {
  const readButton = document.getElementById('readButton');
  readButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) {
        console.error('Unable to find active tab.');
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          console.log(document.body.innerText);
        }
      });
    });
  });
});
