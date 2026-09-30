const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/main-XJCJPCO4.js","assets/xterm-BwRfFNjq.js","assets/xterm-BV-LBlTX.js","assets/xterm-DFuMZ0ql.css","assets/zenfs-5S7w0OYW.js","assets/main-QIXH3hBJ.css"])))=>i.map(i=>d[i]);
import{A as h,I as m,S as u,a0 as c,R as o,T as p,g as w,b as g}from"./main-XJCJPCO4.js";import"./xterm-BwRfFNjq.js";import"./xterm-BV-LBlTX.js";import"./zenfs-5S7w0OYW.js";const y=`<div class="media-player-container">
    <div class="media-view inset-shallow" tabindex="0">
        <video class="media-element"></video>
        <img
            class="media-player-default-image"
            alt="Windows 98 Logo"
        />
    </div>
    <div class="media-controls">
        <div class="progress-bar-container">
            <input
                type="range"
                class="progress-bar"
                value="0"
                min="0"
                max="100"
                step="0.1"
            />
        </div>
        <div class="control-buttons">
            <button
                class="control-button play-pause lightweight"
                title="Play"
            ></button>
            <button
                class="control-button stop lightweight"
                title="Stop"
            ></button>
            <div class="separator"></div>
            <button
                class="control-button seek-backward lightweight"
                title="Seek Backward"
            ></button>
            <button
                class="control-button fast-rewind lightweight"
                title="Rewind"
            ></button>
            <button
                class="control-button fast-forward lightweight"
                title="Fast Forward"
            ></button>
            <button
                class="control-button seek-forward lightweight"
                title="Seek Forward"
            ></button>
            <div class="separator"></div>
            <div class="volume-control">
                <button
                    class="control-button mute lightweight"
                    title="Mute"
                ></button>
                <input
                    type="range"
                    class="volume-slider"
                    value="50"
                    min="0"
                    max="100"
                />
            </div>
        </div>
    </div>
</div>
`,f="/win98-web/assets/mediaplayer-BbIX8vcx.png";class L extends h{static config={id:"media-player",title:"Media Player",description:"Play audio and video files.",icon:m.mediaPlayer,category:"Accessories/Entertainment",width:480,height:360,resizable:!0,isSingleton:!1};constructor(e){super(e),this.blobUrl=null}_onClose(){this.blobUrl&&(URL.revokeObjectURL(this.blobUrl),this.blobUrl=null)}_createWindow(){const e=new $Window({id:this.id,title:this.title,outerWidth:this.width||480,outerHeight:this.height||360,resizable:this.resizable,icons:this.icon}),i=this._createMenuBar();return e.setMenuBar(i),e.$content.append(this._createUI()),e}_createMenuBar(){return new MenuBar({"&File":[{label:"&Open...",action:()=>this._openFile()},{label:"Open &URL...",action:()=>this._openUrlDialog()},"MENU_DIVIDER",{label:"E&xit",action:()=>this.win.close()}],"&Help":[{label:"&About Media Player",action:()=>alert("A simple media player.")}]})}_createUI(){const e=document.createElement("div");return e.className="media-player-container",e.innerHTML=y,e}_openFile(){const e=document.createElement("input");e.type="file",e.accept="audio/*,video/*",e.onchange=i=>{const t=i.target.files[0];if(t){if(t.type.startsWith("audio/")){this.mediaView.style.display="none";const l=this.win.element.offsetHeight-this.win.$content.get(0).offsetHeight,n=this.mediaControls.offsetHeight+l;this.win.setDimensions({outerHeight:n})}else this.mediaView.style.display="flex",this.win.setDimensions({outerHeight:this.originalHeight});const s=URL.createObjectURL(t);this.mediaElement.src=s,this.mediaElement.play(),this.win.title(`${t.name} - Media Player`)}},e.click()}_openUrlDialog(){const e=document.createElement("input");e.type="text",e.placeholder="Enter media URL here",e.style.width="100%";const i=document.createElement("div");i.appendChild(e),u({title:"Open URL",content:i,buttons:[{label:"Open",action:()=>{const t=e.value;t&&this._loadUrl(t)},isDefault:!0},{label:"Cancel",action:()=>{}}]})}_loadUrl(e){this.mediaElement.src=e;const i=e.split("/").pop().split("?")[0],t=decodeURIComponent(i);this.mediaElement.onloadedmetadata=()=>{if(this.mediaElement.videoWidth===0||this.mediaElement.videoHeight===0){this.mediaView.style.display="none";const l=this.win.element.offsetHeight-this.win.$content.get(0).offsetHeight,n=this.mediaControls.offsetHeight+l;this.win.setDimensions({outerHeight:n})}else this.mediaView.style.display="flex",this.win.setDimensions({outerHeight:this.originalHeight})},this.mediaElement.play(),this.win.title(`${t} - Media Player`)}_loadFile(e){if(this.mediaElement.src=e.content,e.type.startsWith("audio/")){this.mediaView.style.display="none";const i=this.win.element.offsetHeight-this.win.$content.get(0).offsetHeight,t=this.mediaControls.offsetHeight+i;this.win.setDimensions({outerHeight:t})}else this.mediaView.style.display="flex",this.win.setDimensions({outerHeight:this.originalHeight});this.mediaElement.play(),this.win.title(`${e.name} - Media Player`)}_setControlsDisabled(e){this.playPauseButton.disabled=e,this.stopButton.disabled=e,this.progressBar.disabled=e,this.volumeSlider.disabled=e,this.seekBackwardButton.disabled=e,this.fastRewindButton.disabled=e,this.fastForwardButton.disabled=e,this.seekForwardButton.disabled=e,this.muteButton.disabled=e,e?(this.mediaElement.style.display="none",this.defaultMediaImage&&(this.defaultMediaImage.style.display="flex"),this.win.title(this.config.title),this.mediaElement.src=""):(this.mediaElement.style.display="flex",this.defaultMediaImage&&(this.defaultMediaImage.style.display="none"))}_onLaunch(e){this.mediaView=this.win.element.querySelector(".media-view"),this.mediaControls=this.win.element.querySelector(".media-controls"),this.mediaElement=this.win.element.querySelector(".media-element"),this.defaultMediaImage=this.win.element.querySelector(".media-player-default-image"),this.defaultMediaImage.src=f,this.playPauseButton=this.win.element.querySelector(".play-pause"),this.stopButton=this.win.element.querySelector(".stop"),this.originalHeight=this.win.element.offsetHeight,this.progressBar=this.win.element.querySelector(".progress-bar"),this.volumeSlider=this.win.element.querySelector(".volume-slider"),this.seekBackwardButton=this.win.element.querySelector(".seek-backward"),this.fastRewindButton=this.win.element.querySelector(".fast-rewind"),this.fastForwardButton=this.win.element.querySelector(".fast-forward"),this.seekForwardButton=this.win.element.querySelector(".seek-forward"),this.muteButton=this.win.element.querySelector(".mute"),this.playPauseButton.addEventListener("click",()=>{this.mediaElement.paused?this.mediaElement.play():this.mediaElement.pause()}),this.stopButton.addEventListener("click",()=>{this.mediaElement.pause(),this.mediaElement.currentTime=0,this._setControlsDisabled(!0)}),this.mediaElement.addEventListener("timeupdate",()=>{const t=this.mediaElement.currentTime/this.mediaElement.duration*100;this.progressBar.value=t}),this.progressBar.addEventListener("input",()=>{const t=this.progressBar.value/100*this.mediaElement.duration;this.mediaElement.currentTime=t});const i=()=>{const t=w(),s=g();this.mediaElement.volume=t,this.mediaElement.muted=s,this.volumeSlider.value=t*100,this.muteButton.classList.toggle("muted",s)};if(document.addEventListener("system-volume-change",i),i(),this.volumeSlider.addEventListener("input",()=>{const t=this.volumeSlider.value/100;this.mediaElement.volume=t,c(()=>import("./main-XJCJPCO4.js").then(s=>s.ad),__vite__mapDeps([0,1,2,3,4,5])).then(s=>s.setVolume(t))}),this.mediaElement.addEventListener("play",()=>{this.playPauseButton.classList.add("playing"),this.playPauseButton.title="Pause"}),this.mediaElement.addEventListener("pause",()=>{this.playPauseButton.classList.remove("playing"),this.playPauseButton.title="Play"}),this.seekBackwardButton.addEventListener("click",()=>{this.mediaElement.currentTime-=5}),this.fastRewindButton.addEventListener("click",()=>{this.mediaElement.currentTime=0}),this.fastForwardButton.addEventListener("click",()=>{this.mediaElement.currentTime=this.mediaElement.duration}),this.seekForwardButton.addEventListener("click",()=>{this.mediaElement.currentTime+=5}),this.muteButton.addEventListener("click",()=>{this.mediaElement.muted=!this.mediaElement.muted,this.muteButton.classList.toggle("muted",this.mediaElement.muted)}),this.mediaElement.addEventListener("loadeddata",()=>{this._setControlsDisabled(!1),this.playPauseButton.focus()}),this.mediaElement.addEventListener("ended",()=>{this.playPauseButton.classList.remove("playing"),this.playPauseButton.title="Play",this.mediaElement.currentTime=0,this.progressBar.value=0}),this._setControlsDisabled(!0),e)if(typeof e=="string"){const t=e.split("/").pop(),s=t.split(".").pop().toLowerCase(),l=["mp3","wav","ogg","aac","m4a","flac","weba"],n=a=>{if(this.blobUrl&&(URL.revokeObjectURL(this.blobUrl),this.blobUrl=null),o(e)&&(this.blobUrl=a),this.mediaElement.src=a,l.includes(s)){this.mediaView.style.display="none";const r=this.win.element.offsetHeight-this.win.$content.get(0).offsetHeight,d=this.mediaControls.offsetHeight+r;this.win.setDimensions({outerHeight:d})}else this.mediaView.style.display="flex",this.win.setDimensions({outerHeight:this.originalHeight});this.win.title(`${t} - Media Player`),this._setControlsDisabled(!1),this.mediaElement.play()};o(e)?p(e).then(n):n(e)}else if(e instanceof File){const t=URL.createObjectURL(e);this._loadUrl(t),this.win.title(`${e.name} - Media Player`)}else e&&typeof e=="object"&&this._loadFile(e)}}export{L as MediaPlayerApp};
