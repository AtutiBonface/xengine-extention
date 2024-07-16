chrome.runtime.onInstalled.addListener(()=>{
    chrome.contextMenus.create({
        id: "filesContextMenus",
        title : "Download with Black juice",
        contexts : ["image", "audio", "video"]
    })
})

chrome.contextMenus.onClicked.addListener((data, tab)=>{
    if(data.menuItemId === 'filesContextMenus'){
      let f_name = new URL(data.srcUrl)
      path_name = f_name.pathname.split('/').pop()
      new_filename = decodeURIComponent(path_name)
      handle_websockets({link : data.srcUrl, name : new_filename})
    }
})
chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
  if(message.action === "clearVideoList"){
    chrome.storage.local.clear(()=>{
      if(chrome.runtime.lastError){
        console.log('Error is', chrome.runtime.lastError)
      }else{
        console.log("deleted successfully")
      }
    })
  }else if(message.action === "initiateDownload"){
    handle_websockets(message.data)
  }
})

chrome.webRequest.onBeforeRequest.addListener(
  function(details){
    if (details.type === "media") {
    
      
      const objectUrl = new URL(details.url)
      let pathname = objectUrl.pathname

      

      const Undecoded_filename = pathname.split('/').pop()
      const filename = decodeURIComponent(Undecoded_filename)

      let Data = {link:details.url, name : filename}
        
      chrome.storage.local.get({updateVideoList : []}, (result)=>{
        
        let video_list = result.updateVideoList

        let isDuplicate = false

        video_list.forEach(video => {
          if (video.name === filename || video.link === details.url){
            isDuplicate = true
            console.log('There is a duplicate', video.name)
          }
        });



        if(!isDuplicate){
          fetch(details.url , {method : 'HEAD'}).then((resp)=>{
            let filesize = resp.headers.get('Content-Length')
    
            filesize = returnFileSizeWithUnits(filesize)

            Data.size = filesize
 
            video_list.push(Data)

            chrome.storage.local.set({updateVideoList : video_list}, function() {
              console.log('Items appended successfully');
          });
          }).catch((err)=>{
            console.log(err)
          })
          
        }

      }) 
    }
  },
{urls: ["<all_urls>"]},
["requestBody"]
);
const check_connection = ()=>{
  let icon_displayed = '/images/xe-128.png'
  let new_socket = new WebSocket('ws://127.0.0.1:65432');

    console.log('Attempting to establish connection')

    new_socket.onopen = (event)=>{
      chrome.action.setIcon({path : "/images/xe-128.png"})
      chrome.storage.local.set({isxengineOpened : true})
    }
    new_socket.onerror = (error)=>{
      chrome.storage.local.set({isxengineOpened : false})
      chrome.action.setIcon({path : "/images/w-xe-128.png"})
    }
    new_socket.onclose = (event)=>{
      check_connection()
    }
}

check_connection()

const handle_websockets = (file)=>{
  
  
  var socket = new WebSocket("ws://127.0.0.1:65432");
   
    socket.onopen = function(event) {
      const json_data = JSON.stringify(file)
      socket.send(json_data);
      console.log("Sent")
    };
    socket.onerror = function(error) {
        console.log("Socket error:", error);
    };
    socket.onclose = (event)=>{
      console.log("Connection closed suddenly")
    }
}

const returnFileSizeWithUnits = (filesize)=>{

  let size = Number(filesize);

  if (isNaN(size)) {
    return '---';
  }
  if (size >= 1024 ** 4) {
    return `${(size / (1024 ** 4)).toFixed(2)} TB`;
  } else if (size >= 1024 ** 3) {
    return `${(size / (1024 ** 3)).toFixed(2)} GB`;
  } else if (size >= 1024 ** 2) {
    return `${(size / (1024 ** 2)).toFixed(2)} MB`;
  } else if (size >= 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${size} bytes`;
  }
}
//chrome.action.setBadgeText({ text: "" });