class SimpleMediaInterceptor {    
    

    constructor() {
        this.isDownloaderActive = false;
        this.allMediaFiles = [];
        this.mediaTypes = ['audio', 'video'];
        this.mediaExtensions = ['.mp3', '.mp4', '.avi', '.mov', '.webm', '.ogg'];
    }


    startApp(){
        chrome.action.setIcon({
            path: this.isDownloaderActive ? "/images/xe-128.png" : "/images/w-xe-128.png"
        });
        if (this.isDownloaderActive) {
            this.startIntersepting()
            
        }
    }
  
    startContextMenus(){  
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
          let path_name = f_name.pathname.split('/').pop()
          let new_filename = decodeURIComponent(path_name)
          this.sendDataToDownloader({link : data.srcUrl, name : new_filename})
        }
    
      })
  
    }

    clearVideoList() {
        chrome.storage.local.set({ updateVideoList: [] }, () => {
            chrome.action.setBadgeText({ text: "" });
        });
    }
    updateBadge(count){
        chrome.action.setBadgeText({ text: count > 0 ? count.toString() : "" });
    }
  
    listenOnMessages(){
      chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
        if(message.action === "clearVideoList"){
          this.clearVideoList()
        }else if(message.action === "initiateDownload"){
          this.sendDataToDownloader(message.data)
        }
      })
    }
  
    sendDataToDownloader(file){  
    
      var socket = new WebSocket("ws://127.0.0.1:65432");
       
        socket.onopen = (event) =>{
          const json_data = JSON.stringify(file)
          socket.send(json_data);
          console.log("Sent")
        };
        socket.onerror =(error) =>{ console.log("Socket error:", error) };
        socket.onclose = (event)=>{ console.log("Connection closed suddenly") }
    }
  
    checkDownloaderActive(){
      let new_socket = new WebSocket('ws://127.0.0.1:65432');
  
  
      new_socket.onopen = (event)=>{
        this.isDownloaderActive = true;

        chrome.storage.local.set({isxengineOpened : true})
        this.startApp()
      }
      new_socket.onerror = (error)=>{
        this.isDownloaderActive = false
        chrome.storage.local.set({isxengineOpened : false})

        this.startApp()
      }
      new_socket.onclose = (event)=>{
        this.checkDownloaderActive()
      }
    }
  
    returnFileSizeWithUnits(filesize){
  
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
  
    startIntersepting() {
        // Listen for requests being sent

        if (this.isDownloaderActive){
            chrome.webRequest.onBeforeRequest.addListener(
                this.interceptRequest.bind(this),
                { urls: ["<all_urls>"] },
                ["requestBody"]
            );
    
            // Listen for responses
            chrome.webRequest.onHeadersReceived.addListener(
                this.checkResponse.bind(this),
                { urls: ["<all_urls>"] },
                ["responseHeaders"]
            );
        }
    }

    

    async getStoredFiles() {
        return new Promise(resolve => {
            chrome.storage.local.get({ updateVideoList: [] }, result => {
                resolve(result.updateVideoList);
            });
        });
    }

    async storeFileData(details){
        const link = details.url

        const object_url = new URL(link)

        const pathname = object_url.pathname
        let undecoded_filename = pathname.split('/').pop()

        const filename = decodeURIComponent(undecoded_filename)

        
        const existingFiles = await this.getStoredFiles();

        if (existingFiles.some(file => file.name === filename || file.link === link)) {
            return;
        }

        try{
            const response = await fetch(link, {method : 'HEAD'})

            const filesize = response.headers.get('Content-Length')

            const fileSizeWithUnits = this.returnFileSizeWithUnits(filesize)

            const data_to_store = {link: details.url, name: filename, size: fileSizeWithUnits}  
            
            existingFiles.push(data_to_store)

            this.updateStoredFiles(existingFiles)

            this.updateBadge(existingFiles.length);
        }
        catch(error){
            console.log(error)
        }

        
    }
    updateStoredFiles(files){
        chrome.storage.local.set({ updateVideoList: files })

    }

    
  
    interceptRequest(details) {
        // Check if the URL ends with a media extension

        if(details.type === 'media'){

            if (this.mediaExtensions.some(ext => details.url.toLowerCase().endsWith(ext))) {

                this.storeFileData(details)
            
            }
        }
        
    }


  
    checkResponse(details) {
  
        // Check Content-Type header for media types
        const contentTypeHeader = details.responseHeaders.find(
            header => header.name.toLowerCase() === 'content-type'
        );
  
        if (contentTypeHeader && this.mediaTypes.some(type => contentTypeHeader.value.includes(type))) {
            this.storeFileData(details)
        }
    }
    
  }
  
  
  const interceptor = new SimpleMediaInterceptor();
  
  interceptor.checkDownloaderActive()
  interceptor.listenOnMessages()
  interceptor.startContextMenus()
  