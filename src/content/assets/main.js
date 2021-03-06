function loadScript(scriptName, onload) {
    var script = document.createElement('script');
    script.onload = onload;
    script.src = scriptName;
    document.body.appendChild(script);
}

function getDocument( url, callback ) {
    var xhr = new XMLHttpRequest();
    
	xhr.onreadystatechange = function() { // (3)
        if (xhr.readyState != 4) return;
        if (xhr.status == 0 || xhr.status == 200 || xhr.status == 304 ) {
            callback(null, xhr.responseText);
        } else {
            callback(xhr.status);
        }

    }
    
	xhr.open( 'GET', url );
	xhr.send();
};

function enableDownloadButton() {
    var nbRootElem = document.querySelector('.nb-worksheet');
    
    var downloadElem = document.createElement('div');
    downloadElem.classList.add('download');
    downloadElem.setAttribute('title', 'Download document');
    downloadElem.addEventListener('click', function () {
        var fileUrl = getRequestParam('file');
        chrome.downloads.download({
            url: fileUrl,
        });
    });
    
    nbRootElem.insertBefore( downloadElem, nbRootElem.firstChild );
}

function prepareFilename(filename) {
    if ( !/\.ipynb\.js$/i.test(filename) ) {
        if ( /\.ipynb$/i.test(filename) ) {
            filename += '.js';
        }
        else {
            filename += '.ipynb.js';
        }
    }
    if ( !/^(\.\/)*files\//i.test(filename) ) {
        filename = 'files/' + filename;
    }
    return filename;
}

function showIpynb(ipynbObject) {
    var notebook = nb.parse(ipynbObject);
    var rendered = notebook.render();
    
    document.getElementById('main').appendChild(rendered);
    Prism.highlightAll();
}

function enableStdoutToggles() {
    function toggleElement(event) {
        this.classList.toggle('opened');
    }
    
    document.querySelectorAll('.nb-stdout').forEach(function (outputElem) {
        outputElem.addEventListener('click', toggleElement);
    });
}

function getRequestParam(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

function appendSearchToUrl(url, search) {
    let a = document.createElement('a');
    a.href = url;
    if (a.search.length < 2) {
        a.search = search;
    }
    else {
        a.search += '&' + search;
    }
    return a.href;
}

function main() {
    var filename = getRequestParam('file');
    if (filename) {
        getDocument(filename, function (err, text) {
            if (err) {
                alert("Download file error: " + err);
                return;
            }
            
            var ipynbObject;
            try {
                ipynbObject = JSON.parse(text);
            }
            catch (e) {
                alert('The current file is not parsable');
                window.location = appendSearchToUrl(filename, 'ipynb-watch=false');
                return;
            }
            showIpynb(ipynbObject);
            enableDownloadButton();
            setTimeout(enableStdoutToggles);
        });
    }
    else {
        alert('Param "file" is not defined');
    }
}

main();