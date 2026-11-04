/* FOREVER Launch Room · spellbook + leveling upgrade layer.
   Change ledger: Blizzard notes. Client spell catalog: build 1.60.1.70753.
   Gear routes are provisional until verified against the live client. */
(() => {
  'use strict';

  const classic = {
    Warrior: `Battle Stance|Berserker Stance|Charge|Intercept|Hamstring|Heroic Strike|Overpower|Execute|Mortal Strike|Bloodrage|Berserker Rage|Pummel|Shield Bash|Shield Block|Shield Slam|Shield Wall|Shield Sunder|Disarm|Taunt|Mocking Blow|Intimidating Shout|Demoralizing Shout|Challenging Shout|Battle Shout|Commanding Shout|Revenge|Cleave|Rend|Thunder Clap|Whirlwind|Slam|Retaliation|Recklessness|Last Stand|Concussion Blow|Piercing Howl|Sweeping Strikes|Bloodthirst|Devastate`,
    Paladin: `Devotion Aura|Retribution Aura|Concentration Aura|Shadow Resistance Aura|Frost Resistance Aura|Fire Resistance Aura|Crusader Aura|Seal of Righteousness|Seal of Command|Seal of Justice|Seal of Light|Seal of Wisdom|Seal of the Crusader|Judgement|Blessing of Might|Blessing of Wisdom|Blessing of Protection|Blessing of Freedom|Blessing of Sanctuary|Blessing of Kings|Blessing of Sacrifice|Divine Shield|Divine Protection|Holy Light|Flash of Light|Cleanse|Purify|Consecration|Exorcism|Hammer of Justice|Hammer of Wrath|Lay on Hands|Redemption|Turn Undead|Righteous Fury|Holy Shock|Divine Favor|Divine Intervention`,
    Hunter: `Auto Shot|Arcane Shot|Serpent Sting|Scorpid Sting|Viper Sting|Serpent Sting|Concussive Shot|Multi-Shot|Aimed Shot|Volley|Hunter's Mark|Rapid Fire|Trueshot Aura|Aspect of the Hawk|Aspect of the Monkey|Aspect of the Cheetah|Aspect of the Pack|Aspect of the Wild|Track Beasts|Track Humanoids|Track Undead|Track Demons|Track Giants|Track Dragonkin|Track Hidden|Disengage|Feign Death|Wing Clip|Raptor Strike|Mongoose Bite|Counterattack|Immolation Trap|Freezing Trap|Frost Trap|Explosive Trap|Distracting Shot|Mend Pet|Revive Pet|Feed Pet|Dismiss Pet|Call Pet|Intimidation|Bestial Wrath|Eyes of the Beast|Flare|Scare Beast`,
    Rogue: `Stealth|Sinister Strike|Backstab|Ambush|Cheap Shot|Garrote|Rupture|Eviscerate|Slice and Dice|Kick|Gouge|Sap|Blind|Distract|Vanish|Sprint|Evasion|Feint|Pick Pocket|Pick Lock|Disarm Trap|Crippling Poison|Deadly Poison|Instant Poison|Mind-numbing Poison|Wound Poison|Kidney Shot|Expose Armor|Blade Flurry|Adrenaline Rush|Cold Blood|Preparation|Premeditation|Hemorrhage|Ghostly Strike|Riposte|Safe Fall`,
    Priest: `Smite|Holy Fire|Mind Blast|Mind Flay|Shadow Word: Pain|Shadow Word: Death|Mind Control|Mind Soothe|Mind Vision|Psychic Scream|Silence|Shadowform|Power Word: Shield|Power Word: Fortitude|Prayer of Fortitude|Divine Spirit|Inner Fire|Renew|Lesser Heal|Heal|Greater Heal|Flash Heal|Prayer of Healing|Resurrection|Dispel Magic|Abolish Disease|Cure Disease|Mana Burn|Fade|Shackle Undead|Levitate|Lightwell|Spirit of Redemption|Desperate Prayer|Vampiric Embrace|Devouring Plague|Fear Ward`,
    Shaman: `Lightning Bolt|Chain Lightning|Earth Shock|Flame Shock|Frost Shock|Lightning Shield|Rockbiter Weapon|Flametongue Weapon|Frostbrand Weapon|Windfury Weapon|Stormstrike|Ghost Wolf|Far Sight|Water Walking|Water Breathing|Astral Recall|Ancestral Spirit|Lesser Healing Wave|Healing Wave|Chain Heal|Cure Poison|Cure Disease|Purge|Tremor Totem|Earthbind Totem|Stoneclaw Totem|Stoneskin Totem|Strength of Earth Totem|Searing Totem|Magma Totem|Fire Nova Totem|Mana Spring Totem|Healing Stream Totem|Windfury Totem|Grace of Air Totem|Grounding Totem|Nature Resistance Totem|Frost Resistance Totem|Fire Resistance Totem|Elemental Mastery|Nature's Swiftness|Mana Tide Totem`,
    Mage: `Fireball|Fire Blast|Scorch|Pyroblast|Flamestrike|Blast Wave|Combustion|Frostbolt|Frost Nova|Cone of Cold|Blizzard|Ice Lance|Ice Barrier|Ice Block|Cold Snap|Frost Ward|Fire Ward|Arcane Missiles|Arcane Explosion|Arcane Power|Presence of Mind|Counterspell|Polymorph|Blink|Slow Fall|Remove Lesser Curse|Detect Magic|Dampen Magic|Amplify Magic|Evocation|Mage Armor|Ice Armor|Frost Armor|Mana Shield|Arcane Intellect|Arcane Brilliance|Conjure Water|Conjure Food|Conjure Mana Agate|Conjure Mana Jade|Conjure Mana Citrine|Teleport: Stormwind|Teleport: Orgrimmar|Portal: Stormwind|Portal: Orgrimmar`,
    Warlock: `Shadow Bolt|Immolate|Corruption|Curse of Agony|Curse of Elements|Curse of Shadow|Curse of Recklessness|Curse of Weakness|Curse of Tongues|Curse of Exhaustion|Siphon Life|Drain Life|Drain Mana|Drain Soul|Life Tap|Fear|Howl of Terror|Death Coil|Shadowburn|Conflagrate|Searing Pain|Hellfire|Rain of Fire|Shadow Ward|Demon Armor|Demon Skin|Unending Breath|Detect Invisibility|Banish|Enslave Demon|Ritual of Summoning|Ritual of Doom|Create Soulstone|Create Healthstone|Create Spellstone|Create Firestone|Soul Link|Summon Imp|Summon Voidwalker|Summon Succubus|Summon Felhunter|Summon Infernal|Summon Felguard|Health Funnel|Eye of Kilrogg`,
    Druid: `Wrath|Starfire|Moonfire|Insect Swarm|Hurricane|Entangling Roots|Hibernate|Soothe Animal|Faerie Fire|Nature's Grasp|Barkskin|Innervate|Rebirth|Mark of the Wild|Gift of the Wild|Thorns|Remove Curse|Abolish Poison|Healing Touch|Regrowth|Rejuvenation|Tranquility|Swiftmend|Nature's Swiftness|Cat Form|Bear Form|Dire Bear Form|Travel Form|Aquatic Form|Moonkin Form|Prowl|Claw|Rake|Rip|Ferocious Bite|Shred|Ravage|Pounce|Tiger's Fury|Dash|Cower|Frenzied Regeneration|Maul|Swipe|Demoralizing Roar|Growl|Bash|Challenging Roar|Feral Charge|Enrage|Track Humanoids`
  };
  SPELLBOOK.sources.CL = {
    label: 'Classic Era reference · not yet verified in the Forever client',
    url: 'https://worldofwarcraft.blizzard.com/en-us/forever/', date: '2026-11-04'
  };
  let baselineCount = 0;
  const client = window.FOREVER_CLIENT_SPELLS;
  const usingClientData = !!(client?.classes && Object.values(client.classes).reduce((n,rows)=>n+rows.length,0)>=590);
  if(usingClientData){
    Object.entries(client.classes).forEach(([name,records])=>{
      const list=SPELLBOOK.classes[name], byName=new Map(list.map(s=>[s.name.toLowerCase(),s]));
      const fallback=list.find(s=>s.status!=='Removed')?.icon||'spell_holy_power';
      const sourceKey=`DB${name}`;
      SPELLBOOK.sources[sourceKey]={label:`WoW Forever class spell client · build ${client.build}`,
        url:`https://metammo.com/wow-forever/spellbook/${name.toLowerCase()}`,date:'2026-11-02'};
      records.forEach(r=>{
        const rankText=r.levels.length?`${r.ranks} ${r.ranks===1?'rank':'ranks'} · levels ${r.levels.join(', ')}`:'No trainer level in client';
        const existing=byName.get(r.name.toLowerCase());
        if(existing){existing.clientRanks=rankText;existing.clientLevels=r.levels;existing.clientSource=sourceKey;return;}
        baselineCount++;
        list.push({name:r.name,status:'Client',spec:r.tag==='talent'?'Talent · client data':'Client spell',
          effect:r.noTrainer?'Present in client spell data; no trainer level listed. May be a talent, internal spell or unlearnable.':'Present in the Forever client spell table. View rank and training-level data in the tooltip.',
          meta:rankText,clientRanks:rankText,clientLevels:r.levels,icon:fallback,source:sourceKey});
      });
    });
  }else{
    Object.entries(classic).forEach(([name, string]) => {
      const list = SPELLBOOK.classes[name], existing = new Set(list.map(s => s.name.toLowerCase()));
      const seen = new Set();
      const fallback = list.find(s => s.status !== 'Removed')?.icon || 'spell_holy_power';
      string.split('|').forEach(spell => {
        const key = spell.toLowerCase();
        if (existing.has(key) || seen.has(key)) return;
        seen.add(key); baselineCount++;
        list.push({name: spell, status: 'Classic', spec: 'Classic reference',
          effect: 'Known Classic Era ability. Exact rank, training level, effects and presence in the launch client are awaiting Forever verification.',
          meta: 'Unverified in Forever · rank-by-rank data pending', icon: fallback, source: 'CL'});
      });
    });
  }

  // Directional classifications are editorial and only applied to specific
  // changes supported by the referenced official notes; others stay Reworked.
  const impacts = {
    'Warrior|Victory Rush': ['Buff','New self-heal after a kill','Healing opportunity added'],
    'Warrior|Defensive Stance': ['Buff','Lower threat multiplier','80% threat bonus'],
    'Warrior|Battle Shout': ['Buff','Party-only effect','Raid-wide effect'],
    'Warrior|Slam': ['Buff','Longer cooldown / pushback','15-second cooldown; pushback removed'],
    'Warrior|Whirlwind': ['Buff','Offhand interaction required a talent','Hits with both weapons without the talent'],
    'Paladin|Lay on Hands': ['Buff','60-minute cooldown','20-minute cooldown'],
    'Paladin|Holy Shock': ['Buff','30-second cooldown','10-second cooldown'],
    'Paladin|Judgement': ['Buff','Consumes the active Seal','Preserves the active Seal'],
    'Paladin|Righteous Fury': ['Rework','Previous threat formulation','33% general + 90% Holy threat'],
    'Paladin|Illumination': ['Nerf','Larger Mana refund','50% of healing spell base cost'],
    'Paladin|Salvation / Mass Salvation / Revoke': ['Nerf','Threat-reduction spells','Removed before launch'],
    'Hunter|Aimed Shot': ['Rework','Separate cooldown interactions','Shared cooldown with Multi-Shot'],
    'Hunter|Arcane Shot': ['Buff','Lower damage/scaling','Improved damage and Attack Power scaling'],
    'Hunter|Serpent Sting': ['Buff','Lower damage/scaling','Increased damage and Attack Power scaling'],
    'Hunter|Traps': ['Rework','Classic placement rules','Castable in combat; shared 30-second cooldown'],
    'Hunter|Auto Shot': ['Nerf','No new stationary windup','0.5-second stationary windup'],
    'Rogue|Poisons': ['Buff','Fewer charges / enchant conflict','More charges; compatible with temporary enchants'],
    'Rogue|Deadly Poison / Instant Poison': ['Buff','Lower Attack Power coefficient','Coefficient doubled'],
    'Rogue|Feint': ['Buff','Previous threat reduction','Threat reduction doubled'],
    'Rogue|Sap': ['Buff','Broke stealth','No longer breaks Stealth'],
    'Priest|Shadow Word: Death': ['Rework','Previous backlash','30% maximum-health backlash if target survives'],
    'Priest|Power Word: Shield': ['Buff','Strict replacement rules','Equal-or-higher rank can replace an existing shield'],
    'Priest|Vampiric Embrace': ['Nerf','Healing could crit','Healing no longer crits'],
    'Mage|Ice Lance': ['Rework','Separate spell timing','Shares an 8-second cooldown with Fire Blast'],
    'Mage|Ice Barrier': ['Buff','Defensive absorb','Adds Frost damage, boosted while intact'],
    'Mage|Cold Snap': ['Nerf','Shorter cooldown','10-minute cooldown'],
    'Mage|Mage Armor': ['Buff','Lower Spirit-based Mana regeneration','Improved Mana regeneration'],
    'Shaman|Riptide': ['Nerf','Initial heal and heal-over-time','Heal-over-time only'],
    'Shaman|Stormstrike': ['Buff','Lower damage / previous Mana cost','Improved output; cost changed to 8% base Mana'],
    'Druid|Berserk': ['Nerf','Beta talent','Removed before launch'],
    'Druid|Lacerate': ['Rework','Previous availability','Moved into talents'],
    'Warlock|Wrack': ['Buff','Previous damage','Damage strengthened'],
  };
  function impactFor(s, cls) {
    if (s.status === 'Client') return {type:'Client'};
    if (s.status === 'Classic') return {type:'Classic'};
    if (s.status === 'New') return {type:'New'};
    if (s.status === 'Removed') return {type:'Removed'};
    if (s.status === 'Baseline') return {type:'Buff'};
    const v = impacts[`${cls}|${s.name}`];
    return v ? {type:v[0],before:v[1],after:v[2]} : {type:'Rework'};
  }
  const badge = type => `<span class="impact impact-${type.toLowerCase()}">${type==='Buff'?'↑ BUFF':type==='Nerf'?'↓ NERF':type==='Removed'?'× REMOVED':type==='New'?'+ NEW':type==='Client'?'CLIENT DATA':type==='Classic'?'CLASSIC REF.':'↔ REWORK'}</span>`;
  const escapeHtml = x => String(x).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const classIcons = {Warrior:'ability_warrior_battleshout',Paladin:'spell_holy_holybolt',Hunter:'ability_hunter_quickshot',
    Rogue:'ability_stealth',Priest:'spell_holy_powerwordshield',Shaman:'spell_nature_lightning',
    Mage:'spell_frost_frostbolt02',Warlock:'spell_shadow_shadowandflame',Druid:'ability_druid_catform'};

  // Preserve existing search, class navigation and tooltip behavior while
  // upgrading visual language and detail panels.
  const statusSelect = document.querySelector('#spellStatus');
  statusSelect.innerHTML = '<option value="All">All spells</option><option value="New">New</option><option value="Buff">Buffs ↑</option><option value="Nerf">Nerfs ↓</option><option value="Rework">Reworks ↔</option><option value="Client">Client spell data</option><option value="Classic">Classic reference</option><option value="Removed">Removed beta entries</option>';
  document.querySelector('.booktools').insertAdjacentHTML('beforeend','<label><span class="sr">Sort spellbook</span><select id="spellSort" aria-label="Sort spellbook"><option value="Changes">Changes first</option><option value="Level">Training level</option><option value="Name">Alphabetical</option></select></label><label><span class="sr">Training level filter</span><select id="spellLevel" aria-label="Training level filter"><option value="All">All levels</option><option value="1-20">Levels 1–20</option><option value="21-40">Levels 21–40</option><option value="41-60">Levels 41–60</option><option value="No trainer">No trainer level</option></select></label>');
  let spellSort='Changes',spellLevel='All';
  document.querySelector('#spellSort').addEventListener('change',e=>{spellSort=e.target.value;bookRows()});
  document.querySelector('#spellLevel').addEventListener('change',e=>{spellLevel=e.target.value;bookRows()});
  const firstLevel=s=>s.clientLevels?.length?Math.min(...s.clientLevels):s.meta?.match(/Level (\d+)/i)?Number(s.meta.match(/Level (\d+)/i)[1]):999;
  bookRows = function () {
    closeTip();
    const list = SPELLBOOK.classes[bookClass];
    const matching = list.map((s,i)=>({...s,index:i,impact:impactFor(s,bookClass)}))
      .filter(s => (bookStatus==='All' || (bookStatus==='Removed'?s.status==='Removed':s.impact.type===bookStatus))
        && (bookSpec==='All' || s.spec===bookSpec)
        && (`${s.name} ${s.effect} ${s.spec} ${s.meta} ${s.clientRanks||''}`.toLowerCase().includes(bookQuery))
        && (spellLevel==='All'||(spellLevel==='No trainer'?!s.clientLevels?.length:!!s.clientLevels?.some(n=>n>=Number(spellLevel.split('-')[0])&&n<=Number(spellLevel.split('-')[1])))))
      .sort((a,b)=>spellSort==='Level'?firstLevel(a)-firstLevel(b)||a.name.localeCompare(b.name):spellSort==='Name'?a.name.localeCompare(b.name):a.index-b.index);
    const counts = ['New','Buff','Nerf','Rework','Removed',usingClientData?'Client':'Classic'].map(type=>`${list.filter(s=>impactFor(s,bookClass).type===type).length} ${type.toLowerCase()}`);
    document.querySelector('#bookCounts').textContent = `${matching.length} / ${list.length} entries · ${counts.join(' · ')}`;
    document.querySelector('#spellRows').innerHTML = matching.map(s=>`
      <button class="spellrow next-spell ${s.status==='Removed'?'removed':''} ${s.impact.type==='Classic'?'classic-reference':''}" data-spell="${s.index}" aria-expanded="false">
        <img src="icons/${s.icon}.jpg" alt="" loading="lazy" onerror="this.onerror=null;this.src='icons/${classIcons[bookClass]}.jpg'">
        <span class="spellidentity"><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.spec)}${s.clientRanks?' · '+escapeHtml(s.clientRanks):s.meta?' · '+escapeHtml(s.meta):''}</small></span>
        ${badge(s.impact.type)}
        <span class="spelleffect ${s.impact.type==='Buff'?'positive':s.impact.type==='Nerf'?'negative':''}">${escapeHtml(s.effect)}</span>
        <span class="spellarrow" aria-hidden="true">↗</span>
      </button>`).join('');
    document.querySelector('#spellEmpty').hidden=matching.length>0;
  };
  showTip = function(trigger,pin=false) {
    if(pinned&&!pin) return;
    closeTip(); pinned=pin; lastTrigger=trigger;
    const s=SPELLBOOK.classes[bookClass][Number(trigger.dataset.spell)];
    const src=SPELLBOOK.sources[s.source], imp=impactFor(s,bookClass);
    tip.setAttribute('role',pin?'dialog':'tooltip'); tip.setAttribute('aria-label',`${s.name} details`);
    const beforeAfter=imp.before&&imp.after?`<div class="before-after"><div><label>BEFORE</label><p>${escapeHtml(imp.before)}</p></div><div><label>FOREVER</label><p class="${imp.type==='Buff'?'positive':imp.type==='Nerf'?'negative':''}">${escapeHtml(imp.after)}</p></div></div>`:'';
    const clientInfo=s.clientRanks?`<div class="client-ranks"><label>CLIENT RANKS / TRAINING</label><p>${escapeHtml(s.clientRanks)}</p>${s.clientSource?`<a href="${SPELLBOOK.sources[s.clientSource].url}" target="_blank" rel="noreferrer">Class client spell table ↗</a>`:''}</div>`:'';
    tip.innerHTML=`<div class="tipheading"><img src="icons/${s.icon}.jpg" alt="" onerror="this.onerror=null;this.src='icons/${classIcons[bookClass]}.jpg'"><div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(bookClass)} · ${escapeHtml(s.spec)}</small></div>${pin?'<button class="tipclose" aria-label="Close spell details">×</button>':''}</div>${badge(imp.type)}${beforeAfter}<p class="tipdescription">${escapeHtml(s.effect)}</p>${clientInfo}${s.meta?`<p class="tipmeta">${escapeHtml(s.meta)}</p>`:''}<div class="tipsource">${pin?`<a href="${src.url}" target="_blank" rel="noreferrer">${escapeHtml(src.label)} ↗</a>`:escapeHtml(src.label)}<br>Updated ${src.date}</div><small class="tipart">${s.status==='Client'?'Present in the client table; this does not prove the spell is learnable. Icon is representative.':s.status==='Classic'?'Classic-reference name and representative art; not a verified Forever tooltip':'Summary of documented change; exact rank values may differ'}</small>`;
    tip.hidden=false; trigger.setAttribute('aria-describedby','spellTooltip'); trigger.setAttribute('aria-expanded',String(pin));
    const r=trigger.getBoundingClientRect(),w=Math.min(420,innerWidth-28);
    tip.style.width=w+'px';const h=tip.getBoundingClientRect().height;
    let x=Math.min(innerWidth-w-14,Math.max(14,r.right-w-20)),y=r.top-h-12;
    if(y<14)y=Math.min(innerHeight-h-14,r.bottom+12);
    tip.style.left=x+'px';tip.style.top=Math.max(14,y)+'px';
    if(pin)tip.querySelector('.tipclose').addEventListener('click',()=>{const t=lastTrigger;closeTip();t?.focus()});
  };
  const currentHint = document.querySelector('.bookhint');
  currentHint.textContent='Hover/focus for tooltips. Click/tap to pin. Green = buff, red = nerf/removed, amber = rework. Client entries include rank/level data; spells without a trainer level may not be learnable.';
  document.querySelector('.bookfoot').textContent=usingClientData?'Client spell entries from build 1.60.1.70753, plus the separate Blizzard change ledger. Client presence does not guarantee the ability is trainable or available at launch; exact tooltip values may be hotfixed.':'Classic-reference entries require live-client verification; rank-by-rank data not yet available.';
  document.querySelector('nav').insertAdjacentHTML('beforeend','<a href="#upgrades">Gear upgrades</a>');
  document.querySelector('.stamp').textContent='RESEARCH SNAPSHOT · 04 NOV 2026';
  document.querySelector('.hero .fine').textContent='EU launch · Thursday 5 November at 00:00 CET (Denmark) · Blizzard official schedule';
  const prepare = document.querySelector('#prepare');
  if(prepare) prepare.remove();
  document.querySelector('nav a[href="#prepare"]')?.remove();

  // Leveling gear targets: recognizable Classic-era routes, not verified BiS.
  const items = [
    ['Crescent Staff',14,27,'Two-hand staff','Wailing Caverns quest','Caster,Healer', 'Classic reference'],
    ['Staff of Westfall',18,29,'Two-hand staff','The Deadmines quest','Caster,Healer', 'Classic reference'],
    ['Illusionary Rod',33,45,'Two-hand staff','Scarlet Monastery · Library','Caster,Healer', 'Classic reference'],
    ["Zum’rah’s Vexing Cane",43,55,'Two-hand staff',"Zul’Farrak",'Caster,Healer','Classic reference'],
    ['Hypnotic Blade',33,45,'One-hand dagger','Scarlet Monastery · Library','Caster,Healer','Classic reference'],
    ['Cruel Barb',18,28,'One-hand sword','The Deadmines','Melee','Classic reference'],
    ['Wingblade',14,27,'One-hand sword','Wailing Caverns quest','Melee','Classic reference'],
    ['Sword of Omen',33,44,'One-hand sword','Scarlet Monastery quest · Horde','Melee','Classic reference'],
    ['Thrash Blade',45,60,'One-hand sword','Maraudon quest','Melee,Tank','Classic reference'],
    ['Corpsemaker',27,39,'Two-hand axe','Razorfen Kraul','Two-hand','Classic reference'],
    ["Verigan’s Fist",20,35,'Two-hand mace','Paladin class quest','Paladin','Classic reference'],
    ['Whirlwind Axe',30,47,'Two-hand axe','Warrior class quest','Warrior','Classic reference'],
    ['Bonebiter',34,48,'Two-hand axe','Scarlet Monastery quest · Alliance','Two-hand','Classic reference'],
    ['Ravager',37,52,'Two-hand axe','Scarlet Monastery · Armory','Two-hand','Classic reference'],
    ['Venomstrike',17,30,'Bow','Wailing Caverns','Hunter','Classic reference'],
    ["Galgann’s Fireblaster",40,54,'Gun','Uldaman','Hunter','Classic reference'],
    ['Blackcrow',51,60,'Crossbow','Blackrock Spire','Hunter','Classic reference'],
    ['Manual Crowd Pummeler',29,46,'Two-hand mace','Gnomeregan','Feral','Classic reference'],
    ['Warden Staff',40,60,'Two-hand staff','World drop','Feral,Tank','Classic reference'],
    ['Aegis of the Scarlet Commander',36,49,'Shield','Scarlet Monastery · Cathedral','Tank','Classic reference'],
  ].map(([name,from,to,slot,source,profiles,verification])=>({name,from,to,slot,source,profiles:profiles.split(','),verification}));
  window.FOREVER_GEAR_ITEMS = items;
  const gearIcon = slot => slot.includes('staff')?'inv_spear_02':
    slot.includes('dagger')?'inv_weapon_shortblade_05':
    /Bow|Gun|Crossbow/.test(slot)?'ability_hunter_quickshot':
    slot.includes('Shield')?'ability_defend':
    /axe|mace/.test(slot)?'inv_spear_07':'inv_sword_27';
  const profiles = {
    Warrior:{Arms:['Two-hand','Melee'],Fury:['Two-hand','Melee'],Protection:['Tank','Melee']},
    Paladin:{Holy:['Healer','Caster','Paladin'],Protection:['Tank','Paladin'],Retribution:['Two-hand','Paladin']},
    Hunter:{'Beast Mastery':['Hunter'],Marksmanship:['Hunter'],Survival:['Hunter','Melee']},
    Rogue:{Assassination:['Melee'],Combat:['Melee'],Subtlety:['Melee']},
    Priest:{Discipline:['Healer','Caster'],Holy:['Healer','Caster'],Shadow:['Caster']},
    Mage:{Arcane:['Caster'],Fire:['Caster'],Frost:['Caster']},
    Shaman:{Elemental:['Caster'],Enhancement:['Two-hand','Melee'],Restoration:['Healer','Caster']},
    Warlock:{Affliction:['Caster'],Demonology:['Caster'],Destruction:['Caster']},
    Druid:{Balance:['Caster'],Feral:['Feral','Tank'],Restoration:['Healer','Caster']}
  };
  const options = values => values.map(v=>`<option>${escapeHtml(v)}</option>`).join('');
  const clsNames = Object.keys(profiles);
  const gearSection=document.createElement('section'); gearSection.id='upgrades'; gearSection.className='upgrade-section';
  gearSection.innerHTML=`<div class="sectiontop"><div><p class="eyebrow">02 / LEVELING GEAR INTELLIGENCE</p><h2>Upgrade routes <span class="gear-beta">LIVE THEORYCRAFT</span></h2></div><a class="secondary" href="https://metammo.com/wow-forever/new-items" target="_blank" rel="noreferrer">Forever item database ↗</a></div>
    <p class="intro small">Pick your class, spec and level. See practical gear targets around your level, then verify the item in the live Forever client before calling it BiS.</p>
    <div class="gear-tool"><div class="gear-controls"><label>CLASS<select id="gearClass">${options(clsNames)}</select></label><label>SPEC<select id="gearSpec"></select></label><label>LEVEL <output id="gearLevelNumber">30</output><input id="gearLevel" type="range" min="1" max="60" value="30"></label></div>
      <div class="gear-insight"><p class="eyebrow">WHAT TO PRIORITIZE</p><strong id="gearPriority"></strong><p id="gearAdvice"></p></div></div>
    <div class="gear-bar"><div><strong id="gearCount"></strong><span>Progression targets · sorted for your character</span></div><label><input id="gearNearby" type="checkbox" checked> Show current / next upgrades</label></div>
    <div id="gearItems" class="gear-items"></div>
    <div class="gear-foot"><div><p class="eyebrow">MEASURE YOUR OWN WEAPON</p><h3>Weapon DPS comparison</h3><p>Enter the actual tooltip DPS for your current and candidate weapon. This compares weapon DPS alone, not total character damage.</p><div class="gear-compare"><label>Current DPS<input id="oldDps" type="number" min="0" step="0.1" placeholder="e.g. 32.4"></label><label>Candidate DPS<input id="newDps" type="number" min="0" step="0.1" placeholder="e.g. 38.8"></label><output id="dpsDifference">Enter both values</output></div></div>
    <div><p class="eyebrow">CHARACTER SNAPSHOT · NEXT STEP</p><h3>Import-ready character profile</h3><p>The page can now import a small local JSON profile (<code>class</code>, <code>spec</code>, <code>level</code>). A verified in-game addon/export for equipped item IDs is still in development.</p><textarea id="gearSnapshot" rows="3" placeholder='{"class":"Rogue","spec":"Combat","level":32}'></textarea><button id="gearImport" class="secondary">Load profile</button><p id="gearImportStatus" role="status"></p></div></div>
    <p class="gear-disclaimer">Not a certified BiS ranking: the items above are Classic-era acquisition routes; Forever may change stats, sources, or availability. Item data: <a target="_blank" rel="noreferrer" href="https://metammo.com/wow-forever/new-items">Forever new/changed item index</a>. Progression remains a hypothesis until live drops and sims are available.</p>`;
  document.querySelector('#addons').before(gearSection);
  document.querySelector('#addons .eyebrow').textContent='03 / KEEP THE UI LIGHT';
  const gearClass=document.querySelector('#gearClass'),gearSpec=document.querySelector('#gearSpec'),gearLevel=document.querySelector('#gearLevel');
  const priorityByProfile={
    'Two-hand':['Weapon DPS first','For physical damage, a stronger two-hander is often the largest leveling upgrade. Compare swing speed, weapon DPS and usable abilities.'],
    Hunter:['Ranged weapon DPS first','Keep your ranged weapon current; pet uptime, ammunition and weapon speed affect the real result.'],
    Melee:['Main-hand weapon first','Compare actual main-hand weapon DPS, speed, then Agility/Strength and hit.'],
    Tank:['Weapon + survival together','Prioritize threat reliability and a usable shield/armor; the highest weapon DPS is not always the safest upgrade.'],
    Feral:['Feral stats / effects','Classic feral scaling can behave differently from weapon DPS. Verify Forever-specific feral effects before ranking weapons.'],
    Healer:['Healing power + Mana','Healing throughput and sustainable Mana matter more than raw weapon damage.'],
    Caster:['Spell damage + Mana','Spell power, hit and Mana efficiency matter more than weapon DPS.']
  };
  function syncSpecs(){const old=gearSpec.value;gearSpec.innerHTML=options(Object.keys(profiles[gearClass.value]));if(old in profiles[gearClass.value])gearSpec.value=old;}
  function renderGear(){
    const level=Number(gearLevel.value), active=profiles[gearClass.value][gearSpec.value]||[];
    document.querySelector('#gearLevelNumber').textContent=String(level);
    const priority=active.find(p=>priorityByProfile[p])||'Caster';
    document.querySelector('#gearPriority').textContent=priorityByProfile[priority][0];
    document.querySelector('#gearAdvice').textContent=priorityByProfile[priority][1];
    const nearby=document.querySelector('#gearNearby').checked;
    const relevant=items.filter(item=>item.profiles.some(p=>active.includes(p)) && (!nearby||(item.from<=level+12&&item.to>=level-8)))
      .sort((a,b)=>Math.abs(a.from-level)-Math.abs(b.from-level));
    document.querySelector('#gearCount').textContent=`${relevant.length} targets`;
    const out=document.querySelector('#gearItems');
    out.innerHTML=relevant.length?relevant.map((item,i)=>{
      const stage=level<item.from?'UPCOMING':level>item.to?'EARLIER':'CURRENT BRACKET';
      return `<article class="gear-item"><span class="gear-slot">${escapeHtml(item.slot)}</span><div><small>${stage} · APPROX. LEVEL ${item.from}–${item.to}</small><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.source)}</p></div><div class="gear-item-end"><span class="gear-unverified">VERIFY IN FOREVER</span><a href="https://www.wowhead.com/classic/search?q=${encodeURIComponent(item.name)}" target="_blank" rel="noreferrer" aria-label="Look up ${escapeHtml(item.name)}">Item reference ↗</a></div></article>`;
    }).join(''):'<div class="gear-empty">No matching reference targets in this bracket yet. Check Forever’s new-item index for recently added drops.</div>';
  }
  gearClass.addEventListener('change',()=>{syncSpecs();renderGear()});gearSpec.addEventListener('change',renderGear);
  gearLevel.addEventListener('input',renderGear);document.querySelector('#gearNearby').addEventListener('change',renderGear);
  const calcDps=()=>{const old=Number(document.querySelector('#oldDps').value),next=Number(document.querySelector('#newDps').value),out=document.querySelector('#dpsDifference');
    if(!old||!next){out.textContent='Enter both values';out.className='';return;}
    const diff=((next/old)-1)*100;out.textContent=`${diff>=0?'+':''}${diff.toFixed(1)}% weapon DPS`;out.className=diff>=0?'positive':'negative';};
  document.querySelector('#oldDps').addEventListener('input',calcDps);document.querySelector('#newDps').addEventListener('input',calcDps);
  document.querySelector('#gearImport').addEventListener('click',()=>{
    const msg=document.querySelector('#gearImportStatus');
    try{const d=JSON.parse(document.querySelector('#gearSnapshot').value);
      if(!profiles[d.class])throw Error('Unknown class');
      if(!profiles[d.class][d.spec])throw Error('Choose an exact specialization');
      if(!Number.isInteger(d.level)||d.level<1||d.level>60)throw Error('Level must be 1–60');
      gearClass.value=d.class;syncSpecs();gearSpec.value=d.spec;gearLevel.value=d.level;renderGear();
      msg.textContent=`Loaded ${d.level} ${d.spec} ${d.class} locally. No data was uploaded.`;msg.className='positive';
    }catch(err){msg.textContent=`Could not import: ${err.message}`;msg.className='negative';}
  });
  syncSpecs();renderGear();
  const gearItemGrid=document.querySelector('#gearItems');
  function decorateGearItems(){
    for(const card of gearItemGrid.querySelectorAll('.gear-item')){
      if(card.dataset.armoryTip)return;
      const heading=card.querySelector('h3');
      const item=items.find(x=>x.name===heading?.textContent);
      if(!item)continue;
      card.dataset.armoryTip='gear:'+item.name;
      card.tabIndex=0;
      card.setAttribute('aria-label','Item details: '+item.name);
      const slot=card.querySelector('.gear-slot');
      if(slot){
        const picture=document.createElement('img');
        picture.className='gear-slot-icon';
        picture.src='icons/'+gearIcon(item.slot)+'.jpg';
        picture.alt='';
        picture.loading='lazy';
        picture.onerror=()=>{picture.onerror=null;picture.src='icons/inv_scroll_03.jpg';};
        slot.replaceWith(picture);
        const first=card.querySelector('small');
        if(first)first.textContent=item.slot+' · '+first.textContent;
      }
    }
  }
  new MutationObserver(decorateGearItems).observe(gearItemGrid,{childList:true});
  decorateGearItems();
  const style=document.createElement('link');style.rel='stylesheet';style.href='forever-enhance.css';document.head.append(style);
  // Existing class cards now reflect extended spellbooks.
  render();
  const method=document.querySelector('.sources p:not(.eyebrow)');
  if(method) method.textContent=`The ${Object.values(SPELLBOOK.classes).reduce((n,l)=>n+l.length,0)}-entry index combines 216 Blizzard-documented Forever changes (including talents and beta removals) with ${usingClientData?'594 entries from the Forever client spell table (build 1.60.1.70753), '+baselineCount+' of which are distinct additions':'a broad Classic-era reference of '+baselineCount+' names'}. Matching spells show ranks and training levels from client data, where listed. Client presence alone does not prove a spell is learnable, and values may change with hotfixes. Buff/nerf direction is only classified where supported by the notes; amber means mixed or unclear. Icons are representative unless verified. Gear targets are provisional Classic routes, not measured Forever BiS; PvP/PvE assessments remain editorial hypotheses.`;
  document.querySelector('.sources .fine').textContent='Checked 4 November 2026. Static research snapshot; no automatic updates. Independent fan project. Not affiliated with Blizzard Entertainment.';
  window.FOREVER_IMPACT = impactFor;
  const atlasLoader = document.createElement('script');
  atlasLoader.src = 'forever-atlas.js?v=3';
  atlasLoader.defer = true;
  document.body.append(atlasLoader);
  const armoryStyle=document.createElement('link');armoryStyle.rel='stylesheet';armoryStyle.href='forever-armory.css?v=1';
  document.head.append(armoryStyle);
  const armoryLoader=document.createElement('script');armoryLoader.src='forever-armory.js?v=1';
  document.body.append(armoryLoader);
})();
