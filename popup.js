document.addEventListener('DOMContentLoaded', function() {
    const videoList = document.getElementById('videoList');
    const clearButton = document.getElementById('clearButton');

    function populateVideoList(videos) {
        videoList.innerHTML = '';
        videos.forEach(video => {
            const li = document.createElement('li');
            const span = document.createElement('span')
            li.textContent = video.name;  
            span.textContent = video.size
            li.appendChild(span)         
            li.addEventListener('click', () => {
                // Handle video click (e.g., send message to background script)
                chrome.runtime.sendMessage({action: 'downloadVideo', link: video.link});
            });
            videoList.appendChild(li);
        });
    }

    function clearVideoList() {
        // Clear the list in the UI
        videoList.innerHTML = '';
        // Send message to background script to clear the stored list
        chrome.runtime.sendMessage({action: 'clearVideoList'});
    }

    // Fetch the video list from storage when popup opens
    chrome.storage.local.get({updateVideoList : []}, function(result) {
        if (result.updateVideoList) {
            populateVideoList(result.updateVideoList);
        }else{
            console.log("No data")
        }
    });

    clearButton.addEventListener('click', clearVideoList);

    // Listen for updates to the video list
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'updateVideoList') {
            console.log("There is a video")
            populateVideoList(message.videos);

            sendResponse({received: "Thanks"})
        }
    });
});