import{A as h,I as g,a5 as a,a6 as c}from"./main-DeqTuPJI.js";import"./xterm-BwRfFNjq.js";import"./xterm-BV-LBlTX.js";import"./zenfs-5S7w0OYW.js";class f extends h{static config={id:"task-manager",title:"Task Manager",description:"Manage running applications.",icon:g.windows,width:300,height:400,resizable:!1,isSingleton:!0};async _onLaunch(){this.win.element.style.zIndex=$Window.Z_INDEX++,this._updateTaskList(),this._setupEventDelegation(),document.addEventListener("app-launched",()=>this._updateTaskList()),document.addEventListener("app-closed",()=>this._updateTaskList())}_updateTaskList(){const t=this.win.$content.find(".task-list"),n=this.win.$content.find(".task-list tr.highlighted").data("instanceKey"),e=$("<tbody></tbody>"),l=a.getRunningApps();for(const[d,i]of Object.entries(l)){if(i.id==="task-manager")continue;const p=a.getAppConfig(i.id),r=i.win?i.win.title():p.title,s=$(`<tr><td>${r}</td></tr>`);s.data("instanceKey",d),n&&d===n&&s.addClass("highlighted"),e.append(s)}t.empty().append(e);const o=t.find("tr.highlighted").length>0;this.win.$content.find(".end-task-btn").prop("disabled",!o),this.win.$content.find(".switch-to-btn").prop("disabled",!o)}_setupEventDelegation(){const t=this.win.$content;t.on("click",".task-list tr",n=>{const e=$(n.currentTarget);t.find(".task-list tr").removeClass("highlighted"),e.addClass("highlighted"),t.find(".end-task-btn").prop("disabled",!1),t.find(".switch-to-btn").prop("disabled",!1)}),t.on("click",".end-task-btn",()=>{const n=t.find(".task-list tr.highlighted");if(n.length){const e=n.data("instanceKey");a.closeApp(e)}}),t.on("click",".switch-to-btn",()=>{c("Switch To")}),t.on("click",".new-task-btn",()=>{c("Create New Task")})}_createWindow(){const t=new $Window({title:"Close Program",icons:this.icon,width:300,height:400,resizable:!1,minimizeButton:!1,maximizeButton:!1,id:"task-manager"});return t.$content.html(`
            <div class="task-manager-content">
                <div class="task-list-container inset-deep">
                    <table class="task-list"></table>
                </div>

                <div>
                    <p>WARNING: Pressing CTRL+ALT+DEL again will restart your computer. You will lose unsaved information in all programs that are running.</p>
                </div>
                <div class="button-bar">
                    <button class="end-task-btn" disabled>End Task</button>
                    <button class="switch-to-btn" disabled>Switch To</button>
                    <button class="new-task-btn">New Task...</button>
                </div>
            </div>
        `),this.win=t,t}}export{f as TaskManagerApp};
