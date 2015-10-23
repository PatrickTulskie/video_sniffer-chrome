var videoFinder = function() {
  var videoTypes = {
    'video/webm': { ext: 'webm' },
    'video/mp4': { ext: 'mp4' },
    'video/x-flv': { ext: 'flv' },
    'video/3gpp': { ext: '3gp' },
    'video/x-msvideo': { ext: 'avi' },
    'video/x-ms-wmv': { ext: 'wmv' },
    'video/mpeg': { ext: 'mpg' },
    'video/quicktime': { ext: 'mov' },
    'video/ogg': { ext: 'ogv' }
  };
  var tabsInfo = { };

  var getVideoInfo = function(headers) {
    var info = { };

    for (var i = 0; i < headers.length; i++) {
      var header = headers[i],
        name = header.name,
        value = header.value;

      if (!name) {
        continue;
      }

      switch (name.toLowerCase()) {
        case 'content-type':
          info.type = value.split(';', 1)[0];
          break;

        case 'content-length':
          info.size = parseInt(value);
          info.formattedSize = formatSize(value);
          break;
      }
    }

    return info.size && info.type && videoTypes[info.type] ? info : null;
  };

  var parseFileName = function(url, type) {
    var clearedUrl = url.split('?', 1)[0];
    var urlParts   = clearedUrl.split('/');
    var filename   = urlParts.length > 0 ? urlParts[urlParts.length - 1] : 'unknown';
    var nameParts  = filename.split('.');

    if (nameParts[nameParts.length - 1] !== videoTypes[type].ext) {
      filename += '.' + videoTypes[type].ext;
    }

    return filename;
  };

  var formatSize = function(size) {
    var i = 0;
    var units = ['b', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    while (size > 1024) {
      size = size / 1024;
      i++;
    };

    return Math.max(size, 0.1).toFixed(1) + ' ' + units[i];
  };

  var processHeaders = function(details) {
    if (!details.responseHeaders) { return; }
    var video = getVideoInfo(details.responseHeaders);
    if (!video) { return; }

    video.url      = details.url;
    video.filename = parseFileName(details.url, video.type);

    var tabId = details.tabId;
    var uid   = Math.random().toString(16).slice(2);

    if (!tabsInfo[tabId]) {
      tabsInfo[tabId] = {
        videos: { }
      };

      chrome.tabs.get(tabId, function(tab) {
        tabsInfo[tabId].page = {
          url: tab.url,
          title: tab.title
        };
      });
    }

    tabsInfo[tabId].videos[uid] = video;

    return video;
  };

  var processMessage = function(request, sender, sendResponse) {
    switch (request.msg) {
      case 'fetchVideos':
        sendResponse({
          fetchedVideos: tabsInfo[request.tabId],
        });
        break;

      case 'startDownloading':
        if (tabsInfo[request.tabId] && tabsInfo[request.tabId].videos[request.videoId]) {
          downloadVideo(tabsInfo[request.tabId].videos[request.videoId]);
        }
        break;
    }
  };

  // = Handlers =
  var downloadVideo = function(video) {
    chrome.downloads.download({
      url: video.url,
      filename: video.filename,
      saveAs: true
    });
  };

  var flushUpdatedTab = function(tabId, changeInfo, tab) {
    if (changeInfo.status == "complete"){
      delete tabsInfo[tabId];
    }
  };

  var flushClosedTab = function(tabId, removeInfo) {
    delete tabsInfo[tabId];
  };

  return {
    init: function() {
      chrome.webRequest.onHeadersReceived.addListener(processHeaders, {
        urls: ["<all_urls>"]
      }, ["responseHeaders"]);
      chrome.runtime.onMessage.addListener(processMessage);
      chrome.tabs.onRemoved.addListener(flushClosedTab);
      chrome.tabs.onUpdated.addListener(flushUpdatedTab);
    }
  };
}();

videoFinder.init();