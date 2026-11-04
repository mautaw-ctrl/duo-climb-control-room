/* WoW Forever advanced research inspection. Numbers are source-backed, never inferred
   from level arrays or presumed from Classic. */
(() => {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const itemStats={
    'Blackened Defias Armor':{quality:'Rare',binding:'Binds when picked up',slot:'Chest',armorType:'Leather',armor:89,required:17,
      attributes:{Stamina:10,Agility:3,Strength:4},source:'https://metaforge.app/wow-forever/database/armor/blackened-defias-armor',origin:'Edwin VanCleef · The Deadmines',verified:'Database tooltip · source may change before live launch'},
    'Blackened Defias Gloves':{quality:'Uncommon',binding:'Binds when equipped',slot:'Hands',armorType:'Leather',armor:52,required:14,
      attributes:{Strength:6,Stamina:2},source:'https://metaforge.app/wow-forever/database/armor/blackened-defias-gloves',origin:'Defias Overseer / Taskmaster · The Deadmines (historic)',verified:'Forever database tooltip · historic drop source provisional'},
    'Armor of the Fang':{quality:'Uncommon',binding:'Binds when picked up',slot:'Chest',armorType:'Leather',armor:91,required:18,
      attributes:{Strength:6,Spirit:7,Stamina:4},source:'https://metaforge.app/wow-forever/database/armor/armor-of-the-fang',origin:'Lord Pythas · Wailing Caverns (historic)',verified:'Forever database tooltip · historic drop source provisional'},
    'Whirlwind Axe':{quality:'Rare',binding:'Binds when picked up',slot:'Two-Hand',armorType:'Axe',required:30,
      weapon:{min:103,max:154,speed:3.60,dps:35.7},attributes:{Strength:16,Stamina:15},
      source:'https://metaforge.app/wow-forever/database/weapons/whirlwind-axe',origin:'Whirlwind Weapon · Warrior class quest',verified:'Forever database item stats · source quest requires in-client confirmation'}
  };
  // This deliberately limited dictionary supplies fully verified *numeric* tooltips.
  // Current client spell list has trainer-level metadata, not full effect data.
  const spellStats={
    Priest:{
      'Heal':{mana:[155,205,255,305],amount:[270,375,523,651],levels:[16,22,28,34],cast:'3 sec',range:'40 yd',source:'https://wow4ever.quest/en/spellbook/priest',kind:'Healing · base tooltip figure'},
      'Flash Heal':{mana:[125,155,185,215,265,315,380],amount:[194,249,312,383,507,644,825],levels:[20,26,32,38,44,50,56],cast:'1.5 sec',range:'40 yd',source:'https://wow4ever.quest/en/spellbook/priest',kind:'Healing · base tooltip figure'},
      'Chastise':{mana:[50,100,135,180,225],amount:[46,93,140,214,289],levels:[20,30,40,50,60],cast:'Instant',range:'20 yd',cooldown:'2 min',source:'https://wow4ever.quest/en/spellbook/priest',kind:'Damage · base tooltip figure'}
    }
  };
  let playerLevel=30,onlyAvailable=false;
  const isNum=n=>Number.isFinite(Number(n));
  function spellRank(s,level=playerLevel,cls=''){
    const unique=[...new Set((s.clientLevels||s.levels||[]).map(Number).filter(n=>n>=1&&n<=60))].sort((a,b)=>a-b);
    const available=unique.filter(n=>n<=level),next=unique.find(n=>n>level);
    const custom=spellStats[cls]?.[s.name];
    let verified=null;
    if(custom){
      const r=custom.levels.filter(n=>n<=level).length;
      if(r>0){const i=r-1;verified={rank:r,level:custom.levels[i],mana:custom.mana[i],amount:custom.amount[i],
        cast:custom.cast,range:custom.range,cooldown:custom.cooldown,kind:custom.kind,source:custom.source};}
    }
    return {total:unique.length,listed:available.length,next,first:unique[0]||null,verified,
      state:unique.length===0?'Unconfirmed trainer level':available.length?'Client-listed by this level':'Not yet client-listed',allLevels:unique};
  }
  function rankMarkup(s,level=playerLevel,cls=''){
    const r=spellRank(s,level,cls);
    let html=`<div class="inspector-rank"><div class="inspector-rank-head"><span>CHARACTER LEVEL ${level}</span><strong class="${r.listed?'inspector-ready':'inspector-waiting'}">${esc(r.state)}</strong></div>`;
    if(r.total){html+=`<p>${r.listed} client-listed level ${r.listed===1?'entry':'entries'} at or before ${level} · ${r.total} distinct listed levels</p><div class="inspector-level-track">${r.allLevels.map(n=>`<span class="${n<=level?'unlocked':'future'}" title="Client entry at level ${n}">${n}</span>`).join('')}</div>`;}
    else html+='<p>No confirmed trainer-level sequence. Could be talent, passive, internal, or untrainable.</p>';
    if(r.next)html+=`<p>Next client-listed level: <b class="inspector-gold">${r.next}</b></p>`;
    if(r.verified){const v=r.verified;html+=`<div class="inspector-verified"><span>NUMERIC SPELL DATA · RANK ${v.rank}</span><div><strong>${v.mana} Mana</strong><strong>${esc(v.cast)}</strong><strong>${esc(v.range)}</strong>${v.cooldown?`<strong>${esc(v.cooldown)} CD</strong>`:''}</div><p>${esc(v.kind)}: <b>${v.amount}</b> (base reported value; scaling, coefficients and talents excluded)</p><a href="${esc(v.source)}" target="_blank" rel="noreferrer">Inspect rank source ↗</a></div>`;}
    else if(spellStats[cls]?.[s.name])html+='<p class="inspector-pending">No documented numeric rank is available yet at the selected level.</p>';
    else html+='<p class="inspector-pending">Exact Mana, coefficient, cast time, cooldown and rank effects are not in this extracted client record; no numeric value is assumed.</p>';
    return html+'</div>';
  }
  function itemMarkup(name){
    const d=itemStats[name];
    if(!d)return `<div class="inspector-item-stats"><span>ITEM STAT BLOCK</span><p>Exact armor, primary attributes, weapon damage, speed, item level, and requirements are not yet source-verified for this specific Forever item. Acquisition shown in the route is a starting point; do not treat it as BiS without checking its live tooltip.</p><a href="https://www.wowhead.com/forever/search?q=${encodeURIComponent(name)}" target="_blank" rel="noreferrer">Search Forever database ↗</a></div>`;
    const attributes=Object.entries(d.attributes||{}).map(([k,v])=>`<span>+${v} ${esc(k)}</span>`).join('');
    return `<div class="inspector-item-stats"><span>${esc(d.quality)} · ${esc(d.binding)}</span><div class="inspector-item-line"><strong>${esc(d.slot)} · ${esc(d.armorType)}</strong><b>Requires level ${d.required}</b></div>
      ${isNum(d.armor)?`<p>${d.armor} Armor</p>`:''}
      ${d.weapon?`<div class="inspector-weapon-line"><strong>${d.weapon.min}–${d.weapon.max} Damage</strong><strong>Speed ${d.weapon.speed.toFixed(2)}</strong><strong>${d.weapon.dps.toFixed(1)} DPS</strong></div>`:''}
      <div class="inspector-attributes">${attributes}</div><p class="inspector-item-origin">Obtain: ${esc(d.origin)}</p><small>${esc(d.verified)}</small><a href="${esc(d.source)}" target="_blank" rel="noreferrer">Verify item tooltip ↗</a></div>`;
  }
  const controls=document.createElement('div');controls.className='inspector-level-controls';
  controls.innerHTML='<label for="spellCharacterLevel">CHARACTER LEVEL <output id="spellCharacterOutput">30</output></label><input type="range" id="spellCharacterLevel" min="1" max="60" value="30" step="1"><label class="inspector-only"><input type="checkbox" id="spellOnlyKnown"> Show only client-listed by level</label><p>Slider updates listed spell levels and verified rank tooltips. Client presence alone ≠ guaranteed trainable.</p>';
  const tools=document.querySelector('.booktools');tools?.after(controls);
  const originalRows=bookRows,originalTip=showTip;
  function decorateRows(){
    document.querySelectorAll('#spellRows .spellrow').forEach(button=>{
      const s=SPELLBOOK.classes[bookClass][Number(button.dataset.spell)];if(!s)return;
      const r=spellRank(s,playerLevel,bookClass);
      if(onlyAvailable&&r.total&&r.listed===0){button.hidden=true;return;}
      if(onlyAvailable&&!r.total){button.hidden=true;return;}
      button.classList.toggle('inspector-locked',r.total>0&&r.listed===0);
      const subtitle=button.querySelector('.spellidentity small');
      if(subtitle){const label=document.createElement('span');label.className='inspector-row-rank';
        label.textContent=r.total?` · Lv ${r.first} · ${r.listed}/${r.total} listed by ${playerLevel}${r.next?' · next '+r.next:''}`:' · training unconfirmed';subtitle.append(label);}
    });
    if(onlyAvailable){const visible=document.querySelectorAll('#spellRows .spellrow:not([hidden])').length;
      document.querySelector('#bookCounts').textContent+=` · ${visible} client-listed by level ${playerLevel}`;}
  }
  bookRows=function(){originalRows();decorateRows();};
  showTip=function(trigger,pin=false){originalTip(trigger,pin);if(tip.hidden)return;
    const s=SPELLBOOK.classes[bookClass][Number(trigger.dataset.spell)];if(!s)return;
    const node=document.createElement('div');node.innerHTML=rankMarkup(s,playerLevel,bookClass);tip.append(node);
    const w=Math.min(440,innerWidth-24);tip.style.width=w+'px';
    const h=Math.min(tip.scrollHeight,innerHeight-25);tip.style.maxHeight=(innerHeight-25)+'px';tip.style.overflowY='auto';
    const r=trigger.getBoundingClientRect();tip.style.left=Math.max(12,Math.min(innerWidth-w-12,r.right-w/2))+'px';
    tip.style.top=Math.max(12,Math.min(innerHeight-h-12,r.bottom+8))+'px';
  };
  function onLevel(value){playerLevel=Math.min(60,Math.max(1,Number(value)||1));controls.querySelector('#spellCharacterOutput').textContent=String(playerLevel);
    const other=document.querySelector('#gearLevel');
    if(other&&Number(other.value)!==playerLevel){other.value=String(playerLevel);other.dispatchEvent(new Event('input',{bubbles:true}));}
    try{localStorage.setItem('forever-character-level',String(playerLevel));}catch{}
    bookRows();}
  try{const saved=Number(localStorage.getItem('forever-character-level'));if(saved>=1&&saved<=60)playerLevel=saved;}catch{}
  controls.querySelector('#spellCharacterLevel').value=String(playerLevel);
  controls.querySelector('#spellCharacterOutput').textContent=String(playerLevel);
  controls.querySelector('#spellCharacterLevel').addEventListener('input',e=>onLevel(e.target.value));
  controls.querySelector('#spellOnlyKnown').addEventListener('change',e=>{onlyAvailable=e.target.checked;bookRows();});
  document.querySelector('#gearLevel')?.addEventListener('input',e=>{const val=Number(e.target.value);
    if(val===playerLevel)return;playerLevel=val;controls.querySelector('#spellCharacterLevel').value=String(val);
    controls.querySelector('#spellCharacterOutput').textContent=String(val);bookRows();});
  window.FOREVER_INSPECTOR={itemStats,spellStats,rankMarkup,itemMarkup,spellRank,
    get level(){return playerLevel;},set level(v){onLevel(v);}};
  bookRows();
})();
