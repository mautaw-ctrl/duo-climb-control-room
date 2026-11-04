/* Launch Room ↔ Valley Atlas: one class selection, one spellbook, one gear desk. */
(() => {
  'use strict';
  const css=document.createElement('link');css.rel='stylesheet';css.href='forever-atlas.css?v=2';document.head.append(css);
  const atlas=document.createElement('dialog');atlas.id='valleyAtlas';atlas.setAttribute('aria-label','Interactive Forever Valley class atlas');
  atlas.innerHTML='<div class="valley-bar"><div><span class="valley-kicker">THE VALLEY OF TRIALS / FOREVER CLASS ATLAS</span><strong id="valleyTitle">Choose your path</strong></div><div class="valley-tools"><button id="valleySpellbook" type="button">Open spellbook ↗</button><button id="valleyGear" type="button">Gear upgrades ↗</button><button id="valleyClose" class="valley-close" type="button" aria-label="Close 3D atlas">✕</button></div></div><iframe id="valleyFrame" title="3D Valley of Trials and interactive class tree" loading="lazy" allow="fullscreen"></iframe>';
  document.body.append(atlas);
  const frame=atlas.querySelector('iframe'), title=atlas.querySelector('#valleyTitle');
  let currentClass='Rogue';
  const names=DATA.classes.map(row=>row[0]);
  function close(){if(atlas.open)atlas.close();document.body.classList.remove('valley-open');}
  function open(cls){
    if(names.includes(cls))currentClass=cls;
    title.textContent=currentClass+' / 3D talent atlas';
    const url=new URL('prototype/',location.href);
    url.searchParams.set('class',currentClass);
    url.searchParams.set('scene','valley-full');
    if(frame.src!==url.href)frame.src=url.href;
    document.body.classList.add('valley-open');
    if(!atlas.open)atlas.showModal();
  }
  function jump(target,cls=currentClass){
    close();
    if(target==='spellbook'){openBook(cls);return;}
    if(['upgrades','sets','professions'].includes(target)){
      const choice=document.querySelector('#gearClass');
      choice.value=cls;
      choice.dispatchEvent(new Event('change',{bubbles:true}));
      const section=document.querySelector('#'+target);
      section?.scrollIntoView({behavior:'smooth',block:'start'});
      history.replaceState(null,'','#'+target);
      return;
    }
    document.querySelector('#classes')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  atlas.querySelector('#valleyClose').addEventListener('click',close);
  atlas.querySelector('#valleySpellbook').addEventListener('click',()=>jump('spellbook'));
  atlas.querySelector('#valleyGear').addEventListener('click',()=>jump('upgrades'));
  atlas.addEventListener('close',()=>document.body.classList.remove('valley-open'));
  atlas.addEventListener('click',e=>{if(e.target===atlas)close();});
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin||e.source!==frame.contentWindow)return;
    const d=e.data;if(!names.includes(d?.className))return;
    if(d.type==='forever:atlas-class'){
      currentClass=d.className;
      title.textContent=currentClass+' / 3D talent atlas';
      return;
    }
    if(d.type!=='forever:atlas-navigate')return;
    jump(['upgrades','sets','professions','spellbook'].includes(d.target)?d.target:'class',d.className);
  });
  window.FOREVER_OPEN_ATLAS=open;
  const heroLink=document.createElement('button');heroLink.type='button';heroLink.className='valley-hero-cta';
  heroLink.innerHTML='<span>◈</span> Enter the 3D Valley <span>↗</span>';
  heroLink.addEventListener('click',()=>open('Rogue'));
  document.querySelector('.hero .actions')?.append(heroLink);
  const navLink=document.createElement('button');navLink.className='valley-nav-link';navLink.type='button';navLink.textContent='3D Atlas';
  navLink.addEventListener('click',()=>open('Rogue'));
  document.querySelector('header nav')?.append(navLink);
  const mountClassButtons=()=>{
    const classIcons={Warrior:'ability_warrior_battleshout',Paladin:'spell_holy_holybolt',Hunter:'ability_hunter_quickshot',
      Rogue:'ability_stealth',Priest:'spell_holy_powerwordshield',Shaman:'spell_nature_lightning',
      Mage:'spell_frost_frostbolt02',Warlock:'spell_shadow_shadowandflame',Druid:'ability_druid_catform'};
    for(const card of document.querySelectorAll('#classGrid .card')){
      if(card.querySelector('[data-atlas]'))continue;
      const cls=card.querySelector('h3')?.textContent?.trim();
      if(!names.includes(cls))continue;
      const action=document.createElement('button');action.type='button';
      action.className='valley-class-cta';action.dataset.atlas=cls;
      const icons=SPELLBOOK.classes[cls].filter(s=>s.icon).slice(0,3)
        .map(s=>'<img src="icons/'+encodeURIComponent(s.icon)+'.jpg" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'icons/'+classIcons[cls]+'.jpg\'">').join('');
      action.innerHTML='<span class="valley-miniicons">'+icons+'</span><span>EXPLORE 3D TALENT TREE</span><span aria-hidden="true">↗</span>';
      action.onclick=()=>open(cls);
      card.querySelector('.openbook')?.after(action);
    }
  };
  const originalRender=render;
  render=function(){originalRender();mountClassButtons();};
  mountClassButtons();
})();
