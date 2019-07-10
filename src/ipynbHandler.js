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

var baseUrl = chrome.extension.getURL('content/ipynb-viewer.html');
function getViewerURL(url) {
    return baseUrl + '?file=' + encodeURIComponent(url);
}


chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        if (!isIpynbFile(details)) {
            return;
        }
        
        if (details.url.indexOf('ipynb-watch=false') !== -1) {
            return;
        }
        var viewerUrl = getViewerURL(details.url);
        return {
            redirectUrl: viewerUrl
        };
    }, 
    {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame"]
    }, 
    ["responseHeaders", "blocking"]
);

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.url.indexOf('ipynb-watch=false') !== -1) {
        return false;
    }
    
    var viewerUrl = getViewerURL(details.url);

    return { redirectUrl: viewerUrl, };
  },
  {
    urls: [
      'file://*/*.ipynb',
      'file://*/*.IPYNB',
      ...(
        // Duck-typing: MediaError.prototype.message was added in Chrome 59.
        MediaError.prototype.hasOwnProperty('message') ? [] :
        [
          // Note: Chrome 59 has disabled ftp resource loading by default:
          // https://www.chromestatus.com/feature/5709390967472128
          'ftp://*/*.ipynb',
          'ftp://*/*.IPYNB',
        ]
      ),
    ],
    types: ['main_frame', 'sub_frame'],
  },
  ['blocking']);