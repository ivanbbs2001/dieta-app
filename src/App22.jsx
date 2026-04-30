import { useState, useMemo, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MEALS = [
  { id:"cafe",    label:"Café da Manhã",   icon:"☕", time:"07:00", cooked:false },
  { id:"lanche1", label:"Lanche da Manhã", icon:"🍎", time:"10:00", cooked:false },
  { id:"almoco",  label:"Almoço",           icon:"🍽️", time:"12:30", cooked:true  },
  { id:"lanche2", label:"Lanche da Tarde",  icon:"🍊", time:"16:00", cooked:false },
  { id:"jantar",  label:"Jantar",           icon:"🌙", time:"19:30", cooked:true  },
  { id:"ceia",    label:"Ceia",             icon:"🌛", time:"22:00", cooked:false },
];

const ACTIVITY_LEVELS = [
  { id:"sed",   label:"Sedentário",           desc:"Pouco ou nenhum exercício",         mult:1.2   },
  { id:"light", label:"Levemente ativo",       desc:"Exercício leve 1–3×/sem",           mult:1.375 },
  { id:"mod",   label:"Moderadamente ativo",   desc:"Exercício moderado 3–5×/sem",       mult:1.55  },
  { id:"very",  label:"Muito ativo",           desc:"Exercício intenso 6–7×/sem",        mult:1.725 },
  { id:"extra", label:"Extremamente ativo",    desc:"Atleta / trabalho físico pesado",   mult:1.9   },
];

const GOAL_OPTIONS = [
  { id:"lose_slow",  label:"Perda leve",     desc:"-250 kcal/dia · ~0,25 kg/sem",  delta:-250 },
  { id:"lose_mod",   label:"Perda moderada", desc:"-500 kcal/dia · ~0,5 kg/sem",   delta:-500 },
  { id:"lose_fast",  label:"Perda rápida",   desc:"-750 kcal/dia · ~0,75 kg/sem",  delta:-750 },
  { id:"maintain",   label:"Manutenção",     desc:"Sem déficit calórico",           delta:0    },
  { id:"gain",       label:"Ganho de massa", desc:"+300 kcal/dia",                  delta:300  },
];

const FOODS = [
  { id:1,  name:"Frango (peito)",        rawCal:110, cookedCal:165, group:"Proteína",   color:"#E8C07D",
    measures:[{label:"Filé pequeno (80g)",g:80},{label:"Filé médio (120g)",g:120},{label:"Filé grande (160g)",g:160}]},
  { id:2,  name:"Bife bovino (patinho)", rawCal:143, cookedCal:180, group:"Proteína",   color:"#C97B5A",
    measures:[{label:"Bife pequeno (80g)",g:80},{label:"Bife médio (120g)",g:120},{label:"Bife grande (160g)",g:160}]},
  { id:3,  name:"Atum em lata",          rawCal:128, cookedCal:128, group:"Proteína",   color:"#7BA7C4",
    measures:[{label:"Lata pequena (80g)",g:80},{label:"3 col. sopa (45g)",g:45},{label:"Lata grande (170g)",g:170}]},
  { id:4,  name:"Ovo inteiro",           rawCal:143, cookedCal:155, group:"Proteína",   color:"#F5D87A",
    measures:[{label:"1 ovo (50g)",g:50},{label:"2 ovos (100g)",g:100},{label:"3 ovos (150g)",g:150}]},
  { id:5,  name:"Salmão",                rawCal:142, cookedCal:208, group:"Proteína",   color:"#F4A57A",
    measures:[{label:"Posta pequena (100g)",g:100},{label:"Posta média (150g)",g:150}]},
  { id:6,  name:"Queijo cottage",        rawCal:98,  cookedCal:98,  group:"Proteína",   color:"#D4E8C2",
    measures:[{label:"2 col. sopa (50g)",g:50},{label:"½ xícara (100g)",g:100}]},
  { id:7,  name:"Iogurte grego natural", rawCal:97,  cookedCal:97,  group:"Proteína",   color:"#C8E0F4",
    measures:[{label:"Pote pequeno (80g)",g:80},{label:"Pote grande (170g)",g:170}]},
  { id:8,  name:"Arroz branco",          rawCal:358, cookedCal:130, group:"Carboidrato",color:"#F7ECC8",
    measures:[{label:"½ escumadeira (50g coz.)",g:50},{label:"1 escumadeira (100g coz.)",g:100},{label:"2 escumadeiras (200g coz.)",g:200}]},
  { id:9,  name:"Arroz integral",        rawCal:350, cookedCal:111, group:"Carboidrato",color:"#C8B89A",
    measures:[{label:"1 escumadeira (100g coz.)",g:100},{label:"2 escumadeiras (200g coz.)",g:200}]},
  { id:10, name:"Batata doce",           rawCal:76,  cookedCal:86,  group:"Carboidrato",color:"#E8A07D",
    measures:[{label:"Batata pequena (80g)",g:80},{label:"Batata média (120g)",g:120}]},
  { id:11, name:"Macarrão",              rawCal:356, cookedCal:131, group:"Carboidrato",color:"#F5D490",
    measures:[{label:"Col. servir (80g coz.)",g:80},{label:"Porção média (150g coz.)",g:150}]},
  { id:12, name:"Pão francês",           rawCal:300, cookedCal:300, group:"Carboidrato",color:"#D4A96A",
    measures:[{label:"1 unidade (50g)",g:50},{label:"Metade (25g)",g:25}]},
  { id:13, name:"Aveia em flocos",       rawCal:389, cookedCal:389, group:"Carboidrato",color:"#C8A87A",
    measures:[{label:"2 col. sopa (20g)",g:20},{label:"½ xícara (40g)",g:40}]},
  { id:14, name:"Mandioca cozida",       rawCal:125, cookedCal:125, group:"Carboidrato",color:"#F0E0A0",
    measures:[{label:"Pedaço médio (100g)",g:100},{label:"Pedaço grande (150g)",g:150}]},
  { id:15, name:"Feijão carioca",        rawCal:335, cookedCal:77,  group:"Leguminosa", color:"#C8946A",
    measures:[{label:"1 concha (80g coz.)",g:80},{label:"Concha cheia (100g coz.)",g:100}]},
  { id:16, name:"Feijão preto",          rawCal:341, cookedCal:82,  group:"Leguminosa", color:"#6A4A3A",
    measures:[{label:"1 concha (80g coz.)",g:80},{label:"Concha cheia (100g coz.)",g:100}]},
  { id:17, name:"Lentilha",              rawCal:352, cookedCal:116, group:"Leguminosa", color:"#A07050",
    measures:[{label:"½ xícara (80g coz.)",g:80},{label:"¾ xícara (120g coz.)",g:120}]},
  { id:18, name:"Brócolis",              rawCal:34,  cookedCal:28,  group:"Vegetal",    color:"#6AAF6E",
    measures:[{label:"Buquê médio (80g)",g:80},{label:"Prato cheio (150g)",g:150}]},
  { id:19, name:"Alface",                rawCal:15,  cookedCal:15,  group:"Vegetal",    color:"#90C97E",
    measures:[{label:"Pires cheio (50g)",g:50},{label:"Prato raso (100g)",g:100}]},
  { id:20, name:"Tomate",                rawCal:18,  cookedCal:18,  group:"Vegetal",    color:"#E07070",
    measures:[{label:"Tomate médio (100g)",g:100},{label:"5 fatias (80g)",g:80}]},
  { id:21, name:"Cenoura",               rawCal:41,  cookedCal:35,  group:"Vegetal",    color:"#F0924A",
    measures:[{label:"½ cenoura (40g)",g:40},{label:"Cenoura média (80g)",g:80}]},
  { id:22, name:"Abobrinha",             rawCal:17,  cookedCal:15,  group:"Vegetal",    color:"#A0C870",
    measures:[{label:"½ abobrinha (80g)",g:80},{label:"Abobrinha média (150g)",g:150}]},
  { id:23, name:"Couve refogada",        rawCal:40,  cookedCal:32,  group:"Vegetal",    color:"#4A9050",
    measures:[{label:"2 col. sopa (30g)",g:30},{label:"Porção (60g)",g:60}]},
  { id:24, name:"Banana",                rawCal:89,  cookedCal:89,  group:"Fruta",      color:"#F5E050",
    measures:[{label:"Banana pequena (80g)",g:80},{label:"Banana média (120g)",g:120}]},
  { id:25, name:"Maçã",                  rawCal:52,  cookedCal:52,  group:"Fruta",      color:"#D4534A",
    measures:[{label:"Maçã pequena (130g)",g:130},{label:"Maçã média (180g)",g:180}]},
  { id:26, name:"Laranja",               rawCal:47,  cookedCal:47,  group:"Fruta",      color:"#F5A030",
    measures:[{label:"Laranja média (130g)",g:130},{label:"Laranja grande (180g)",g:180}]},
  { id:27, name:"Abacate",               rawCal:160, cookedCal:160, group:"Fruta",      color:"#5E9960",
    measures:[{label:"½ unidade (80g)",g:80},{label:"Col. sopa (25g)",g:25}]},
  { id:28, name:"Mamão",                 rawCal:32,  cookedCal:32,  group:"Fruta",      color:"#F5A060",
    measures:[{label:"Fatia (130g)",g:130},{label:"Fatia grande (200g)",g:200}]},
  { id:29, name:"Azeite de oliva",       rawCal:884, cookedCal:884, group:"Gordura",    color:"#C8B84A",
    measures:[{label:"1 col. chá (5g)",g:5},{label:"1 col. sopa (14g)",g:14}]},
  { id:30, name:"Leite desnatado",       rawCal:35,  cookedCal:35,  group:"Laticínio",  color:"#E8F4FA",
    measures:[{label:"½ copo (100ml)",g:100},{label:"1 copo (200ml)",g:200}]},
];

const GROUP_ICONS = {
  "Proteína":"🥩","Carboidrato":"🍚","Vegetal":"🥦",
  "Fruta":"🍎","Gordura":"🫒","Leguminosa":"🫘","Laticínio":"🥛"
};

function calcCal(food, grams, cooked) {
  return Math.round(((cooked ? food.cookedCal : food.rawCal) * grams) / 100);
}

// Mifflin-St Jeor
function calcBMR(sex, age, weight, height) {
  if (!age || !weight || !height) return null;
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(sex === "M" ? base + 5 : base - 161);
}

function exportPDF(menu, totalCal, dailyGoal, profile) {
  const dateStr = new Date().toLocaleDateString("pt-BR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const mealHTML = MEALS.map(meal => {
    const items = menu.filter(i => i.mealId === meal.id);
    if (items.length === 0) return "";
    const mCal = items.reduce((s,i) => s+i.cal, 0);
    return `
      <div class="meal-block">
        <div class="meal-title">${meal.icon} ${meal.label} <span class="meal-cal">${mCal} kcal</span></div>
        ${items.map(it => `
          <div class="item-row">
            <span class="item-name">${it.name}</span>
            <span class="item-measure">${it.measure}</span>
            <span class="item-cal">${it.cal} kcal</span>
          </div>`).join("")}
      </div>`;
  }).join("");

  const win = window.open("","_blank");
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Cardápio Diário</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400;600;700&display=swap');
      body{font-family:'Source Sans 3',sans-serif;color:#2A2420;padding:32px 40px;max-width:700px;margin:0 auto}
      h1{font-family:'Playfair Display',serif;font-size:28px;color:#2C1A0E;margin-bottom:4px}
      .subtitle{color:#8B7050;font-size:13px;margin-bottom:6px}
      .meta{display:flex;gap:24px;background:#F5EFE6;border-radius:10px;padding:12px 16px;margin:16px 0;font-size:13px}
      .meta-item label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#8B7050;margin-bottom:2px}
      .meta-item strong{font-size:20px;font-family:'Playfair Display',serif;color:#5C3018}
      .meal-block{margin-bottom:18px;border:1px solid #E8E0D0;border-radius:10px;overflow:hidden}
      .meal-title{background:#F5EFE6;padding:10px 14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between}
      .meal-cal{color:#8B5E3C;font-family:'Playfair Display',serif}
      .item-row{display:flex;align-items:center;padding:8px 14px;border-top:1px dashed #EDE5D8;gap:10px}
      .item-name{flex:1;font-weight:600;font-size:13px}
      .item-measure{color:#8B7050;font-size:12px;flex:1}
      .item-cal{font-family:'Playfair Display',serif;font-weight:700;color:#5C3018;font-size:14px;min-width:70px;text-align:right}
      .footer{margin-top:24px;border-top:1px solid #E8E0D0;padding-top:12px;font-size:11px;color:#A89878;display:flex;justify-content:space-between}
      .profile-line{font-size:12px;color:#8B7050;margin-bottom:16px}
      @media print{body{padding:16px}}
    </style></head><body>
    <h1>Cardápio Diário</h1>
    <div class="subtitle">${dateStr}</div>
    ${profile?.nome ? `<div class="profile-line">👤 ${profile.nome}${profile.weight ? ` · ${profile.weight} kg` : ""}${profile.height ? ` · ${profile.height} cm` : ""}</div>` : ""}
    <div class="meta">
      <div class="meta-item"><label>Total do dia</label><strong>${totalCal} kcal</strong></div>
      <div class="meta-item"><label>Meta diária</label><strong>${dailyGoal} kcal</strong></div>
      <div class="meta-item"><label>Saldo</label><strong style="color:${totalCal<=dailyGoal?"#286028":"#C0392B"}">${totalCal<=dailyGoal?"-":"+"} ${Math.abs(dailyGoal-totalCal)} kcal</strong></div>
    </div>
    ${mealHTML}
    <div class="footer"><span>Gerado pelo Dieta Diária App</span><span>${new Date().toLocaleString("pt-BR")}</span></div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
    </body></html>`);
  win.document.close();
}

function exportJSON(menu, profile, dailyGoal) {
  const data = { version:1, exportedAt: new Date().toISOString(), menu, profile, dailyGoal };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `dieta-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DietaTracker() {
  const [activeTab, setActiveTab]   = useState("cardapio");
  const [menu, setMenu]             = useState([]);
  const [search, setSearch]         = useState("");
  const [selGroup, setSelGroup]     = useState("Todos");
  const [targetMeal, setTargetMeal] = useState("cafe");
  const [expanded, setExpanded]     = useState({ cafe:true, lanche1:false, almoco:true, lanche2:false, jantar:true, ceia:false });
  const [subTarget, setSubTarget]   = useState(null);
  const [subResults, setSubResults] = useState([]);
  const [addModal, setAddModal]     = useState(null);
  const [toast, setToast]           = useState(null);
  const fileRef                     = useRef();

  // Profile & TMB state
  const [profile, setProfile] = useState({ nome:"", sex:"M", age:"", weight:"", height:"", activity:"mod", goal:"lose_mod" });
  const [dailyGoalManual, setDailyGoalManual] = useState(null); // null = use TMB-derived

  const bmr  = calcBMR(profile.sex, +profile.age, +profile.weight, +profile.height);
  const act  = ACTIVITY_LEVELS.find(a => a.id === profile.activity)?.mult || 1.55;
  const tdee = bmr ? Math.round(bmr * act) : null;
  const goalDelta = GOAL_OPTIONS.find(g => g.id === profile.goal)?.delta || -500;
  const derivedGoal = tdee ? Math.max(1200, tdee + goalDelta) : 2000;
  const dailyGoal = dailyGoalManual ?? derivedGoal;

  const groups   = ["Todos", ...Array.from(new Set(FOODS.map(f => f.group)))];
  const filtered = useMemo(() => FOODS.filter(f =>
    (selGroup === "Todos" || f.group === selGroup) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  ), [search, selGroup]);

  const totalCal = useMemo(() => menu.reduce((s,i) => s+i.cal, 0), [menu]);
  const mealCals = useMemo(() => {
    const o = {}; MEALS.forEach(m => { o[m.id] = menu.filter(i => i.mealId===m.id).reduce((s,i) => s+i.cal,0); }); return o;
  }, [menu]);

  const pct      = Math.min(100, Math.round((totalCal/dailyGoal)*100));
  const barColor = pct < 70 ? "#6AAF6E" : pct < 97 ? "#E8A030" : "#D04040";

  function showToast(msg, type="ok") {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2800);
  }

  function addItem(food, measure, mealId) {
    const meal = MEALS.find(m => m.id === mealId);
    setMenu(prev => [...prev, {
      id:Date.now(), mealId, foodId:food.id, name:food.name,
      measure:measure.label, grams:measure.g,
      cal:calcCal(food, measure.g, meal.cooked),
      color:food.color, group:food.group, cooked:meal.cooked
    }]);
    setAddModal(null); setActiveTab("cardapio");
    setExpanded(p => ({...p,[mealId]:true}));
    showToast(`${food.name} adicionado ao ${meal.label}`);
  }

  function removeItem(id) { setMenu(prev => prev.filter(i => i.id !== id)); }

  function findSub(item) {
    const results = [];
    FOODS.filter(f => f.id !== item.foodId).forEach(food => {
      food.measures.forEach(m => {
        const c = calcCal(food, m.g, item.cooked);
        if (item.cal > 0 && Math.abs(c-item.cal)/item.cal <= 0.12)
          results.push({ food, measure:m, cal:c, diff:Math.abs(c-item.cal) });
      });
    });
    setSubTarget(item);
    setSubResults(results.sort((a,b)=>a.diff-b.diff).slice(0,8));
    setActiveTab("substituicoes");
  }

  function applySub(item, food, measure) {
    const cal = calcCal(food, measure.g, item.cooked);
    setMenu(prev => prev.map(i => i.id===item.id
      ? {...i, foodId:food.id, name:food.name, measure:measure.label, grams:measure.g, cal, color:food.color, group:food.group}
      : i));
    setSubTarget(null); setSubResults([]);
    setActiveTab("cardapio");
    showToast("Substituição aplicada!");
  }

  function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.menu) setMenu(data.menu);
        if (data.profile) setProfile(data.profile);
        if (data.dailyGoal) setDailyGoalManual(data.dailyGoal);
        showToast("Backup importado com sucesso!");
      } catch { showToast("Arquivo inválido.", "err"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function updateProfile(k, v) { setProfile(p => ({...p,[k]:v})); }

  const TABS = [
    ["cardapio","📋","Cardápio"],
    ["alimentos","🔍","Alimentos"],
    ["substituicoes","🔄","Trocas"],
    ["tmb","🧮","TMB"],
    ["dados","💾","Dados"],
  ];

  return (
    <div style={{ fontFamily:"'Source Sans 3',sans-serif", minHeight:"100vh", background:"#F2EDE4", color:"#2A2420", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Source+Sans+3:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .btn{cursor:pointer;border:none;transition:all .15s;font-family:'Source Sans 3',sans-serif}
        .btn:active{transform:scale(0.97)}
        .card{background:#FDFAF4;border-radius:14px;box-shadow:0 1px 8px rgba(60,40,10,.08);border:1px solid #E8E0D0}
        .inp{background:#FDFAF4;border:1.5px solid #DDD5C4;border-radius:10px;padding:9px 14px;font-family:'Source Sans 3',sans-serif;font-size:14px;outline:none;width:100%;transition:border .18s;color:#2A2420}
        .inp:focus{border-color:#8B5E3C}
        .sel{appearance:none;background:#FDFAF4 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M0 0l6 8 6-8z' fill='%238B5E3C'/%3E%3C/svg%3E") no-repeat right 12px center;border:1.5px solid #DDD5C4;border-radius:10px;padding:9px 32px 9px 14px;font-family:'Source Sans 3',sans-serif;font-size:14px;outline:none;width:100%;transition:border .18s;color:#2A2420;cursor:pointer}
        .sel:focus{border-color:#8B5E3C}
        .pill{padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid transparent;transition:all .15s;background:#E8E0D0;color:#5C4020;white-space:nowrap}
        .pill.on{background:#8B5E3C;color:#FDFAF4}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#C8B8A0;border-radius:2px}
        .sl{animation:sl .22s ease}@keyframes sl{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .overlay{position:fixed;inset:0;background:rgba(20,10,5,.6);z-index:100;display:flex;align-items:flex-end;justify-content:center}
        .modal{background:#FDFAF4;border-radius:22px 22px 0 0;padding:20px 16px 30px;width:100%;max-width:480px;max-height:82vh;overflow-y:auto}
        .tag{display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:700}
        .toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:20px;font-weight:600;font-size:13px;z-index:200;animation:fadeUp .3s ease;white-space:nowrap;max-width:90vw;text-align:center}
        @keyframes fadeUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
        .lbl{display:block;font-size:11px;font-weight:700;color:#8B7050;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px;margin-top:14px}
        .seg{display:flex;border-radius:10px;overflow:hidden;border:1.5px solid #DDD5C4}
        .seg-btn{flex:1;padding:8px 4px;background:#FDFAF4;border:none;font-family:'Source Sans 3',sans-serif;font-size:12px;font-weight:600;color:#8B7050;cursor:pointer;transition:all .15s;text-align:center}
        .seg-btn.on{background:#8B5E3C;color:#FDFAF4}
        .stat-row{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px dashed #EDE5D8}
        .stat-label{font-size:13px;color:#5C4020}
        .stat-val{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#2C1A0E}
        .stat-unit{font-size:11px;color:#8B7050;margin-left:3px}
        .action-btn{display:flex;align-items:center;gap:12px;background:#FDFAF4;border:1.5px solid #E8E0D0;border-radius:12px;padding:14px;cursor:pointer;transition:all .15s;width:100%;text-align:left;font-family:'Source Sans 3',sans-serif}
        .action-btn:hover{background:#F0E8DC;border-color:#C8A87A}
        .goal-card{border:2px solid transparent;border-radius:12px;padding:11px 14px;cursor:pointer;transition:all .15s;background:#FDFAF4}
        .goal-card.on{border-color:#8B5E3C;background:#FFF8F0}
        .goal-card:hover{background:#F5EFE6}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background:"linear-gradient(150deg,#2C1A0E 0%,#5C3018 55%,#8B5E3C 100%)", color:"#F5E8D0", padding:"18px 16px 0" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <p style={{ fontSize:10, letterSpacing:".22em", textTransform:"uppercase", opacity:.6, marginBottom:2 }}>Plano Alimentar</p>
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between" }}>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700 }}>Dieta Diária</h1>
            {profile.nome && <span style={{ fontSize:12, opacity:.7 }}>Olá, {profile.nome.split(" ")[0]}!</span>}
          </div>
          <div style={{ margin:"12px 0 4px", background:"rgba(255,255,255,.15)", borderRadius:8, height:8, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:barColor, borderRadius:8, transition:"width .5s" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <span style={{ fontSize:13, opacity:.85 }}>
              <strong style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>{totalCal}</strong> / <strong>{dailyGoal}</strong> kcal
            </span>
            <span style={{ fontSize:12, opacity:.6 }}>{pct}% · saldo {totalCal<=dailyGoal ? "-" : "+"}{Math.abs(dailyGoal-totalCal)} kcal</span>
          </div>
          <div style={{ display:"flex", gap:1, overflowX:"auto" }}>
            {TABS.map(([tab,ico,lbl]) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: activeTab===tab ? "#FDFAF4" : "transparent",
                color: activeTab===tab ? "#2C1A0E" : "#F5E8D0",
                border:"none", padding:"8px 12px", borderRadius:"8px 8px 0 0",
                fontWeight:600, fontSize:11, cursor:"pointer", transition:"all .18s",
                opacity: activeTab===tab ? 1 : 0.72, flexShrink:0
              }}>{ico} {lbl}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"0 14px 90px" }}>

        {/* ══════════ CARDÁPIO ══════════ */}
        {activeTab === "cardapio" && (
          <div className="sl" style={{ paddingTop:14, display:"flex", flexDirection:"column", gap:10 }}>
            {MEALS.map(meal => {
              const items = menu.filter(i => i.mealId===meal.id);
              const mcal  = mealCals[meal.id];
              const open  = expanded[meal.id];
              return (
                <div key={meal.id} className="card" style={{ overflow:"hidden" }}>
                  <div onClick={() => setExpanded(p => ({...p,[meal.id]:!p[meal.id]}))}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", cursor:"pointer" }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{meal.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ fontWeight:700, fontSize:14 }}>{meal.label}</span>
                        {meal.cooked && <span className="tag" style={{ background:"#FFF0D8", color:"#8B5000", border:"1px solid #E8C07D" }}>🍳 cozido</span>}
                      </div>
                      <span style={{ fontSize:11, color:"#8B7050" }}>{meal.time}</span>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      {mcal > 0
                        ? <><span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#5C3018" }}>{mcal}</span><br/><span style={{ fontSize:10, color:"#8B7050" }}>kcal</span></>
                        : <span style={{ fontSize:16, color:"#C8B8A0" }}>–</span>}
                    </div>
                    <span style={{ fontSize:11, color:"#A89878", marginLeft:2, display:"inline-block", transform:open?"rotate(90deg)":"rotate(0)", transition:"transform .2s" }}>▶</span>
                  </div>
                  {open && (
                    <div style={{ borderTop:"1px solid #EDE5D8", padding:"6px 10px 8px" }}>
                      {items.length === 0
                        ? <p style={{ fontSize:12, color:"#A89878", padding:"6px 4px", fontStyle:"italic" }}>Nenhum alimento adicionado</p>
                        : items.map(item => (
                          <div key={item.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 4px", borderBottom:"1px dashed #EDE5D8" }}>
                            <div style={{ width:32, height:32, borderRadius:8, background:item.color+"44", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                              {GROUP_ICONS[item.group]||"🍴"}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</p>
                              <p style={{ fontSize:11, color:"#8B7050" }}>{item.measure}</p>
                            </div>
                            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"#5C3018", flexShrink:0 }}>{item.cal} kcal</span>
                            <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                              <button className="btn" onClick={() => findSub(item)} style={{ background:"#EDE5D8", borderRadius:7, padding:"4px 8px", fontSize:11, fontWeight:600, color:"#5C3018" }}>Trocar</button>
                              <button className="btn" onClick={() => removeItem(item.id)} style={{ background:"#FDECEA", borderRadius:7, padding:"4px 8px", fontSize:12, color:"#C0392B", fontWeight:700 }}>✕</button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              );
            })}
            {menu.length > 0 && (
              <div style={{ background:"linear-gradient(135deg,#2C1A0E,#5C3018)", borderRadius:14, padding:"16px", color:"#F5E8D0" }}>
                <p style={{ fontSize:10, letterSpacing:".18em", textTransform:"uppercase", opacity:.6, marginBottom:4 }}>Resumo do Dia</p>
                <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:10 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700 }}>{totalCal}</span>
                  <span style={{ opacity:.7, fontSize:13 }}>kcal · meta {dailyGoal} kcal</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"7px 16px" }}>
                  {MEALS.map(m => mealCals[m.id] > 0 && (
                    <div key={m.id}><p style={{ fontSize:10, opacity:.6 }}>{m.icon} {m.label}</p><p style={{ fontSize:14, fontWeight:700 }}>{mealCals[m.id]} kcal</p></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ ALIMENTOS ══════════ */}
        {activeTab === "alimentos" && (
          <div className="sl" style={{ paddingTop:14 }}>
            <div className="card" style={{ padding:"12px 14px", marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"#8B7050", letterSpacing:".1em", textTransform:"uppercase", marginBottom:8 }}>Adicionar à refeição:</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {MEALS.map(m => (
                  <button key={m.id} className={`pill ${targetMeal===m.id?"on":""}`} onClick={() => setTargetMeal(m.id)}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
              {MEALS.find(m => m.id===targetMeal)?.cooked && (
                <div style={{ marginTop:10, background:"#FFF8EC", border:"1px solid #E8C07D", borderRadius:8, padding:"7px 12px", display:"flex", gap:8 }}>
                  <span>🍳</span>
                  <p style={{ fontSize:12, color:"#7A4A00" }}><strong>Valores calculados para alimento cozido.</strong> Carnes, arroz e leguminosas têm calorias ajustadas ao preparo.</p>
                </div>
              )}
            </div>
            <input className="inp" placeholder="Buscar alimento..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom:10 }} />
            <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8, marginBottom:8 }}>
              {groups.map(g => (
                <button key={g} className={`pill ${selGroup===g?"on":""}`} onClick={() => setSelGroup(g)}>
                  {g!=="Todos" ? GROUP_ICONS[g] : "✦"} {g}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.map(food => {
                const isCook = MEALS.find(m => m.id===targetMeal)?.cooked;
                const changed = food.rawCal !== food.cookedCal;
                return (
                  <div key={food.id} className="card" style={{ padding:"13px 14px" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                      <div style={{ width:38, height:38, borderRadius:9, background:food.color+"44", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>
                        {GROUP_ICONS[food.group]||"🍴"}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:2 }}>
                          <span style={{ fontWeight:700, fontSize:14 }}>{food.name}</span>
                          {isCook && changed
                            ? <span className="tag" style={{ background:"#FFF0D8", color:"#8B5000", border:"1px solid #E8C07D" }}>🍳 cozido</span>
                            : <span className="tag" style={{ background:"#EAF6E8", color:"#286028", border:"1px solid #90C97E" }}>natural</span>}
                        </div>
                        <p style={{ fontSize:12, color:"#8B7050" }}>
                          <strong style={{ color:"#5C3018" }}>{isCook ? food.cookedCal : food.rawCal} kcal</strong>/100g
                          {isCook && changed && <span style={{ color:"#A89878", fontSize:11 }}> · cru: {food.rawCal} kcal</span>}
                        </p>
                      </div>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {food.measures.map((m,i) => (
                        <button key={i} className="btn" onClick={() => setAddModal({ food, measure:m })}
                          style={{ background:food.color+"2A", border:`1.5px solid ${food.color}88`, padding:"6px 11px", fontSize:12, borderRadius:20, fontWeight:600, color:"#2A2420" }}>
                          + {m.label} <span style={{ opacity:.65 }}>({calcCal(food, m.g, isCook)} kcal)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ SUBSTITUIÇÕES ══════════ */}
        {activeTab === "substituicoes" && (
          <div className="sl" style={{ paddingTop:14 }}>
            {!subTarget ? (
              <div style={{ textAlign:"center", padding:"48px 20px" }}>
                <div style={{ fontSize:48, marginBottom:14 }}>🔄</div>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#8B7050", marginBottom:8 }}>Substituições Equivalentes</p>
                <p style={{ fontSize:14, color:"#A89878" }}>No <strong>Cardápio</strong>, toque em <strong>"Trocar"</strong> para ver opções com calorias equivalentes (±12%).</p>
              </div>
            ) : (
              <>
                <div style={{ background:"linear-gradient(135deg,#5C3018,#2C1A0E)", borderRadius:13, padding:"14px 16px", color:"#F5E8D0", marginBottom:14 }}>
                  <p style={{ fontSize:10, opacity:.6, textTransform:"uppercase", letterSpacing:".15em", marginBottom:3 }}>
                    Substituindo em · {MEALS.find(m => m.id===subTarget.mealId)?.label}
                  </p>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700 }}>{subTarget.name}</p>
                  <p style={{ fontSize:13, opacity:.8 }}>{subTarget.measure} · {subTarget.cal} kcal
                    {subTarget.cooked && <span style={{ marginLeft:8, background:"rgba(255,200,100,.2)", padding:"1px 7px", borderRadius:8, fontSize:11 }}>🍳 cozido</span>}
                  </p>
                </div>
                <p style={{ fontSize:13, color:"#8B7050", marginBottom:12 }}>
                  Opções com <span style={{ background:"#EDE5D8", padding:"2px 8px", borderRadius:10, fontWeight:700 }}>±12% kcal</span>
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {subResults.length === 0
                    ? <p style={{ color:"#A89878", textAlign:"center", padding:24, fontStyle:"italic" }}>Nenhuma substituição encontrada.</p>
                    : subResults.map((r,i) => (
                      <div key={i} className="card" style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:8, background:r.food.color+"44", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>
                          {GROUP_ICONS[r.food.group]||"🍴"}
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontWeight:700, fontSize:14 }}>{r.food.name}</p>
                          <p style={{ fontSize:12, color:"#8B7050" }}>{r.measure.label}</p>
                          <div style={{ display:"flex", gap:6, marginTop:2 }}>
                            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"#5C3018" }}>{r.cal} kcal</span>
                            <span className="tag" style={{ background:r.diff===0?"#D4EDDA":"#FFF3CD", color:r.diff===0?"#155724":"#856404" }}>
                              {r.diff===0 ? "✓ Igual" : `${r.cal>subTarget.cal?"+":"-"}${r.diff} kcal`}
                            </span>
                          </div>
                        </div>
                        <button className="btn" onClick={() => applySub(subTarget, r.food, r.measure)}
                          style={{ background:"#5C3018", color:"#F5E8D0", borderRadius:9, padding:"8px 14px", fontWeight:700, fontSize:13, flexShrink:0 }}>
                          Usar
                        </button>
                      </div>
                    ))
                  }
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════ TMB / METABOLISMO ══════════ */}
        {activeTab === "tmb" && (
          <div className="sl" style={{ paddingTop:14, display:"flex", flexDirection:"column", gap:12 }}>

            {/* Inputs */}
            <div className="card" style={{ padding:"16px" }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:4 }}>Dados Pessoais</p>
              <p style={{ fontSize:12, color:"#8B7050", marginBottom:12 }}>Fórmula de Mifflin-St Jeor</p>

              <label className="lbl" style={{ marginTop:0 }}>Nome</label>
              <input className="inp" placeholder="Seu nome" value={profile.nome} onChange={e => updateProfile("nome", e.target.value)} />

              <label className="lbl">Sexo biológico</label>
              <div className="seg">
                <button className={`seg-btn ${profile.sex==="M"?"on":""}`} onClick={() => updateProfile("sex","M")}>♂ Masculino</button>
                <button className={`seg-btn ${profile.sex==="F"?"on":""}`} onClick={() => updateProfile("sex","F")}>♀ Feminino</button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                <div>
                  <label className="lbl">Idade</label>
                  <input className="inp" type="number" min="10" max="110" placeholder="anos" value={profile.age} onChange={e => updateProfile("age", e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Peso (kg)</label>
                  <input className="inp" type="number" min="30" max="300" placeholder="kg" value={profile.weight} onChange={e => updateProfile("weight", e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Altura (cm)</label>
                  <input className="inp" type="number" min="100" max="250" placeholder="cm" value={profile.height} onChange={e => updateProfile("height", e.target.value)} />
                </div>
              </div>

              <label className="lbl">Nível de atividade física</label>
              <select className="sel" value={profile.activity} onChange={e => updateProfile("activity", e.target.value)}>
                {ACTIVITY_LEVELS.map(a => <option key={a.id} value={a.id}>{a.label} — {a.desc}</option>)}
              </select>
            </div>

            {/* Results */}
            {bmr && (
              <div className="card" style={{ padding:"16px" }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:12 }}>Seu Metabolismo</p>
                <div className="stat-row">
                  <span className="stat-label">🔥 TMB (em repouso)</span>
                  <span><span className="stat-val">{bmr}</span><span className="stat-unit">kcal/dia</span></span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">⚡ TDEE (com atividade)</span>
                  <span><span className="stat-val">{tdee}</span><span className="stat-unit">kcal/dia</span></span>
                </div>
                <div className="stat-row" style={{ borderBottom:"none" }}>
                  <span className="stat-label">🎯 Meta atual</span>
                  <span><span className="stat-val" style={{ color:"#8B5E3C" }}>{dailyGoal}</span><span className="stat-unit">kcal/dia</span></span>
                </div>
              </div>
            )}

            {/* Goal selector */}
            {bmr && (
              <div className="card" style={{ padding:"16px" }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:12 }}>Objetivo Calórico</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {GOAL_OPTIONS.map(g => {
                    const val = tdee ? Math.max(1200, tdee + g.delta) : null;
                    return (
                      <div key={g.id} className={`goal-card ${profile.goal===g.id?"on":""}`}
                        onClick={() => { updateProfile("goal", g.id); setDailyGoalManual(null); }}
                        style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div>
                          <p style={{ fontWeight:700, fontSize:14 }}>{g.label}</p>
                          <p style={{ fontSize:12, color:"#8B7050" }}>{g.desc}</p>
                        </div>
                        {val && <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#5C3018", flexShrink:0 }}>{val} kcal</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:14 }}>
                  <label className="lbl">Ou defina meta manual (kcal)</label>
                  <input className="inp" type="number" min="800" max="5000" placeholder={`Ex: ${derivedGoal}`}
                    value={dailyGoalManual ?? ""}
                    onChange={e => setDailyGoalManual(e.target.value ? +e.target.value : null)} />
                </div>
              </div>
            )}

            {!bmr && (
              <div style={{ textAlign:"center", padding:"32px 20px" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🧮</div>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"#8B7050", marginBottom:6 }}>Preencha seus dados acima</p>
                <p style={{ fontSize:13, color:"#A89878" }}>Calcularemos sua TMB, TDEE e a meta calórica ideal para o seu objetivo.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════ DADOS ══════════ */}
        {activeTab === "dados" && (
          <div className="sl" style={{ paddingTop:14, display:"flex", flexDirection:"column", gap:12 }}>

            {/* Export PDF */}
            <div className="card" style={{ padding:"16px" }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:4 }}>Exportar Cardápio</p>
              <p style={{ fontSize:13, color:"#8B7050", marginBottom:14 }}>Gera um PDF com todas as refeições do dia, total calórico e meta.</p>
              <button className="btn action-btn" onClick={() => {
                if (menu.length === 0) { showToast("Adicione alimentos primeiro", "err"); return; }
                exportPDF(menu, totalCal, dailyGoal, profile);
              }}>
                <span style={{ fontSize:28 }}>📄</span>
                <div>
                  <p style={{ fontWeight:700, fontSize:14 }}>Exportar como PDF</p>
                  <p style={{ fontSize:12, color:"#8B7050" }}>{menu.length} itens · {totalCal} kcal · meta {dailyGoal} kcal</p>
                </div>
              </button>
            </div>

            {/* Backup */}
            <div className="card" style={{ padding:"16px" }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:4 }}>Backup dos Dados</p>
              <p style={{ fontSize:13, color:"#8B7050", marginBottom:14 }}>Salve cardápio, perfil e metas em um arquivo JSON para restaurar depois.</p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <button className="btn action-btn" onClick={() => exportJSON(menu, profile, dailyGoal)}>
                  <span style={{ fontSize:28 }}>💾</span>
                  <div>
                    <p style={{ fontWeight:700, fontSize:14 }}>Exportar backup (.json)</p>
                    <p style={{ fontSize:12, color:"#8B7050" }}>{menu.length} itens no cardápio atual</p>
                  </div>
                </button>
                <button className="btn action-btn" onClick={() => fileRef.current.click()}>
                  <span style={{ fontSize:28 }}>📂</span>
                  <div>
                    <p style={{ fontWeight:700, fontSize:14 }}>Importar backup (.json)</p>
                    <p style={{ fontSize:12, color:"#8B7050" }}>Restaura cardápio, perfil e metas salvas</p>
                  </div>
                </button>
                <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }} onChange={handleImport} />
              </div>
            </div>

            {/* Limpar */}
            <div className="card" style={{ padding:"16px" }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:4 }}>Reiniciar Dia</p>
              <p style={{ fontSize:13, color:"#8B7050", marginBottom:14 }}>Remove todos os itens do cardápio do dia sem apagar seu perfil ou metas.</p>
              <button className="btn action-btn" onClick={() => {
                if (menu.length === 0) { showToast("Cardápio já está vazio", "err"); return; }
                setMenu([]); showToast("Cardápio limpo!");
              }} style={{ borderColor:"#F4CCCC" }}>
                <span style={{ fontSize:28 }}>🗑️</span>
                <div>
                  <p style={{ fontWeight:700, fontSize:14, color:"#C0392B" }}>Limpar cardápio</p>
                  <p style={{ fontSize:12, color:"#8B7050" }}>Esta ação não pode ser desfeita</p>
                </div>
              </button>
            </div>

            {/* Status */}
            {menu.length > 0 && (
              <div style={{ background:"linear-gradient(135deg,#2C1A0E,#5C3018)", borderRadius:14, padding:"14px 16px", color:"#F5E8D0" }}>
                <p style={{ fontSize:10, letterSpacing:".18em", textTransform:"uppercase", opacity:.6, marginBottom:8 }}>Status Atual</p>
                <div style={{ display:"flex", gap:"12px 24px", flexWrap:"wrap" }}>
                  {[["Alimentos",menu.length+" itens"],["Total",totalCal+" kcal"],["Meta",dailyGoal+" kcal"],["Saldo",(totalCal<=dailyGoal?"-":"+")+Math.abs(dailyGoal-totalCal)+" kcal"]].map(([l,v]) => (
                    <div key={l}><p style={{ fontSize:10, opacity:.6 }}>{l}</p><p style={{ fontSize:15, fontWeight:700 }}>{v}</p></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── MODAL: escolha de refeição ── */}
      {addModal && (
        <div className="overlay" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:700, marginBottom:2 }}>{addModal.food.name}</p>
            <p style={{ fontSize:13, color:"#8B7050", marginBottom:16 }}>{addModal.measure.label}</p>
            <p style={{ fontSize:11, fontWeight:700, color:"#8B7050", letterSpacing:".12em", textTransform:"uppercase", marginBottom:10 }}>Adicionar a qual refeição?</p>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {MEALS.map(m => {
                const c = calcCal(addModal.food, addModal.measure.g, m.cooked);
                return (
                  <button key={m.id} className="btn" onClick={() => addItem(addModal.food, addModal.measure, m.id)}
                    style={{ display:"flex", alignItems:"center", gap:12, background:"#F2EDE4", borderRadius:12, padding:"11px 14px", textAlign:"left" }}>
                    <span style={{ fontSize:20 }}>{m.icon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:700, fontSize:14 }}>{m.label}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:1 }}>
                        <span style={{ fontSize:11, color:"#8B7050" }}>{m.time}</span>
                        {m.cooked && <span className="tag" style={{ background:"#FFF0D8", color:"#8B5000", border:"1px solid #E8C07D" }}>🍳 cozido</span>}
                      </div>
                    </div>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:"#5C3018" }}>{c} kcal</span>
                  </button>
                );
              })}
            </div>
            <button className="btn" onClick={() => setAddModal(null)}
              style={{ marginTop:12, width:"100%", background:"#EDE5D8", borderRadius:10, padding:"11px", fontSize:14, fontWeight:600, color:"#5C4020" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="toast" style={{ background:toast.type==="err"?"#C0392B":"#2C1A0E", color:"#F5E8D0" }}>
          {toast.type==="err" ? "⚠️ " : "✓ "}{toast.msg}
        </div>
      )}
    </div>
  );
}
