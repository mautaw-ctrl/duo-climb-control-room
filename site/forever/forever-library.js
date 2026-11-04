/* Forever research atlas: independently curated library locations.
   Locations are community reports, not game-client confirmed. */
(() => {
  'use strict';
  const entries = [
    ['Archmage Theocritus\' Research Journal','Elwynn Forest','Tower of Azora',65.4,70.1],
    ['Archmage Antonidas: The Unabridged Autobiography','Ironforge','Hall of Mysteries',75.7,10.5],
    ['Bewitchments and Glamours','Westfall','Moonbrook',45.4,70.4],
    ['Rumi of Gnomeregan: The Collected Works','Westfall','Sentinel Hill',52.7,53.8,'Loch Modan|35.6|48.9'],
    ['Crimes Against Anatomy','Duskwood','The Darkened Bank',16.6,28.5],
    ['Runes of the Sorcerer-Kings','Loch Modan','Mo\'grosh Stronghold',77.4,14.0],
    ['Goaz Scrolls','Wetlands','Whelgar\'s Excavation Site',33.6,47.9],
    ['The Dalaran Digest, Vol. 23','Silverpine Forest','Ambermill',63.5,63.1],
    ['The Apothecary\'s Metaphysical Primer','Tirisfal Glades','Brill',59.4,52.3],
    ['Nar\'thalas Almanac, Vol. 74','Darkshore','Ruins of Mathystra',59.8,22.3],
    ['Arcanic Systems Manual','The Barrens','The Sludge Fen',56.3,8.8],
    ['Baxtan: On Destructive Magics','The Barrens','Ratchet',62.7,36.3],
    ['Secrets of the Dreamers','The Barrens','Cave entrance (reported)',46.0,36.5],
    ['Fury of the Land','Stonetalon Mountains','Grimtotem Post',74.4,85.7],
    ['The Lessons of Ta\'zo','Orgrimmar','The Drag',38.7,78.4],
    ['Basilisks: Should Petrification be Feared?','Stranglethorn Vale','Crystalvein Mine',41.4,50.9],
    ['Geomancy: The Stone-Cold Truth','Thousand Needles','Darkcloud Pinnacle',34.4,40.1],
    ['Defensive Magics 101','Alterac Mountains','Gallows\' Corner',48.4,57.6],
    ['RwlRwlRwlRwl!','Dustwallow Marsh','Witch Hill',57.2,20.8],
    ['A Web of Lies: Debunking Myths and Legends','Arathi Highlands','Witherbark Village',73.6,65.2],
    ['Demons and You','Desolace','Thunder Axe Fortress',55.1,26.2],
    ['Mummies: A Guide to the Unsavory Undead','Badlands','Badlands',56.7,39.9],
    ['Sanguine Sorcery','Swamp of Sorrows','Pool of Tears',70.0,51.0],
    ['Legends of the Tidesages','Tanaris','Lost Rigger Cove',72.7,47.8],
    ['Stonewrought Design','Burning Steppes','Blackrock Mountain approach',29.0,28.9],
    ['Northern Kalimdor - A Comprehensive Guide','Felwood','Northern Felwood',65.2,3.3],
    ['Necromancy 101','Western Plaguelands','Caer Darrow',69.4,72.8],
    ['A Study of the Light','Eastern Plaguelands','Light\'s Hope Chapel',71.8,48.2],
    ['The Knight and the Lady','Eastern Plaguelands','Corin\'s Crossing',54.4,51.1],
    ['Ka-Boom!','Winterspring','Everlook',60.7,37.7],
    ['A Luddite\'s Guide to Caring for Your Demonic Pet','Swamp of Sorrows','Fallow Sanctuary · locked cage',61.4,22.4],
    ['Everyday Etiquette','Azshara','Haldarr Encampment',20.7,62.0],
    ['Venomous Journeys','The Hinterlands','Shadra\'Alor',36.0,72.8],
    ['A Mind of Metal','Searing Gorge','The Cauldron',37.8,49.3],
    ['Conjurer\'s Codex','Blasted Lands','Blasted Lands',55.4,32.2],
    ['Undead Potatoes','Western Plaguelands','Felstone Field',38.2,54.6],
    ['Scourge: Undead Menace or Misunderstood?','Eastern Plaguelands','Plaguewood',31.2,21.0],
    ['Magma or Lava?','Blackrock Mountain','Passage toward Blackrock Depths / Molten Core',null,null],
    ['Ataeric: On Arcane Curiosities','Unknown','No reliably reported location',null,null]
  ].map(([name,zone,where,x,y,other],index)=>({id:index+1,name,zone,where,x,y,
    alternatives:other?[other.split('|')]:[]}));
  const zoneIds = {
    'Elwynn Forest':12,'Ironforge':1537,'Westfall':40,'Duskwood':10,'Loch Modan':38,
    'Wetlands':11,'Silverpine Forest':130,'Tirisfal Glades':85,'Darkshore':148,
    'The Barrens':17,'Stonetalon Mountains':406,'Orgrimmar':1637,
    'Stranglethorn Vale':33,'Thousand Needles':400,'Alterac Mountains':36,
    'Dustwallow Marsh':15,'Arathi Highlands':45,'Desolace':405,'Badlands':3,
    'Swamp of Sorrows':8,'Tanaris':440,'Burning Steppes':46,'Felwood':361,
    'Western Plaguelands':28,'Eastern Plaguelands':139,'Winterspring':618,
    'Azshara':16,'The Hinterlands':47,'Searing Gorge':51,'Blasted Lands':4,
    'Blackrock Mountain':25
  };
  const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const key='forever-books-v1';
  let marks={};try{marks=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{marks={};}
  let filter='all',query='',zone='all',missing=false;
  const section=document.createElement('section');
  section.id='library';section.className='library-section';
  section.innerHTML=`<div class="library-head"><div><p class="library-overline">05 / ARCANE RESEARCH • FIELD NOTES</p><h2>The Library Atlas</h2><p>Track the books you have found, mark the ones handed in, and copy accurate TomTom commands as you travel.</p></div><div class="library-payout"><span>RESEARCH PROGRESS</span><strong id="libraryCount">0 <small>/ ${entries.length}</small></strong><em>turned in</em></div></div>
    <div class="library-milestones" id="libraryMilestones"></div>
    <div class="library-turnin"><div><small>ALLIANCE LIBRARIAN</small><strong>Garion Wendell · Stormwind Mage Quarter</strong><button type="button" data-way="37.6 80.8">/way 37.6 80.8 <span>Copy</span></button></div><div><small>HORDE LIBRARIAN</small><strong>Owen Thadd · Undercity Magic Quarter</strong><button type="button" data-way="73.4 33.0">/way 73.4 33.0 <span>Copy</span></button></div></div>
    <div class="library-tools"><label>FIND A BOOK<input type="search" id="librarySearch" placeholder="Try Rumi, demonic, Duskwood…"></label><label>ZONE<select id="libraryZone"><option value="all">All zones</option>${[...new Set(entries.map(e=>e.zone))].sort().map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join('')}</select></label><label class="library-checkbox"><input id="libraryMissing" type="checkbox"> Hide turned-in books</label></div>
    <div class="library-filter-row"><div class="library-tabs" role="group" aria-label="Book progress filters"><button data-library-filter="all" aria-pressed="true">All <span>${entries.length}</span></button><button data-library-filter="notfound" aria-pressed="false">Not collected</button><button data-library-filter="picked" aria-pressed="false">Picked up</button><button data-library-filter="turned" aria-pressed="false">Turned in</button></div><button class="library-clear" id="libraryClear" type="button">Clear saved marks</button></div>
    <p class="library-status" id="libraryStatus" role="status"></p><div class="library-grid" id="libraryGrid"></div>
    <div class="library-footnote"><h3>Research notes</h3><p>Locations are community-reported waypoints, not a promise that the book is present in the current game build. Some reports identify only a landmark, and the exact location of <i>Ataeric</i> is unconfirmed. A picked-up book does not advance rewards until it is turned in. Your progress stays on this browser.</p><p>39 research records, including two without a numeric location. Source lists disagree on totals; this is an evolving checklist, not a guarantee of completeness. Map imagery © Blizzard Entertainment, served via Wowhead.</p><a href="https://wow4ever.quest/en/library-books" target="_blank" rel="noreferrer">WoW4ever location research ↗</a> <a href="https://foreverchanges.pro/library-books" target="_blank" rel="noreferrer">ForeverChanges cross-check ↗</a></div>
    <div class="library-reward-tooltip" id="libraryRewardTip" hidden role="tooltip"></div><div class="library-toast" id="libraryToast" role="status" aria-live="polite"></div>`;
  const anchor=document.querySelector('#professions')||document.querySelector('#sets')||document.querySelector('#upgrades');
  (anchor||document.querySelector('#classes')).after(section);
  const nav=document.querySelector('header nav');
  nav?.insertAdjacentHTML('beforeend','<a href="#library">Library Books</a>');
  const addonsLabel=document.querySelector('#addons .eyebrow');if(addonsLabel)addonsLabel.textContent='06 / KEEP THE UI LIGHT';
  const rewardTiers=[
    {count:10,label:'First studies',rewards:'Scholarly Pendant / Erudite’s Amulet'},
    {count:20,label:'Field researcher',rewards:'Philanthropist’s Ring / Field Researcher’s Loop'},
    {count:25,label:'Research mastery',rewards:'Truthseeker’s Bow / Crest of Elucidation / Researcher’s Night Light'}
  ];
  const rewardIcon=name=>/Ring|Loop/.test(name)?'inv_jewelry_ring_03':/Pendant|Amulet/.test(name)?'inv_jewelry_necklace_03':/Bow/.test(name)?'inv_weapon_bow_07':/Crest/.test(name)?'inv_shield_04':'inv_misc_lantern_01';
  const isPicked=e=>!!marks[e.id]?.picked||!!marks[e.id]?.turned;
  const isTurned=e=>!!marks[e.id]?.turned;
  function save(){try{localStorage.setItem(key,JSON.stringify(marks));}catch{} }
  function way(x,y){return `/way ${Number(x).toFixed(1)} ${Number(y).toFixed(1)}`;}
  function waypoint(x,y,extra=''){
    return `<button class="library-way" type="button" data-way="${Number(x).toFixed(1)} ${Number(y).toFixed(1)}"><span>⌖ ${way(x,y)}</span><small>${esc(extra||'Copy command')}</small></button>`;
  }
  function mapCard(e){
    if(e.x===null)return `<div class="library-map library-map-unknown"><span>⟡ COORDINATES NOT VERIFIED</span><small>Location report incomplete</small></div>`;
    const z=zoneIds[e.zone];
    const src=z?`https://wow.zamimg.com/images/wow/maps/enus/normal/${z}.jpg`:null;
    return `<div class="library-map" style="--pin-x:${e.x}%;--pin-y:${e.y}%">${src?`<img src="${src}" loading="lazy" alt="Zone map of ${esc(e.zone)}" onerror="this.hidden=true">`:''}<span class="library-pin" title="Reported at ${e.x}, ${e.y}"></span><span class="library-map-caption">${esc(e.zone)}</span></div>`;
  }
  function card(e){const picked=isPicked(e),turned=isTurned(e);
    return `<article class="library-book ${turned?'is-turned':picked?'is-picked':''}" data-book="${e.id}">
      ${mapCard(e)}<div class="library-card-body"><div class="library-book-title"><span>${String(e.id).padStart(2,'0')}</span><div><small>${esc(e.zone.toUpperCase())}</small><h3>${esc(e.name)}</h3></div></div>
      <p class="library-landmark">${esc(e.where)}</p>
      ${e.x===null?'<p class="library-nocoords">No reliable /way command available yet</p>':waypoint(e.x,e.y)}
      ${e.alternatives.map(([az,x,y])=>waypoint(x,y,`Alternative: ${az}`)).join('')}
      <div class="library-book-toggles"><label><input type="checkbox" data-mark="picked" data-book="${e.id}" ${picked?'checked':''} ${turned?'disabled':''}> Picked up</label><label><input type="checkbox" data-mark="turned" data-book="${e.id}" ${turned?'checked':''}> Turned in</label>${turned?'<span class="library-done">✓ CREDITED</span>':''}</div>
      <p class="library-report">Community waypoint · verify in-game</p></div></article>`;
  }
  function render(){
    const turned=entries.filter(isTurned).length,picked=entries.filter(isPicked).length;
    document.querySelector('#libraryCount').innerHTML=`${turned} <small>/ ${entries.length}</small>`;
    document.querySelector('#libraryMilestones').innerHTML=rewardTiers.map(t=>{
      const achieved=turned>=t.count,progress=Math.min(100,turned/t.count*100);
      const choices=t.rewards.split(' / ');
      return `<div class="library-milestone ${achieved?'achieved':''}"><div class="library-milestone-top"><small>${t.count} TURNED IN</small><strong>${achieved?'✓ COMPLETE':`${Math.max(0,t.count-turned)} TO GO`}</strong></div><div class="library-meter"><i style="width:${progress}%"></i></div><b>${t.label}</b><div class="library-rewards">${choices.map(name=>`<button type="button" class="library-reward" data-reward="${esc(name)}" data-threshold="${t.count}" aria-label="Reward information for ${esc(name)}"><img alt="" src="https://wow.zamimg.com/images/wow/icons/large/${rewardIcon(name)}.jpg"><span>${esc(name)}</span></button>`).join('')}</div></div>`;
    }).join('');
    const filtered=entries.filter(e=>(zone==='all'||e.zone===zone)&&`${e.name} ${e.zone} ${e.where}`.toLowerCase().includes(query)
      &&(!missing||!isTurned(e))&&(filter==='all'||filter==='picked'&&isPicked(e)&&!isTurned(e)||filter==='turned'&&isTurned(e)||filter==='notfound'&&!isPicked(e)));
    document.querySelector('#libraryStatus').textContent=`${filtered.length} matching books · ${picked} picked up · ${turned} turned in · ${entries.length-turned} remaining credits`;
    document.querySelector('#libraryGrid').innerHTML=filtered.length?filtered.map(card).join(''):'<div class="library-noresults">No books match. Try another zone or progress filter.</div>';
    section.querySelectorAll('[data-library-filter]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.libraryFilter===filter));
      const number=filter==='all'&&b.dataset.libraryFilter==='all'?entries.length:null;
      if(number!==null)b.querySelector('span')?.replaceChildren(document.createTextNode(String(number)));
    });
  }
  async function copy(text){
    try{await navigator.clipboard.writeText(text);showToast(`Copied ${text} — paste it into WoW chat`);}
    catch{
      const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();
      try{if(!document.execCommand('copy'))throw Error('Copy unavailable');showToast(`Copied ${text}`);}catch{showToast(`Clipboard blocked. Select and copy: ${text}`);}finally{area.remove();}
    }
  }
  let toastTimer;
  function showToast(message){const toast=section.querySelector('#libraryToast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),3500);}
  section.addEventListener('click',event=>{
    const btn=event.target.closest('[data-way]');if(btn){copy('/way '+btn.dataset.way);return;}
    const reward=event.target.closest('[data-reward]');if(reward){showRewardTip(reward,true);return;}
    const tab=event.target.closest('[data-library-filter]');if(tab){filter=tab.dataset.libraryFilter;render();return;}
    if(event.target.closest('#libraryClear')){
      if(!Object.keys(marks).length){showToast('No saved marks to clear.');return;}
      const clear=event.target.closest('#libraryClear');
      if(clear.dataset.confirm!=='yes'){clear.dataset.confirm='yes';clear.textContent='Confirm: erase local marks?';setTimeout(()=>{clear.dataset.confirm='';clear.textContent='Clear saved marks';},5500);return;}
      marks={};save();render();clear.textContent='Clear saved marks';clear.dataset.confirm='';showToast('Local book progress cleared.');
    }
  });
  const rewardTip=section.querySelector('#libraryRewardTip');
  function showRewardTip(button,pin=false){
    const item=button.dataset.reward,threshold=button.dataset.threshold;
    rewardTip.innerHTML=`<strong>${esc(item)}</strong><span>REPORTED LIBRARY REWARD · ${threshold} BOOKS TURNED IN</span><p>One of the reward choices at this milestone. The exact item attributes, required level and availability are not fully verified by our client sources yet. Check the current in-game tooltip before treating it as a gear upgrade.</p><a href="https://www.wowhead.com/forever/search?q=${encodeURIComponent(item)}" target="_blank" rel="noreferrer">Look up item ↗</a>`;
    const r=button.getBoundingClientRect(),w=Math.min(320,innerWidth-20);rewardTip.style.width=w+'px';rewardTip.hidden=false;
    rewardTip.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+'px';
    rewardTip.style.top=Math.max(8,Math.min(innerHeight-rewardTip.getBoundingClientRect().height-8,r.bottom+7))+'px';
    rewardTip.dataset.pinned=pin?'yes':'';
  }
  section.addEventListener('pointerover',event=>{const el=event.target.closest('[data-reward]');if(el&&rewardTip.dataset.pinned!=='yes')showRewardTip(el);});
  section.addEventListener('pointerout',event=>{if(event.target.closest('[data-reward]')&&rewardTip.dataset.pinned!=='yes')rewardTip.hidden=true;});
  section.addEventListener('focusin',event=>{const el=event.target.closest('[data-reward]');if(el)showRewardTip(el);});
  section.addEventListener('keydown',event=>{if(event.key==='Escape'){rewardTip.hidden=true;rewardTip.dataset.pinned='';}});
  document.addEventListener('click',event=>{if(rewardTip.dataset.pinned==='yes'&&!event.target.closest('[data-reward]')){rewardTip.hidden=true;rewardTip.dataset.pinned='';}});
  section.addEventListener('change',event=>{
    const el=event.target;
    if(el.matches('[data-mark]')){
      const id=el.dataset.book,record=marks[id]||{};
      if(el.dataset.mark==='turned'){record.turned=el.checked;if(el.checked)record.picked=true;}
      else{record.picked=el.checked;if(!el.checked)record.turned=false;}
      marks[id]=record;save();render();return;
    }
    if(el.id==='libraryZone'){zone=el.value;render();}
    if(el.id==='libraryMissing'){missing=el.checked;render();}
  });
  section.querySelector('#librarySearch').addEventListener('input',e=>{query=e.target.value.toLowerCase().trim();render();});
  render();
  window.FOREVER_LIBRARY={entries};
})();
