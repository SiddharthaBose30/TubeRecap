// chrome.tabs.onUpdated.addListener(
//   function(tabId, changeInfo, tab) {
//     // send the new url to contentscripts.js
//     if (changeInfo && changeInfo?.url && changeInfo?.url?.includes('youtube.com/watch?v=')) {
//       chrome.tabs.sendMessage( tabId, {
//         message: 'URL_Changed',
//       })
//       console.log("URL changed to:"+changeInfo.url)
//     }
//   }
// );
  