/* WoW Forever Launch Room: curated leveling sets, professions, and item tooltips.
   Official camp facts: Blizzard 21 Oct 2026. Set data: Wowhead + Forever wiki,
   with reported/datamined entries clearly separated from verified Classic routes. */
(() => {
  'use strict';
  const ESC = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clsNames = DATA.classes.map(c => c[0]);
  const wowIcon = icon => 'https://wow.zamimg.com/images/wow/icons/large/'+encodeURIComponent(icon)+'.jpg';
  const localFallback = 'icons/inv_scroll_03.jpg';
  const icon = (id, fallback=localFallback) => '<img src="'+ESC(wowIcon(id))+'" alt="" loading="lazy" onerror="this.onerror=null;this.src=\''+fallback+'\'">';
  const slotIcon = {Head:'inv_helmet_03',Shoulder:'inv_shoulder_05',Chest:'inv_chest_cloth_07',
    Wrist:'inv_bracer_03',Hands:'inv_gauntlets_05',Waist:'inv_belt_04',Legs:'inv_pants_06',
    Feet:'inv_boots_05',Ring:'inv_jewelry_ring_03',Weapon:'inv_sword_27'};
  const slots8 = ['Head','Shoulder','Chest','Wrist','Hands','Waist','Legs','Feet'];
  const slots5 = ['Chest','Hands','Waist','Legs','Feet'];
  const all = clsNames.slice();
  const cloth = ['Mage','Warlock','Priest'];
  const leather = ['Rogue','Druid','Hunter','Shaman'];
  const plate = ['Warrior','Paladin'];
  const wiki = 'https://forever.undrwrldcub.com/gear/';
  const officialCamp = 'https://worldofwarcraft.blizzard.com/en-us/news/24301516/gather-around-the-campfire-in-world-of-warcraft-forever';
  const professionDatabase = 'https://metammo.com/wow-forever/professions';
  const setSource = slug => 'https://forever.undrwrldcub.com/db/item-sets/set-'+slug+'/';
  function set(name, lvl, armor, who, origin, status, count, pieceString, bonuses, source, note, kind='Dungeon') {
    const names = pieceString ? pieceString.split('|') : [];
    const slots = name==='Chain of the Scarlet Crusade'?['Waist','Feet','Chest','Hands','Legs','Wrist']:
      count===8 ? slots8 : count===5 ? slots5 : count===6 ? ['Head','Shoulder','Chest','Hands','Legs','Feet'] : count===2 ? ['Hands','Legs'] : [];
    return {id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,from:lvl[0],to:lvl[1],
      armor,who,origin,status,count,pieces:names.map((n,i)=>({name:n,slot:slots[i]||'Set piece'})),
      bonuses,source:source||wiki,note:note||'',kind};
  }
  const SETS = [
    set('Defias Leather',[14,17],'Leather',leather,'The Deadmines','Changed',5,
      'Blackened Defias Armor|Blackened Defias Gloves|Blackened Defias Belt|Blackened Defias Leggings|Blackened Defias Boots',
      [[2,'+5 Arcane Resistance'],[3,'+15 Attack Power against Humanoids'],[4,'Melee attacks from behind: 5% chance to cause a 75-damage bleed over 5 sec'],[5,'+1 Daggers']],
      setSource('defias-leather'),'Early melee set; dungeon drop locations should be checked in Forever.'),
    set('Embrace of the Viper',[14,18],'Leather',['Druid','Rogue','Hunter','Shaman'],'Wailing Caverns','Changed',5,
      'Armor of the Fang|Gloves of the Fang|Belt of the Fang|Leggings of the Fang|Footpads of the Fang',
      [[2,'+10 Intellect'],[3,'+10 Attack Power'],[4,'At low health: restore Health and Mana over 5 sec'],[5,'Melee strikes can apply Dream Venom, stunning the target for 1 sec']],
      setSource('embrace-of-the-viper'),'A Druid serpent-form easter egg is reported for the full set.'),
    set("Rotmender's Raiment",[17,20],'Cloth',cloth,'Ruins of Lordaeron','New · reported',5,
      "Rotmender's Garb|Rotmender's Gloves|Rotmender's Sash|Wispcloth Leggings|Frostbane Treads",
      [[2,'+10 Intellect'],[3,'5% less threat generated'],[4,'When Mana drops below 15%, restore 600 Mana over 15 sec (5-minute trigger limit)'],[5,'Healing spells can apply a healing-over-time effect']],
      setSource('rotmenders-raiment'),'Three pieces have unverified drop sources; do not assume the set can be completed yet.'),
    set('Partners in Crime',[17,60],'Jewelry',all,'New jewelry set / various sources','New · reported',2,'',
      [[2,'Strength bonus with a chance on melee attack to gain more Strength temporarily']],
      setSource('partners-in-crime'),'The two rings span very different levels; complete set use is mainly an endgame possibility.','Other'),
    set('Blessing of Kalimdor',[21,25],'Jewelry',all,'World content','New · reported',3,'',[],
      setSource('blessing-of-kalimdor'),'Piece-by-piece details not yet verified.','World'),
    set("Violet Sorcerer's Vestments",[27,33],'Cloth',cloth,'City of Dalaran','New · reported',5,
      'Arcanowisp Robes',[],setSource('violet-sorcerers-vestments'),
      'Only Arcanowisp Robes is presently identified; remaining pieces and set bonuses are unknown.'),
    set('Chain of the Scarlet Crusade',[30,39],'Mail',['Hunter','Shaman','Warrior','Paladin'],'Scarlet Monastery','Changed',6,
      'Scarlet Belt|Scarlet Boots|Scarlet Chestpiece|Scarlet Gauntlets|Scarlet Leggings|Scarlet Wristguards',[],
      setSource('chain-of-the-scarlet-crusade'),'A Classic dungeon set with changed Forever bonuses. Piece slots vary from the default layout.'),
    set('Stormcloth Regalia',[39,45],'Cloth',cloth,'Tailoring','New · reported',6,'',[],
      setSource('stormcloth-regalia'),'Crafted cloth progression; verify recipe unlocks and required materials.','Crafted'),
    set("Krol'dok Battlegear",[40,45],'Mixed',all,"Krol'dok Stronghold",'New · reported',5,'',[],
      setSource('kroldok-battlegear'),'New dungeon gear. Specific set slots and bonuses are not yet verified.'),
    set('Blessed Plate',[47,56],'Plate',plate,'Blacksmithing','New · reported',8,'',[],
      setSource('blessed-plate'),'Crafted plate path; exact material economy remains uncertain.','Crafted'),
    set('Imperial Plate',[47,56],'Plate',plate,'Blacksmithing','Changed',8,'',[],
      setSource('imperial-plate'),'Classic crafted plate set; verify Forever tuning.','Crafted'),
    set("Defias Enforcer's Garb",[48,53],'Leather',leather,'Alcaz Prison / reported','New · reported',5,'',[],
      setSource('defias-enforcers-garb'),'Specific boss mapping and piece bonuses need launch confirmation.'),
    set('Devilsaur Armor',[53,55],'Leather',leather,'Leatherworking','Changed',2,'Devilsaur Gauntlets|Devilsaur Leggings',[],
      setSource('devilsaur-armor'),'Two-piece leather craft; compare set effect with your current weapon and hit rating.','Crafted'),
    set('Black Dragon Mail',[53,57],'Mail',['Hunter','Shaman','Warrior','Paladin'],'Blacksmithing','Changed · reported',3,'',[],
      setSource('black-dragon-mail'),'Piece list and changed bonus should be confirmed before investing in crafting materials.','Crafted'),
    set('Battlegear of Valor',[52,58],'Plate',['Warrior'],'Scholomance · Stratholme · Blackrock Spire','Changed',8,
      'Helm of Valor|Spaulders of Valor|Breastplate of Valor|Bracers of Valor|Gauntlets of Valor|Belt of Valor|Legplates of Valor|Boots of Valor',
      [[2,'+8 All Resistances'],[3,'+15 Strength'],[4,'Chance to remove a Disarm when struck'],[5,'Melee attacks can heal and generate Rage'],[6,'Health regeneration']],
      setSource('battlegear-of-valor'),'Dungeon Set 1 / Warrior. Historic boss drops require Forever verification.'),
    set('Lightforge Armor',[52,58],'Plate',['Paladin'],'Scholomance · Stratholme · Blackrock Spire','Changed',8,
      'Lightforge Helm|Lightforge Spaulders|Lightforge Breastplate|Lightforge Bracers|Lightforge Gauntlets|Lightforge Belt|Lightforge Legplates|Lightforge Boots',
      [[2,'+8 All Resistances'],[3,'+18 Spell damage and healing'],[4,'Chance to silence a harmful spellcaster'],[5,'Temporary spell damage and healing proc'],[6,'Mana regeneration']],
      setSource('lightforge-armor'),'Dungeon Set 1 / Paladin.'),
    set('Beaststalker Armor',[52,58],'Mail',['Hunter'],'Scholomance · Stratholme · Blackrock Spire','Changed',8,
      "Beaststalker's Cap|Beaststalker's Mantle|Beaststalker's Tunic|Beaststalker's Bindings|Beaststalker's Gloves|Beaststalker's Belt|Beaststalker's Pants|Beaststalker's Boots",
      [[2,'+8 All Resistances'],[3,'+30 Attack Power'],[4,'Chance to remove Root when struck'],[5,'Autoattacks can restore Mana'],[6,'Mana regeneration']],
      setSource('beaststalker-armor'),'Dungeon Set 1 / Hunter.'),
    set('Shadowcraft Armor',[52,58],'Leather',['Rogue'],'Scholomance · Stratholme · Blackrock Spire','Changed',8,
      'Shadowcraft Cap|Shadowcraft Spaulders|Shadowcraft Tunic|Shadowcraft Bracers|Shadowcraft Gloves|Shadowcraft Belt|Shadowcraft Pants|Shadowcraft Boots',
      [[2,'+8 All Resistances'],[3,'+30 Attack Power'],[4,'Chance to remove a Snare when struck'],[5,'Melee attacks can restore 20 Energy'],[6,'Health regeneration']],
      setSource('shadowcraft-armor'),'Dungeon Set 1 / Rogue.'),
    set('Vestments of the Devout',[52,58],'Cloth',['Priest'],'Scholomance · Stratholme · Blackrock Spire','Changed',8,
      'Devout Crown|Devout Mantle|Devout Robe|Devout Bracers|Devout Gloves|Devout Belt|Devout Skirt|Devout Sandals',
      [[2,'+8 All Resistances'],[3,'+18 Spell damage and healing'],[4,'Chance to absorb damage when struck'],[5,'Spellcasts can restore Mana'],[6,'Mana regeneration']],
      setSource('vestments-of-the-devout'),'Dungeon Set 1 / Priest.'),
    set('The Elements',[52,58],'Mail',['Shaman'],'Scholomance · Stratholme · Blackrock Spire','Changed',8,
      'Coif of Elements|Pauldrons of Elements|Vest of Elements|Bindings of Elements|Gauntlets of Elements|Cord of Elements|Kilt of Elements|Boots of Elements',
      [[2,'+8 All Resistances'],[3,'+18 Spell damage and healing'],[4,'Chance to disarm an attacker'],[5,'Temporary spell damage and healing proc'],[6,'Mana regeneration']],
      setSource('the-elements'),'Dungeon Set 1 / Shaman.'),
    set("Magister's Regalia",[52,58],'Cloth',['Mage'],'Scholomance · Stratholme · Blackrock Spire','Changed',8,
      "Magister's Crown|Magister's Mantle|Magister's Robes|Magister's Bindings|Magister's Gloves|Magister's Belt|Magister's Leggings|Magister's Boots",
      [[2,'+8 All Resistances'],[3,'+18 Spell damage and healing'],[4,'Chance to freeze an attacker'],[5,'Spellcasts can restore 200 Mana'],[6,'Mana regeneration']],
      setSource('magisters-regalia'),'Dungeon Set 1 / Mage.'),
    set('Dreadmist Raiment',[52,58],'Cloth',['Warlock'],'Scholomance · Stratholme · Blackrock Spire','Changed',8,
      'Dreadmist Mask|Dreadmist Mantle|Dreadmist Robe|Dreadmist Bracers|Dreadmist Wraps|Dreadmist Belt|Dreadmist Leggings|Dreadmist Sandals',
      [[2,'+8 All Resistances'],[3,'+18 Spell damage and healing'],[4,'Chance to fear an attacker'],[5,'Spellcasts can heal the wearer'],[6,'Mana regeneration']],
      setSource('dreadmist-raiment'),'Dungeon Set 1 / Warlock.'),
    set('Wildheart Raiment',[52,58],'Leather',['Druid'],'Scholomance · Stratholme · Blackrock Spire','Changed',8,
      'Wildheart Cowl|Wildheart Spaulders|Wildheart Vest|Wildheart Bracers|Wildheart Gloves|Wildheart Belt|Wildheart Kilt|Wildheart Boots',
      [[2,'+8 All Resistances'],[3,'Spell damage/healing plus Attack Power'],[4,'Chance for a short movement-speed increase'],[5,'Form-dependent Mana, Energy or Rage recovery'],[6,'Mana regeneration']],
      setSource('wildheart-raiment'),'Dungeon Set 1 / Druid.'),
    set('Battlegear of Heroism',[58,60],'Plate',['Warrior'],'Dungeon set upgrade chain','Changed · reported',8,'',[],
      setSource('battlegear-of-heroism'),'The level-60 upgraded dungeon set; exact pieces need verification.'),
    set('Beastmaster Armor',[58,60],'Mail',['Hunter'],'Dungeon set upgrade chain','Changed · reported',8,'',[],
      setSource('beastmaster-armor'),'The level-60 upgraded dungeon set; exact pieces need verification.'),
    set('Darkmantle Armor',[58,60],'Leather',['Rogue'],'Dungeon set upgrade chain','Changed · reported',8,'',[],
      setSource('darkmantle-armor'),'The level-60 upgraded dungeon set; exact pieces need verification.'),
    set("Sorcerer's Regalia",[58,60],'Cloth',['Mage'],'Dungeon set upgrade chain','Changed · reported',8,'',[],
      setSource('sorcerers-regalia'),'The level-60 upgraded dungeon set; exact pieces need verification.'),
    set('Soulforge Armor',[58,60],'Plate',['Paladin'],'Dungeon set upgrade chain','Changed · reported',8,'',[],
      setSource('soulforge-armor'),'The level-60 upgraded dungeon set; exact pieces need verification.'),
    set('Deathmist Raiment',[58,60],'Cloth',['Warlock'],'Dungeon set upgrade chain','Changed · reported',8,'',[],
      setSource('deathmist-raiment'),'The level-60 upgraded dungeon set; exact pieces need verification.'),
    set('Feralheart Raiment',[58,60],'Leather',['Druid'],'Dungeon set upgrade chain','Changed · reported',8,'',[],
      setSource('feralheart-raiment'),'The level-60 upgraded dungeon set; exact pieces need verification.')
  ];

  const PROFESSIONS = [
    {name:'Alchemy',group:'Crafting',icon:'trade_alchemy',pair:'Herbalism',camp:'Mana Well',skill:20,
      effect:'Restores 10–29 Mana every 5 sec (depends on level).',exclusive:'Blessing of Wisdom',
      use:'Consumables, potions and Mana support.',classic:'Healing Potion',classicIcon:'inv_potion_54'},
    {name:'Blacksmithing',group:'Crafting',icon:'trade_blacksmithing',pair:'Mining',camp:'Sharpening Wheel',skill:20,
      effect:'Grants +6–34 Strength (level dependent).',exclusive:'Strength of Earth Totem',
      use:'Crafted weapons, plate and mail; material-intensive.',classic:'Rough Sharpening Stone',classicIcon:'inv_stone_sharpeningstone_01'},
    {name:'Enchanting',group:'Crafting',icon:'trade_engraving',pair:'Tailoring',camp:'Enchanted Lute',skill:20,
      effect:'Adds Armor, all stats and resistances (level dependent).',exclusive:'Mark of the Wild',
      use:'Permanent item enchants; Disenchanting fuels materials.',classic:'Enchant Weapon - Minor Striking',classicIcon:'inv_enchant_disenchant'},
    {name:'Engineering',group:'Crafting',icon:'trade_engineering',pair:'Mining',camp:'Reagent Bot',skill:20,
      effect:'Provides reagent purchases at a shared campsite.',exclusive:'No class-buff collision listed',
      use:'Gadgets, explosives and practical utility; verify PvP rules.',classic:'Target Dummy',classicIcon:'inv_misc_enggizmos_02'},
    {name:'Leatherworking',group:'Crafting',icon:'trade_leatherworking',pair:'Skinning',camp:'Camp Tent',skill:20,
      effect:'Adds 5% of a level of rested XP if you are below that rested amount.',exclusive:'Does not help if already sufficiently rested',
      use:'Leather and mail equipment; class-appropriate crafted paths.',classic:'Light Armor Kit',classicIcon:'inv_misc_armorkit_17'},
    {name:'Tailoring',group:'Crafting',icon:'trade_tailoring',pair:'Enchanting',camp:'Faction Banner',skill:20,
      effect:'Grants +14–32 Spirit (level dependent) to your faction.',exclusive:'Divine Spirit',
      use:'Cloth gear, bags, and a natural match with Enchanting.',classic:'Linen Bag',classicIcon:'inv_misc_bag_01'},
    {name:'Herbalism',group:'Gathering',icon:'trade_herbalism',pair:'Alchemy',camp:'Incense Candle',skill:20,
      effect:'Grants +2–25 Intellect (level dependent).',exclusive:'Arcane Intellect',
      use:'Collect herbs; materials for Alchemy or the market.',classic:'Peacebloom',classicIcon:'inv_misc_flower_02'},
    {name:'Mining',group:'Gathering',icon:'trade_mining',pair:'Blacksmithing / Engineering',camp:'Lodestone',skill:20,
      effect:'Reported to grant +12–90 melee Attack Power, depending on level.',exclusive:'Blessing of Might',
      use:'Mine ore and stone for Blacksmithing or Engineering.',classic:'Copper Bar',classicIcon:'inv_ingot_02',
      reported:true,source:'https://www.wowhead.com/forever/guide/camping-overview-unlock-rewards'},
    {name:'Skinning',group:'Gathering',icon:'inv_misc_pelt_wolf_01',pair:'Leatherworking',camp:'Camp Chair',skill:20,
      effect:'Grants +2% critical strike chance to spells and attacks.',exclusive:'Moonkin Aura',
      use:'Leather and hides while killing beasts; easy leveling income.',classic:'Light Leather',classicIcon:'inv_misc_leatherscrap_01'},
    {name:'Cooking',group:'Secondary',icon:'inv_misc_food_15',pair:'Fishing',camp:'Basic Campfire',skill:1,
      effect:'Makes a place to cook and supports 3 contributed camp features.',exclusive:'None — the campsite is the shared base',
      use:'Food buffs and experience-supporting food recipes.',classic:'Herb Baked Egg',classicIcon:'inv_egg_02'},
    {name:'Fishing',group:'Secondary',icon:'trade_fishing',pair:'Cooking',camp:'Fishing Bowl',skill:20,
      effect:'Grants +8% to all stats.',exclusive:'Blessing of Kings',
      use:'Food ingredients and resource farming; pairs with Cooking.',classic:'Raw Brilliant Smallfish',classicIcon:'inv_misc_fish_02'},
    {name:'First Aid',group:'Secondary',icon:'spell_holy_sealofsacrifice',pair:'Any class',camp:'First Aid Kit',skill:20,
      effect:'Grants +3–56 Stamina (level dependent).',exclusive:'Power Word: Fortitude',
      use:'Bandages and survival; secondary slot, available alongside your primary choices.',classic:'Linen Bandage',classicIcon:'inv_misc_bandage_15'}
  ];
  const profByName = new Map(PROFESSIONS.map(p=>[p.name,p]));
  const PAIRS = {
    Warrior:[['Mining','Blacksmithing','Self-crafting','Plate and weapons as you level; high material cost.'],['Mining','Engineering','Utility / PvP','Gadgets and utility, not automatically more DPS.']],
    Paladin:[['Mining','Blacksmithing','Plate & weapons','Self-made armor and melee gear; especially relevant to Protection/Ret.'],['Herbalism','Alchemy','Sustain','Potions and materials when leveling solo.']],
    Hunter:[['Skinning','Leatherworking','Self-crafted gear','Use beast drops for leather; mail options develop later.'],['Mining','Engineering','Utility / PvP','Tools and gadgets for difficult pulls and group play.']],
    Rogue:[['Mining','Engineering','World PvP utility','Gadgets complement stealth and control.'],['Skinning','Leatherworking','Gear & gold','Craft leather upgrades while collecting hides.']],
    Priest:[['Tailoring','Enchanting','Caster self-sufficiency','Cloth gear and Disenchanting surplus cloth pieces.'],['Herbalism','Alchemy','Healer consumables','Mana and healing consumables for group play.']],
    Mage:[['Tailoring','Enchanting','Caster self-sufficiency','Bags and cloth items provide enchanting materials.'],['Herbalism','Alchemy','Consumable economy','Potion supply, with materials gathered yourself.']],
    Shaman:[['Skinning','Leatherworking','Flexible gear','Leather and later mail crafted options for Enhancement or healer.'],['Herbalism','Alchemy','Support / sustain','Potions for mana-heavy leveling and group roles.']],
    Warlock:[['Tailoring','Enchanting','Caster self-sufficiency','Cloth gear, bags and disenchanting.'],['Mining','Engineering','Utility / PvP','Gadgets alongside your spell toolkit.']],
    Druid:[['Herbalism','Alchemy','Flexible solo leveling','Potions for shifts between caster, healer and feral roles.'],['Skinning','Leatherworking','Feral gear','Use beast materials for leather equipment.']]
  };
  window.FOREVER_ARMORY = {sets:SETS,professions:PROFESSIONS,pairs:PAIRS};
  const registry = new Map();
  (window.FOREVER_GEAR_ITEMS||[]).forEach(item=>registry.set('gear:'+item.name,{
    name:item.name,eyebrow:'LEVELING UPGRADE / '+item.slot,
    icon:item.slot.includes('staff')?'inv_staff_01':/Bow|Gun|Crossbow/.test(item.slot)?'inv_weapon_bow_07':
      item.slot.includes('Shield')?'inv_shield_04':item.slot.includes('dagger')?'inv_weapon_shortblade_05':'inv_sword_27',
    meta:'Approximate useful levels '+item.from+'–'+item.to+' · '+item.slot,
    effect:'Suggested route: '+item.source+'. Classes/roles: '+item.profiles.join(', ')+'.',
    extra:'Classic reference only. Compare real item stats and acquisition in the Forever client; this is not a verified BiS ranking.',
    status:item.verification,source:'https://www.wowhead.com/classic/search?q='+encodeURIComponent(item.name)
  }));
  function register(key,data){registry.set(key,data);return ' data-armory-tip="'+ESC(key)+'"';}
  const classOpts=clsNames.map(name=>'<option>'+ESC(name)+'</option>').join('');
  const gearSection=document.querySelector('#upgrades');
  if(!gearSection)return;
  const setsSection=document.createElement('section');
  setsSection.id='sets';setsSection.className='armory-section';
  setsSection.innerHTML='<div class="sectiontop"><div><p class="eyebrow">03 / SET INTELLIGENCE</p><h2>Item sets <span class="armory-count">'+SETS.length+' curated paths</span></h2></div><a class="secondary" href="https://rankedboost.com/world-of-warcraft/forever/item-sets/" target="_blank" rel="noreferrer">Full set database ↗</a></div>'+
    '<p class="intro small">Find useful sets as you level. Each set has interactive set-bonus tiers and individual piece tooltips where names are known. New, changed and reported data are marked separately.</p>'+
    '<div class="armory-controls"><label>CLASS<select id="setClass">'+classOpts+'</select></label><label>LEVEL <output id="setLevelNum">30</output><input id="setLevel" type="range" min="1" max="60" value="30"></label><label>KIND<select id="setKind"><option>All</option><option>Dungeon</option><option>Crafted</option><option>World</option><option>Other</option></select></label><label>SEARCH<input id="setSearch" type="search" placeholder="Set, piece, dungeon…"></label><label class="armory-toggle"><input id="setAll" type="checkbox"> Show all levels</label></div>'+
    '<p class="armory-result" id="setCount" role="status"></p><div class="armory-set-grid" id="setGrid"></div>'+
    '<p class="armory-caution">Set bonuses are from recent Forever databases and may change. Historic dungeon drop locations are reference routes; they are not guaranteed in the re-itemized Forever loot tables. Missing piece names are deliberately not invented.</p>';
  gearSection.after(setsSection);
  const professionsSection=document.createElement('section');
  professionsSection.id='professions';professionsSection.className='armory-section';
  professionsSection.innerHTML='<div class="sectiontop"><div><p class="eyebrow">04 / CRAFTING & GATHERING</p><h2>Professions <span class="armory-count">9 primary · 3 secondary</span></h2></div><a class="secondary" href="'+professionDatabase+'" target="_blank" rel="noreferrer">Profession 1–300 routes ↗</a></div>'+
    '<p class="intro small">Choose two primary professions, while Cooking, Fishing and First Aid stay available as secondary skills. Recommendations are playstyle tradeoffs, not a fixed BiS ranking.</p>'+
    '<div class="prof-choice"><label>YOUR CLASS<select id="profClass">'+classOpts+'</select></label><div><span class="armory-kicker">SUGGESTED PAIRS</span><div id="profPairs" class="prof-pairs"></div></div></div>'+
    '<div class="prof-filters" role="group" aria-label="Profession category"><button data-prof-group="All" aria-pressed="true">All professions</button><button data-prof-group="Crafting" aria-pressed="false">Crafting</button><button data-prof-group="Gathering" aria-pressed="false">Gathering</button><button data-prof-group="Secondary" aria-pressed="false">Secondary</button></div>'+
    '<div id="profGrid" class="profession-grid"></div>'+
    '<div class="camp-notes"><strong>How campsite items work</strong><p>Camp objects require a Basic Campfire. Up to three can be contributed, one per player. Rest or craft there for about one minute to receive the shared benefit. Camp features have a shared one-hour cooldown; many buffs do not stack with equivalent class buffs.</p><a href="'+officialCamp+'" target="_blank" rel="noreferrer">Blizzard’s profession and camping rules ↗</a></div>'+
    '<p class="armory-caution">Skill-20 objects and effects are confirmed by Blizzard except Mining’s Lodestone, which is drawn from current client/guide data. Classic example items are references, not verified Forever recipes or stats.</p>';
  setsSection.after(professionsSection);
  const nav=document.querySelector('header nav');
  nav?.insertAdjacentHTML('beforeend','<a href="#sets">Item sets</a><a href="#professions">Professions</a>');
  document.querySelector('#addons .eyebrow').textContent='05 / KEEP THE UI LIGHT';
  const tooltip=document.createElement('div');
  tooltip.id='armoryTooltip';tooltip.hidden=true;tooltip.setAttribute('role','tooltip');
  document.body.append(tooltip);
  let pinned=false,anchor=null,hideTimer=0,group='All';
  const statusText=s=>s.includes('reported')?'REPORTED / DATA':s.toUpperCase();
  function setIcon(s) {
    return s.armor==='Plate'?'inv_chest_plate02':s.armor==='Mail'?'inv_chest_chain_05':
      s.armor==='Leather'?'inv_chest_leather_03':s.armor==='Cloth'?'inv_chest_cloth_07':
      s.armor==='Jewelry'?'inv_jewelry_ring_03':'inv_misc_gem_01';
  }
  function tipMarkup(d,pin) {
    const label=d.verified||'SOURCE / STATUS';
    return '<div class="armory-tooltip-title">'+icon(d.icon||'inv_misc_gem_01')+'<div><span>'+ESC(d.eyebrow||'FOREVER / ITEM')+'</span><strong>'+ESC(d.name)+'</strong></div>'+
      (pin?'<button type="button" id="tipClose" aria-label="Close item tooltip">×</button>':'')+'</div>'+
      (d.meta?'<div class="armory-tooltip-meta">'+ESC(d.meta)+'</div>':'')+
      '<p class="armory-tooltip-effect">'+ESC(d.effect||'')+'</p>'+
      (d.extra?'<p class="armory-tooltip-extra">'+ESC(d.extra)+'</p>':'')+
      (d.exclusive?'<p class="armory-tooltip-exclusive">Does not stack with / condition: '+ESC(d.exclusive)+'</p>':'')+
      '<div class="armory-tooltip-source"><b>'+ESC(label)+'</b> '+ESC(d.status||'')+
      (d.source?'<a href="'+ESC(d.source)+'" target="_blank" rel="noreferrer">View source ↗</a>':'')+'</div>';
  }
  function showTip(el,pin=false){
    const d=registry.get(el.dataset.armoryTip);if(!d)return;
    if(pinned&&!pin)return;
    clearTimeout(hideTimer);anchor=el;pinned=pin;
    tooltip.innerHTML=tipMarkup(d,pin);tooltip.hidden=false;
    tooltip.setAttribute('role',pin?'dialog':'tooltip');
    const r=el.getBoundingClientRect(),w=Math.min(355,innerWidth-20);
    tooltip.style.width=w+'px';
    let x=r.right+12;if(x+w>innerWidth-8)x=Math.max(8,r.left-w-12);
    let y=r.top;const h=tooltip.getBoundingClientRect().height;
    y=Math.max(8,Math.min(innerHeight-h-8,y));
    tooltip.style.left=x+'px';tooltip.style.top=y+'px';
    if(pin)tooltip.querySelector('#tipClose')?.addEventListener('click',()=>closeTip());
  }
  function closeTip(){clearTimeout(hideTimer);pinned=false;anchor=null;tooltip.hidden=true;}
  document.addEventListener('pointerover',e=>{
    const el=e.target.closest?.('[data-armory-tip]');
    if(!el||el.contains(e.relatedTarget))return;
    if(!pinned)showTip(el);
  });
  document.addEventListener('pointerout',e=>{
    const el=e.target.closest?.('[data-armory-tip]');
    if(el&&!el.contains(e.relatedTarget)&&!tooltip.contains(e.relatedTarget)&&!pinned)
      hideTimer=setTimeout(closeTip,170);
  });
  document.addEventListener('focusin',e=>{const el=e.target.closest?.('[data-armory-tip]');if(el&&!pinned)showTip(el);});
  document.addEventListener('focusout',e=>{if(e.target.closest?.('[data-armory-tip]')&&!pinned)hideTimer=setTimeout(closeTip,160);});
  document.addEventListener('click',e=>{
    if(e.target.closest?.('a')||e.target.closest?.('#tipClose'))return;
    const el=e.target.closest?.('[data-armory-tip]');
    if(el){if(pinned&&anchor===el)closeTip();else showTip(el,true);}
    else if(pinned&&!tooltip.contains(e.target))closeTip();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!tooltip.hidden)closeTip();});
  window.addEventListener('scroll',()=>{if(!pinned)closeTip();},{passive:true});
  tooltip.addEventListener('pointerenter',()=>clearTimeout(hideTimer));
  tooltip.addEventListener('pointerleave',()=>{if(!pinned)closeTip();});
  function pieceTip(s,p){
    return {name:p.name,eyebrow:s.name+' / '+p.slot,icon:slotIcon[p.slot]||setIcon(s),
      meta:p.slot+' · Approx. level '+s.from+'–'+s.to+' · '+s.armor,
      effect:'Part of '+s.name+'. '+s.origin+'.',
      extra:'Full item stats and exact drop location require verification in the Forever client.',
      status:s.status,source:s.source};
  }
  function setTip(s) {
    return {name:s.name,eyebrow:'ITEM SET / '+s.kind,icon:setIcon(s),
      meta:s.count+' pieces · '+s.armor+' · Approx. levels '+s.from+'–'+s.to,
      effect:s.bonuses.map(b=>b[0]+' pieces: '+b[1]).join(' · ')||'Bonuses not reliably recorded in the current source.',
      extra:s.note||s.origin,status:s.status,source:s.source};
  }
  function renderSets(){
    const cls=document.querySelector('#setClass').value;
    const lvl=Number(document.querySelector('#setLevel').value);
    const kind=document.querySelector('#setKind').value;
    const query=document.querySelector('#setSearch').value.trim().toLowerCase();
    const showAll=document.querySelector('#setAll').checked;
    document.querySelector('#setLevelNum').textContent=String(lvl);
    const rows=SETS.filter(s=>s.who.includes(cls)&&(kind==='All'||s.kind===kind)&&
      (showAll||(s.from<=lvl+15&&s.to>=lvl-12))&&
      (!query||[s.name,s.origin,s.armor,s.note,...s.pieces.map(p=>p.name)].join(' ').toLowerCase().includes(query)))
      .sort((a,b)=>Math.abs(a.from-lvl)-Math.abs(b.from-lvl)||a.from-b.from);
    document.querySelector('#setCount').textContent=rows.length+' relevant set'+(rows.length===1?'':'s')+
      ' · '+cls+' · Level '+lvl+' · '+(showAll?'all level ranges':'nearby levels');
    document.querySelector('#setGrid').innerHTML=rows.length?rows.map(s=>{
      register('set:'+s.id,setTip(s));
      return '<article class="armory-set-card"><div class="armory-set-top">'+
        '<button class="armory-set-icon" type="button"'+register('set:'+s.id,setTip(s))+' aria-label="Tooltip for '+ESC(s.name)+'">'+icon(setIcon(s))+'</button>'+
        '<div><span class="armory-kicker">'+ESC(s.kind.toUpperCase())+' · APPROX. '+s.from+'–'+s.to+'</span><h3>'+ESC(s.name)+'</h3><small>'+ESC(s.armor)+' · '+s.count+' pieces · '+ESC(s.origin)+'</small></div></div>'+
        '<div class="armory-set-status '+(s.status.includes('reported')?'reported':'changed')+'">'+statusText(s.status)+'</div>'+
        '<details><summary>Piece list & set bonuses <span>↗</span></summary>'+
        '<div class="armory-bonus-list">'+(s.bonuses.length?s.bonuses.map(b=>'<div><b>'+b[0]+' pieces</b><p>'+ESC(b[1])+'</p></div>').join(''):'<p class="armory-muted">Exact Forever set bonuses not yet verified for this set.</p>')+'</div>'+
        (s.pieces.length?'<div class="armory-piece-list">'+s.pieces.map((p,i)=>{
          const key='piece:'+s.id+':'+i;register(key,pieceTip(s,p));
          return '<button type="button" class="armory-piece"'+register(key,pieceTip(s,p))+' aria-label="Item tooltip: '+ESC(p.name)+'">'+icon(slotIcon[p.slot]||setIcon(s))+
            '<span>'+ESC(p.name)+'<small>'+ESC(p.slot)+'</small></span></button>';
        }).join('')+'</div>':'<p class="armory-muted">Item names/slots still under verification. Browse the source database for the latest piece list.</p>')+
        '<p class="armory-footnote">'+ESC(s.note)+'</p><a href="'+ESC(s.source)+'" target="_blank" rel="noreferrer" class="armory-source">Set source & full item list ↗</a></details></article>';
    }).join(''):'<div class="armory-no-results">No curated sets match. Try “Show all levels” or another class.</div>';
  }
  function renderPairs(){
    const cls=document.querySelector('#profClass').value;
    document.querySelector('#profPairs').innerHTML=PAIRS[cls].map((pair,i)=>{
      const [a,b,tag,why]=pair;
      return '<article class="prof-pair"><span>'+ESC(i===0?'SUGGESTED START':'ALTERNATIVE')+' · '+ESC(tag)+'</span><strong>'+ESC(a)+' + '+ESC(b)+'</strong><p>'+ESC(why)+'</p></article>';
    }).join('');
  }
  function profTip(p,type){
    if(type==='camp')return {name:p.camp,eyebrow:p.name.toUpperCase()+' / CAMP OBJECT',
      icon:p.icon,meta:'Profession skill '+p.skill+' · Shared one-hour camp-feature cooldown',
      effect:p.effect,exclusive:p.exclusive,extra:'Place at a Basic Campfire; sit or craft nearby for roughly a minute to receive its benefit.',
      status:p.reported?'Datamined / check at launch':'Blizzard confirmed',source:p.source||officialCamp};
    return {name:p.classic,eyebrow:p.name.toUpperCase()+' / CLASSIC REFERENCE',icon:p.classicIcon,
      meta:'Example traditional profession item',effect:p.use,
      extra:'Recipe, reagents, skill requirement and item statistics must be checked against the Forever client.',
      status:'Classic reference — not a verified Forever tooltip',source:professionDatabase};
  }
  function renderProfessions(){
    const rows=PROFESSIONS.filter(p=>group==='All'||p.group===group);
    document.querySelector('#profGrid').innerHTML=rows.map(p=>{
      const campKey='camp:'+p.name,classKey='example:'+p.name;
      register(campKey,profTip(p,'camp'));register(classKey,profTip(p,'classic'));
      return '<article class="profession-card"><header class="profession-heading">'+icon(p.icon)+
        '<div><small>'+ESC(p.group.toUpperCase())+'</small><h3>'+ESC(p.name)+'</h3><span>Pairs with '+ESC(p.pair)+'</span></div></header>'+
        '<p class="profession-use">'+ESC(p.use)+'</p>'+
        '<div class="profession-item-list">'+
        '<button type="button" class="profession-item"'+register(campKey,profTip(p,'camp'))+' aria-label="Tooltip: '+ESC(p.camp)+'">'+icon(p.icon)+
          '<span><b>'+ESC(p.camp)+'</b><small>'+ESC(p.skill===1?'Skill 1':'Skill 20')+' · '+(p.reported?'Datamined camp feature':'Forever camp feature')+'</small><em>'+ESC(p.effect)+'</em></span></button>'+
        '<button type="button" class="profession-item"'+register(classKey,profTip(p,'classic'))+' aria-label="Tooltip: '+ESC(p.classic)+'">'+icon(p.classicIcon)+
          '<span><b>'+ESC(p.classic)+'</b><small>Classic recipe/item reference</small><em>Hover, focus or tap for context</em></span></button></div>'+
        '<a class="armory-source" target="_blank" rel="noreferrer" href="'+professionDatabase+'/'+p.name.toLowerCase().replace(/ /g,'-')+'">Level '+ESC(p.name)+' from 1 to 300 ↗</a></article>';
    }).join('');
  }
  for(const id of ['setClass','setKind','setAll'])document.querySelector('#'+id).addEventListener('change',renderSets);
  document.querySelector('#setLevel').addEventListener('input',renderSets);
  document.querySelector('#setSearch').addEventListener('input',renderSets);
  document.querySelector('#profClass').addEventListener('change',renderPairs);
  document.querySelectorAll('[data-prof-group]').forEach(b=>b.addEventListener('click',()=>{
    group=b.dataset.profGroup;
    document.querySelectorAll('[data-prof-group]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    renderProfessions();
  }));
  const gearClass=document.querySelector('#gearClass'),gearLevel=document.querySelector('#gearLevel');
  function syncFromGear(){
    document.querySelector('#setClass').value=gearClass.value;
    document.querySelector('#profClass').value=gearClass.value;
    document.querySelector('#setLevel').value=gearLevel.value;
    renderSets();renderPairs();
  }
  gearClass.addEventListener('change',syncFromGear);
  gearLevel.addEventListener('input',syncFromGear);
  syncFromGear();renderProfessions();
})();
