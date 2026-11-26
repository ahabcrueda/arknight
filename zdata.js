/* STICK ARKNIGHTS - 게임 데이터. 캐릭터 그래픽은 zgame.js 캔버스에서 생성합니다. */
window.STICK_DATA = (() => {
  const classes = [
    { id:"vanguard", name:"뱅가드", en:"VANGUARD", color:"#e4a15a", branches:["척후병","돌격수","기수","전술가","전략가"] },
    { id:"guard", name:"가드", en:"GUARD", color:"#df6c67", branches:["드레드노트","공격수","로드","아츠 파이터","교관","파이터","소드마스터","해방자","리퍼","크러셔"] },
    { id:"defender", name:"디펜더", en:"DEFENDER", color:"#7fa7cf", branches:["프로텍터","가디언","저거너트","아츠 프로텍터","포트리스","센트리 프로텍터"] },
    { id:"sniper", name:"스나이퍼", en:"SNIPER", color:"#79c6b5", branches:["명사수","포격사수","데드아이","헤비슈터","확산사수","공성사수","헌터"] },
    { id:"caster", name:"캐스터", en:"CASTER", color:"#aa8be8", branches:["코어 캐스터","스플래시 캐스터","체인 캐스터","메크-어코드","팔랑크스","미스틱 캐스터","프라이멀 캐스터"] },
    { id:"medic", name:"메딕", en:"MEDIC", color:"#79c9a6", branches:["메딕","멀티타깃","테라피스트","방랑 메딕","인칸테이션 메딕","체인 메딕"] },
    { id:"supporter", name:"서포터", en:"SUPPORTER", color:"#e6c66d", branches:["감속자","소환사","헥서","바드","어브주러","아티피서","리추얼리스트"] },
    { id:"specialist", name:"스페셜리스트", en:"SPECIALIST", color:"#a9a2d0", branches:["푸시마스터","후크마스터","처형자","매복자","긱","상인","트랩마스터","인형사"] }
  ];

  const operators = [
    {id:"fang",name:"팽",class:"vanguard",branch:"척후병",rarity:3,dp:8,hp:1050,atk:165,def:125,range:1,block:2,aspd:1.15,role:"dp",skill:"전술 지휘",desc:"배치 중 일정 시간마다 DP를 회복한다.",skillText:"즉시 DP 6 회복",color:"#d58e4c"},
    {id:"myrtle",name:"머틀",class:"vanguard",branch:"기수",rarity:4,dp:10,hp:900,atk:95,def:110,range:2,block:1,aspd:1.3,role:"dp",skill:"지원 신호",desc:"공격을 멈추고 DP를 빠르게 생성한다.",skillText:"DP 12 회복",color:"#e8bb74"},
    {id:"siege",name:"시즈",class:"vanguard",branch:"돌격수",rarity:6,dp:13,hp:1850,atk:285,def:220,range:1,block:2,aspd:1.1,role:"dp",skill:"왕의 일격",desc:"적을 제압할 때 추가 DP를 획득한다.",skillText:"강한 범위 타격 및 DP 4 회복",color:"#d78a58"},
    {id:"lappland",name:"라플란드",class:"guard",branch:"로드",rarity:5,dp:17,hp:2050,atk:320,def:190,range:3,block:2,aspd:1.15,role:"arts",skill:"화이트 아웃",desc:"일반 공격에 아츠 피해와 침묵 효과가 더해진다.",skillText:"공격력 상승, 범위 내 적 약화",color:"#d5dce4"},
    {id:"silverash",name:"실버애쉬",class:"guard",branch:"로드",rarity:6,dp:18,hp:2250,atk:350,def:210,range:3,block:2,aspd:1.05,role:"splash",skill:"진은참",desc:"넓은 범위를 동시에 공격한다.",skillText:"공격 범위 확대 및 강력한 연속 타격",color:"#b6c9e0"},
    {id:"blaze",name:"블레이즈",class:"guard",branch:"공격수",rarity:6,dp:22,hp:2900,atk:310,def:230,range:1,block:3,aspd:1.0,role:"splash",skill:"전기톱 가동",desc:"전방의 여러 적을 동시에 공격한다.",skillText:"공격력과 저지 능력 상승",color:"#e87e58"},
    {id:"exusiai",name:"엑시아",class:"sniper",branch:"명사수",rarity:6,dp:12,hp:1450,atk:205,def:115,range:4,block:1,aspd:0.72,role:"rapid",skill:"오버로드",desc:"짧은 시간 동안 빠른 연속 공격을 퍼붓는다.",skillText:"연속 5회 공격, 공격 속도 증가",color:"#e6b86c"},
    {id:"w",name:"W",class:"sniper",branch:"포격사수",rarity:6,dp:20,hp:1550,atk:345,def:125,range:5,block:1,aspd:1.65,role:"trap",skill:"D12",desc:"지정 구역에 지연 폭발 표식을 남긴다.",skillText:"여러 지점에 표식 설치 후 범위 피해",color:"#c85a64"},
    {id:"wisadel",name:"위셔델",class:"sniper",branch:"포격사수",rarity:6,dp:22,hp:1700,atk:390,def:145,range:5,block:1,aspd:1.5,role:"shadow",skill:"죽음의 시선",desc:"그림자 분신과 함께 다수의 적을 공격한다.",skillText:"분신 2기 생성, 범위 공격 강화",color:"#9d75e3"},
    {id:"amiya",name:"아미야",class:"caster",branch:"코어 캐스터",rarity:5,dp:18,hp:1500,atk:320,def:115,range:4,block:1,aspd:1.35,role:"arts",skill:"정신 폭발",desc:"방어력이 높은 적에게 효과적인 아츠 공격.",skillText:"강력한 단일 아츠 공격",color:"#74aee4"},
    {id:"eyja",name:"에이야퍄들라",class:"caster",branch:"스플래시 캐스터",rarity:6,dp:21,hp:1550,atk:285,def:110,range:3,block:1,aspd:1.5,role:"splash",skill:"화산",desc:"여러 적을 휩쓰는 범위 아츠 공격.",skillText:"광범위 연속 아츠 공격",color:"#e4a35f"},
    {id:"click",name:"클릭",class:"caster",branch:"체인 캐스터",rarity:4,dp:16,hp:1250,atk:190,def:100,range:4,block:1,aspd:1.45,role:"chain",skill:"연쇄 전류",desc:"공격이 주변 적에게 연쇄된다.",skillText:"최대 4명에게 연쇄 피해",color:"#79cbbf"},
    {id:"cuora",name:"쿠오라",class:"defender",branch:"프로텍터",rarity:4,dp:17,hp:3100,atk:105,def:420,range:1,block:3,aspd:1.8,role:"tank",skill:"철벽",desc:"높은 방어력과 저지 수로 적을 막는다.",skillText:"방어력 대폭 상승 및 체력 회복",color:"#83a9ce"},
    {id:"saria",name:"사리아",class:"defender",branch:"가디언",rarity:6,dp:20,hp:3300,atk:190,def:380,range:2,block:3,aspd:1.7,role:"heal",skill:"칼슘화",desc:"주변 아군을 회복하고 방어선을 유지한다.",skillText:"주변 아군 대량 회복",color:"#b4c8d9"},
    {id:"ansel",name:"안셀",class:"medic",branch:"메딕",rarity:3,dp:12,hp:1050,atk:0,def:95,range:4,block:1,aspd:1.45,role:"heal",skill:"응급 처치",desc:"범위 내 체력이 낮은 아군을 회복한다.",skillText:"아군 2명 회복",color:"#8bc8ae"},
    {id:"perfumer",name:"퍼퓨머",class:"medic",branch:"멀티타깃",rarity:5,dp:16,hp:1350,atk:0,def:115,range:4,block:1,aspd:1.7,role:"healAll",skill:"향기로운 치유",desc:"범위 내 아군 모두를 지속 회복한다.",skillText:"전체 아군 회복",color:"#8ed8bb"},
    {id:"suzuran",name:"스즈란",class:"supporter",branch:"감속자",rarity:6,dp:18,hp:1350,atk:175,def:100,range:4,block:1,aspd:1.5,role:"slow",skill:"여우의 축복",desc:"적을 약화하고 주변 아군을 지원한다.",skillText:"범위 내 적 감속, 아군 공격력 증가",color:"#dfbd76"},
    {id:"scene",name:"씬",class:"supporter",branch:"소환사",rarity:5,dp:14,hp:1250,atk:140,def:105,range:3,block:1,aspd:1.6,role:"summon",skill:"촬영 개시",desc:"보조 드론을 배치해 공격을 돕는다.",skillText:"보조 드론 2기 생성",color:"#9fb8aa"},
    {id:"shaw",name:"쇼",class:"specialist",branch:"푸시마스터",rarity:4,dp:14,hp:1550,atk:150,def:150,range:1,block:2,aspd:1.6,role:"push",skill:"긴급 제동",desc:"전방의 적을 밀어내 시간을 번다.",skillText:"전방 적 밀쳐내기 및 피해",color:"#b5a3d4"},
    {id:"red",name:"프로젝트 레드",class:"specialist",branch:"처형자",rarity:5,dp:10,hp:1600,atk:260,def:130,range:1,block:1,aspd:0.95,role:"fast",skill:"섬광 습격",desc:"빠른 재배치와 순간적인 제압에 특화.",skillText:"즉시 재공격 및 주변 적 기절",color:"#c77c85"}
  ];

  const enemies = {
    soldier:{name:"일반병",hp:520,def:20,speed:0.55,atk:55,reward:1,color:"#a3aab8",type:"normal"},
    hound:{name:"돌격병",hp:370,def:5,speed:1.05,atk:45,reward:1,color:"#c58e6b",type:"fast"},
    shield:{name:"방패병",hp:850,def:170,speed:0.4,atk:65,reward:2,color:"#7e91aa",type:"armor"},
    archer:{name:"원거리병",hp:560,def:30,speed:0.45,atk:85,reward:2,color:"#c56d70",type:"ranged"},
    caster:{name:"술사",hp:630,def:40,speed:0.42,atk:105,reward:2,color:"#9d7ccc",type:"arts"},
    heavy:{name:"중장병",hp:1900,def:230,speed:0.25,atk:120,reward:4,color:"#747f90",type:"heavy"},
    drone:{name:"공중기체",hp:470,def:10,speed:0.82,atk:50,reward:2,color:"#85bfc0",type:"air"},
    bomber:{name:"폭탄병",hp:760,def:45,speed:0.5,atk:130,reward:3,color:"#cb8b55",type:"bomber"},
    leader:{name:"정예 지휘관",hp:2600,def:140,speed:0.34,atk:170,reward:7,color:"#ce646d",type:"elite"},
    boss:{name:"작전 보스",hp:8200,def:220,speed:0.22,atk:230,reward:30,color:"#c84b66",type:"boss"}
  };

  const storyStages = [
    {id:"0-1",chapter:0,title:"기초 훈련",subtitle:"배치와 저지의 기본",difficulty:1,enemies:14,reward:{lmd:1600,records:12,chips:1,orundum:40},mix:["soldier","soldier","hound"]},
    {id:"0-2",chapter:0,title:"폐허 경계",subtitle:"빠른 적의 진격을 저지하라",difficulty:1.15,enemies:18,reward:{lmd:1900,records:14,chips:2,orundum:45},mix:["soldier","hound","archer"]},
    {id:"0-3",chapter:0,title:"붉은 신호",subtitle:"정예 지휘관 출현",difficulty:1.3,enemies:20,boss:true,reward:{lmd:2500,records:18,chips:2,advanced:1,orundum:60},mix:["soldier","shield","caster","leader"]},
    {id:"1-1",chapter:1,title:"도시 외곽",subtitle:"방어선을 재정비하라",difficulty:1.45,enemies:22,reward:{lmd:2700,records:20,chips:2,orundum:60},mix:["soldier","hound","shield","archer"]},
    {id:"1-2",chapter:1,title:"교차로",subtitle:"원거리 적이 합류한다",difficulty:1.65,enemies:24,reward:{lmd:3000,records:22,chips:3,orundum:70},mix:["hound","archer","caster","drone"]},
    {id:"1-3",chapter:1,title:"철갑 행렬",subtitle:"중장 적을 돌파하라",difficulty:1.9,enemies:26,boss:true,reward:{lmd:3800,records:28,chips:3,advanced:2,orundum:90},mix:["shield","heavy","caster","leader"]},
    {id:"2-1",chapter:2,title:"침묵 구역",subtitle:"다양한 특수 적에 대응하라",difficulty:2.05,enemies:28,reward:{lmd:4000,records:30,chips:3,orundum:90},mix:["hound","bomber","drone","caster"]},
    {id:"2-2",chapter:2,title:"붕괴 지점",subtitle:"강화된 적의 공세",difficulty:2.3,enemies:30,reward:{lmd:4600,records:34,chips:4,advanced:1,orundum:110},mix:["shield","heavy","archer","leader"]},
    {id:"2-3",chapter:2,title:"최종 방어선",subtitle:"작전 보스를 격파하라",difficulty:2.6,enemies:32,boss:true,reward:{lmd:6000,records:45,chips:5,advanced:2,orundum:150},mix:["heavy","bomber","caster","leader","boss"]}
  ];

  const relics = [
    {id:"red_blade",name:"적색 신호기",desc:"모든 오퍼레이터 공격력 +12%",icon:"◆",effect:{atk:1.12}},
    {id:"blue_core",name:"청색 동력핵",desc:"배치 DP 회복 속도 +25%",icon:"◈",effect:{dp:1.25}},
    {id:"medic_kit",name:"응급 구급함",desc:"전투 시작 시 생명 점수 +2",icon:"✚",effect:{life:2}},
    {id:"scope",name:"정밀 조준기",desc:"원거리 직군 공격력 +18%",icon:"◎",effect:{rangeAtk:1.18}},
    {id:"armor",name:"복합 장갑판",desc:"아군 방어력 +20%",icon:"▣",effect:{def:1.2}},
    {id:"fortune",name:"작전 기록 장치",desc:"작전 보상 LMD +25%",icon:"▤",effect:{reward:1.25}},
    {id:"arts",name:"공명 증폭기",desc:"캐스터 공격력 +25%",icon:"✦",effect:{caster:1.25}},
    {id:"medal",name:"전장의 훈장",desc:"모든 오퍼레이터 공격 속도 +10%",icon:"★",effect:{speed:1.1}}
  ];

  const rogueNodes = [
    {id:"n01",floor:1,col:1,type:"combat",label:"작전"},{id:"n02",floor:1,col:3,type:"encounter",label:"이벤트"},
    {id:"n11",floor:2,col:0,type:"combat",label:"작전"},{id:"n12",floor:2,col:2,type:"shop",label:"상점"},{id:"n13",floor:2,col:4,type:"combat",label:"작전"},
    {id:"n21",floor:3,col:0,type:"rest",label:"휴식"},{id:"n22",floor:3,col:1,type:"combat",label:"작전"},{id:"n23",floor:3,col:3,type:"emergency",label:"긴급"},{id:"n24",floor:3,col:4,type:"encounter",label:"이벤트"},
    {id:"n31",floor:4,col:0,type:"combat",label:"작전"},{id:"n32",floor:4,col:2,type:"shop",label:"상점"},{id:"n33",floor:4,col:4,type:"emergency",label:"긴급"},
    {id:"n41",floor:5,col:1,type:"boss",label:"보스"},{id:"n42",floor:5,col:3,type:"boss",label:"보스"}
  ];

  return { classes, operators, enemies, storyStages, relics, rogueNodes };
})();
