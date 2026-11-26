/* STICK ARKNIGHTS - playable browser prototype */
(() => {
  'use strict';
  const D = window.STICK_DATA;
  const SAVE_KEY = 'stickArknightsSave_v1';
  const $ = (q, root=document) => root.querySelector(q);
  const $$ = (q, root=document) => [...root.querySelectorAll(q)];
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const classById = id => D.classes.find(c=>c.id===id);
  const opById = id => D.operators.find(o=>o.id===id);
  const number = n => Math.floor(n||0).toLocaleString('ko-KR');
  const state = {
    view:'home', selectedOperator:'exusiai', selectedDeploy:'fang', battle:null,
    battleTimer:null, animationFrame:null, toastTimer:null, save:null,
    mobileOpen:false, pendingRogueNode:null
  };

  function defaultSave(){
    const owned = ['fang','myrtle','lappland','exusiai','w','wisadel','amiya','cuora','saria','ansel','suzuran','shaw'];
    const levels = {};
    D.operators.forEach(o => levels[o.id] = {elite:0,level:1});
    return {
      resources:{lmd:32000,records:180,chips:24,advanced:12,orundum:2400,permits:5},
      owned, levels, clearedStages:[], bestAnnihilation:0, recruitmentCount:0,
      rogueWins:0, rogue:null, selectedSquad:['fang','exusiai','cuora','ansel']
    };
  }
  function loadSave(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      if(!raw) return defaultSave();
      const parsed=JSON.parse(raw), fresh=defaultSave();
      return {...fresh,...parsed,resources:{...fresh.resources,...(parsed.resources||{})},levels:{...fresh.levels,...(parsed.levels||{})}};
    }catch(e){ return defaultSave(); }
  }
  state.save=loadSave();
  function save(){ try{localStorage.setItem(SAVE_KEY,JSON.stringify(state.save));}catch(e){} }
  function ownedOperators(){ return state.save.owned.map(opById).filter(Boolean); }
  function getLevel(id){ return state.save.levels[id] || {elite:0,level:1}; }
  function effectiveStats(op){
    const lv=getLevel(op.id), tier=lv.elite;
    const factor=tier===2?1.42:tier===1?1.19:1;
    return {hp:Math.round(op.hp*factor*(1+(lv.level-1)*.004)),atk:Math.round(op.atk*factor*(1+(lv.level-1)*.008)),def:Math.round(op.def*factor*(1+(lv.level-1)*.006))};
  }
  function rogueBoosts(op){
    const run=state.save.rogue;const out={atk:1,def:1,speed:1,dp:1,reward:1};if(!run)return out;
    (run.relics||[]).forEach(id=>{const relic=D.relics.find(x=>x.id===id);if(!relic)return;const e=relic.effect||{};if(e.atk)out.atk*=e.atk;if(e.def)out.def*=e.def;if(e.speed)out.speed*=e.speed;if(e.dp)out.dp*=e.dp;if(e.reward)out.reward*=e.reward;if(e.rangeAtk&&['sniper','caster'].includes(op.class))out.atk*=e.rangeAtk;if(e.caster&&op.class==='caster')out.atk*=e.caster;});return out;
  }
  function toast(msg){
    const el=$('#toast'); if(!el)return; el.textContent=msg; el.classList.add('show');
    clearTimeout(state.toastTimer); state.toastTimer=setTimeout(()=>el.classList.remove('show'),2100);
  }
  function setView(view){
    stopBattleLoops(); state.view=view; state.mobileOpen=false;
    $('#sidebar')?.classList.remove('open'); render();
  }
  function renderResources(){
    const r=state.save.resources;
    const el=$('#resource-strip'); if(!el)return;
    el.innerHTML=`<div class="resource"><span>◈ LMD</span><em>${number(r.lmd)}</em></div><div class="resource"><span>▤ 기록</span><em>${number(r.records)}</em></div><div class="resource"><span>◆ 칩</span><em>${number(r.chips)}</em></div><div class="resource"><span>✦ 고급칩</span><em>${number(r.advanced)}</em></div><div class="resource"><span>◇ 합성옥</span><em>${number(r.orundum)}</em></div>`;
  }
  function render(){
    renderResources();
    $$('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
    const main=$('#main-content');
    if(state.view==='home') main.innerHTML=renderHome();
    else if(state.view==='story') main.innerHTML=renderStory();
    else if(state.view==='annihilation') main.innerHTML=renderAnnihilation();
    else if(state.view==='roguelike') main.innerHTML=renderRogue();
    else if(state.view==='operators') main.innerHTML=renderOperators();
    else if(state.view==='recruit') main.innerHTML=renderRecruit();
    else if(state.view==='battle') main.innerHTML=renderBattle();
    else main.innerHTML=renderHome();
    if(state.view==='battle') startBattleLoops();
    bindSpriteCanvases();
  }
  function renderHome(){
    const s=state.save, cleared=s.clearedStages.length, best=s.bestAnnihilation;
    return `<div class="page-header"><div><div class="page-kicker">RHODES ISLAND · TACTICAL TERMINAL</div><h1>작전 지휘실</h1><p>전장을 선택하고, 오퍼레이터를 편성해 작전을 시작하십시오.</p></div><span class="header-chip">OPERATIONAL STATUS · READY</span></div>
      <section class="hero"><div class="hero-content"><div class="page-kicker">STICK ARKNIGHTS / FIELD COMMAND</div><h2>THE LINE<br><span>MUST HOLD.</span></h2><p>픽셀 스틱맨으로 재구성한 전술 디펜스. 스토리 작전에서 전력을 키우고, 섬멸작전에서 한계를 시험하며, 통합전략에서 매번 달라지는 경로를 돌파하십시오.</p><div class="button-row"><button class="btn primary" data-view="story">스토리 작전 진입</button><button class="btn subtle" data-view="operators">오퍼레이터 관리</button></div></div></section>
      <div class="stats-grid" style="margin-top:16px"><div class="stat-box"><strong>${cleared}/${D.storyStages.length}</strong><span>스토리 작전 완료</span></div><div class="stat-box"><strong>${best}/80</strong><span>섬멸 최고 처치 수</span></div><div class="stat-box"><strong>${s.owned.length}</strong><span>보유 오퍼레이터</span></div><div class="stat-box"><strong>${s.rogueWins}</strong><span>통합전략 완주</span></div></div>
      <div class="section-title"><h2>전투 모드</h2><small>세 가지 전장 유형</small></div>
      <div class="dashboard-grid">
        <article class="mode-card"><div class="mode-icon">▤</div><h3>스토리 작전</h3><p>챕터와 스테이지를 순서대로 해금한다. 단계별 적 구성과 보스전을 돌파해 성장 재화를 확보한다.</p><button class="btn" data-view="story">작전 목록 보기 →</button></article>
        <article class="mode-card"><div class="mode-icon">⌁</div><h3>섬멸작전</h3><p>10의 생명 점수로 장기 웨이브를 버틴다. 처치 수가 높을수록 보상이 커진다. 본 프로토타입은 80명 규모다.</p><button class="btn" data-view="annihilation">섬멸작전 진입 →</button></article>
        <article class="mode-card"><div class="mode-icon">✣</div><h3>통합전략</h3><p>분기형 노드에서 작전, 긴급 작전, 이벤트, 상점, 휴식을 선택한다. 희망과 유물을 관리해 최종 보스에 도달한다.</p><button class="btn" data-view="roguelike">탐험 시작 →</button></article>
      </div>
      <div class="section-title"><h2>최근 전력 현황</h2><small>정예화와 육성</small></div>
      <div class="panel"><div class="split"><div><h3>보유 전력</h3><p>오퍼레이터는 레벨을 올린 뒤 1차 정예화(E1), 2차 정예화(E2)를 거쳐 전투 능력과 스킬이 강화된다. 성장 재화는 원작보다 넉넉하게 지급한다.</p><div class="button-row"><button class="btn primary" data-view="operators">오퍼레이터 관리</button><button class="btn" data-view="recruit">확정 모집</button></div></div><div><div class="reward-line">PROGRESSION SUPPORT</div><p style="margin-top:8px">스토리 첫 클리어 보상, 섬멸작전 누적 처치 보상, 통합전략 탐험 보상을 통해 LMD·기록·칩을 빠르게 모을 수 있다.</p><div class="footnote">저장 데이터는 현재 브라우저의 localStorage에 보관된다.</div></div></div></div>
      <div class="footer-note">STICK ARKNIGHTS · PROTOTYPE BUILD 0.1</div>`;
  }
  function renderStory(){
    let html=`<div class="page-header"><div><div class="page-kicker">MAIN THEME · STORY OPERATIONS</div><h1>스토리 작전</h1><p>각 스테이지를 클리어하면 다음 작전이 해금된다. 반복 플레이로 성장 재화를 확보할 수 있다.</p></div><span class="header-chip">CLEARED ${state.save.clearedStages.length}/${D.storyStages.length}</span></div>`;
    [0,1,2].forEach(ch=>{
      html+=`<div class="section-title"><h2>CHAPTER ${String(ch+1).padStart(2,'0')} · ${['첫 번째 접촉','도시의 균열','최종 방어선'][ch]}</h2><small>${D.storyStages.filter(s=>s.chapter===ch&&state.save.clearedStages.includes(s.id)).length}/3 COMPLETE</small></div><div class="stage-list">`;
      D.storyStages.filter(s=>s.chapter===ch).forEach(stage=>{
        const index=D.storyStages.indexOf(stage), unlocked=index===0||state.save.clearedStages.includes(D.storyStages[index-1].id), cleared=state.save.clearedStages.includes(stage.id);
        html+=`<button class="stage-card ${unlocked?'':'locked'}" data-stage="${stage.id}" ${unlocked?'':'disabled'}><div class="stage-id">${stage.id} ${cleared?'· CLEAR':''}</div><h3>${stage.title}</h3><p>${stage.subtitle}</p><div class="stage-meta"><span>ENEMIES ${stage.enemies}</span><span>DIFF ${stage.difficulty.toFixed(1)}</span></div><div class="divider"></div><div class="reward-line">LMD ${number(stage.reward.lmd)} · EXP ${stage.reward.records}</div></button>`;
      });
      html+='</div>';
    });
    html+=`<div class="section-title"><h2>작전 적 정보</h2><small>주요 적 병종</small></div><div class="panel"><div class="enemy-list">${Object.values(D.enemies).map(e=>`<div class="enemy-chip"><b>${e.name}</b><small>HP ${number(e.hp)} · DEF ${e.def} · ${e.type==='boss'?'BOSS':e.type.toUpperCase()}</small></div>`).join('')}</div></div>`;
    return html;
  }
  function renderAnnihilation(){
    const best=state.save.bestAnnihilation;
    return `<div class="page-header"><div><div class="page-kicker">PERMANENT OPERATION · LONG DEFENSE</div><h1>섬멸작전</h1><p>적의 대규모 공세를 막아라. 전투가 끝나면 처치 수에 비례해 보상을 받는다.</p></div><span class="header-chip">BEST ${best}/80</span></div>
      <div class="split"><div class="panel"><div class="wave-banner">PROTOTYPE RULE · 총 80기 / 생명 점수 10 / 처치 수 누적 보상</div><h3 style="margin-top:16px">폐허 외곽 섬멸 구역</h3><p>일반병과 돌격병으로 시작해 방패병, 술사, 중장병, 정예 지휘관이 순차적으로 합류한다. 적이 목표 지점에 도달하면 생명 점수가 감소한다. 전투 중 퇴각해도 처치 수에 따라 일부 보상을 획득한다.</p><div class="stats-grid"><div class="stat-box"><strong>80</strong><span>목표 적 수</span></div><div class="stat-box"><strong>10</strong><span>생명 점수</span></div><div class="stat-box"><strong>4</strong><span>보상 구간</span></div><div class="stat-box"><strong>${best}</strong><span>개인 최고 기록</span></div></div><div class="button-row" style="margin-top:16px"><button class="btn primary" data-action="start-annihilation">섬멸작전 시작</button><button class="btn" data-view="operators">편성 확인</button></div></div>
      <div class="panel"><h3>누적 보상표</h3>${[20,40,60,80].map((n,i)=>`<div style="margin:12px 0"><div class="stage-meta"><b>${n}기 처치</b><span>${i===0?'기초 보급':i===1?'전술 보급':i===2?'정예 보급':'완전 섬멸'}</span></div><div class="progress" style="margin-top:7px"><i style="width:${n/80*100}%"></i></div><p style="font-size:11px;margin:6px 0 0">LMD ${n*105} · 기록 ${Math.floor(n*.72)} · 합성옥 ${Math.floor(n/20)*35}</p></div>`).join('')}<div class="footnote">실제 섬멸작전의 장기 방어와 처치 수 비례 보상 구조를 참고해 플레이 시간을 줄인 버전이다.</div></div></div>`;
  }
  function renderRogue(){
    const r=state.save.rogue;
    if(!r){
      return `<div class="page-header"><div><div class="page-kicker">INTEGRATED STRATEGIES · ROGUELIKE</div><h1>통합전략</h1><p>매 회차 다른 노드 경로와 임시 전력으로 최종 보스에 도전한다.</p></div><span class="header-chip">RUN-BASED MODE</span></div><div class="hero" style="min-height:190px"><div class="hero-content"><div class="page-kicker">EXPEDITION PROTOCOL</div><h2>CHOOSE<br><span>YOUR ROUTE.</span></h2><p>작전 노드, 긴급 작전, 우연한 만남, 상점, 휴식 지점을 거쳐 최종 보스에게 도달하라. 보유 오퍼레이터 중 일부를 임시 편성하고, 탐험 도중 새 오퍼레이터와 유물을 확보할 수 있다.</p><button class="btn primary" data-action="start-rogue">새 탐험 시작</button></div></div><div class="section-title"><h2>통합전략 규칙</h2><small>한 회차마다 초기화</small></div><div class="dashboard-grid"><div class="mode-card"><div class="mode-icon">◇</div><h3>희망</h3><p>오퍼레이터 모집과 승급에 사용하는 임시 자원. 높은 등급의 모집일수록 더 많은 희망이 필요하다.</p></div><div class="mode-card"><div class="mode-icon">✦</div><h3>유물</h3><p>공격력, DP 회복, 생존력 등을 강화한다. 여러 유물을 조합해 매번 다른 전술을 구성한다.</p></div><div class="mode-card"><div class="mode-icon">⌘</div><h3>분기 경로</h3><p>다음 층에서 인접한 노드를 선택한다. 휴식이나 상점에 들르는 대신 전투를 선택할 수도 있다.</p></div></div><div class="panel" style="margin-top:16px"><h3>이전 탐험 기록</h3><p>완주 ${state.save.rogueWins}회 · 누적 영구 보상 ${number(state.save.resources.lmd)} LMD</p></div>`;
    }
    const nodeTypes={combat:['⚔','작전'],emergency:['‼','긴급'],encounter:['?','이벤트'],shop:['▣','상점'],rest:['✚','휴식'],boss:['♜','보스']};
    let mapRows='';
    for(let floor=1;floor<=5;floor++){
      let slots='';
      for(let col=0;col<5;col++){
        const n=D.rogueNodes.find(x=>x.floor===floor&&x.col===col);
        if(!n){slots+='<div class="rogue-empty"></div>';continue;}
        const [sym,label]=nodeTypes[n.type],done=r.cleared.includes(n.id);
        const available=floor===r.floor&&!done&&(floor===1||r.lastCol===null||Math.abs(col-r.lastCol)<=2);
        const status=done?'완료':available?'선택 가능':'잠김';
        slots+=`<div class="rogue-slot"><button class="rogue-node ${done?'done':available?'available':'locked'}" data-rogue-node="${n.id}" ${available?'':'disabled'}><span class="node-symbol">${sym}</span><b>${label}</b><small>F${floor} · ${status}</small></button></div>`;
      }
      mapRows+=`<div class="rogue-floor-row" aria-label="${floor}층">${slots}</div>`;
    }
    const links=[];
    D.rogueNodes.forEach(a=>D.rogueNodes.filter(b=>b.floor===a.floor+1&&Math.abs(b.col-a.col)<=2).forEach(b=>links.push(`<line x1="${(a.col+.5)*20}" y1="${(a.floor-.5)*20}" x2="${(b.col+.5)*20}" y2="${(b.floor-.5)*20}" />`)));
    const mapSvg=`<svg class="rogue-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${links.join('')}</svg>`;
    const relicHtml=(r.relics||[]).map(id=>{const x=D.relics.find(y=>y.id===id);return x?`<span class="tag gold" title="${x.desc}">${x.icon} ${x.name}</span>`:''}).join('')||'<span class="muted">아직 획득한 유물이 없습니다.</span>';
    return `<div class="page-header"><div><div class="page-kicker">INTEGRATED STRATEGIES · ACTIVE RUN</div><h1>층 ${r.floor} / 5 · ${r.floor===5?'최종 구역':'탐험 경로'}</h1><p>현재 층에서 다음 노드를 선택하라. 탐험 중 획득한 전력과 유물은 이번 회차에만 적용된다.</p></div><button class="btn danger small" data-action="abandon-rogue">탐험 포기</button></div>
      <div class="rogue-summary"><span class="header-chip">LIFE ${r.life}</span><span class="header-chip">HOPE ${r.hope}</span><span class="header-chip">INGOTS ${r.ingots}</span><span class="header-chip">TEAM ${r.roster.length}/8</span></div>
      <div class="section-title"><h2>분기형 작전 지도</h2><small>현재 층 노드 중 하나 선택</small></div><div class="rogue-map">${mapSvg}${mapRows}</div>
      <div class="section-title"><h2>이번 회차 편성</h2><small>${r.roster.length} operators · HOPE ${r.hope}</small></div><div class="operator-grid">${r.roster.map(id=>opById(id)).filter(Boolean).map(op=>operatorCard(op,true)).join('')}</div><div class="button-row" style="margin-top:12px"><button class="btn primary" data-action="rogue-recruit" ${r.roster.length>=8?'disabled':''}>희망으로 오퍼레이터 모집</button></div>
      <div class="section-title"><h2>보유 유물</h2><small>${(r.relics||[]).length} / ${D.relics.length}</small></div><div class="panel"><div style="display:flex;gap:6px;flex-wrap:wrap">${relicHtml}</div></div>`;
  }
  function operatorCard(op,compact=false){
    const lv=getLevel(op.id), cl=classById(op.class);
    return `<button class="operator-card" data-operator="${op.id}"><div class="sprite-box"><canvas class="mini-sprite" width="32" height="32" data-sprite="${op.id}"></canvas></div><div class="operator-info"><b>${op.name}</b><small>${cl.name} · ${op.branch}</small><div class="rarity">${'★'.repeat(op.rarity)} <span style="color:#8293a5">E${lv.elite} Lv.${lv.level}</span></div></div></button>`;
  }
  function renderOperators(){
    let selected=opById(state.selectedOperator)||ownedOperators()[0];
    if(!selected) selected=D.operators[0];
    const owned=state.save.owned.includes(selected.id), lv=getLevel(selected.id), stats=effectiveStats(selected), cl=classById(selected.class);
    const maxLevel=lv.elite===0?50:lv.elite===1?70:90;
    const canE1=selected.rarity>=4 && lv.elite===0 && lv.level>=40;
    const canE2=selected.rarity>=4 && lv.elite===1 && lv.level>=60;
    const maxElite=selected.rarity>=4?2:1;
    const cardList=D.operators.map(op=>`<button class="operator-card ${op.id===selected.id?'selected':''}" data-operator="${op.id}"><div class="sprite-box"><canvas class="mini-sprite" width="32" height="32" data-sprite="${op.id}"></canvas></div><div class="operator-info"><b>${op.name}${state.save.owned.includes(op.id)?'':' · 미보유'}</b><small>${classById(op.class).name} · ${op.branch}</small><div class="rarity">${'★'.repeat(op.rarity)} <span style="color:#8293a5">${state.save.owned.includes(op.id)?`E${getLevel(op.id).elite} Lv.${getLevel(op.id).level}`:'RECRUIT'}</span></div></div></button>`).join('');
    const promotionButton = !owned ? `<button class="btn primary" data-action="recruit" data-id="${selected.id}">확정 모집 · LMD 1,800 + 모집권 1</button>` : `<div class="button-row"><button class="btn" data-action="train" data-id="${selected.id}" ${lv.level>=maxLevel?'disabled':''}>레벨 +5 · 기록 4 / LMD 160</button>${lv.elite===0?`<button class="btn primary" data-action="promote" data-tier="1" data-id="${selected.id}" ${canE1?'':'disabled'}>1차 정예화 · LMD 2,200 / 칩 2</button>`:''}${lv.elite===1?`<button class="btn primary" data-action="promote" data-tier="2" data-id="${selected.id}" ${canE2?'':'disabled'}>2차 정예화 · LMD 4,500 / 고급칩 1 / 칩 3</button>`:''}${lv.elite>=maxElite?'<span class="tag gold">최대 정예화</span>':''}</div>`;
    return `<div class="page-header"><div><div class="page-kicker">OPERATOR MANAGEMENT · ROSTER</div><h1>오퍼레이터</h1><p>보유 오퍼레이터를 육성하고, 직군별 세부 분파와 성장 상태를 확인한다.</p></div><span class="header-chip">OWNED ${state.save.owned.length}/${D.operators.length}</span></div>
      <div class="operator-detail panel"><div class="operator-portrait"><canvas class="large-sprite" width="64" height="64" data-sprite="${selected.id}"></canvas></div><div><div class="page-kicker">${cl.en} · ${selected.branch.toUpperCase()}</div><h2 style="margin:5px 0">${selected.name} <span class="rarity">${'★'.repeat(selected.rarity)}</span></h2><p style="margin:0 0 7px">${selected.desc}</p><div class="stage-meta"><span>${selected.skill}</span><span>DP ${selected.dp} · 저지 ${selected.block}</span></div><div class="detail-stats"><div class="detail-stat"><span>HP</span><b>${stats.hp}</b></div><div class="detail-stat"><span>ATK</span><b>${stats.atk}</b></div><div class="detail-stat"><span>DEF</span><b>${stats.def}</b></div><div class="detail-stat"><span>RANGE</span><b>${selected.range}</b></div></div><div class="branch-block"><div class="stage-meta"><b>성장 단계</b><span>ELITE ${lv.elite} · LEVEL ${lv.level}/${maxLevel}</span></div><div class="progress" style="margin-top:8px"><i style="width:${lv.level/maxLevel*100}%"></i></div><p style="font-size:11px;margin:8px 0 0">${lv.elite===0?'기본 단계. 레벨 40 달성 시 1차 정예화 가능.':lv.elite===1?'1차 정예화. 특성이 강화되며 레벨 60 달성 시 2차 정예화 가능.':'2차 정예화 완료. 능력치가 추가 상승하고 전용 스킬 강화 단계가 해방되었다.'}</p><div class="divider"></div><div class="stage-meta"><b>전용 스킬 · ${selected.skill}</b><span>E${lv.elite} 강화</span></div><p style="font-size:11px;margin:7px 0 0">${selected.skillText}</p></div>${promotionButton}</div></div>
      <div class="section-title"><h2>오퍼레이터 목록</h2><small>선택해 상세 정보 확인</small></div><div class="operator-grid">${cardList}</div>
      <div class="section-title"><h2>직군 및 세부 분파 도감</h2><small>${D.classes.reduce((n,c)=>n+c.branches.length,0)} branches</small></div><div class="panel">${D.classes.map(c=>`<div class="branch-block"><h4><span style="color:${c.color}">◆</span> ${c.name} <small class="muted">${c.en}</small></h4><div>${c.branches.map(b=>`<span class="branch-chip ${selected.class===c.id&&selected.branch===b?'selected-branch':''}">${b}</span>`).join('')}</div></div>`).join('')}</div>`;
  }
  function renderRecruit(){
    const available=D.operators.filter(o=>!state.save.owned.includes(o.id));
    return `<div class="page-header"><div><div class="page-kicker">PERSONNEL · DIRECT CONTRACT</div><h1>오퍼레이터 모집</h1><p>무작위 뽑기 없이 원하는 오퍼레이터를 직접 선택하는 확정 모집이다.</p></div><span class="header-chip">PERMIT ${state.save.resources.permits}</span></div><div class="panel"><div class="split"><div><h3>확정 모집 계약</h3><p>모집 대상과 비용을 미리 공개한다. LMD 1,800과 모집권 1장을 사용해 선택한 오퍼레이터를 영입한다. 모집권이 부족하면 합성옥 300개로 대신할 수 있다.</p></div><div class="stat-box"><strong>${available.length}</strong><span>미영입 오퍼레이터</span></div></div></div><div class="section-title"><h2>영입 가능한 오퍼레이터</h2><small>직접 선택 · 확정 획득</small></div><div class="operator-grid">${available.map(op=>`<div class="panel" style="padding:12px"><div style="display:flex;gap:10px;align-items:center"><div class="sprite-box"><canvas class="mini-sprite" width="32" height="32" data-sprite="${op.id}"></canvas></div><div class="operator-info"><b>${op.name}</b><small>${classById(op.class).name} · ${op.branch}</small><div class="rarity">${'★'.repeat(op.rarity)}</div></div></div><p style="font-size:11px;margin:10px 0">${op.desc}</p><button class="btn primary small" style="width:100%" data-action="recruit" data-id="${op.id}">모집 · LMD 1,800 + 모집권 1</button></div>`).join('')||'<div class="empty-state">모든 오퍼레이터를 영입했다.</div>'}</div>`;
  }
  function renderBattle(){
    const b=state.battle; if(!b)return '<div class="empty-state">전투 데이터를 찾을 수 없습니다.</div>';
    const deployIds=b.mode==='rogue'?(state.save.rogue?.roster||[]):state.save.owned;
    const cards=deployIds.map(id=>opById(id)).filter(Boolean).map(op=>`<button class="deploy-card ${state.selectedDeploy===op.id?'active':''}" data-deploy="${op.id}"><b>${op.name}</b><span>DP ${op.dp} · ${op.branch}</span></button>`).join('');
    const modeName=b.mode==='story'?'STORY OPERATION':b.mode==='annihilation'?'ANNIHILATION':'INTEGRATED STRATEGIES';
    return `<div class="page-header"><div><div class="page-kicker">${modeName} · LIVE BATTLE</div><h1>${b.title}</h1><p>${b.subtitle}</p></div><button class="btn danger small" data-action="retreat">작전 종료</button></div>
      <div class="battle-layout"><div class="battle-board"><div class="battle-topline"><b>TACTICAL MAP · 8 × 5 GRID</b><span id="battle-status">DEPLOYMENT PHASE</span></div><div class="battle-meters"><div class="meter"><b id="battle-dp">${b.dp}</b><span>DEPLOY COST</span></div><div class="meter"><b id="battle-life">${b.life}</b><span>LIFE</span></div><div class="meter"><b id="battle-kills">0 / ${b.total}</b><span>ELIMINATED</span></div></div><div class="progress" style="margin:10px 0"><i id="battle-progress" style="width:0%"></i></div><div class="battle-canvas-wrap"><canvas id="battle-canvas" class="battle-canvas" width="800" height="500" aria-label="전술 전장. 배치할 타일을 클릭하세요."></canvas></div><p class="battle-tip">오퍼레이터를 선택한 뒤 격자 타일을 클릭해 배치한다. 전방 저지 직군은 중앙 도로, 원거리 직군은 위·아래 지원 타일에 배치하는 것이 효율적이다.</p></div>
      <aside class="battle-side"><div class="panel"><h3>배치 오퍼레이터</h3><div class="deploy-list">${cards||'<div class="muted">편성 가능한 오퍼레이터가 없다.</div>'}</div><div class="divider"></div><div class="stage-meta"><span>DEPLOYED</span><b id="battle-deployed">0 / 8</b></div><button class="btn primary" style="width:100%;margin-top:12px" data-action="start-wave" id="start-wave">작전 개시</button><button class="btn" style="width:100%;margin-top:7px" data-action="speed" id="speed-button">전투 배속 1×</button></div><div class="panel"><h3>전투 기록</h3><div class="battle-log" id="battle-log"><div>작전 준비 완료. 오퍼레이터를 배치하라.</div></div></div><div class="panel"><h3>작전 팁</h3><p style="font-size:11px;margin:0">적이 중앙 도로를 지나 목표 지점에 도달하면 생명 점수를 잃는다. 방어 직군으로 진격을 막고, 원거리 직군으로 안전한 타일에서 지원하라.</p></div></aside></div>`;
  }

  function bindSpriteCanvases(){
    $$('canvas[data-sprite]').forEach(canvas=>drawSpriteCanvas(canvas,opById(canvas.dataset.sprite)));
  }
  function drawSpriteCanvas(canvas,op){
    if(!canvas||!op)return;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
    const scale=Math.min(canvas.width,canvas.height)/32;ctx.save();ctx.scale(scale,scale);drawStickFigure(ctx,16,21,op.color,false,getLevel(op.id).elite);ctx.restore();
  }
  function drawStickFigure(ctx,x,y,accent,isEnemy=false,elite=0){
    // Every character uses the same plain black bald circular head.
    const black='#05080d';
    ctx.fillStyle=black;ctx.fillRect(x-3,y-20,6,1);ctx.fillRect(x-5,y-19,10,2);ctx.fillRect(x-6,y-17,12,5);ctx.fillRect(x-5,y-12,10,2);
    ctx.fillStyle='#f0f3f7';ctx.fillRect(x-3,y-14,1,1);ctx.fillRect(x+2,y-14,1,1);
    ctx.fillStyle=black;ctx.fillRect(x-4,y-9,8,7);ctx.fillRect(x-7,y-8,3,5);ctx.fillRect(x+4,y-8,3,5);
    ctx.fillRect(x-6,y-3,4,7);ctx.fillRect(x+2,y-3,4,7);
    ctx.fillRect(x-6,y+3,4,7);ctx.fillRect(x+2,y+3,4,7);
    ctx.fillRect(x-8,y+9,6,2);ctx.fillRect(x+1,y+9,7,2);
    ctx.fillStyle=accent;ctx.fillRect(x-4,y-8,8,3);ctx.fillRect(x-2,y-5,4,3);
    if(elite>0){ctx.fillStyle=elite===2?'#f2d17a':'#b6d8e7';ctx.fillRect(x-6,y-7,2,2);ctx.fillRect(x+4,y-7,2,2);}
    if(isEnemy){ctx.fillStyle='#d95f68';ctx.fillRect(x-2,y-17,4,1);}
    else {ctx.fillStyle=accent;ctx.fillRect(x+6,y-5,5,2);ctx.fillRect(x+9,y-7,2,2);}
  }

  function startBattle(mode,opts={}){
    stopBattleLoops();
    let total,life,title,subtitle,mix,difficulty=1;
    if(mode==='story'){
      const stage=opts.stage;total=stage.enemies;life=3;title=`${stage.id} · ${stage.title}`;subtitle=stage.subtitle;mix=stage.mix;difficulty=stage.difficulty;
    }else if(mode==='annihilation'){
      total=80;life=10;title='폐허 외곽 · 섬멸작전';subtitle='장기 웨이브를 버티고 가능한 많은 적을 처치하라.';mix=['soldier','hound','shield','archer','caster','drone','heavy','bomber','leader'];difficulty=1.1;
    }else{
      const node=opts.node;total=node.type==='boss'?26:node.type==='emergency'?22:17;life=state.save.rogue.life;title=`통합전략 · ${node.type==='boss'?'최종 보스':node.type==='emergency'?'긴급 작전':'작전 노드'}`;subtitle=`${state.save.rogue.floor}층 · ${node.label} · 이번 회차 임시 편성`;mix=node.type==='boss'?['shield','heavy','caster','leader','boss']:['soldier','hound','shield','archer','drone','caster'];difficulty=node.type==='emergency'?1.6:node.type==='boss'?2.3:1.2;
    }
    state.battle={mode,opts,total,life,dp:mode==='annihilation'?18:12,title,subtitle,mix,difficulty,spawned:0,kills:0,enemies:[],units:[],started:false,over:false,won:false,elapsed:0,lastSpawn:0,dpTimer:0,log:['전투 준비 완료. 오퍼레이터를 배치하라.'],speed:1,leaks:0,finished:false};
    state.selectedDeploy=(mode==='rogue'?(state.save.rogue.roster[0]||'fang'):(state.save.selectedSquad.find(id=>state.save.owned.includes(id))||state.save.owned[0]));
    state.view='battle';render();
  }
  function stopBattleLoops(){
    if(state.battleTimer){clearInterval(state.battleTimer);state.battleTimer=null;}
    if(state.animationFrame){cancelAnimationFrame(state.animationFrame);state.animationFrame=null;}
  }
  function addLog(message){
    const b=state.battle;if(!b)return;b.log.unshift(message);b.log=b.log.slice(0,18);
    const el=$('#battle-log');if(el)el.innerHTML=b.log.map(x=>`<div>${x}</div>`).join('');
  }
  function updateBattleMeters(){
    const b=state.battle;if(!b)return;
    const set=(id,val)=>{const el=$(id);if(el)el.textContent=val;};
    set('#battle-dp',Math.floor(b.dp));set('#battle-life',b.life);set('#battle-kills',`${b.kills} / ${b.total}`);set('#battle-deployed',`${b.units.length} / 8`);
    const p=$('#battle-progress');if(p)p.style.width=`${b.kills/b.total*100}%`;
    const st=$('#battle-status');if(st)st.textContent=b.over?'OPERATION COMPLETE':b.started?'ENGAGEMENT IN PROGRESS':'DEPLOYMENT PHASE';
  }
  function startBattleLoops(){
    const canvas=$('#battle-canvas');if(!canvas)return;
    canvas.addEventListener('click',onBattleCanvasClick);
    updateBattleMeters();
    if(state.battleTimer)clearInterval(state.battleTimer);
    state.battleTimer=setInterval(updateBattle,100);
    const draw=()=>{if(state.view!=='battle'||!state.battle)return;drawBattle();state.animationFrame=requestAnimationFrame(draw);};
    state.animationFrame=requestAnimationFrame(draw);
  }
  function onBattleCanvasClick(e){
    const b=state.battle;if(!b||b.over)return;
    const canvas=e.currentTarget,rect=canvas.getBoundingClientRect();
    const x=(e.clientX-rect.left)/rect.width*canvas.width,y=(e.clientY-rect.top)/rect.height*canvas.height;
    const col=Math.floor(x/(canvas.width/8)),row=Math.floor(y/(canvas.height/5));
    if(col<0||col>=8||row<0||row>=5)return;
    deployOperator(state.selectedDeploy,col,row);
  }
  function deployOperator(id,col,row){
    const b=state.battle,op=opById(id);if(!b||!op||b.over)return;
    const ids=b.mode==='rogue'?(state.save.rogue?.roster||[]):state.save.owned;
    if(!ids.includes(id)){toast('현재 편성에 포함되지 않은 오퍼레이터다.');return;}
    if(b.units.length>=8){toast('배치 한도 8명에 도달했다.');return;}
    if(b.units.some(u=>u.x===col&&u.y===row)){toast('이미 오퍼레이터가 배치된 타일이다.');return;}
    const front=['vanguard','guard','defender','specialist'].includes(op.class);
    if((row===2&&!front)||(row!==2&&front&&op.class!=='specialist')){toast(row===2?'중앙 도로에는 전방 배치 직군을 배치하라.':'전방 직군은 중앙 도로 타일에 배치하라.');return;}
    if(b.dp<op.dp){toast('배치 DP가 부족하다.');return;}
    b.dp-=op.dp;const stats=effectiveStats(op);
    b.units.push({id,x:col,y:row,hp:stats.hp,maxHp:stats.hp,atk:stats.atk,def:stats.def,cool:0,charge:0,elite:getLevel(id).elite,skillReady:false,skillPulse:0,role:op.role,op});
    addLog(`${op.name} 배치 완료.`);updateBattleMeters();
  }
  function spawnEnemy(){
    const b=state.battle;if(!b)return;
    const spawnIndex=b.spawned;let type=b.mix[spawnIndex%b.mix.length];
    if(b.mode==='story'){
      if(type==='leader'||type==='boss')type='shield';
      if(b.opts.stage.boss&&spawnIndex===b.total-1)type=b.opts.stage.id==='2-3'?'boss':'leader';
    }else if(b.mode==='rogue'){
      if(type==='boss')type='leader';
      if(b.opts.node.type==='boss'&&spawnIndex===b.total-1)type='boss';
    }
    if(b.mode==='annihilation'){
      const n=b.spawned;
      if(n>62&&n%13===0)type='leader';else if(n>45&&n%9===0)type='heavy';else if(n>28&&n%7===0)type='caster';
    }
    const base=D.enemies[type]||D.enemies.soldier;
    const mul=b.difficulty*(b.mode==='annihilation'?1+(b.spawned/80)*.55:1);
    b.enemies.push({type,x:-.25,y:2,hp:Math.round(base.hp*mul),maxHp:Math.round(base.hp*mul),def:base.def*mul,speed:base.speed*(b.mode==='annihilation'?1.05:1),atk:base.atk*mul,reward:base.reward,slow:0,attackTimer:0});
    b.spawned++;
  }
  function damageEnemy(enemy,damage,arts=false){
    if(!enemy||enemy.hp<=0)return;
    const real=Math.max(18,damage-(arts?enemy.def*.12:enemy.def*.48));enemy.hp-=real;
    if(enemy.hp<=0){const b=state.battle;b.kills++;b.dp=Math.min(99,b.dp+enemy.reward*.35);if(b.mode==='annihilation'&&b.kills%20===0)addLog(`${b.kills}기 처치! 누적 보상 구간 달성.`);}
  }
  function nearestEnemy(unit,b){
    const op=unit.op;let candidates=b.enemies.filter(e=>e.hp>0);
    candidates=candidates.filter(e=>Math.abs(e.x-unit.x)<=op.range&&Math.abs(e.y-unit.y)<=Math.max(1,op.range/2));
    candidates.sort((a,c)=>Math.abs(a.x-unit.x)+Math.abs(a.y-unit.y)-(Math.abs(c.x-unit.x)+Math.abs(c.y-unit.y)));
    return candidates[0]||null;
  }
  function useSkill(unit,target){
    const b=state.battle,op=unit.op;unit.charge=0;unit.skillPulse=1.2;
    addLog(`${op.name} · ${op.skill} 발동!`);
    if(op.role==='dp'){b.dp=Math.min(99,b.dp+(op.id==='myrtle'?12:6));return;}
    if(op.role==='heal'||op.role==='healAll'){
      const targets=b.units.filter(u=>u.hp<u.maxHp).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp).slice(0,op.role==='healAll'?b.units.length:2);
      targets.forEach(t=>t.hp=Math.min(t.maxHp,t.hp+unit.atk*2.3+250));return;
    }
    if(!target)return;
    const power=unit.atk*(unit.elite===2?2.4:unit.elite===1?2:1.75);
    if(op.id==='exusiai'){
      for(let i=0;i<5;i++)damageEnemy(target,power*.55,false);
    }else if(op.id==='lappland'){
      damageEnemy(target,power,true);target.slow=2.5;
    }else if(op.id==='w'){
      b.enemies.filter(e=>Math.abs(e.x-target.x)<1.7&&Math.abs(e.y-target.y)<1).forEach(e=>damageEnemy(e,power*.9,true));
    }else if(op.id==='wisadel'){
      b.enemies.filter(e=>Math.abs(e.x-target.x)<2.2&&Math.abs(e.y-target.y)<1.4).forEach(e=>damageEnemy(e,power*1.05,true));
    }else if(op.role==='splash'){
      b.enemies.filter(e=>Math.abs(e.x-target.x)<1.5&&Math.abs(e.y-target.y)<1.5).forEach(e=>damageEnemy(e,power,true));
    }else if(op.role==='slow'){
      b.enemies.filter(e=>Math.abs(e.x-target.x)<2&&Math.abs(e.y-target.y)<1.5).forEach(e=>{damageEnemy(e,power*.8,true);e.slow=4;});
    }else if(op.role==='push'){
      damageEnemy(target,power,false);target.x=Math.max(-.25,target.x-.75);
    }else{
      damageEnemy(target,power,op.role==='arts'||op.role==='chain');
    }
  }
  function attackUnit(unit,target,dt){
    const op=unit.op;unit.cool-=dt;
    if(unit.cool>0||(!target&&!['heal','healAll'].includes(op.role)))return;
    const interval=Math.max(.38,op.aspd*(getLevel(op.id).elite===2?.78:1)/(unit.speed||1));
    unit.cool=interval;
    if(op.role==='heal'||op.role==='healAll'||op.role==='heal'){
      const wounded=state.battle.units.filter(u=>u.hp<u.maxHp).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp);
      if(wounded[0])wounded[0].hp=Math.min(wounded[0].maxHp,wounded[0].hp+unit.atk*.55+125);
    }else if(op.role==='dp'){
      state.battle.dp=Math.min(99,state.battle.dp+(op.id==='myrtle'?1.7:.65));damageEnemy(target,unit.atk*.35,false);
    }else if(op.role==='rapid'){
      const shots=unit.skillReady?5:3;for(let i=0;i<shots;i++)damageEnemy(target,unit.atk*.32,false);
    }else if(op.role==='trap'){
      damageEnemy(target,unit.atk*1.12,true);
      if(op.id==='w'&&Math.random()<.32){state.battle.enemies.filter(e=>e!==target&&Math.abs(e.x-target.x)<1.2).forEach(e=>damageEnemy(e,unit.atk*.7,true));}
    }else if(op.role==='shadow'){
      damageEnemy(target,unit.atk*.9,true);if(Math.random()<.5)damageEnemy(target,unit.atk*.65,true);
      state.battle.enemies.filter(e=>e!==target&&Math.abs(e.x-target.x)<1.15).slice(0,2).forEach(e=>damageEnemy(e,unit.atk*.5,true));
    }else if(op.role==='chain'){
      damageEnemy(target,unit.atk*.88,true);state.battle.enemies.filter(e=>e!==target&&Math.abs(e.x-target.x)<1.7).slice(0,3).forEach(e=>damageEnemy(e,unit.atk*.42,true));
    }else if(op.role==='splash'){
      damageEnemy(target,unit.atk*.95,op.class==='caster');state.battle.enemies.filter(e=>e!==target&&Math.abs(e.x-target.x)<1.1&&Math.abs(e.y-target.y)<1).forEach(e=>damageEnemy(e,unit.atk*.55,op.class==='caster'));
    }else if(op.role==='slow'){
      damageEnemy(target,unit.atk*.8,true);target.slow=1.5;
    }else if(op.role==='push'){
      damageEnemy(target,unit.atk*.9,false);target.x=Math.max(-.25,target.x-.25);
    }else if(op.role==='fast'){
      damageEnemy(target,unit.atk*1.25,false);
    }else if(op.role==='summon'){
      damageEnemy(target,unit.atk*.9,true);damageEnemy(target,unit.atk*.22,true);
    }else if(op.role==='arts'){
      damageEnemy(target,unit.atk*1.05,true);
    }else{
      damageEnemy(target,unit.atk*.95,false);
    }
    unit.charge=Math.min(100,unit.charge+18);
    const skillThreshold=unit.elite===2?80:unit.elite===1?90:100;
    if(unit.charge>=skillThreshold){unit.skillReady=true;useSkill(unit,target);unit.skillReady=false;}
  }
  function updateBattle(){
    const b=state.battle;if(!b||b.over)return;
    const dt=.1*b.speed;b.elapsed+=dt;b.dpTimer+=dt;
    if(!b.started)return;
    const dpBoost=b.mode==='rogue'?rogueBoosts({class:'vanguard'}).dp:1;
    if(b.dpTimer>=1.65/dpBoost){b.dp=Math.min(99,b.dp+1);b.dpTimer=0;}
    if(b.spawned<b.total&&b.elapsed-b.lastSpawn>=(b.mode==='annihilation'?.78:.95)){spawnEnemy();b.lastSpawn=b.elapsed;}
    // enemies move through the center lane unless blocked by a front-line unit
    b.enemies.forEach(e=>{
      if(e.hp<=0)return;
      e.attackTimer-=dt;
      const blocker=b.units.find(u=>u.y===2&&u.op.block>0&&Math.abs(u.x-e.x)<.52&&b.enemies.filter(other=>other!==e&&other.hp>0&&Math.abs(other.x-u.x)<.52).length<u.op.block);
      if(blocker){
        if(e.attackTimer<=0){blocker.hp-=e.atk*.18;e.attackTimer=.9;if(blocker.hp<=0){addLog(`${blocker.op.name} 퇴각.`);b.units=b.units.filter(u=>u!==blocker);}}
      }else{
        const slowFactor=e.slow>0?.42:1;e.x+=e.speed*dt*slowFactor;
      }
      if(e.slow>0)e.slow-=dt;
    });
    b.units.forEach(u=>{
      if(!b.units.includes(u))return;
      if(u.skillPulse>0)u.skillPulse-=dt;
      const target=nearestEnemy(u,b);attackUnit(u,target,dt);
    });
    const leaked=b.enemies.filter(e=>e.hp>0&&e.x>=8.15);
    if(leaked.length){b.life-=leaked.length;b.leaks+=leaked.length;addLog(`적 ${leaked.length}기 목표 지점 도달. 생명 점수 감소.`);}
    b.enemies=b.enemies.filter(e=>e.hp>0&&e.x<8.15);
    if(b.leaks>0&&b.leaks%3===0){};
    updateBattleMeters();
    if(b.life<=0){finishBattle(false);return;}
    if(b.spawned>=b.total&&b.enemies.length===0){finishBattle(true);return;}
  }
  function drawBattle(){
    const canvas=$('#battle-canvas'),b=state.battle;if(!canvas||!b)return;
    const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,cw=w/8,ch=h/5;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#0b131d';ctx.fillRect(0,0,w,h);
    // background skyline silhouettes
    for(let i=0;i<13;i++){const x=i*68;ctx.fillStyle=i%2?'#101e2b':'#142231';ctx.fillRect(x,20+(i%4)*9,34,90);ctx.fillRect(x+8,8+(i%3)*11,14,18);}
    for(let row=0;row<5;row++)for(let col=0;col<8;col++){
      const x=col*cw,y=row*ch;ctx.fillStyle=row===2?'#4a4232':(row===1||row===3?'#202e3c':'#182432');ctx.fillRect(x+1,y+1,cw-2,ch-2);
      ctx.strokeStyle='#324356';ctx.lineWidth=1;ctx.strokeRect(x+1,y+1,cw-2,ch-2);
      if(row===2){ctx.fillStyle='#b39455';ctx.fillRect(x+cw*.18,y+ch*.46,cw*.64,3);}
      else if(row===1||row===3){ctx.fillStyle='#293c4d';ctx.fillRect(x+cw*.42,y+ch*.43,5,5);}
    }
    ctx.fillStyle='#e0bd68';ctx.fillRect(0,h*.4,6,ch*.8);ctx.fillRect(w-8,h*.4,8,ch*.8);
    ctx.fillStyle='#e5c878';ctx.font='bold 11px monospace';ctx.fillText('IN',8,15);ctx.fillText('OUT',w-43,15);
    // operators
    b.units.forEach(u=>{
      const op=u.op,x=(u.x+.5)*cw,y=(u.y+.57)*ch;
      drawStickFigure(ctx,x,y,op.color,false,u.elite);
      ctx.fillStyle='#101722';ctx.fillRect(x-20,y+14,40,5);ctx.fillStyle='#62c994';ctx.fillRect(x-20,y+14,40*clamp(u.hp/u.maxHp,0,1),5);
      if(u.charge>=70){ctx.fillStyle='#f1ce70';ctx.fillRect(x-9,y-31,18,3);ctx.fillRect(x-9,y-31,18*u.charge/100,3);}
      if(u.skillPulse>0){ctx.strokeStyle=op.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y-5,18+(1.2-u.skillPulse)*14,0,Math.PI*2);ctx.stroke();}
    });
    // enemies
    b.enemies.forEach(e=>{
      const x=(e.x+.5)*cw,y=2.55*ch;const type=D.enemies[e.type];
      drawStickFigure(ctx,x,y,type.color,true,0);
      ctx.fillStyle='#090f17';ctx.fillRect(x-18,y-29,36,4);ctx.fillStyle='#db6670';ctx.fillRect(x-18,y-29,36*clamp(e.hp/e.maxHp,0,1),4);
      if(e.type==='boss'){ctx.strokeStyle='#d75e70';ctx.lineWidth=2;ctx.strokeRect(x-22,y-34,44,48);}
      if(e.slow>0){ctx.fillStyle='#7cd3d5';ctx.fillRect(x-2,y-34,4,4);}
    });
    if(!b.started){ctx.fillStyle='rgba(5,9,15,.54)';ctx.fillRect(0,0,w,h);ctx.fillStyle='#f0d28a';ctx.font='bold 20px monospace';ctx.textAlign='center';ctx.fillText('DEPLOY OPERATORS',w/2,h/2);ctx.font='12px monospace';ctx.fillStyle='#d1dae5';ctx.fillText('Select an operator, then click a tile.',w/2,h/2+25);ctx.textAlign='left';}
    if(b.over){ctx.fillStyle='rgba(5,9,15,.58)';ctx.fillRect(0,0,w,h);ctx.textAlign='center';ctx.fillStyle='#f0d28a';ctx.font='bold 26px monospace';ctx.fillText(b.won?'OPERATION COMPLETE':'OPERATION ENDED',w/2,h/2);ctx.textAlign='left';}
  }
  function finishBattle(won){
    const b=state.battle;if(!b||b.over)return;b.over=true;b.won=won;stopBattleLoops();
    const r=state.save.resources;
    if(b.mode==='story'){
      const stage=b.opts.stage;
      if(won){
        const first=!state.save.clearedStages.includes(stage.id);if(first)state.save.clearedStages.push(stage.id);
        const factor=(first?1:.55)*(b.rewardBoost||1);b.rewardSummary=`LMD +${Math.round(stage.reward.lmd*factor)} · 기록 +${Math.round(stage.reward.records*(first?1:.55))}`;r.lmd+=Math.round(stage.reward.lmd*factor);r.records+=Math.round(stage.reward.records*(first?1:.55));r.chips+=Math.round(stage.reward.chips*(first?1:.55));r.advanced+=(stage.reward.advanced||0)*(first?1:0);r.orundum+=(stage.reward.orundum||0)*(first?1:.25);
        addLog(`작전 성공! 보상 LMD ${Math.round(stage.reward.lmd*factor)} 획득.`);
      }else{r.lmd+=Math.round(b.kills*28);r.records+=Math.floor(b.kills/3);addLog('작전 실패. 처치 수에 따른 보급품을 일부 회수했다.');}
    }else if(b.mode==='annihilation'){
      state.save.bestAnnihilation=Math.max(state.save.bestAnnihilation,b.kills);
      b.rewardSummary=`LMD +${b.kills*105} · 기록 +${Math.floor(b.kills*.72)} · 칩 +${Math.floor(b.kills/22)}`;r.lmd+=b.kills*105;r.records+=Math.floor(b.kills*.72);r.chips+=Math.floor(b.kills/22);r.advanced+=Math.floor(b.kills/65);r.orundum+=Math.floor(b.kills/20)*35;
      addLog(`섬멸 기록 ${b.kills}기. 처치 수에 비례해 보상을 정산했다.`);
    }else if(b.mode==='rogue'){
      const run=state.save.rogue;
      if(won){run.life=b.life;run.ingots+=b.opts.node.type==='boss'?5:2;run.hope+=b.opts.node.type==='boss'?3:1;run.cleared.push(b.opts.node.id);run.lastCol=b.opts.node.col;run.floor++;const rewardFactor=rogueBoosts({class:'other'}).reward;r.lmd+=Math.round(450*rewardFactor);r.records+=5;
        if(b.opts.node.type==='boss'||run.floor>5){r.lmd+=5500+run.ingots*250;r.records+=45;r.chips+=5;r.advanced+=3;r.orundum+=120;state.save.rogueWins++;state.save.rogue=null;state.view='roguelike';addLog('통합전략 완주! 탐험 보상을 수령했다.');}
        else{state.view='roguelike';addLog('작전 노드 돌파. 다음 경로를 선택하라.');}
      }else{r.lmd+=b.kills*22;r.records+=Math.floor(b.kills/5);state.save.rogue=null;state.view='roguelike';addLog('탐험 종료. 처치 수에 따른 소량의 보급품을 회수했다.');}
    }
    save();renderResources();
    showBattleResult(b);
  }
  function showBattleResult(b){
    const rewards=b.rewardSummary||(b.mode==='story'?(b.won?`LMD +${b.opts.stage.reward.lmd} · 기록 +${b.opts.stage.reward.records}`:`LMD +${b.kills*28} · 기록 +${Math.floor(b.kills/3)}`):b.mode==='annihilation'?`LMD +${b.kills*105} · 기록 +${Math.floor(b.kills*.72)} · 칩 +${Math.floor(b.kills/22)}`:b.won?'탐험 자원과 임시 희망을 획득했다.':'일부 작전 보급품을 회수했다.');
    const root=$('#modal-root');root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="page-kicker">AFTER ACTION REPORT</div><h2>${b.won?'작전 완료':'작전 종료'}</h2><p>${b.title} · 처치 ${b.kills}/${b.total} · 잔여 생명 ${b.life}</p><div class="panel"><div class="reward-line">${rewards}</div><p style="font-size:11px;margin-bottom:0">${b.mode==='rogue'?'통합전략은 현재 회차 결과에 따라 다음 경로 또는 탐험 결과 화면으로 돌아간다.':'재화는 계정에 저장되었다.'}</p></div><div class="modal-actions"><button class="btn primary" data-action="close-result">확인</button></div></div></div>`;
  }

  function startRogue(){
    const base=['fang','exusiai','cuora','ansel'].filter(id=>state.save.owned.includes(id));
    state.save.rogue={floor:1,life:5,hope:6,ingots:0,roster:base,cleared:[],lastCol:null,relics:[],nodeCount:0};save();state.view='roguelike';render();
  }
  function availableRogueNodes(){
    const r=state.save.rogue;if(!r)return[];
    return D.rogueNodes.filter(n=>n.floor===r.floor&&!r.cleared.includes(n.id)&&(r.floor===1||r.lastCol===null||Math.abs(n.col-r.lastCol)<=2));
  }
  function selectRogueNode(id){
    const r=state.save.rogue;if(!r)return;const node=D.rogueNodes.find(n=>n.id===id);if(!node||!availableRogueNodes().some(x=>x.id===id))return;
    r.nodeCount++;
    if(['combat','emergency','boss'].includes(node.type)){startBattle('rogue',{node});return;}
    if(node.type==='encounter'){
      showModal('우연한 만남','낡은 보급 상자를 발견했다. 어느 자원을 확보할 것인가?',[
        {label:'희망 +2',action:()=>{r.hope+=2;advanceRogue(node);}},
        {label:'유물 획득',action:()=>{grantRandomRelic();advanceRogue(node);}},
        {label:'LMD +1,500',action:()=>{state.save.resources.lmd+=1500;advanceRogue(node);}}
      ]);return;
    }
    if(node.type==='shop'){
      showShop(node);return;
    }
    if(node.type==='rest'){
      showModal('안전 지대','잠시 숨을 돌릴 수 있다. 탐험 상태를 정비하라.',[
        {label:'생명 +2',action:()=>{r.life=Math.min(8,r.life+2);advanceRogue(node);}},
        {label:'희망 +2',action:()=>{r.hope+=2;advanceRogue(node);}},
        {label:'유물 획득',action:()=>{grantRandomRelic();advanceRogue(node);}}
      ]);return;
    }
  }
  function advanceRogue(node){
    const r=state.save.rogue;if(!r)return;r.cleared.push(node.id);r.lastCol=node.col;r.floor++;save();closeModal();
    if(r.floor>5){state.save.resources.lmd+=4500;state.save.resources.records+=35;state.save.rogueWins++;state.save.rogue=null;save();toast('탐험 완주! 보상을 획득했다.');}
    render();
  }
  function showRogueRecruit(){
    const r=state.save.rogue;if(!r)return;
    const candidates=state.save.owned.filter(id=>!r.roster.includes(id)).map(id=>opById(id)).filter(Boolean);
    if(!candidates.length){toast('모집 가능한 오퍼레이터가 없다.');return;}
    const root=$('#modal-root');
    root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="page-kicker">ROGUE RECRUITMENT</div><h2>임시 오퍼레이터 모집</h2><p>보유 오퍼레이터 중 이번 탐험에 합류시킬 인원을 선택한다. 희망 비용은 등급별로 공개된다.</p><div class="operator-grid">${candidates.map(op=>{const cost=op.rarity>=6?3:op.rarity===5?2:op.rarity===4?1:0;return `<div class="panel" style="padding:10px"><b>${op.name}</b><p style="font-size:10px;margin:4px 0 8px">${classById(op.class).name} · ${op.branch} · ${'★'.repeat(op.rarity)}</p><button class="btn small" data-rogue-recruit="${op.id}" ${r.hope<cost||r.roster.length>=8?'disabled':''}>희망 ${cost} 사용</button></div>`;}).join('')}</div><div class="modal-actions"><button class="btn" data-action="close-modal">닫기</button></div></div></div>`;
  }
  function rogueRecruit(id){
    const r=state.save.rogue,op=opById(id);if(!r||!op||r.roster.includes(id)||r.roster.length>=8)return;
    const cost=op.rarity>=6?3:op.rarity===5?2:op.rarity===4?1:0;if(r.hope<cost){toast('희망이 부족하다.');return;}
    r.hope-=cost;r.roster.push(id);save();closeModal();render();toast(`${op.name} 임시 편성 완료.`);
  }
  function grantRandomRelic(){
    const r=state.save.rogue;if(!r)return;const pool=D.relics.filter(x=>!r.relics.includes(x.id));if(!pool.length){r.ingots+=2;return;}const relic=pool[Math.floor(Math.random()*pool.length)];r.relics.push(relic.id);if(relic.effect.life)r.life=Math.min(8,r.life+relic.effect.life);toast(`유물 획득: ${relic.name}`);
  }
  function showShop(node){
    state.pendingRogueNode=node;
    const root=$('#modal-root');const r=state.save.rogue;const pool=D.relics.filter(x=>!r.relics.includes(x.id)).slice(0,3);
    root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="page-kicker">ROGUE TRADER</div><h2>임시 보급 상점</h2><p>보유한 임시 주화를 사용해 이번 탐험에만 적용되는 보급품을 구매한다.</p><div class="stage-meta"><span>보유 주화</span><b>${r.ingots}</b></div><div class="divider"></div><div class="shop-grid">${pool.map(x=>`<div class="shop-item"><b>${x.icon} ${x.name}</b><p>${x.desc}</p><button class="btn small" data-buy-relic="${x.id}" ${r.ingots<2?'disabled':''}>2 주화 구매</button></div>`).join('')||'<p>구매 가능한 유물이 없다.</p>'}<div class="shop-item"><b>희망 보급</b><p>모집에 사용할 희망 2를 보충한다.</p><button class="btn small" data-buy-hope ${r.ingots<1?'disabled':''}>1 주화 구매</button></div></div><div class="modal-actions"><button class="btn primary" data-action="leave-shop" data-node="${node.id}">상점 떠나기</button></div></div></div>`;
  }
  function showModal(title,body,choices){
    const root=$('#modal-root');root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="page-kicker">FIELD EVENT</div><h2>${title}</h2><p>${body}</p><div class="modal-actions">${choices.map((c,i)=>`<button class="btn ${i===0?'primary':''}" data-event-choice="${i}">${c.label}</button>`).join('')}</div></div></div>`;
    root._choices=choices;
  }
  function closeModal(){const root=$('#modal-root');root.innerHTML='';root._choices=null;}

  function train(id){
    const op=opById(id),lv=getLevel(id),res=state.save.resources,max=lv.elite===0?50:lv.elite===1?70:90;if(lv.level>=max){toast('현재 정예화 단계의 최대 레벨이다.');return;}
    if(res.records<4||res.lmd<160){toast('전술 기록 또는 LMD가 부족하다.');return;}
    const amount=Math.min(5,max-lv.level);res.records-=4;res.lmd-=160;lv.level+=amount;state.save.levels[id]=lv;save();render();toast(`${op.name} 레벨 ${lv.level} 달성.`);
  }
  function promote(id,tier){
    const op=opById(id),lv=getLevel(id),res=state.save.resources;
    if(tier===1){if(op.rarity<4||lv.elite!==0||lv.level<40){toast('레벨 40 이상, 4성 이상 오퍼레이터가 필요하다.');return;}if(res.lmd<2200||res.chips<2){toast('LMD 또는 직군 칩이 부족하다.');return;}res.lmd-=2200;res.chips-=2;lv.elite=1;lv.level=1;}
    else if(tier===2){if(op.rarity<4||lv.elite!==1||lv.level<60){toast('1차 정예화 후 레벨 60이 필요하다.');return;}if(res.lmd<4500||res.advanced<1||res.chips<3){toast('LMD, 고급칩 또는 직군 칩이 부족하다.');return;}res.lmd-=4500;res.advanced--;res.chips-=3;lv.elite=2;lv.level=1;}
    state.save.levels[id]=lv;save();render();toast(`${op.name} E${tier} 정예화 완료!`);
  }
  function recruit(id){
    if(state.save.owned.includes(id)){toast('이미 영입한 오퍼레이터다.');return;}
    const res=state.save.resources;if(res.lmd<1800){toast('LMD가 부족하다.');return;}
    if(res.permits>0)res.permits--;else if(res.orundum>=300)res.orundum-=300;else{toast('모집권 또는 합성옥이 부족하다.');return;}
    res.lmd-=1800;state.save.owned.push(id);state.save.levels[id]={elite:0,level:1};state.save.recruitmentCount++;save();render();toast(`${opById(id).name} 영입 완료!`);
  }
  function showRecruitDetail(id){state.selectedOperator=id;setView('operators');}

  function handleAction(btn){
    const action=btn.dataset.action;
    if(action==='start-annihilation')startBattle('annihilation');
    else if(action==='start-rogue')startRogue();
    else if(action==='rogue-recruit')showRogueRecruit();
    else if(action==='train')train(btn.dataset.id);
    else if(action==='promote')promote(btn.dataset.id,Number(btn.dataset.tier));
    else if(action==='recruit')recruit(btn.dataset.id);
    else if(action==='start-wave'){
      if(state.battle){state.battle.started=true;addLog('작전 개시. 적 웨이브가 접근 중이다.');updateBattleMeters();btn.disabled=true;}
    }
    else if(action==='speed'){
      if(state.battle){state.battle.speed=state.battle.speed===1?2:state.battle.speed===2?3:1;btn.textContent=`전투 배속 ${state.battle.speed}×`;}
    }
    else if(action==='retreat'){
      if(state.battle&&!state.battle.over){finishBattle(false);}
    }
    else if(action==='close-result'){closeModal();if(state.view==='battle')setView(state.battle?.mode==='story'?'story':state.battle?.mode==='annihilation'?'annihilation':'roguelike');else render();}
    else if(action==='abandon-rogue'){state.save.rogue=null;save();render();toast('현재 탐험을 종료했다.');}
    else if(action==='leave-shop'){const node=D.rogueNodes.find(n=>n.id===btn.dataset.node);if(node)advanceRogue(node);}
    else if(action==='close-modal')closeModal();
  }

  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-view]');
    if(nav){e.preventDefault();setView(nav.dataset.view);return;}
    const stage=e.target.closest('[data-stage]');if(stage){const s=D.storyStages.find(x=>x.id===stage.dataset.stage);if(s)startBattle('story',{stage:s});return;}
    const node=e.target.closest('[data-rogue-node]');if(node){selectRogueNode(node.dataset.rogueNode);return;}
    const op=e.target.closest('[data-operator]');if(op){state.selectedOperator=op.dataset.operator;render();return;}
    const deploy=e.target.closest('[data-deploy]');if(deploy){state.selectedDeploy=deploy.dataset.deploy;$$('[data-deploy]').forEach(x=>x.classList.toggle('active',x===deploy));return;}
    const action=e.target.closest('[data-action]');if(action){handleAction(action);return;}
    const choice=e.target.closest('[data-event-choice]');if(choice){const choices=$('#modal-root')._choices;const selected=choices&&choices[Number(choice.dataset.eventChoice)];if(selected)selected.action();return;}
    const rogueRecruitButton=e.target.closest('[data-rogue-recruit]');if(rogueRecruitButton){rogueRecruit(rogueRecruitButton.dataset.rogueRecruit);return;}
    const buyRelic=e.target.closest('[data-buy-relic]');if(buyRelic){const r=state.save.rogue,id=buyRelic.dataset.buyRelic;if(r&&r.ingots>=2&&!r.relics.includes(id)){r.ingots-=2;r.relics.push(id);const bought=D.relics.find(x=>x.id===id);if(bought?.effect?.life)r.life=Math.min(8,r.life+bought.effect.life);save();showShop(state.pendingRogueNode||D.rogueNodes.find(n=>n.type==='shop'));toast('유물을 구매했다.');}return;}
    const buyHope=e.target.closest('[data-buy-hope]');if(buyHope){const r=state.save.rogue;if(r&&r.ingots>=1){r.ingots--;r.hope+=2;save();showShop(state.pendingRogueNode||D.rogueNodes.find(n=>n.type==='shop'));toast('희망을 보충했다.');}return;}
  });
  $('#mobile-menu')?.addEventListener('click',()=>{$('#sidebar').classList.toggle('open');});
  window.addEventListener('beforeunload',()=>{save();stopBattleLoops();});
  window.addEventListener('hashchange',()=>{});
  render();
})();
