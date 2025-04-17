var avaliableContentTypes = [
    'text/plain',
    'application/octet-stream',
    'application/json'
];

function isIpynbFile(details) {
    var pos = details.url.indexOf('.ipynb');

    if (pos === -1) {
        return false;
    }

    if ( !(pos + 6 === details.url.length || details.url[pos + 6] == '?') ) {
        return false;
    }

    var contentType = details.responseHeaders ? details.responseHeaders.filter(obj => obj.name.toLowerCase() === 'content-type') : '';
    contentType = contentType ? contentType[0].value : 'text/html';
    contentType = contentType.toLowerCase().split(';')[0].trim();
    if ( avaliableContentTypes.indexOf(contentType) === -1 ) {
        return false;
    }

    return true;
}


const extensionViewerBaseUrl = chrome.runtime.getURL('content/ipynb-viewer.html');


function getViewerURL(url) {
    return `${extensionViewerBaseUrl}?file=${encodeURIComponent(url)}`;
}


chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        if (!isIpynbFile(details)) {
            return;
        }

        if (details.url.includes('ipynb-watch=false')) {
            return;
        }

        if (details.tabId >= 0) {
            chrome.tabs.update(details.tabId, { url: getViewerURL(details.url) });
        }
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame"]
    },
    ["responseHeaders", "extraHeaders"]
);


chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.url.includes('ipynb-watch=false')) {
        return;
    }

    if (details.tabId >= 0) {
        chrome.tabs.update(details.tabId, { url: getViewerURL(details.url) });
    }
  },
  {
    urls: [
      'file://*/*.ipynb',
      'file://*/*.IPYNB',
    ],
    types: ['main_frame', 'sub_frame'],
  },
  [],
);
