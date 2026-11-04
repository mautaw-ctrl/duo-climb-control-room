/* Forever Valley Atlas — nine-class tree over the full Valley of Trials model.
   Source data is shared with the main Launch Room, not a separate Rogue demo. */
(() => {
  'use strict';
  const advancedStyle=document.createElement('link');advancedStyle.rel='stylesheet';advancedStyle.href='../forever-inspector.css?v=1';document.head.append(advancedStyle);
  const atlasStyles=document.createElement('link');atlasStyles.rel='stylesheet';atlasStyles.href='atlas-integration.css?v=6';document.head.append(atlasStyles);
  const classes = DATA.classes.map(row => row[0]);
  const classData = new Map(DATA.classes.map(row => [row[0],row]));
  const qs = new URLSearchParams(location.search);
  let currentClass = classes.includes(qs.get('class')) ? qs.get('class') : 'Rogue';
  let search = '', selectedSpell = -1,frameLevel=30,frameOnlyAvailable=false;
  const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
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
  const inspector=()=>{try{return parent.FOREVER_INSPECTOR}catch{return null}};
  const spellLevelInfo=s=>inspector()?.spellRank?.(s,frameLevel,currentClass) || (()=>{
    const levels=[...new Set(s.levels||[])].sort((a,b)=>a-b);
    return {listed:levels.filter(n=>n<=frameLevel).length,total:levels.length,next:levels.find(n=>n>frameLevel)};
  })();
  const itemInfo=name=>inspector()?.itemMarkup?.(name)||'<p class="atlas-disclaimer">Exact Forever item statistics have not yet been confirmed for this item.</p>';
  const wowItemIcon = name => 'https://wow.zamimg.com/images/wow/icons/large/'+encodeURIComponent(name)+'.jpg';
  const iconForGear=(slot='',name='')=>{
    const text=(slot+' '+name).toLowerCase();
    if(/staff/.test(text))return 'inv_staff_01';if(/bow/.test(text))return 'inv_weapon_bow_07';
    if(/gun/.test(text))return 'inv_weapon_rifle_04';if(/shield/.test(text))return 'inv_shield_04';
    if(/dagger/.test(text))return 'inv_weapon_shortblade_05';if(/axe/.test(text))return 'inv_axe_06';
    if(/mace|hammer/.test(text))return 'inv_mace_01';if(/ring/.test(text))return 'inv_jewelry_ring_03';
    if(/hands|gloves/.test(text))return 'inv_gauntlets_05';if(/feet|boots/.test(text))return 'inv_boots_05';
    if(/legs|leggings/.test(text))return 'inv_pants_06';if(/waist|belt/.test(text))return 'inv_belt_04';
    if(/head|helm/.test(text))return 'inv_helmet_03';if(/chest|armor/.test(text))return 'inv_chest_leather_03';
    return 'inv_sword_27';
  };
  const setIconName = armor => ({Plate:'inv_chest_plate02',Mail:'inv_chest_chain_05',Leather:'inv_chest_leather_03',Cloth:'inv_chest_cloth_07',Jewelry:'inv_jewelry_ring_03'})[armor]||'inv_misc_gem_01';
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
      iconNode('Gear routes','Upgrades',73,59,'inv_sword_27','Leveling items and acquisition routes'),
      iconNode('Item sets','Upgrades',84,59,'inv_scroll_03','Set pieces and bonus thresholds'),
      iconNode('Professions','Upgrades',95,59,'spell_nature_enchantarmor','Crafting and gathering suggestions'),
      iconNode('Weapon DPS','Gear routes',73,82,'inv_sword_27','Compare real tooltip weapon DPS'),
      iconNode('Library Books','Upgrades',84,82,'inv_misc_book_09','Reported books with maps, coordinates and research rewards'),
      iconNode('Camp items','Professions',95,82,'spell_nature_strengthofearthtotem02','Profession-made camping tools and bonuses')
    ];
  }
  const goToDesk = target => {
    if(parent !== window){
      parent.postMessage({type:'forever:atlas-navigate',target,className:currentClass},location.origin);
    } else {
      location.href='../#'+(['upgrades','sets','professions','library'].includes(target)?target:'classes');
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
    const filtered=classSpells(pred).filter(s=>`${s.name} ${s.spec} ${s.effect} ${s.meta}`.toLowerCase().includes(search.toLowerCase())
      &&(!frameOnlyAvailable||spellLevelInfo(s).listed>0));
    const counts=classSpells(pred).length;
    return '<div class="atlas-heading"><span class="tag">FOREVER / '+safe(currentClass)+'</span><h2>'+safe(name)+'</h2><p>'+counts+' entries · documented changes and client spell records</p></div>'+
      '<label class="atlas-search"><span>SEARCH THE SPELLBOOK</span><input id="atlasSpellSearch" placeholder="Name, effect, specialization…" type="search" value="'+safe(search)+'"></label>'+
      '<div class="atlas-level-control"><label for="atlasSpellLevel">CHARACTER LEVEL <output>'+frameLevel+'</output></label><input id="atlasSpellLevel" type="range" min="1" max="60" value="'+frameLevel+'"><label><input type="checkbox" id="atlasOnlyKnown" '+(frameOnlyAvailable?'checked':'')+'> Listed by this level</label></div>'+
      '<div class="atlas-counts"><span>'+classSpells(s=>['Buff','New'].includes(s.impact.type)).length+' buffs / new</span><span>'+classSpells(s=>['Nerf','Removed'].includes(s.impact.type)).length+' nerfs / removed</span><span>'+entries.length+' total</span></div>'+
      '<div class="atlas-spell-grid">'+filtered.map(s=>{const rank=spellLevelInfo(s);return '<button class="atlas-spell '+(rank.total&&!rank.listed?'atlas-untrained':'')+'" data-spell-index="'+s.i+'" type="button" aria-label="'+safe(s.name)+' details"><img loading="lazy" src="'+iconPath(s.icon)+'" alt=""><span>'+safe(s.name)+'</span><small class="atlas-rank-label">'+(rank.total?(rank.listed+'/'+rank.total+' levels'+(rank.next?' · next '+rank.next:'')):'Trainer unconfirmed')+'</small>'+badge(s.impact.type)+'</button>';}).join('')+'</div>'+
      (!filtered.length?'<p class="muted">No spells match. Clear the search to see all entries.</p>':'')+
      '<p class="atlas-disclaimer">Client presence does not prove an ability is trainable. Icons are representative and exact values may change.</p>';
  }
  function spellDetails(index){
    const s=entries[index];if(!s)return;
    const imp=classify(s);
    const src=SPELLBOOK.sources[s.source];
    const content='<div class="atlas-spell-detail"><div class="atlas-detail-title"><img src="'+iconPath(s.icon)+'" alt=""><div><span class="tag">'+safe(s.spec)+'</span><h2>'+safe(s.name)+'</h2></div></div>'+badge(imp.type)+
      (imp.before&&imp.after?'<div class="atlas-before-after"><div><small>BEFORE</small><p>'+safe(imp.before)+'</p></div><div><small>FOREVER</small><p class="'+(imp.type==='Buff'?'buff':imp.type==='Nerf'?'nerf':'')+'">'+safe(imp.after)+'</p></div></div>':'')+
      '<p>'+safe(s.effect)+'</p>'+(inspector()?.rankMarkup?.(s,frameLevel,currentClass)||'')+(s.clientRanks?'<div class="atlas-meta"><b>Client ranks / training</b><p>'+safe(s.clientRanks)+'</p></div>':'')+
      (s.meta?'<p class="atlas-meta">'+safe(s.meta)+'</p>':'')+
      (src?'<p class="atlas-source">Source: <a href="'+safe(src.url)+'" target="_blank" rel="noreferrer">'+safe(src.label)+'</a> · '+safe(src.date)+'</p>':'<p class="atlas-source">Client spell table · build 1.60.1.70753</p>')+
      '<button type="button" class="action" data-back-spells>← Back to spell icons</button></div>';
    detail.innerHTML='<div class="detail">'+content+'</div>';
    selectedSpell=index;
  }
  function itemDetails(name){
    let armory;try{armory=parent.FOREVER_ARMORY}catch{armory=null}
    let gear;try{gear=(parent.FOREVER_GEAR_ITEMS||[]).find(i=>i.name===name)}catch{gear=null}
    const group=(armory?.sets||[]).find(s=>s.pieces.some(p=>p.name===name));
    const slot=gear?.slot||group?.pieces.find(p=>p.name===name)?.slot||'';
    detail.innerHTML='<div class="detail"><div class="atlas-spell-detail"><div class="atlas-detail-title"><img src="'+wowItemIcon(iconForGear(slot,name))+'" alt=""><div><span class="tag">ITEM RESEARCH / '+safe(slot||group?.name||'GEAR')+'</span><h2>'+safe(name)+'</h2></div></div>'+
      '<p class="atlas-route">'+safe(gear?'Where to investigate: '+gear.source:group?'From: '+group.origin:'Acquisition not source-verified')+'</p>'+
      itemInfo(name)+'<p class="atlas-disclaimer">A numerical item tooltip is shown only when a Forever database source supports it. Confirm obtainable loot, drop changes and stat weights in-game.</p>'+
      '<button type="button" class="action" data-next="'+(group?'Item sets':'Gear routes')+'">← Back to '+(group?'sets':'gear routes')+'</button></div></div>';
  }
  function panelFor(name){
    const c=classData.get(currentClass);
    const next=nodes.filter(n=>n[1]===name).map(n=>n[0]);
    if(['Spellbook','All spells','Buffs & new','Nerfs & removed'].includes(name))return spellsPanel(name);
    let armory;
    try{armory=parent.FOREVER_ARMORY}catch{armory=null}
    if(name==='Item sets'){
      const level=frameLevel;
      const sets=(armory?.sets||[]).filter(s=>s.who.includes(currentClass)).sort((a,b)=>Math.abs(a.from-level)-Math.abs(b.from-level)).slice(0,4);
      return '<span class="tag">ARMORY / '+safe(currentClass)+'</span><h2>Item sets</h2><p>Nearby set routes at level '+level+'. Hover individual pieces for their attributes, tier bonuses and reported acquisition.</p>'+
        '<div class="atlas-quick-list">'+(sets.length?sets.map(s=>'<div class="atlas-set-preview"><img src="'+wowItemIcon(setIconName(s.armor))+'" alt=""><span><b>'+safe(s.name)+'</b><small>'+s.count+' pieces · levels '+s.from+'–'+s.to+' · '+safe(s.status)+'</small><small class="atlas-bonus-caption">'+safe(s.bonuses.slice(0,2).map(b=>b[0]+'p: '+b[1]).join(' · ')||'Bonuses require research')+'</small></span></div>'+
          (s.pieces.length?'<div class="atlas-set-pieces">'+s.pieces.map(p=>'<button type="button" data-armory-item="'+safe(p.name)+'" title="Inspect '+safe(p.name)+'"><img src="'+wowItemIcon(iconForGear(p.slot,p.name))+'" alt="">'+safe(p.name)+'</button>').join('')+'</div>':'<small class="atlas-disclaimer">Individual pieces not yet reliably recorded.</small>')).join(''):'<p class="muted">Curated set list in the Launch Room.</p>')+'</div>'+ 
        '<button class="action" data-desk="sets">Open set bonuses & pieces ↗</button><p class="atlas-disclaimer">Reported sets may have unconfirmed pieces or bonus data.</p>';
    }
    if(name==='Library Books'){
      const books=parent?.FOREVER_LIBRARY?.entries?.length||39;
      return '<span class="tag">LIBRARY ATLAS / RESEARCH ROUTE</span><h2>Library Books</h2><p>'+books+' research records with zone images, marked waypoints, filters and rewards for 10, 20 and 25 books handed in.</p><p class="atlas-route">Picked-up marks do not count toward reward thresholds. Copy a /way command from each location card to paste in-game with TomTom.</p><button class="action" data-desk="library">Open Library Atlas ↗</button>';
    }
    if(name==='Professions'||name==='Camp items'){
      const pairs=armory?.pairs?.[currentClass]||[];
      const names=name==='Camp items'?[...new Set(pairs.flatMap(pair=>pair.slice(0,2)))]:[];
      const professions=(armory?.professions||[]).filter(p=>names.includes(p.name));
      return '<span class="tag">CRAFTING / '+safe(currentClass)+'</span><h2>'+safe(name)+'</h2><p>Two primary professions are available. Cooking, Fishing and First Aid are secondary choices. Suggestions reflect your leveling goals, not measured BiS.</p>'+
        '<div class="atlas-quick-list">'+(name==='Camp items'?professions.map(p=>'<button type="button" data-armory-prof="'+safe(p.name)+'"><img src="'+wowItemIcon(p.icon)+'" alt=""><span><b>'+safe(p.camp)+'</b><small>'+safe(p.name)+' · skill '+p.skill+' · '+safe(p.effect)+'</small></span></button>').join(''):
          (pairs.length?pairs.map(pair=>{const prof=(armory?.professions||[]).find(p=>p.name===pair[0]);return '<div><img src="'+wowItemIcon(prof?.icon||'inv_misc_gem_01')+'" alt=""><span><b>'+safe(pair[0]+' + '+pair[1])+'</b><small>'+safe(pair[2]+' · '+pair[3])+'</small></span></div>'}).join(''):'<p class="muted">Choose a profession pair in the Launch Room.</p>'))+'</div>'+ 
        '<div class="actions">'+(name==='Professions'?'<button class="action" data-next="Camp items">Explore camp items ↗</button>':'')+'<button class="action" data-desk="professions">All professions & item tooltips ↗</button></div>';
    }
    if(name==='Upgrades'||name==='Weapon DPS'||name==='Gear routes'){
      const roles={Warrior:['Warrior','Two-hand','Melee','Tank'],Paladin:['Paladin','Two-hand','Melee','Tank'],Hunter:['Hunter','Melee'],Rogue:['Melee'],Priest:['Healer','Caster'],Shaman:['Healer','Caster','Two-hand','Melee'],Mage:['Caster'],Warlock:['Caster'],Druid:['Feral','Tank','Caster','Healer']};
      let gear=[];try{gear=(parent.FOREVER_GEAR_ITEMS||[]).filter(i=>i.profiles.some(p=>roles[currentClass]?.includes(p))).sort((a,b)=>Math.abs(a.from-frameLevel)-Math.abs(b.from-frameLevel)).slice(0,6)}catch{}
      return '<span class="tag">LEVELING INTELLIGENCE / LV '+frameLevel+'</span><h2>'+safe(name)+'</h2><p>Quest and dungeon equipment worth investigating near your level. Hover to inspect item statistics; click to pin the full item panel.</p><p class="atlas-disclaimer">These are provisional progression routes, not verified Forever BiS.</p><div class="actions">'+next.map(n=>'<button class="action" data-next="'+safe(n)+'">'+safe(n)+' ↗</button>').join('')+'<button class="action" data-desk="upgrades">Open '+safe(currentClass)+' upgrades ↗</button></div>'+
        (name!=='Weapon DPS'?'<div class="atlas-quick-list">'+gear.map(i=>'<button type="button" data-armory-item="'+safe(i.name)+'"><img src="'+wowItemIcon(iconForGear(i.slot,i.name))+'" alt=""><span><b>'+safe(i.name)+'</b><small>Lv '+i.from+'–'+i.to+' · '+safe(i.slot)+'</small><small class="atlas-route">'+safe(i.source)+'</small></span></button>').join('')+'</div>':'')+
        (name==='Weapon DPS'?'<div class="atlas-weapon"><label>Current weapon DPS<input id="atlasDpsOld" type="number" min="0" step=".1" placeholder="e.g. 24.8"></label><label>Candidate DPS<input id="atlasDpsNew" type="number" min="0" step=".1" placeholder="e.g. 29.1"></label><output id="atlasDpsResult">Enter both weapon values</output></div>':'');
    }
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
      b.innerHTML='<span class="face"><img src="'+iconPath(icon)+'" alt="" onerror="this.onerror=null;this.src=\'../icons/spell_holy_power.jpg\'"></span><strong>'+safe(name)+'</strong><span class="tip">'+safe(hint)+'</span>';
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
    const item=e.target.closest('[data-armory-item]');
    if(item){tooltip.hidden=true;itemDetails(item.dataset.armoryItem);return;}
    if(e.target.closest('[data-armory-set]')){goToDesk('sets');return;}
    if(e.target.closest('[data-armory-prof]')){goToDesk('professions');return;}
    if(e.target.closest('[data-back-spells]')){select('Spellbook');return;}
    const go=e.target.closest('[data-desk]');if(go)goToDesk(go.dataset.desk);
  });
  detail.addEventListener('error',e=>{
    const image=e.target;
    if(!(image instanceof HTMLImageElement))return;
    const fallback=iconPath(glyph(currentClass));
    if(image.src===new URL(fallback,location.href).href){image.hidden=true;return;}
    image.src=fallback;
  },true);
  detail.addEventListener('input',e=>{
    if(e.target.id==='atlasSpellLevel'){
      frameLevel=Number(e.target.value);
      try{if(inspector())inspector().level=frameLevel}catch{}
      const previous=detail.querySelector('.atlas-spell-grid')?.scrollTop||0;
      detail.innerHTML='<div class="detail">'+spellsPanel(activeNode)+'</div>';
      detail.querySelector('.atlas-spell-grid')?.scrollTo({top:previous});
      detail.querySelector('#atlasSpellLevel')?.focus();return;
    }
    if(e.target.id==='atlasOnlyKnown'){
      frameOnlyAvailable=e.target.checked;
      detail.innerHTML='<div class="detail">'+spellsPanel(activeNode)+'</div>';return;
    }
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
    const gearEl=e.target.closest('[data-armory-set],[data-armory-prof],[data-armory-item]');
    if(gearEl){
      let armory;try{armory=parent.FOREVER_ARMORY}catch{armory=null}
      const s=gearEl.dataset.armorySet&&(armory?.sets||[]).find(x=>x.id===gearEl.dataset.armorySet);
      const p=gearEl.dataset.armoryProf&&(armory?.professions||[]).find(x=>x.name===gearEl.dataset.armoryProf);
      const item=gearEl.dataset.armoryItem;
      if(item){
        const gear=parent.FOREVER_GEAR_ITEMS?.find(i=>i.name===item);
        const group=(armory?.sets||[]).find(s=>s.pieces.some(p=>p.name===item));
        tooltip.innerHTML='<strong>'+safe(item)+'</strong><p class="atlas-source">'+safe(gear?.source||group?.origin||'Source research pending')+'</p>'+itemInfo(item);
      }else if(s||p){
        tooltip.innerHTML='<strong>'+safe(s?.name||p?.camp)+'</strong><p>'+safe(s?(s.origin+' · '+s.count+' pieces · '+(s.bonuses.map(b=>b[0]+': '+b[1]).join('; ')||s.note)):(p.effect+' · Skill '+p.skill+' · '+p.exclusive))+'</p><span class="atlas-badge atlas-rework">'+safe(s?.status||(p.reported?'DATAMINED':'CAMP FEATURE'))+'</span>';
      }
      if(item||s||p){const r=gearEl.getBoundingClientRect();const w=Math.min(410,innerWidth-20);tooltip.style.width=w+'px';
        tooltip.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left-w-10))+'px';tooltip.hidden=false;
        tooltip.style.top=Math.max(8,Math.min(innerHeight-tooltip.getBoundingClientRect().height-8,r.top))+'px';}
      return;
    }
    const el=e.target.closest('[data-spell-index]');if(!el)return;
    const s=entries[Number(el.dataset.spellIndex)];if(!s)return;
    const imp=classify(s);
    tooltip.innerHTML='<strong>'+safe(s.name)+'</strong>'+badge(imp.type)+
      (imp.before&&imp.after?'<div class="atlas-before-after"><div><small>BEFORE</small><p>'+safe(imp.before)+'</p></div><div><small>FOREVER</small><p class="'+(imp.type==='Buff'?'buff':imp.type==='Nerf'?'nerf':'')+'">'+safe(imp.after)+'</p></div></div>':'')+
      '<p>'+safe(s.effect)+'</p>'+(inspector()?.rankMarkup?.(s,frameLevel,currentClass)||'<small>Client ranks require source verification.</small>');
    const r=el.getBoundingClientRect();
    const w=Math.min(410,innerWidth-20);tooltip.style.width=w+'px';
    tooltip.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left-w-10))+'px';tooltip.hidden=false;
    tooltip.style.top=Math.max(8,Math.min(innerHeight-tooltip.getBoundingClientRect().height-8,r.top))+'px';
  });
  detail.addEventListener('mouseout',e=>{if(e.target.closest('[data-spell-index],[data-armory-set],[data-armory-prof],[data-armory-item]'))tooltip.hidden=true;});
  detail.addEventListener('focusin',e=>{const el=e.target.closest('[data-spell-index],[data-armory-set],[data-armory-prof],[data-armory-item]');if(el)el.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));});
  detail.addEventListener('focusout',()=>tooltip.hidden=true);
  const syncedLevel=inspector()?.level;
  if(Number.isFinite(syncedLevel)&&syncedLevel>=1&&syncedLevel<=60)frameLevel=syncedLevel;
  rebuild();
})();
