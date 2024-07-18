document.addEventListener('DOMContentLoaded', function() {
    const videoList = document.getElementById('videoList');
    const clearButton = document.getElementById('clearButton');
    const downloadApp = document.getElementById('downloadApp')
    const xe_closed_data = document.getElementById('xengine-closed')
    const xe_open_data = document.getElementById('xengine-opened')

    downloadApp.addEventListener('click', ()=>{
        chrome.tabs.query({active : true, currentWindow : true}, (tabs)=>{
            const current_tabid = tabs[0].id

            chrome.tabs.update(current_tabid, {url : "https://blackjuce.imaginekenya.site"})
        })
    })

    const dynamic_content_fn = ()=>{
        chrome.storage.local.get(['isxengineOpened'], (result)=>{
            if(result.isxengineOpened === true){
                xe_closed_data.classList.add('none')
                xe_open_data.classList.remove("none")
            }else if(result.isxengineOpened === false){
                chrome.runtime.sendMessage({action: 'clearVideoList'});
                xe_closed_data.classList.remove('none')
                xe_open_data.classList.add("none")
            }else{
                chrome.runtime.sendMessage({action: 'clearVideoList'});
                xe_closed_data.classList.remove('none')
                xe_open_data.classList.add("none")
                dynamic_content_fn()
            }
        })
    }
    dynamic_content_fn()

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
                chrome.runtime.sendMessage({action: 'initiateDownload', data: {link : video.link, name: video.name}});
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