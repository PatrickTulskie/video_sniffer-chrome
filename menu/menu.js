var videoFinderMenu = function() {
  var tabId;
  var page   = { };
  var videos = { };

  var fetchVideos = function(response) {
    if (response.fetchedVideos) {
      page = response.fetchedVideos.page;
      videos = response.fetchedVideos.videos;
    }

    renderPage();
  };

  var renderPage = function() {
    var content = document.getElementById('content');
    var inserted = 0;

    var ul = document.createElement('ul');
    ul.className = 'list-download';

    for (var i in videos) {
      var video = videos[i],
        format = 1,
        li = document.createElement('li'),
        col1 = document.createElement('span'),
        col2 = document.createElement('span'),
        col3 = document.createElement('span'),
        button = document.createElement('div');

      col1.className = 'col-1';
      col1.innerHTML = '<b>' + video.type + '</b>';
      li.appendChild(col1);

      col2.className = 'col-2';
      col2.innerText = video.filename;
      li.appendChild(col2);

      button.className = 'btn-download';
      button.innerHTML = '<div vid="' + i + '">' + chrome.i18n.getMessage('download') + ' ' + video.formattedSize + '</div>';
      button.addEventListener('click', startDownloading, true);

      col3.className = 'col-3';
      col3.appendChild(button);
      li.appendChild(col3);

      ul.appendChild(li);
      inserted++;
    }

    if (inserted > 0) {
      div = document.createElement('div');
      div.className = 'tit-download';
      div.innerText = chrome.i18n.getMessage('found_title');
      content.appendChild(div);
      content.appendChild(ul);
    } else {
      div = document.createElement('div');

      div.className = 'text info';
      div.innerHTML = chrome.i18n.getMessage('not_found');

      content.appendChild(div);
    }
  };

  var startDownloading = function(e) {
    window.close();
    chrome.runtime.sendMessage({
      msg: 'startDownloading',
      tabId: tabId,
      videoId: e.target.getAttribute('vid')
    });
  };

  chrome.tabs.query(
    {
      active: true,
      currentWindow: true
    },
    function(result) {
      if (!result.length) { return; }

      tabId = result[0].id;

      chrome.runtime.sendMessage(
        { msg: 'fetchVideos', tabId: tabId },
        fetchVideos
      );
    }
  );

}();
