function detectVideoUrls() {
    const videos = document.getElementsByTagName('video');
    for (let video of videos) {
      let videoUrl = video.currentSrc || video.src;
      if (videoUrl) {
       
        chrome.runtime.sendMessage({videoUrl: videoUrl});
      }
    }
  }
console.log(document.title)
chrome.runtime.sendMessage({action : "page-title",
  title : document.title
})
 