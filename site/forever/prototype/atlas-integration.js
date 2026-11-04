/* Forever Valley Atlas — nine-class tree over the full Valley of Trials model.
   Source data is shared with the main Launch Room, not a separate Rogue demo. */
(() => {
  'use strict';
  const classes = DATA.classes.map(row => row[0]);
  const classData = new Map(DATA.classes.map(row => [row[0],row]));
  const qs = new URLSearchParams(location.search);
  let currentClass = classes.includes(qs.get('class')) ? qs.get('class') : 'Rogue';
  let search = '', selectedSpell = -1;
  const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[ch]));
  const getClassList = () => {
    const list = SPELLBOOK.classes[currentClass].map(s => ({...s, levels:s.clientLevels || []}));
    const known = new Map(list.map((s, i) => [s.name.toLowerCase(),i]));
    const records = window.FOREVER_CLIENT_SPELLS?.classes?.[currentClass] || [];
    const fallback = list.find(s => s.icon)?.icon || 'spell_holy_power';
    for (const record of records) {
      const i = known.get(record.name.toLowerCase());
      const ranks = `${record.ranks} ${record.ranks===1?'rank':'ranks'} · ${record.levels?.length?'levels '+record.levels.join(', '):'no trainer level'}`;
      if (i !== undefined) { list[i].clientRanks = ranks;list[i].levels = record.levels || [];continue; }
      known.set(record.name.toLowerCase(),list.length);
      list.push({name:record.name,status:'Client',spec:record.tag === 'talent'?'Talent · client data':'Client spell',
        icon:fallback,effect:record.noTrainer?'Present in the client table; this does not confirm that it can be learned.':'Present in the client spell table. See the trainer levels and ranks below.',
        meta:ranks,clientRanks:ranks,levels:record.levels || [],source:null});
    }
    return list;
  };
  let entries = getClassList();
  const fallbackImpact = (s) => {
    if(s.status === 'New' || s.status === 'Baseline') return {type:'Buff'};
    if(s.status === 'Removed') return {type:'Removed'};
    if(s.status === 'Changed') return {type:'Rework'};
    return {type:s.status};
  };
  const classify = s => {
    try {
      if (parent !== window && typeof parent.FOREVER_IMPACT === 'function') return parent.FOREVER_IMPACT(s,currentClass);
    } catch { /* Standalone tree uses the documented status, without guessing direction. */ }
    return fallbackImpact(s);
  };
  const glyph = name => ({
    Warrior:'ability_warrior_battleshout',Paladin:'spell_holy_holybolt',Hunter:'ability_hunter_quickshot',
    Rogue:'ability_stealth',Priest:'spell_holy_powerwordshield',Shaman:'spell_nature_lightning',
    Mage:'spell_frost_frostbolt02',Warlock:'spell_shadow_shadowandflame',Druid:'ability_druid_catform'
  })[name] || entries[0]?.icon || 'spell_holy_power';
  const iconPath = icon => '../icons/'+encodeURIComponent(icon || 'spell_holy_power')+'.jpg';
  const classChoice = document.createElement('label');
  classChoice.className = 'atlas-class-choice';
  classChoice.innerHTML = '<span>CLASS</span><select id="atlasClass" aria-label="Choose class">'+classes.map(c=>'<option>'+c+'</option>').join('')+'</select>';
  document.querySelector('.viewbar').prepend(classChoice);
  const jump = document.createElement('button'); jump.className='action';jump.type='button';jump.id='atlasJump';jump.textContent='Open class desk ↗';
  document.querySelector('.viewbar').append(jump);
  const legend = document.createElement('div');legend.className='atlas-legend';
  legend.innerHTML='<span class="buff">+ BUFF / NEW</span><span class="nerf">− NERF / REMOVED</span><span class="rework">↔ REWORK</span><span class="client">◈ CLIENT DATA</span>';
  document.querySelector('.viewbar').after(legend);
  const side = document.querySelector('aside');
  const tooltip = document.createElement('div');tooltip.id='atlasTooltip';tooltip.hidden=true;tooltip.setAttribute('role','tooltip');document.body.append(tooltip);
  const iconNode = (name, parentName, x, y, icon, hint) => [name,parentName,x,y,icon,hint];
  function buildGraph(){
    const specs=classData.get(currentClass)[3].split(' / ');
    return [
      iconNode(currentClass,null,50,8,glyph(currentClass),'Class overview and role'),
      iconNode('Spellbook',currentClass,18,30,entries.find(s=>s.status==='New')?.icon || glyph(currentClass),'All abilities, icons and tooltips'),
      iconNode('Builds',currentClass,50,30,entries.find(s=>s.spec?.includes(specs[0]))?.icon || glyph(currentClass),'Explore the three specializations'),
      iconNode('Upgrades',currentClass,82,30,'inv_sword_27','Leveling upgrade routes'),
      iconNode('All spells','Spellbook',8,59,glyph(currentClass),'Full searchable class spellbook'),
      iconNode('Buffs & new','Spellbook',20,59,entries.find(s=>s.status==='New')?.icon || glyph(currentClass),'Positive additions and documented buffs'),
      iconNode('Nerfs & removed','Spellbook',32,59,entries.find(s=>s.status==='Removed')?.icon || glyph(currentClass),'Negative changes and removed abilities'),
      iconNode(specs[0],'Builds',43,59,entries.find(s=>s.spec?.includes(specs[0]))?.icon || glyph(currentClass),'Explore '+specs[0]),
      iconNode(specs[1],'Builds',55,59,entries.find(s=>s.spec?.includes(specs[1]))?.icon || glyph(currentClass),'Explore '+specs[1]),
      iconNode(specs[2],'Builds',66,59,entries.find(s=>s.spec?.includes(specs[2]))?.icon || glyph(currentClass),'Explore '+specs[2]),
      iconNode('Weapon DPS','Upgrades',81,59,'inv_sword_27','Compare real tooltip weapon DPS'),
      iconNode('Gear routes','Upgrades',94,59,'inv_scroll_03','Suggested leveling equipment to verify')
    ];
  }
  const goToDesk = target => {
    if(parent !== window){
      parent.postMessage({type:'forever:atlas-navigate',target,className:currentClass},location.origin);
    } else {
      location.href='../#'+(target==='upgrades'?'upgrades':'classes');
    }
  };
  jump.onclick = () => goToDesk('class');
  const badge = type => '<span class="atlas-badge atlas-'+safe(type.toLowerCase())+'">'+({
    Buff:'↑ BUFF',New:'+ NEW',Nerf:'↓ NERF',Removed:'× REMOVED',
    Rework:'↔ REWORK',Client:'CLIENT DATA',Classic:'CLASSIC REFERENCE'
  }[type] || safe(type))+'</span>';
  const classSpells = predicate => entries.map((s,i)=>({...s,i,impact:classify(s)})).filter(predicate);
  function spellsPanel(name){
    const pred = s => name==='Buffs & new'?['New','Buff'].includes(s.impact.type)
      :name==='Nerfs & removed'?['Nerf','Removed'].includes(s.impact.type):true;
    const filtered=classSpells(pred).filter(s=>`${s.name} ${s.spec} ${s.effect} ${s.meta}`.toLowerCase().includes(search.toLowerCase()));
    const counts=classSpells(pred).length;
    return '<div class="atlas-heading"><span class="tag">FOREVER / '+safe(currentClass)+'</span><h2>'+safe(name)+'</h2><p>'+counts+' entries · documented changes and client spell records</p></div>'+
      '<label class="atlas-search"><span>SEARCH THE SPELLBOOK</span><input id="atlasSpellSearch" placeholder="Name, effect, specialization…" type="search" value="'+safe(search)+'"></label>'+
      '<div class="atlas-counts"><span>'+classSpells(s=>['Buff','New'].includes(s.impact.type)).length+' buffs / new</span><span>'+classSpells(s=>['Nerf','Removed'].includes(s.impact.type)).length+' nerfs / removed</span><span>'+entries.length+' total</span></div>'+
      '<div class="atlas-spell-grid">'+filtered.map(s=>'<button class="atlas-spell" data-spell-index="'+s.i+'" type="button" aria-label="'+safe(s.name)+' details" title="'+safe(s.name)+' · '+safe(s.effect)+'"><img loading="lazy" src="'+iconPath(s.icon)+'" alt="" onerror="this.hidden=true"><span>'+safe(s.name)+'</span>'+badge(s.impact.type)+'</button>').join('')+'</div>'+
      (!filtered.length?'<p class="muted">No spells match. Clear the search to see all entries.</p>':'')+
      '<p class="atlas-disclaimer">Client presence does not prove an ability is trainable. Icons are representative and exact values may change.</p>';
  }
  function spellDetails(index){
    const s=entries[index];if(!s)return;
    const imp=classify(s);
    const src=SPELLBOOK.sources[s.source];
    const content='<div class="atlas-spell-detail"><div class="atlas-detail-title"><img src="'+iconPath(s.icon)+'" alt=""><div><span class="tag">'+safe(s.spec)+'</span><h2>'+safe(s.name)+'</h2></div></div>'+badge(imp.type)+
      (imp.before&&imp.after?'<div class="atlas-before-after"><div><small>BEFORE</small><p>'+safe(imp.before)+'</p></div><div><small>FOREVER</small><p class="'+(imp.type==='Buff'?'buff':imp.type==='Nerf'?'nerf':'')+'">'+safe(imp.after)+'</p></div></div>':'')+
      '<p>'+safe(s.effect)+'</p>'+(s.clientRanks?'<div class="atlas-meta"><b>Client ranks / training</b><p>'+safe(s.clientRanks)+'</p></div>':'')+
      (s.meta?'<p class="atlas-meta">'+safe(s.meta)+'</p>':'')+
      (src?'<p class="atlas-source">Source: <a href="'+safe(src.url)+'" target="_blank" rel="noreferrer">'+safe(src.label)+'</a> · '+safe(src.date)+'</p>':'<p class="atlas-source">Client spell table · build 1.60.1.70753</p>')+
      '<button type="button" class="action" data-back-spells>← Back to spell icons</button></div>';
    detail.innerHTML='<div class="detail">'+content+'</div>';
    selectedSpell=index;
  }
  function panelFor(name){
    const c=classData.get(currentClass);
    const next=nodes.filter(n=>n[1]===name).map(n=>n[0]);
    if(['Spellbook','All spells','Buffs & new','Nerfs & removed'].includes(name))return spellsPanel(name);
    if(name==='Upgrades'||name==='Weapon DPS'||name==='Gear routes')
      return '<span class="tag">LEVELING INTELLIGENCE</span><h2>'+safe(name)+'</h2><p>Use your class, specialization and level in the Launch Room to see nearby dungeon/quest gear targets.</p><p class="atlas-disclaimer">These are provisional Classic-era progression routes, not verified Forever BiS.</p><div class="actions"><button class="action" data-desk="upgrades">Open '+safe(currentClass)+' upgrades ↗</button></div>'+
        (name==='Weapon DPS'?'<div class="atlas-weapon"><label>Current weapon DPS<input id="atlasDpsOld" type="number" min="0" step=".1" placeholder="e.g. 24.8"></label><label>Candidate DPS<input id="atlasDpsNew" type="number" min="0" step=".1" placeholder="e.g. 29.1"></label><output id="atlasDpsResult">Enter both weapon values</output></div>':'');
    if(name==='Builds'||name===currentClass)
      return '<span class="tag">'+safe(c[2])+'</span><h2>'+safe(name)+'</h2><p>'+safe(c[4])+'</p><p>'+safe(c[5])+'</p><div class="actions">'+next.map(n=>'<button class="action" data-next="'+safe(n)+'">'+safe(n)+' ↗</button>').join('')+'</div><p class="atlas-disclaimer">PvP and PvE potential are hypotheses until launch logs and gameplay confirm performance.</p>';
    return '<span class="tag">SPECIALIZATION / '+safe(currentClass)+'</span><h2>'+safe(name)+'</h2><p>'+safe(c[7])+'</p><p>'+safe(c[6])+'</p><button type="button" class="action" data-next="Spellbook">Inspect '+safe(currentClass)+' spells ↗</button><button type="button" class="action" data-desk="upgrades">See leveling gear ↗</button>';
  }
  panel = panelFor;
  select = function(name) {
    if(!byName.has(name))return;
    activeNode=name;
    const route=[];
    for(let n=name;n;n=byName.get(n)?.[1])route.unshift(n);
    lines.querySelectorAll('.trace').forEach(el=>el.remove());
    for(const [key,b] of buttons){b.classList.toggle('hot',route.includes(key));b.setAttribute('aria-pressed',String(name===key));}
    for(const [key,w] of wires)w.classList.toggle('on',route.includes(key));
    route.slice(1).forEach((n,i)=>{const wire=wires.get(n);if(!wire)return;const pulse=pathElement(wire.getAttribute('d'),'trace');pulse.dataset.target=n;pulse.setAttribute('pathLength','1');pulse.style.animationDelay=i*.14+'s';pulse.onanimationend=()=>pulse.remove();});
    document.querySelector('#crumb').textContent=route.join(' / ');
    detail.innerHTML='<div class="detail">'+panelFor(name)+'</div>';
    selectedSpell=-1;search='';
    window.dispatchEvent(new CustomEvent('atlas-select',{detail:name}));
  };
  function rebuild(){
    entries=getClassList();search='';selectedSpell=-1;
    const graph=buildGraph();
    nodes.splice(0,nodes.length,...graph);buttons.clear();wires.clear();byName.clear();
    for(const n of nodes)byName.set(n[0],n);
    board.querySelectorAll('.node').forEach(el=>el.remove());lines.replaceChildren();
    for(const [name,parentName,x,y,icon,hint] of nodes){
      if(parentName){const [, ,px,py]=byName.get(parentName),mid=(py+y)/2;wires.set(name,pathElement('M '+px+' '+py+' V '+mid+' H '+x+' V '+y,'wire'));}
      const b=document.createElement('button');b.type='button';b.className='node';b.style.left=x+'%';b.style.top=y+'%';
      b.setAttribute('aria-label',name+' — '+hint);
      b.innerHTML='<span class="face"><img src="'+iconPath(icon)+'" alt="" onerror="this.hidden=true"></span><strong>'+safe(name)+'</strong><span class="tip">'+safe(hint)+'</span>';
      b.onclick=()=>select(name);board.append(b);buttons.set(name,b);
    }
    document.querySelector('h1').textContent=currentClass+' · Forever atlas';
    document.title=currentClass+' | Forever Valley Atlas';
    document.querySelector('#atlasClass').value=currentClass;
    document.documentElement.style.setProperty('--class-tint',classData.get(currentClass)[1]);
    const url=new URL(location.href);url.searchParams.set('class',currentClass);history.replaceState(null,'',url);
    if(parent!==window)parent.postMessage({type:'forever:atlas-class',className:currentClass},location.origin);
    select(currentClass);
    window.dispatchEvent(new Event('atlas-tree-change'));
  }
  document.querySelector('#atlasClass').addEventListener('change',e=>{currentClass=e.target.value;rebuild();});
  detail.addEventListener('click',e=>{
    const spell=e.target.closest('[data-spell-index]');
    if(spell){spellDetails(Number(spell.dataset.spellIndex));return;}
    if(e.target.closest('[data-back-spells]')){select('Spellbook');return;}
    const go=e.target.closest('[data-desk]');if(go)goToDesk(go.dataset.desk);
  });
  detail.addEventListener('input',e=>{
    if(e.target.id==='atlasSpellSearch'){
      search=e.target.value;
      const name=activeNode;
      const start=e.target.selectionStart;
      detail.innerHTML='<div class="detail">'+spellsPanel(name)+'</div>';
      const input=detail.querySelector('#atlasSpellSearch');input.focus();input.setSelectionRange(start,start);
    }
    if(['atlasDpsOld','atlasDpsNew'].includes(e.target.id)){
      const old=Number(detail.querySelector('#atlasDpsOld')?.value),next=Number(detail.querySelector('#atlasDpsNew')?.value);
      const out=detail.querySelector('#atlasDpsResult');const diff=old>0&&next>0?(next/old-1)*100:null;
      out.textContent=diff===null?'Enter both weapon values':`${diff>=0?'+':''}${diff.toFixed(1)}% weapon DPS`;
      out.className=diff===null?'':diff>=0?'buff':'nerf';
    }
  });
  detail.addEventListener('mouseover',e=>{
    const el=e.target.closest('[data-spell-index]');if(!el)return;
    const s=entries[Number(el.dataset.spellIndex)];if(!s)return;
    tooltip.innerHTML='<strong>'+safe(s.name)+'</strong><p>'+safe(s.effect)+'</p>'+badge(classify(s).type);
    const r=el.getBoundingClientRect();
    tooltip.style.left=Math.min(innerWidth-282,Math.max(8,r.left-290))+'px';
    tooltip.style.top=Math.max(8,Math.min(innerHeight-160,r.top))+'px';
    tooltip.hidden=false;
  });
  detail.addEventListener('mouseout',e=>{if(e.target.closest('[data-spell-index]'))tooltip.hidden=true;});
  detail.addEventListener('focusin',e=>{const el=e.target.closest('[data-spell-index]');if(el)el.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));});
  detail.addEventListener('focusout',()=>tooltip.hidden=true);
  rebuild();
})();
