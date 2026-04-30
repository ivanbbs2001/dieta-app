import { useState, useMemo, useRef } from "react";

// ─── MEALS ────────────────────────────────────────────────────────────────────
const MEALS = [
  { id:"cafe",    label:"Cafe da Manha",   icon:"☕", time:"07:00", cooked:false },
  { id:"lanche1", label:"Lanche da Manha", icon:"🍎", time:"10:00", cooked:false },
  { id:"almoco",  label:"Almoco",           icon:"🍽️", time:"12:30", cooked:true  },
  { id:"lanche2", label:"Lanche da Tarde",  icon:"🍊", time:"16:00", cooked:false },
  { id:"jantar",  label:"Jantar",           icon:"🌙", time:"19:30", cooked:true  },
  { id:"ceia",    label:"Ceia",             icon:"🌛", time:"22:00", cooked:false },
];

const ACTIVITY_LEVELS = [
  { id:"sed",   label:"Sedentario",          desc:"Pouco ou nenhum exercicio",      mult:1.2   },
  { id:"light", label:"Levemente ativo",      desc:"Exercicio leve 1-3x/sem",        mult:1.375 },
  { id:"mod",   label:"Moderadamente ativo",  desc:"Exercicio moderado 3-5x/sem",    mult:1.55  },
  { id:"very",  label:"Muito ativo",          desc:"Exercicio intenso 6-7x/sem",     mult:1.725 },
  { id:"extra", label:"Extremamente ativo",   desc:"Atleta / trabalho fisico pesado",mult:1.9   },
];

const GOAL_OPTIONS = [
  { id:"lose_slow",  label:"Perda leve",     desc:"-250 kcal/dia · ~0,25 kg/sem", delta:-250 },
  { id:"lose_mod",   label:"Perda moderada", desc:"-500 kcal/dia · ~0,5 kg/sem",  delta:-500 },
  { id:"lose_fast",  label:"Perda rapida",   desc:"-750 kcal/dia · ~0,75 kg/sem", delta:-750 },
  { id:"maintain",   label:"Manutencao",     desc:"Sem deficit calorico",          delta:0    },
  { id:"gain",       label:"Ganho de massa", desc:"+300 kcal/dia",                 delta:300  },
];

// ─── MEAL-APPROPRIATE FOOD GROUPS ────────────────────────────────────────────
// Define which groups make sense for each meal
const MEAL_GROUPS = {
  cafe:    ["Carboidrato","Laticinios","Fruta","Proteina","Gordura","Suplemento","Bebida","Condimento","Lanche"],
  lanche1: ["Fruta","Laticinios","Carboidrato","Proteina","Gordura","Suplemento","Bebida","Condimento","Lanche"],
  almoco:  ["Proteina","Carboidrato","Leguminosa","Vegetal","Gordura","Condimento"],
  lanche2: ["Fruta","Laticinios","Carboidrato","Proteina","Gordura","Suplemento","Bebida","Condimento","Lanche"],
  jantar:  ["Proteina","Carboidrato","Leguminosa","Vegetal","Gordura","Condimento"],
  ceia:    ["Laticinios","Fruta","Carboidrato","Proteina","Suplemento","Bebida","Condimento","Lanche"],
};


const FOODS = [
  // macro per 100g: p=protein, c=carbs, f=fat, fi=fiber, su=sugar, na=sodium(mg), k=potassium(mg), ch=cholesterol(mg)
  { id:1,  name:"Frango (peito grelhado)",  rawCal:110, cookedCal:165, group:"Proteina",   color:"#E8C07D", price:3.000, priceDesc:"FILE PEITO BIFE 600g~R$16,99/Irani", macro:{p:31,c:0,f:3.6,fi:0,su:0,na:74,k:370,ch:85},
    measures:[{label:"1/2 palma da mao (80g)",g:80},{label:"1 palma da mao (120g)",g:120},{label:"1 palma cheia (150g)",g:150}]},
  { id:2,  name:"Bife bovino (patinho)",    rawCal:143, cookedCal:180, group:"Proteina",   color:"#C97B5A", price:3.800, priceDesc:"bife/patinho ~R$38/kg/Irani Açougue", macro:{p:26,c:0,f:6,fi:0,su:0,na:60,k:310,ch:75},
    measures:[{label:"1/2 palma da mao (80g)",g:80},{label:"1 palma da mao (120g)",g:120},{label:"1 palma cheia (150g)",g:150}]},
  { id:3,  name:"Atum em lata (natural)",   rawCal:128, cookedCal:128, group:"Proteina",   color:"#7BA7C4", price:8.230, priceDesc:"lata 170g~R$13,99/Irani Mercearia", macro:{p:28,c:0,f:1,fi:0,su:0,na:300,k:280,ch:50},
    measures:[{label:"Lata pequena (80g)",g:80},{label:"3 col. sopa (45g)",g:45},{label:"Lata grande (170g)",g:170}]},
  { id:4,  name:"Ovo cozido / mexido",      rawCal:143, cookedCal:155, group:"Proteina",   color:"#F5E080", price:1.270, priceDesc:"C/30~R$18,99 (R$0,63/und)/Irani Feira", macro:{p:13,c:1,f:11,fi:0,su:0.4,na:124,k:126,ch:373},
    measures:[{label:"1 ovo (50g)",g:50},{label:"2 ovos (100g)",g:100},{label:"3 ovos (150g)",g:150}]},
  { id:41, name:"Ovo frito (com oleo)",     rawCal:143, cookedCal:196, group:"Proteina",   color:"#F5C840", price:1.270, priceDesc:"C/30~R$18,99 (R$0,63/und)/Irani Feira", macro:{p:13,c:1,f:15,fi:0,su:0.4,na:207,k:132,ch:401},
    measures:[{label:"1 ovo frito (55g)",g:55},{label:"2 ovos fritos (110g)",g:110}]},
  { id:5,  name:"Salmao",                   rawCal:142, cookedCal:208, group:"Proteina",   color:"#F4A57A", price:6.000, priceDesc:"salmão ~R$60/kg/Peixaria", macro:{p:25,c:0,f:12,fi:0,su:0,na:59,k:490,ch:70},
    measures:[{label:"1/2 palma da mao (100g)",g:100},{label:"1 palma da mao (150g)",g:150}]},
  { id:6,  name:"Queijo cottage",           rawCal:98,  cookedCal:98,  group:"Proteina",   color:"#D4E8C2", price:3.800, priceDesc:"pote 200g~R$7,60/Irani Frios", macro:{p:11,c:3,f:4,fi:0,su:2.7,na:364,k:84,ch:15},
    measures:[{label:"2 col. sopa (50g)",g:50},{label:"1/2 xicara (100g)",g:100}]},
  { id:42, name:"Whey concentrado Growth",  rawCal:380, cookedCal:380, group:"Suplemento", color:"#B8D4F0", price:4.970, priceDesc:"kg~R$149/Suplementos", macro:{p:74,c:8,f:4,fi:0,su:5,na:120,k:180,ch:50},
    measures:[{label:"1 scoop (30g)",g:30},{label:"2 scoops (60g)",g:60}]},
  { id:43, name:"Barra proteina Max Titan.",rawCal:330, cookedCal:330, group:"Suplemento", color:"#D0B8F0", price:4.170, priceDesc:"60g~R$25/Suplementos", macro:{p:33,c:30,f:7,fi:2,su:5,na:150,k:200,ch:20},
    measures:[{label:"1 barra (60g)",g:60},{label:"Meia barra (30g)",g:30}]},
  { id:7,  name:"Iogurte grego natural",    rawCal:97,  cookedCal:97,  group:"Laticinios", color:"#C8E0F4", price:5.880, priceDesc:"pote 170g~R$10,00/Irani Frios", macro:{p:9,c:4,f:5,fi:0,su:3.2,na:36,k:141,ch:17},
    measures:[{label:"Pote pequeno (80g)",g:80},{label:"Pote grande (170g)",g:170}]},
  { id:44, name:"Iogurte Batavo Pense Zero",rawCal:45,  cookedCal:45,  group:"Laticinios", color:"#A8D8F0", price:3.470, priceDesc:"pote 170g~R$5,90/Irani Frios", macro:{p:6,c:5,f:0,fi:0,su:4,na:46,k:160,ch:3},
    measures:[{label:"Pote 100g",g:100},{label:"Pote 170g",g:170}]},
  { id:30, name:"Leite desnatado",          rawCal:35,  cookedCal:35,  group:"Laticinios", color:"#E8F4FA", price:0.550, priceDesc:"litro~R$5,49/Irani Laticinios", macro:{p:3.5,c:5,f:0.2,fi:0,su:5,na:52,k:166,ch:2},
    measures:[{label:"1/2 copo (100ml)",g:100},{label:"1 copo (200ml)",g:200}]},
  { id:57, name:"Leite integral",           rawCal:61,  cookedCal:61,  group:"Laticinios", color:"#F0E8D0", price:0.600, priceDesc:"litro~R$5,99/Irani Laticinios", macro:{p:3.2,c:4.8,f:3.3,fi:0,su:4.8,na:44,k:150,ch:11},
    measures:[{label:"1/2 copo (100ml)",g:100},{label:"1 copo (200ml)",g:200}]},
  { id:58, name:"Leite semidesnatado",      rawCal:47,  cookedCal:47,  group:"Laticinios", color:"#E0EEF8", price:0.550, priceDesc:"litro~R$5,49/Irani Laticinios", macro:{p:3.3,c:4.9,f:1.5,fi:0,su:4.9,na:46,k:155,ch:7},
    measures:[{label:"1/2 copo (100ml)",g:100},{label:"1 copo (200ml)",g:200}]},
  { id:59, name:"Queijo mussarela",         rawCal:280, cookedCal:280, group:"Laticinios", color:"#F8F0D8", price:7.000, priceDesc:"kg~R$39,98/Irani Frios", macro:{p:22,c:2,f:20,fi:0,su:1,na:627,k:76,ch:60},
    measures:[{label:"1 fatia fina (20g)",g:20},{label:"2 fatias (40g)",g:40},{label:"3 fatias (60g)",g:60}]},
  { id:60, name:"Requeijao light",          rawCal:170, cookedCal:170, group:"Laticinios", color:"#F5ECE0", price:4.990, priceDesc:"copo 200g~R$9,98/Irani Frios", macro:{p:8,c:4,f:12,fi:0,su:3,na:290,k:110,ch:35},
    measures:[{label:"Para 1 fatia de pao (20g)",g:20},{label:"1 col. sopa cheia (25g)",g:25},{label:"2 col. sopa (50g)",g:50}]},
  { id:80, name:"Requeijao cremoso normal", rawCal:240, cookedCal:240, group:"Laticinios", color:"#F0E0C0", price:4.990, priceDesc:"copo 200g~R$9,98/Irani Frios", macro:{p:7,c:4,f:20,fi:0,su:3,na:340,k:100,ch:60},
    measures:[{label:"Para 1 fatia de pao (20g)",g:20},{label:"1 col. sopa cheia (25g)",g:25},{label:"2 col. sopa (50g)",g:50}]},
  { id:81, name:"Cafe puro (sem acucar)",   rawCal:2,   cookedCal:2,   group:"Bebida",     color:"#6B3A1F", price:0.050, priceDesc:"pacote 500g~R$13,00/Mercearia", macro:{p:0.1,c:0,f:0,fi:0,su:0,na:2,k:49,ch:0},
    measures:[{label:"Xicara pequena (50ml)",g:50},{label:"Xicara media (100ml)",g:100},{label:"Caneco (200ml)",g:200}]},
  { id:82, name:"Cafe com leite integral",  rawCal:42,  cookedCal:42,  group:"Bebida",     color:"#9C6840", price:0.600, priceDesc:"litro~R$5,99/Irani Laticinios", macro:{p:1.6,c:2.4,f:1.7,fi:0,su:2.4,na:22,k:75,ch:5},
    measures:[{label:"Xicara (100ml)",g:100},{label:"Caneco (200ml)",g:200}]},
  { id:83, name:"Cafe com leite desnatado", rawCal:28,  cookedCal:28,  group:"Bebida",     color:"#B08860", price:0.550, priceDesc:"litro~R$5,49/Irani Laticinios", macro:{p:1.8,c:2.5,f:0.1,fi:0,su:2.5,na:26,k:83,ch:1},
    measures:[{label:"Xicara (100ml)",g:100},{label:"Caneco (200ml)",g:200}]},
  { id:84, name:"Suco de laranja natural",  rawCal:45,  cookedCal:45,  group:"Bebida",     color:"#F5A030", price:0.800, priceDesc:"laranja kg~R$7,98/Irani Hortifruti", macro:{p:0.7,c:10,f:0.2,fi:0.2,su:8.4,na:1,k:200,ch:0},
    measures:[{label:"Copo pequeno (150ml)",g:150},{label:"Copo medio (200ml)",g:200},{label:"Copo grande (300ml)",g:300}]},
  { id:86, name:"Leite com Nescau integral",rawCal:74,  cookedCal:74,  group:"Bebida",     color:"#7A4A2A", price:0.600, priceDesc:"litro~R$5,99/Irani Laticinios", macro:{p:3.5,c:11,f:2.8,fi:0.3,su:9,na:60,k:180,ch:10},
    measures:[{label:"Copo (200ml)",g:200},{label:"Caneco (300ml)",g:300}]},
  { id:87, name:"Leite com Nescau desnat.", rawCal:54,  cookedCal:54,  group:"Bebida",     color:"#9A6A4A", price:0.550, priceDesc:"litro~R$5,49/Irani Laticinios", macro:{p:3.8,c:10,f:0.5,fi:0.3,su:8,na:62,k:185,ch:2},
    measures:[{label:"Copo (200ml)",g:200},{label:"Caneco (300ml)",g:300}]},
  { id:88, name:"Cha verde (sem acucar)",   rawCal:1,   cookedCal:1,   group:"Bebida",     color:"#90B870", price:0.080, priceDesc:"cx 10un~R$5,90/Mercearia", macro:{p:0,c:0.2,f:0,fi:0,su:0,na:1,k:20,ch:0},
    measures:[{label:"Xicara (200ml)",g:200},{label:"Copo grande (350ml)",g:350}]},
  { id:89, name:"Agua de coco natural",     rawCal:19,  cookedCal:19,  group:"Bebida",     color:"#D8F0C0", price:1.820, priceDesc:"caixinha 330ml~R$5,99/Mercearia", macro:{p:0.7,c:3.7,f:0.2,fi:1,su:2.6,na:105,k:250,ch:0},
    measures:[{label:"Copo (200ml)",g:200},{label:"Caixinha (330ml)",g:330}]},
  { id:8,  name:"Arroz branco",             rawCal:358, cookedCal:130, group:"Carboidrato", color:"#F7ECC8", price:0.400, priceDesc:"kg~R$3,99/Irani Mercearia", macro:{p:2.5,c:28,f:0.3,fi:0.4,su:0,na:5,k:35,ch:0},
    measures:[{label:"1/2 escumadeira (50g coz.)",g:50},{label:"1 escumadeira (100g coz.)",g:100},{label:"2 escumadeiras (200g coz.)",g:200}]},
  { id:9,  name:"Arroz integral",           rawCal:350, cookedCal:111, group:"Carboidrato", color:"#C8B89A", price:0.600, priceDesc:"kg~R$5,99/Irani Mercearia", macro:{p:2.6,c:23,f:0.9,fi:1.8,su:0,na:5,k:79,ch:0},
    measures:[{label:"1 escumadeira (100g coz.)",g:100},{label:"2 escumadeiras (200g coz.)",g:200}]},
  { id:10, name:"Batata doce",              rawCal:76,  cookedCal:86,  group:"Carboidrato", color:"#E8A07D", price:0.450, priceDesc:"kg~R$4,49/Irani Hortifruti", macro:{p:1.6,c:20,f:0.1,fi:3,su:4.2,na:55,k:337,ch:0},
    measures:[{label:"1 fatia fina (40g)",g:40},{label:"2 fatias (80g)",g:80},{label:"3 fatias (120g)",g:120}]},
  { id:11, name:"Macarrao",                 rawCal:356, cookedCal:131, group:"Carboidrato", color:"#F5D490", price:0.550, priceDesc:"pct 500g~R$2,75/Mercearia", macro:{p:4.5,c:28,f:0.9,fi:1.8,su:0.6,na:6,k:44,ch:0},
    measures:[{label:"1 colher de servir (80g coz.)",g:80},{label:"2 colheres de servir (160g coz.)",g:160}]},
  { id:45, name:"Pao de forma natural",     rawCal:265, cookedCal:265, group:"Carboidrato", color:"#E8C890", price:2.800, priceDesc:"pct 400g~R$11,19/Mercearia", macro:{p:8,c:50,f:4,fi:2.3,su:5,na:490,k:100,ch:0},
    measures:[{label:"1 fatia (25g)",g:25},{label:"2 fatias (50g)",g:50}]},
  { id:46, name:"Pao de forma integral",    rawCal:240, cookedCal:240, group:"Carboidrato", color:"#C8A870", price:3.110, priceDesc:"pct 450g~R$13,99/Irani Mercearia", macro:{p:9,c:46,f:3,fi:6,su:3,na:440,k:180,ch:0},
    measures:[{label:"1 fatia (25g)",g:25},{label:"2 fatias (50g)",g:50}]},
  { id:12, name:"Pao frances",              rawCal:300, cookedCal:300, group:"Carboidrato", color:"#D4A96A", price:1.400, priceDesc:"kg~R$13,98/Irani Padaria", macro:{p:8,c:58,f:3,fi:2.3,su:2,na:590,k:110,ch:0},
    measures:[{label:"1 unidade (50g)",g:50},{label:"Metade (25g)",g:25}]},
  { id:47, name:"Granola tradicional",      rawCal:410, cookedCal:410, group:"Carboidrato", color:"#D4B870", price:4.990, priceDesc:"pct 800g~R$39,98/Mercearia", macro:{p:8,c:65,f:10,fi:5,su:18,na:50,k:280,ch:0},
    measures:[{label:"2 col. sopa (25g)",g:25},{label:"1/2 xicara (50g)",g:50}]},
  { id:48, name:"Granola fit (sem acucar)", rawCal:360, cookedCal:360, group:"Carboidrato", color:"#B8A860", price:4.990, priceDesc:"pct 800g~R$39,98/Mercearia", macro:{p:10,c:60,f:8,fi:8,su:4,na:40,k:300,ch:0},
    measures:[{label:"2 col. sopa (25g)",g:25},{label:"1/2 xicara (50g)",g:50}]},
  { id:61, name:"Batata inglesa cozida",    rawCal:72,  cookedCal:77,  group:"Carboidrato", color:"#E8D8A0", price:0.400, priceDesc:"kg~R$3,99/Irani Hortifruti", macro:{p:2,c:17,f:0.1,fi:2.2,su:0.8,na:6,k:379,ch:0},
    measures:[{label:"Batata pequena (80g)",g:80},{label:"3 rodelas (60g)",g:60},{label:"5 rodelas (100g)",g:100}]},
  { id:62, name:"Quinoa cozida",            rawCal:368, cookedCal:120, group:"Carboidrato", color:"#C8D8A0", price:2.000, priceDesc:"kg~R$20,00/Mercearia", macro:{p:4.4,c:22,f:1.9,fi:2.8,su:0,na:7,k:172,ch:0},
    measures:[{label:"3 col. sopa (60g)",g:60},{label:"1/2 xicara (90g)",g:90}]},
  { id:63, name:"Tapioca (goma pronta)",    rawCal:334, cookedCal:334, group:"Carboidrato", color:"#F0E8D8", price:1.340, priceDesc:"pct 500g~R$6,69/Irani Mercearia", macro:{p:0.7,c:83,f:0.2,fi:0.9,su:0,na:1,k:11,ch:0},
    measures:[{label:"Tapioca pequena (50g)",g:50},{label:"Tapioca media (80g)",g:80}]},
  { id:64, name:"Cuscuz de milho cozido",   rawCal:350, cookedCal:112, group:"Carboidrato", color:"#F5D8A0", price:0.990, priceDesc:"pct 500g~R$4,95/Mercearia", macro:{p:2.4,c:23,f:0.5,fi:1.4,su:0,na:8,k:60,ch:0},
    measures:[{label:"Fatia (80g)",g:80},{label:"2 fatias (160g)",g:160}]},
  { id:14, name:"Mandioca cozida",          rawCal:125, cookedCal:125, group:"Carboidrato", color:"#F0E0A0", price:1.200, priceDesc:"~R$11,98/un/Irani Hortifruti", macro:{p:1,c:30,f:0.3,fi:1.9,su:1.7,na:14,k:271,ch:0},
    measures:[{label:"2 fatias (80g)",g:80},{label:"3 fatias (120g)",g:120},{label:"4 fatias (160g)",g:160}]},
  { id:15, name:"Feijao carioca",           rawCal:335, cookedCal:77,  group:"Leguminosa",  color:"#C8946A", price:0.450, priceDesc:"kg~R$4,49/Irani Mercearia", macro:{p:4.8,c:14,f:0.5,fi:8.5,su:0.3,na:2,k:255,ch:0},
    measures:[{label:"1 concha (80g coz.)",g:80},{label:"Concha cheia (100g coz.)",g:100}]},
  { id:16, name:"Feijao preto",             rawCal:341, cookedCal:82,  group:"Leguminosa",  color:"#6A4A3A", price:0.450, priceDesc:"kg~R$4,49/Irani Mercearia", macro:{p:5.2,c:14,f:0.5,fi:8.7,su:0.3,na:2,k:260,ch:0},
    measures:[{label:"1 concha (80g coz.)",g:80},{label:"Concha cheia (100g coz.)",g:100}]},
  { id:17, name:"Lentilha",                 rawCal:352, cookedCal:116, group:"Leguminosa",  color:"#A07050", price:1.490, priceDesc:"kg~R$14,90/Mercearia", macro:{p:9,c:20,f:0.4,fi:7.9,su:1.8,na:2,k:369,ch:0},
    measures:[{label:"1 concha pequena (60g coz.)",g:60},{label:"1 concha (80g coz.)",g:80},{label:"Concha cheia (100g coz.)",g:100}]},
  { id:65, name:"Grao de bico",             rawCal:364, cookedCal:164, group:"Leguminosa",  color:"#C8A860", price:1.600, priceDesc:"pct 500g~R$7,99/Irani Mercearia", macro:{p:8.9,c:27,f:2.6,fi:7.6,su:4.8,na:7,k:291,ch:0},
    measures:[{label:"3 col. sopa (50g coz.)",g:50},{label:"1 concha (80g coz.)",g:80}]},
  { id:66, name:"Ervilha",                  rawCal:339, cookedCal:77,  group:"Leguminosa",  color:"#90C060", price:1.390, priceDesc:"kg~R$13,90/Mercearia", macro:{p:5,c:14,f:0.4,fi:5.5,su:5.5,na:5,k:244,ch:0},
    measures:[{label:"2 col. sopa (40g coz.)",g:40},{label:"3 col. sopa (60g coz.)",g:60}]},
  { id:18, name:"Brocolis",                 rawCal:34,  cookedCal:28,  group:"Vegetal",     color:"#6AAF6E", price:4.430, priceDesc:"bandeja 180g~R$7,98/Irani Hortifruti", macro:{p:2.8,c:5,f:0.4,fi:2.6,su:1.7,na:33,k:316,ch:0},
    measures:[{label:"2 buques pequenos (50g)",g:50},{label:"3 buques medios (80g)",g:80},{label:"Porcao generosa (130g)",g:130}]},
  { id:19, name:"Alface",                   rawCal:15,  cookedCal:15,  group:"Vegetal",     color:"#90C97E", price:2.330, priceDesc:"pé hidrop.~R$3,49/Irani Hortifruti", macro:{p:1.3,c:2,f:0.2,fi:1.3,su:0.8,na:10,k:194,ch:0},
    measures:[{label:"Porcao pequena (30g)",g:30},{label:"Porcao media (60g)",g:60},{label:"Prato de salada (100g)",g:100}]},
  { id:20, name:"Tomate",                   rawCal:18,  cookedCal:18,  group:"Vegetal",     color:"#E07070", price:0.500, priceDesc:"kg~R$4,99/Irani Hortifruti", macro:{p:0.9,c:3.9,f:0.2,fi:1.2,su:2.6,na:5,k:237,ch:0},
    measures:[{label:"2 rodelas (40g)",g:40},{label:"4 rodelas (80g)",g:80},{label:"Tomate medio inteiro (100g)",g:100}]},
  { id:21, name:"Cenoura",                  rawCal:41,  cookedCal:35,  group:"Vegetal",     color:"#F0924A", price:0.410, priceDesc:"kg~R$4,14/Irani Hortifruti", macro:{p:0.9,c:9,f:0.2,fi:2.8,su:4.7,na:69,k:320,ch:0},
    measures:[{label:"3 rodelas (30g)",g:30},{label:"5 rodelas (50g)",g:50},{label:"Porcao (80g)",g:80}]},
  { id:22, name:"Abobrinha",                rawCal:17,  cookedCal:15,  group:"Vegetal",     color:"#A0C870", price:0.260, priceDesc:"kg~R$2,59/Irani Hortifruti", macro:{p:1.2,c:3,f:0.3,fi:1,su:2.5,na:10,k:261,ch:0},
    measures:[{label:"3 fatias (60g)",g:60},{label:"5 fatias (100g)",g:100},{label:"Porcao (150g)",g:150}]},
  { id:23, name:"Couve refogada",           rawCal:40,  cookedCal:32,  group:"Vegetal",     color:"#4A9050", price:0.390, priceDesc:"maço~R$3,90/Irani Hortifruti", macro:{p:3.5,c:4,f:1,fi:2,su:0,na:53,k:228,ch:0},
    measures:[{label:"2 col. sopa (30g)",g:30},{label:"Porcao (60g)",g:60}]},
  { id:67, name:"Pepino",                   rawCal:15,  cookedCal:15,  group:"Vegetal",     color:"#80C878", price:0.600, priceDesc:"kg~R$5,99/Irani Hortifruti", macro:{p:0.7,c:3,f:0.1,fi:0.5,su:1.7,na:2,k:147,ch:0},
    measures:[{label:"4 rodelas (40g)",g:40},{label:"8 rodelas (80g)",g:80},{label:"1/2 pepino (100g)",g:100}]},
  { id:68, name:"Repolho",                  rawCal:25,  cookedCal:20,  group:"Vegetal",     color:"#A8D890", price:0.210, priceDesc:"un~R$2,10/Irani Hortifruti", macro:{p:1.3,c:5,f:0.1,fi:2.5,su:3.2,na:18,k:170,ch:0},
    measures:[{label:"Porcao pequena (50g)",g:50},{label:"Porcao media (100g)",g:100}]},
  { id:69, name:"Espinafre",                rawCal:23,  cookedCal:17,  group:"Vegetal",     color:"#3A9050", price:0.390, priceDesc:"maço~R$3,90/Irani Hortifruti", macro:{p:2.9,c:3.6,f:0.4,fi:2.2,su:0.4,na:79,k:558,ch:0},
    measures:[{label:"Porcao (50g)",g:50},{label:"Porcao generosa (100g)",g:100}]},
  { id:70, name:"Chuchu cozido",            rawCal:24,  cookedCal:24,  group:"Vegetal",     color:"#90C890", price:0.220, priceDesc:"un~R$2,20/Irani Hortifruti", macro:{p:1,c:5,f:0.2,fi:1.7,su:1.7,na:2,k:125,ch:0},
    measures:[{label:"3 fatias (60g)",g:60},{label:"5 fatias (100g)",g:100}]},
  { id:71, name:"Beterraba cozida",         rawCal:43,  cookedCal:43,  group:"Vegetal",     color:"#C04060", price:0.330, priceDesc:"maço~R$3,30/Irani Hortifruti", macro:{p:1.7,c:10,f:0.2,fi:2,su:8,na:78,k:305,ch:0},
    measures:[{label:"2 rodelas (40g)",g:40},{label:"4 rodelas (80g)",g:80}]},
  { id:72, name:"Vagem cozida",             rawCal:31,  cookedCal:25,  group:"Vegetal",     color:"#70A858", price:0.450, priceDesc:"kg~R$4,50/Irani Hortifruti", macro:{p:1.8,c:5,f:0.2,fi:2.7,su:2.2,na:4,k:160,ch:0},
    measures:[{label:"Porcao (60g)",g:60},{label:"Porcao generosa (100g)",g:100}]},
  { id:24, name:"Banana",                   rawCal:89,  cookedCal:89,  group:"Fruta",       color:"#F5E050", price:0.690, priceDesc:"kg~R$6,89/Irani Hortifruti", macro:{p:1.1,c:23,f:0.3,fi:2.6,su:12,na:1,k:358,ch:0},
    measures:[{label:"Banana pequena (80g)",g:80},{label:"Banana media (120g)",g:120}]},
  { id:25, name:"Maca",                     rawCal:52,  cookedCal:52,  group:"Fruta",       color:"#D4534A", price:1.200, priceDesc:"kg~R$11,99/Irani Hortifruti", macro:{p:0.3,c:14,f:0.2,fi:2.4,su:10,na:1,k:107,ch:0},
    measures:[{label:"Maca pequena (130g)",g:130},{label:"Maca media (180g)",g:180}]},
  { id:26, name:"Laranja",                  rawCal:47,  cookedCal:47,  group:"Fruta",       color:"#F5A030", price:0.800, priceDesc:"kg~R$7,98/Irani Hortifruti", macro:{p:0.9,c:12,f:0.1,fi:2.4,su:9,na:0,k:181,ch:0},
    measures:[{label:"Laranja media (130g)",g:130},{label:"Laranja grande (180g)",g:180}]},
  { id:27, name:"Abacate",                  rawCal:160, cookedCal:160, group:"Fruta",       color:"#5E9960", price:0.500, priceDesc:"kg~R$4,99/Irani Hortifruti", macro:{p:2,c:9,f:15,fi:6.7,su:0.7,na:7,k:485,ch:0},
    measures:[{label:"1/2 unidade (80g)",g:80},{label:"Col. sopa (25g)",g:25}]},
  { id:28, name:"Mamao",                    rawCal:32,  cookedCal:32,  group:"Fruta",       color:"#F5A060", price:0.700, priceDesc:"un~R$6,99/Irani Hortifruti", macro:{p:0.5,c:8,f:0.1,fi:1.8,su:5.9,na:8,k:182,ch:0},
    measures:[{label:"Fatia (130g)",g:130},{label:"Fatia grande (200g)",g:200}]},
  { id:49, name:"Manga",                    rawCal:65,  cookedCal:65,  group:"Fruta",       color:"#F0B830", price:0.630, priceDesc:"kg~R$6,30/Irani Hortifruti", macro:{p:0.8,c:17,f:0.3,fi:1.8,su:14,na:2,k:168,ch:0},
    measures:[{label:"Fatia media (100g)",g:100},{label:"1/2 manga (150g)",g:150}]},
  { id:50, name:"Morango",                  rawCal:32,  cookedCal:32,  group:"Fruta",       color:"#E05060", price:3.950, priceDesc:"bandeja 200g~R$7,89/Irani Hortifruti", macro:{p:0.7,c:7.7,f:0.3,fi:2,su:4.9,na:1,k:153,ch:0},
    measures:[{label:"5 morangos (75g)",g:75},{label:"1 xicara (150g)",g:150}]},
  { id:51, name:"Uva",                      rawCal:69,  cookedCal:69,  group:"Fruta",       color:"#9060C0", price:1.200, priceDesc:"kg~R$12,00/Irani Hortifruti", macro:{p:0.7,c:18,f:0.2,fi:0.9,su:15,na:2,k:191,ch:0},
    measures:[{label:"Porcao pequena (80g)",g:80},{label:"1 cacho medio (150g)",g:150}]},
  { id:52, name:"Abacaxi",                  rawCal:50,  cookedCal:50,  group:"Fruta",       color:"#F0D040", price:0.450, priceDesc:"un~R$4,50/Irani Hortifruti", macro:{p:0.5,c:13,f:0.1,fi:1.4,su:9.9,na:1,k:109,ch:0},
    measures:[{label:"1 fatia (80g)",g:80},{label:"2 fatias (160g)",g:160}]},
  { id:53, name:"Kiwi",                     rawCal:61,  cookedCal:61,  group:"Fruta",       color:"#90B840", price:1.500, priceDesc:"kg~R$15,00/Irani Hortifruti", macro:{p:1.1,c:15,f:0.5,fi:3,su:9,na:3,k:312,ch:0},
    measures:[{label:"1 unidade (80g)",g:80},{label:"2 unidades (160g)",g:160}]},
  { id:54, name:"Melancia",                 rawCal:30,  cookedCal:30,  group:"Fruta",       color:"#E86070", price:0.150, priceDesc:"kg~R$1,50/Irani Hortifruti", macro:{p:0.6,c:8,f:0.2,fi:0.4,su:6.2,na:1,k:112,ch:0},
    measures:[{label:"Fatia fina (150g)",g:150},{label:"Fatia media (250g)",g:250}]},
  { id:55, name:"Pera",                     rawCal:57,  cookedCal:57,  group:"Fruta",       color:"#C8D890", price:0.750, priceDesc:"kg~R$7,50/Irani Hortifruti", macro:{p:0.4,c:15,f:0.1,fi:3.1,su:9.8,na:1,k:116,ch:0},
    measures:[{label:"Pera pequena (120g)",g:120},{label:"Pera media (170g)",g:170}]},
  { id:79, name:"Melao",                    rawCal:34,  cookedCal:34,  group:"Fruta",       color:"#F0E090", price:0.550, priceDesc:"kg~R$5,50/Irani Hortifruti", macro:{p:0.8,c:8,f:0.2,fi:0.9,su:7.9,na:16,k:267,ch:0},
    measures:[{label:"Fatia media (150g)",g:150},{label:"Fatia grande (250g)",g:250}]},
  { id:29, name:"Azeite de oliva",          rawCal:884, cookedCal:884, group:"Gordura",     color:"#C8B84A", price:8.000, priceDesc:"500ml~R$40,00/Mercearia", macro:{p:0,c:0,f:100,fi:0,su:0,na:2,k:1,ch:0},
    measures:[{label:"1 col. cha (5g)",g:5},{label:"1 col. sopa (14g)",g:14}]},
  { id:56, name:"Castanha de caju torrada", rawCal:553, cookedCal:553, group:"Gordura",     color:"#D4A060", price:4.000, priceDesc:"pct 200g~R$8,00/Mercearia", macro:{p:18,c:33,f:44,fi:3.3,su:6,na:16,k:565,ch:0},
    measures:[{label:"~10 unidades (20g)",g:20},{label:"~15 unidades (30g)",g:30}]},
  { id:73, name:"Amendoim torrado",         rawCal:599, cookedCal:599, group:"Gordura",     color:"#C89050", price:2.800, priceDesc:"500g~R$13,98/Irani Mercearia", macro:{p:26,c:22,f:49,fi:8,su:4,na:18,k:705,ch:0},
    measures:[{label:"Punhado pequeno (20g)",g:20},{label:"Punhado medio (30g)",g:30}]},
  { id:74, name:"Manteiga",                 rawCal:717, cookedCal:717, group:"Gordura",     color:"#F0D070", price:7.170, priceDesc:"pct 200g~R$14,35/Irani Frios", macro:{p:0.9,c:0,f:81,fi:0,su:0,na:643,k:24,ch:215},
    measures:[{label:"1 ponta de faca (5g)",g:5},{label:"1 col. cha (10g)",g:10}]},
  { id:76, name:"Carne moida (patinho)",    rawCal:143, cookedCal:230, group:"Proteina",    color:"#B06040", price:2.900, priceDesc:"kg~R$28,99/Irani Açougue", macro:{p:26,c:0,f:16,fi:0,su:0,na:68,k:320,ch:83},
    measures:[{label:"1/2 palma da mao (80g)",g:80},{label:"1 palma da mao (120g)",g:120}]},
  { id:77, name:"Peito de peru fatiado",    rawCal:109, cookedCal:109, group:"Proteina",    color:"#D8C0A0", price:3.500, priceDesc:"pct 200g~R$6,99/Irani Frios", macro:{p:18,c:2,f:3,fi:0,su:1,na:820,k:200,ch:45},
    measures:[{label:"1 fatia (20g)",g:20},{label:"2 fatias (40g)",g:40},{label:"3 fatias (60g)",g:60}]},
  { id:78, name:"Presunto magro fatiado",   rawCal:145, cookedCal:145, group:"Proteina",    color:"#E0A090", price:4.500, priceDesc:"pct 200g~R$8,99/Irani Frios", macro:{p:19,c:2,f:7,fi:0,su:1,na:1000,k:220,ch:55},
    measures:[{label:"1 fatia (20g)",g:20},{label:"2 fatias (40g)",g:40}]},
  { id:90, name:"Cream cheese light",       rawCal:168, cookedCal:168, group:"Laticinios",  color:"#F0E8D8", price:3.450, priceDesc:"pote 200g~R$6,90/Irani Frios", macro:{p:7,c:4,f:13,fi:0,su:3,na:300,k:120,ch:40},
    measures:[{label:"1 col. sopa (25g)",g:25},{label:"2 col. sopa (50g)",g:50}]},
  { id:91, name:"Iogurte natural integral", rawCal:61,  cookedCal:61,  group:"Laticinios",  color:"#EAF0FA", price:1.670, priceDesc:"pote 180g~R$3,00/Irani Frios", macro:{p:3.5,c:4.7,f:3.3,fi:0,su:4.7,na:46,k:155,ch:13},
    measures:[{label:"Pote pequeno (90g)",g:90},{label:"Pote grande (180g)",g:180}]},
  { id:92, name:"Frango sobrecoxa",         rawCal:160, cookedCal:209, group:"Proteina",    color:"#D4A060", price:3.000, priceDesc:"FILE PEITO BIFE 600g~R$16,99/Irani", macro:{p:22,c:0,f:10,fi:0,su:0,na:90,k:260,ch:95},
    measures:[{label:"1/2 palma da mao (80g)",g:80},{label:"1 palma da mao (120g)",g:120}]},
  { id:93, name:"Tilapia grelhada",         rawCal:96,  cookedCal:128, group:"Proteina",    color:"#A8C8D8", price:4.000, priceDesc:"tilápia ~R$40/kg/Peixaria", macro:{p:20,c:0,f:2.7,fi:0,su:0,na:56,k:302,ch:57},
    measures:[{label:"1/2 palma da mao (90g)",g:90},{label:"1 palma da mao (130g)",g:130}]},
  { id:95, name:"Pao integral multigraos",  rawCal:255, cookedCal:255, group:"Carboidrato", color:"#A89060", price:3.110, priceDesc:"pct 450g~R$13,99/Irani Mercearia", macro:{p:10,c:42,f:5,fi:7,su:4,na:400,k:200,ch:0},
    measures:[{label:"1 fatia (25g)",g:25},{label:"2 fatias (50g)",g:50}]},
  { id:96, name:"Biscoito de arroz",        rawCal:388, cookedCal:388, group:"Carboidrato", color:"#F0E8C0", price:3.880, priceDesc:"pct 100g~R$3,88/Mercearia", macro:{p:7,c:82,f:3,fi:1.5,su:1,na:320,k:100,ch:0},
    measures:[{label:"1 unidade (10g)",g:10},{label:"2 unidades (20g)",g:20},{label:"3 unidades (30g)",g:30}]},
  { id:97, name:"Batata palha",             rawCal:531, cookedCal:531, group:"Carboidrato", color:"#F0C060", price:2.650, priceDesc:"pct 200g~R$5,30/Mercearia", macro:{p:5,c:56,f:31,fi:3.5,su:0.5,na:410,k:700,ch:0},
    measures:[{label:"1 col. sopa (15g)",g:15},{label:"2 col. sopa (30g)",g:30}]},
  { id:98, name:"Inhame cozido",            rawCal:118, cookedCal:118, group:"Carboidrato", color:"#C8A890", price:0.890, priceDesc:"kg~R$8,90/Irani Hortifruti", macro:{p:1.5,c:28,f:0.2,fi:4.1,su:0.5,na:9,k:816,ch:0},
    measures:[{label:"Pedaco medio (80g)",g:80},{label:"Pedaco grande (120g)",g:120}]},
  { id:99, name:"Pasta de amendoim (nat.)", rawCal:588, cookedCal:588, group:"Gordura",     color:"#C89858", price:2.940, priceDesc:"pct 200g~R$5,88/Mercearia", macro:{p:25,c:20,f:50,fi:6,su:6,na:17,k:649,ch:0},
    measures:[{label:"1 col. sopa (20g)",g:20},{label:"2 col. sopa (40g)",g:40}]},
  { id:100,name:"Queijo prato fatiado",     rawCal:358, cookedCal:358, group:"Laticinios",  color:"#F5E080", price:7.000, priceDesc:"kg~R$39,98/Irani Frios", macro:{p:23,c:1,f:29,fi:0,su:0.5,na:600,k:77,ch:88},
    measures:[{label:"1 fatia (20g)",g:20},{label:"2 fatias (40g)",g:40},{label:"3 fatias (60g)",g:60}]},
  { id:101,name:"Queijo parmesao ralado",   rawCal:393, cookedCal:393, group:"Laticinios",  color:"#F0D890", price:19.650, priceDesc:"pct 200g~R$39,30/Irani Frios", macro:{p:36,c:2,f:26,fi:0,su:0,na:1600,k:92,ch:68},
    measures:[{label:"1 col. sopa (10g)",g:10},{label:"2 col. sopa (20g)",g:20}]},
  { id:102,name:"Queijo cheddar fatiado",   rawCal:403, cookedCal:403, group:"Laticinios",  color:"#F0A840", price:7.000, priceDesc:"kg~R$39,98/Irani Frios", macro:{p:25,c:1.3,f:33,fi:0,su:0.5,na:621,k:98,ch:100},
    measures:[{label:"1 fatia (20g)",g:20},{label:"2 fatias (40g)",g:40}]},
  { id:103,name:"Queijo coalho",            rawCal:330, cookedCal:330, group:"Laticinios",  color:"#F8E8A0", price:12.100, priceDesc:"kg~R$42,90/Irani Frios", macro:{p:21,c:2,f:26,fi:0,su:0,na:560,k:80,ch:82},
    measures:[{label:"1 fatia (30g)",g:30},{label:"1/2 palma (80g)",g:80}]},
  { id:104,name:"Requeijao light Frimesa",  rawCal:188, cookedCal:188, group:"Laticinios",  color:"#F5ECE0", price:4.990, priceDesc:"copo 200g~R$9,98/Irani Frios", macro:{p:8,c:5,f:15,fi:0,su:3,na:290,k:110,ch:35},
    measures:[{label:"1 col. sopa (25g)",g:25},{label:"2 col. sopa (50g)",g:50}]},
  { id:105,name:"Leite po Ninho",           rawCal:448, cookedCal:448, group:"Laticinios",  color:"#F8F0E0", price:17.920, priceDesc:"pote 400g~R$71,68/Mercearia", macro:{p:24,c:54,f:12,fi:0,su:54,na:440,k:1200,ch:40},
    measures:[{label:"1 medida (25g)",g:25},{label:"2 medidas (50g)",g:50}]},
  { id:107,name:"Geleia frutas sem acucar", rawCal:190, cookedCal:190, group:"Condimento",  color:"#D04060", price:9.500, priceDesc:"pote 200g~R$19,00/Mercearia", macro:{p:0,c:48,f:0,fi:1,su:2,na:30,k:60,ch:0},
    measures:[{label:"1 col. cha (10g)",g:10},{label:"1 col. sopa (20g)",g:20}]},
  { id:108,name:"Ketchup Heinz",            rawCal:89,  cookedCal:89,  group:"Condimento",  color:"#C02020", price:3.000, priceDesc:"frasco 397g~R$11,90/Irani Mercearia", macro:{p:1.5,c:22,f:0.1,fi:0.5,su:19,na:980,k:280,ch:0},
    measures:[{label:"1 col. sopa (17g)",g:17},{label:"2 col. sopa (34g)",g:34}]},
  { id:109,name:"Amido de milho (Maisena)", rawCal:350, cookedCal:350, group:"Carboidrato", color:"#F8F0D0", price:0.870, priceDesc:"kg~R$8,75/Mercearia", macro:{p:0.5,c:88,f:0.1,fi:0.9,su:0,na:7,k:3,ch:0},
    measures:[{label:"1 col. sopa (12g)",g:12},{label:"2 col. sopa (24g)",g:24}]},
  { id:110,name:"Atum em pedacos natural",  rawCal:91,  cookedCal:91,  group:"Proteina",    color:"#7BA7C4", price:8.230, priceDesc:"lata 170g~R$13,99/Irani Mercearia", macro:{p:20,c:0,f:1,fi:0,su:0,na:310,k:235,ch:38},
    measures:[{label:"3 col. sopa (45g)",g:45},{label:"Lata pequena (80g)",g:80},{label:"Lata grande (170g)",g:170}]},
  { id:111,name:"Sardinha em oleo",         rawCal:206, cookedCal:206, group:"Proteina",    color:"#A0C0D0", price:7.850, priceDesc:"lata 140g~R$10,99/Irani Mercearia", macro:{p:19,c:0,f:14,fi:0,su:0,na:430,k:397,ch:76},
    measures:[{label:"1/2 lata (55g)",g:55},{label:"1 lata (110g)",g:110}]},
  { id:112,name:"Granola zero acucar",      rawCal:326, cookedCal:326, group:"Carboidrato", color:"#B8A060", price:4.990, priceDesc:"pct 800g~R$39,98/Mercearia", macro:{p:11,c:55,f:9,fi:10,su:2,na:35,k:290,ch:0},
    measures:[{label:"2 col. sopa (25g)",g:25},{label:"1/2 xicara (50g)",g:50}]},
  { id:113,name:"Aveia em flocos",          rawCal:367, cookedCal:367, group:"Carboidrato", color:"#C8A87A", price:2.470, priceDesc:"400g~R$9,89/Irani Mercearia", macro:{p:14,c:64,f:7,fi:10,su:1,na:8,k:429,ch:0},
    measures:[{label:"2 col. sopa (20g)",g:20},{label:"1/2 xicara (40g)",g:40},{label:"3/4 xicara (60g)",g:60}]},
  { id:114,name:"Nescau em po",             rawCal:380, cookedCal:380, group:"Bebida",      color:"#5C2A10", price:4.370, priceDesc:"lata 400g~R$17,49/Mercearia", macro:{p:5,c:79,f:4,fi:5,su:68,na:130,k:600,ch:0},
    measures:[{label:"1 col. sopa cheia (20g)",g:20},{label:"2 col. sopa (40g)",g:40}]},
  { id:115,name:"Cappuccino 3 Coracoes",    rawCal:425, cookedCal:425, group:"Bebida",      color:"#8A5030", price:7.750, priceDesc:"pct 200g~R$15,50/Mercearia", macro:{p:5,c:68,f:14,fi:0,su:50,na:90,k:300,ch:10},
    measures:[{label:"1 dose (20g)",g:20},{label:"2 doses (40g)",g:40}]},
  { id:116,name:"Coxinha (de frango)",      rawCal:258, cookedCal:258, group:"Lanche",      color:"#E0A050", price:0.000, priceDesc:"aprox.R$4,50/un/Padaria", macro:{p:9,c:28,f:12,fi:1.5,su:1,na:420,k:180,ch:30},
    measures:[{label:"Coxinha pequena (60g)",g:60},{label:"Coxinha media (100g)",g:100}]},
  { id:117,name:"Tapioca recheada (frango)",rawCal:128, cookedCal:128, group:"Lanche",      color:"#F0D8A0", price:0.000, priceDesc:"aprox.R$8,00/un/Lancheria", macro:{p:9,c:20,f:2,fi:0.9,su:0,na:180,k:160,ch:25},
    measures:[{label:"Tapioca pequena (100g)",g:100},{label:"Tapioca media (150g)",g:150}]},
  { id:118,name:"Pao de queijo",            rawCal:299, cookedCal:299, group:"Lanche",      color:"#F5D070", price:3.990, priceDesc:"kg~R$39,88/Irani Padaria", macro:{p:5,c:41,f:13,fi:0.5,su:1,na:310,k:60,ch:30},
    measures:[{label:"1 unidade (25g)",g:25},{label:"2 unidades (50g)",g:50},{label:"3 unidades (75g)",g:75}]},
  { id:119,name:"Vitamina de banana",       rawCal:58,  cookedCal:58,  group:"Bebida",      color:"#F5E880", price:0.600, priceDesc:"litro~R$5,99/Irani Laticinios", macro:{p:3,c:11,f:0.3,fi:0.8,su:7,na:52,k:210,ch:2},
    measures:[{label:"Copo (200ml)",g:200},{label:"Copo grande (300ml)",g:300}]},
  { id:120,name:"Frango xadrez",            rawCal:120, cookedCal:120, group:"Proteina",    color:"#D08040", price:3.000, priceDesc:"FILE PEITO BIFE 600g~R$16,99/Irani", macro:{p:14,c:8,f:4,fi:1,su:4,na:380,k:280,ch:50},
    measures:[{label:"1/2 palma da mao (80g)",g:80},{label:"1 palma da mao (120g)",g:120}]},
  { id:121,name:"Omelete simples",          rawCal:170, cookedCal:170, group:"Proteina",    color:"#F5D060", price:1.270, priceDesc:"C/30~R$18,99/Irani Feira", macro:{p:12,c:1,f:13,fi:0,su:0.4,na:210,k:130,ch:380},
    measures:[{label:"Omelete 2 ovos (100g)",g:100},{label:"Omelete 3 ovos (150g)",g:150}]},
  { id:122,name:"Sopa de legumes",          rawCal:45,  cookedCal:45,  group:"Vegetal",     color:"#F0C870", price:0.000, priceDesc:"ingredients~R$2,50/porção", macro:{p:2,c:8,f:0.8,fi:2,su:3,na:350,k:280,ch:0},
    measures:[{label:"Tigela (200g)",g:200},{label:"Tigela grande (300g)",g:300}]},
  { id:123,name:"Maionese light",           rawCal:236, cookedCal:236, group:"Condimento",  color:"#F5F0D0", price:5.900, priceDesc:"pote 200g~R$11,80/Mercearia", macro:{p:1,c:8,f:22,fi:0,su:3,na:520,k:15,ch:30},
    measures:[{label:"1 col. sopa (15g)",g:15},{label:"2 col. sopa (30g)",g:30}]},
  { id:124,name:"Azeite de dende",          rawCal:884, cookedCal:884, group:"Gordura",     color:"#E08020", price:8.840, priceDesc:"500ml~R$44,20/Mercearia", macro:{p:0,c:0,f:100,fi:0,su:0,na:0,k:0,ch:0},
    measures:[{label:"1 col. sopa (14g)",g:14}]},
  { id:125,name:"Mel",                      rawCal:304, cookedCal:304, group:"Condimento",  color:"#F0C040", price:6.670, priceDesc:"pote 300g~R$20,00/Mercearia", macro:{p:0.3,c:82,f:0,fi:0.2,su:82,na:4,k:52,ch:0},
    measures:[{label:"1 col. cha (7g)",g:7},{label:"1 col. sopa (21g)",g:21}]},
  { id:126,name:"Achocolatado Toddy caixa", rawCal:74,  cookedCal:74,  group:"Bebida",      color:"#6A3020", price:2.000, priceDesc:"caixinha 200ml~R$4,00/Mercearia", macro:{p:2.5,c:14,f:1,fi:0.3,su:12,na:55,k:160,ch:4},
    measures:[{label:"Caixinha 200ml",g:200}]},
  { id:127,name:"Queijo branco frescal",    rawCal:173, cookedCal:173, group:"Laticinios",  color:"#F0F0E0", price:5.770, priceDesc:"pct 300g~R$17,30/Irani Frios", macro:{p:13,c:2,f:13,fi:0,su:0.5,na:290,k:80,ch:43},
    measures:[{label:"1 fatia (30g)",g:30},{label:"2 fatias (60g)",g:60}]},

  // ── Hambúrgueres caseiros (cru moldado) ──
  // Preparados na AIRFRYER: ar quente circulante, gordura escorre menos que na churrasqueira
  // pois a carne fica no cesto (reabsorve parte da gordura). Perda de água ~15-18%.

  // Patinho: carne magra, baixo teor de gordura. Fonte CSV: R$28,99/kg
  // Airfryer: perde ~18% água, gordura escorre pouco (já é magro ~6g → ~5g restante)
  // 130g → ~221 kcal | 180g → ~306 kcal
  { id:128,name:"Hamburguer caseiro patinho",rawCal:143, cookedCal:170, group:"Proteina",   color:"#C97B5A", price:2.900, priceDesc:"kg~R$28,99/Irani Açougue", macro:{p:31,c:0,f:5,fi:0,su:0,na:68,k:320,ch:75},
    measures:[
      {label:"Hamburguer 130g (magro)",g:130},
      {label:"Hamburguer 180g (padrao)",g:180},
    ]},
  // Acém: corte mais gordo. Na airfryer a gordura escorre MENOS que na churrasqueira
  // (carne fica no cesto, reabsorve parte). ~18g → ~13g gordura restante
  // 130g → ~305 kcal | 180g → ~423 kcal
  { id:129,name:"Hamburguer caseiro acem",   rawCal:250, cookedCal:235, group:"Proteina",   color:"#B05830", price:2.500, priceDesc:"kg~R$25,00/Irani Açougue", macro:{p:26,c:0,f:13,fi:0,su:0,na:72,k:280,ch:78},
    measures:[
      {label:"Hamburguer 130g (magro)",g:130},
      {label:"Hamburguer 180g (padrao)",g:180},
    ]},
  // Colchão mole: gordura intermediária. Airfryer: ~14g → ~11g gordura restante
  // 130g → ~273 kcal | 180g → ~378 kcal
  { id:130,name:"Hamburguer colchao mole",   rawCal:200, cookedCal:210, group:"Proteina",   color:"#A06840", price:3.200, priceDesc:"kg~R$32,00/Irani Açougue", macro:{p:27,c:0,f:11,fi:0,su:0,na:65,k:300,ch:77},
    measures:[
      {label:"Hamburguer 130g (magro)",g:130},
      {label:"Hamburguer 180g (padrao)",g:180},
    ]},
];

const GROUP_ICONS = {
  "Proteina":"🥩","Carboidrato":"🍚","Vegetal":"🥦","Fruta":"🍎",
  "Gordura":"🫒","Leguminosa":"🫘","Laticinios":"🥛","Suplemento":"💊",
  "Bebida":"☕","Personalizado":"✏️","Condimento":"🫙","Lanche":"🫓"
};

function calcCal(food, grams, cooked) {
  return Math.round(((cooked ? food.cookedCal : food.rawCal) * grams) / 100);
}
function getEffectivePrice(food, customPrices) {
  if(customPrices && customPrices[food.id] !== undefined) return customPrices[food.id];
  return food.price || 0;
}
function calcPrice(food, grams, customPrices) {
  const p = getEffectivePrice(food, customPrices);
  if(!p) return null;
  return p * grams / 100;
}
function fmtPrice(val) {
  if(val===null || val===undefined) return null;
  return "R$\u00a0" + val.toFixed(2).replace(".", ",");
}
function calcBMR(sex, age, weight, height) {
  if (!age || !weight || !height) return null;
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(sex === "M" ? base + 5 : base - 161);
}

function exportPDF(menu, totalCal, dailyGoal, profile) {
  const dateStr = new Date().toLocaleDateString("pt-BR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const mealHTML = MEALS.map(meal => {
    const items = menu.filter(i => i.mealId === meal.id);
    if (!items.length) return "";
    const mCal = items.reduce((s,i) => s+i.cal, 0);
    return `<div class="mb"><div class="mt">${meal.icon} ${meal.label}<span class="mc">${mCal} kcal</span></div>${items.map(it=>`<div class="ir"><span class="in">${it.name}</span><span class="im">${it.measure}</span><span class="ic">${it.cal} kcal</span></div>`).join("")}</div>`;
  }).join("");
  const win = window.open("","_blank");
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cardapio Diario</title>
    <style>@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400;600;700&display=swap');
    body{font-family:'Source Sans 3',sans-serif;color:#2A2420;padding:32px 40px;max-width:700px;margin:0 auto}
    h1{font-family:'Playfair Display',serif;font-size:28px;color:#2C1A0E;margin-bottom:4px}.sub{color:#8B7050;font-size:13px;margin-bottom:6px}
    .meta{display:flex;gap:24px;background:#F5EFE6;border-radius:10px;padding:12px 16px;margin:16px 0;font-size:13px}
    .meta label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#8B7050;margin-bottom:2px}
    .meta strong{font-size:20px;font-family:'Playfair Display',serif;color:#5C3018}
    .mb{margin-bottom:18px;border:1px solid #E8E0D0;border-radius:10px;overflow:hidden}
    .mt{background:#F5EFE6;padding:10px 14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between}
    .mc{color:#8B5E3C;font-family:'Playfair Display',serif}
    .ir{display:flex;padding:8px 14px;border-top:1px dashed #EDE5D8;gap:10px}
    .in{flex:1;font-weight:600;font-size:13px}.im{color:#8B7050;font-size:12px;flex:1}
    .ic{font-family:'Playfair Display',serif;font-weight:700;color:#5C3018;font-size:14px;min-width:70px;text-align:right}
    </style></head><body>
    <h1>Cardapio Diario</h1><div class="sub">${dateStr}</div>
    ${profile?.nome?`<p style="font-size:12px;color:#8B7050;margin-bottom:16px">👤 ${profile.nome}${profile.weight?` · ${profile.weight} kg`:""}${profile.height?` · ${profile.height} cm`:""}</p>`:""}
    <div class="meta">
      <div><label>Total</label><strong>${totalCal} kcal</strong></div>
      <div><label>Meta</label><strong>${dailyGoal} kcal</strong></div>
      <div><label>Saldo</label><strong style="color:${totalCal<=dailyGoal?"#286028":"#C0392B"}">${totalCal<=dailyGoal?"-":"+"} ${Math.abs(dailyGoal-totalCal)} kcal</strong></div>
    </div>${mealHTML}
    <p style="margin-top:24px;border-top:1px solid #E8E0D0;padding-top:12px;font-size:11px;color:#A89878">Gerado pelo Dieta Diaria App · ${new Date().toLocaleString("pt-BR")}</p>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
    </body></html>`);
  win.document.close();
}

function exportJSON(menu, profile, dailyGoal, customPrices) {
  const blob = new Blob([JSON.stringify({ version:2, exportedAt:new Date().toISOString(), menu, profile, dailyGoal, customPrices }, null, 2)], { type:"application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `dieta-backup-${new Date().toISOString().split("T")[0]}.json`; a.click();
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DietaTracker() {
  const [activeTab, setActiveTab]   = useState("cardapio");
  const [menu, setMenu]             = useState([]);
  const [search, setSearch]         = useState("");
  const [selGroup, setSelGroup]     = useState("Todos");
  const [targetMeal, setTargetMeal] = useState("cafe");
  const [expanded, setExpanded]     = useState({ cafe:true,lanche1:false,almoco:true,lanche2:false,jantar:true,ceia:false });
  const [subTarget, setSubTarget]   = useState(null);
  const [subResults, setSubResults] = useState([]);
  const [subSearch, setSubSearch]   = useState("");
  const [subMode, setSubMode]       = useState("smart"); // "smart" | "browse"
  const [addModal, setAddModal]     = useState(null);
  const [toast, setToast]           = useState(null);
  const [breadToast, setBreadToast] = useState(null);
  const [lastAdded, setLastAdded]   = useState(null);
  const [customFood, setCustomFood] = useState(null);
  const [history, setHistory]       = useState({}); // { "YYYY-MM-DD": {menu, totalCal} }

  function todayKey() { return new Date().toISOString().split("T")[0]; }
  function saveDay() {
    const key = todayKey();
    setHistory(prev => ({...prev, [key]: { menu: [...menu], totalCal }}));
    showToast("Dia salvo no histórico!");
  }
  const [editItemId, setEditItemId] = useState(null);
  const [customGrams, setCustomGrams] = useState("");
  const fileRef = useRef();

  const [profile, setProfile]            = useState({ nome:"", sex:"M", age:"", weight:"", height:"", activity:"mod", goal:"lose_mod" });
  const [dailyGoalManual, setDailyGoalManual] = useState(null);
  const [customPrices, setCustomPrices]        = useState({}); // { foodId: price_per_100g }

  // ── AI Generator ──
  const [genIngredients, setGenIngredients] = useState("");
  const [genPrefs, setGenPrefs]             = useState("");
  const [genLoading, setGenLoading]         = useState(false);
  const [genResult, setGenResult]           = useState(null);
  const [genError, setGenError]             = useState("");
  const [genStep, setGenStep]               = useState("form");

  // ── Sugestao ──
  const [sugCookMeal, setSugCookMeal]   = useState("almoco"); // almoco | jantar | ambos | nenhum
  const [sugIngred, setSugIngred]       = useState("");
  const [sugPeople, setSugPeople]       = useState("1");
  const [sugPrefs, setSugPrefs]         = useState("");
  const [sugLoading, setSugLoading]     = useState(false);
  const [sugResult, setSugResult]       = useState(null);  // { menu, shoppingList, cookingTips, notes }
  const [sugError, setSugError]         = useState("");
  const [sugStep, setSugStep]           = useState("form");
  const [sugCopied, setSugCopied]       = useState(false);

  const bmr  = calcBMR(profile.sex, +profile.age, +profile.weight, +profile.height);
  const act  = ACTIVITY_LEVELS.find(a=>a.id===profile.activity)?.mult || 1.55;
  const tdee = bmr ? Math.round(bmr * act) : null;
  const goalDelta = GOAL_OPTIONS.find(g=>g.id===profile.goal)?.delta || -500;
  const derivedGoal = tdee ? Math.max(1200, tdee+goalDelta) : 2000;
  const dailyGoal = dailyGoalManual ?? derivedGoal;

  const groups   = ["Todos", ...Array.from(new Set(FOODS.map(f=>f.group)))];
  const filtered = useMemo(()=>FOODS.filter(f=>
    (selGroup==="Todos"||f.group===selGroup) && f.name.toLowerCase().includes(search.toLowerCase())
  ),[search,selGroup]);

  const totalCal = useMemo(()=>menu.reduce((s,i)=>s+i.cal,0),[menu]);
  const mealCals = useMemo(()=>{const o={};MEALS.forEach(m=>{o[m.id]=menu.filter(i=>i.mealId===m.id).reduce((s,i)=>s+i.cal,0)});return o;},[menu]);
  const pct=Math.min(100,Math.round((totalCal/dailyGoal)*100));
  const barColor=pct<70?"#6AAF6E":pct<97?"#E8A030":"#D04040";

  function showToast(msg,type="ok"){setToast({msg,type});setTimeout(()=>setToast(null),2800);}
  function updateProfile(k,v){setProfile(p=>({...p,[k]:v}));}

  function addItem(food,measure,mealId){
    const meal=MEALS.find(m=>m.id===mealId);
    const isBread = [12,45,46].includes(food.id);
    setMenu(prev=>[...prev,{id:Date.now(),mealId,foodId:food.id,name:food.name,measure:measure.label,grams:measure.g,cal:calcCal(food,measure.g,meal.cooked),color:food.color,group:food.group,cooked:meal.cooked,qty:1}]);
    setAddModal(null);
    setLastAdded({foodName:food.name, mealId, mealLabel:meal.label});
    setExpanded(p=>({...p,[mealId]:true}));
    if(isBread) setBreadToast(mealId);
  }
  function removeItem(id){setMenu(prev=>prev.filter(i=>i.id!==id));}

  function addCustomFood(cf) {
    const { name, calPer100, grams, mealId } = cf;
    const g = parseInt(grams), c100 = parseFloat(calPer100);
    if (!name.trim() || !g || !c100 || g<1 || c100<1) return;
    const cal = Math.round(c100 * g / 100);
    const meal = MEALS.find(m=>m.id===mealId);
    setMenu(prev=>[...prev,{
      id:Date.now(), mealId, foodId:null, name:name.trim(),
      measure:`${g}g`, grams:g, cal, color:"#B8B8B8",
      group:"Personalizado", cooked:meal?.cooked||false, qty:1, isCustom:true
    }]);
    setCustomFood(null);
    setLastAdded({foodName:name.trim(), mealId, mealLabel:meal?.label||""});
    setExpanded(p=>({...p,[mealId]:true}));
  }

  function editItemPortion(itemId, food, measure, cooked){
    setMenu(prev=>prev.map(i=>{
      if(i.id!==itemId) return i;
      const q = i.qty||1;
      return {...i, measure:measure.label, grams:measure.g, cal:calcCal(food,measure.g,cooked)*q};
    }));
    setEditItemId(null); setCustomGrams("");
  }

  function editItemCustomGrams(itemId, food, grams, cooked){
    const g = parseInt(grams);
    if(!g || g < 1 || g > 2000) return;
    setMenu(prev=>prev.map(i=>{
      if(i.id!==itemId) return i;
      const q = i.qty||1;
      return {...i, measure:`${g}g (personalizado)`, grams:g, cal:calcCal(food,g,cooked)*q};
    }));
    setEditItemId(null); setCustomGrams("");
  }

  function changeQty(itemId, delta){
    setMenu(prev=>prev.map(i=>{
      if(i.id!==itemId) return i;
      const food = FOODS.find(f=>f.id===i.foodId);
      const q = Math.max(1, Math.min(10, (i.qty||1)+delta));
      const baseCal = food ? calcCal(food, i.grams, i.cooked) : Math.round(i.cal/(i.qty||1));
      return {...i, qty:q, cal:baseCal*q};
    }));
  }

  function findSub(item){
    const allowedGroups = MEAL_GROUPS[item.mealId] || Object.keys(GROUP_ICONS);
    const results=[];
    FOODS
      .filter(f => f.id !== item.foodId && allowedGroups.includes(f.group))
      .forEach(food=>{food.measures.forEach(m=>{
        const c=calcCal(food,m.g,item.cooked);
        if(item.cal>0 && Math.abs(c-item.cal)/item.cal<=0.15)
          results.push({food,measure:m,cal:c,diff:Math.abs(c-item.cal)});
      });});
    setSubTarget(item);
    setSubResults(results.sort((a,b)=>a.diff-b.diff).slice(0,10));
    setActiveTab("substituicoes");
  }
  function applySub(item,food,measure){
    setMenu(prev=>prev.map(i=>i.id===item.id?{...i,foodId:food.id,name:food.name,measure:measure.label,grams:measure.g,cal:calcCal(food,measure.g,item.cooked),color:food.color,group:food.group}:i));
    setSubTarget(null);setSubResults([]);setActiveTab("cardapio");showToast("Substituicao aplicada!");
  }
  function handleImport(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();reader.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.menu)setMenu(d.menu);if(d.profile)setProfile(d.profile);if(d.dailyGoal)setDailyGoalManual(d.dailyGoal);if(d.customPrices)setCustomPrices(d.customPrices);showToast("Backup importado!");}catch{showToast("Arquivo invalido.","err");}};
    reader.readAsText(file);e.target.value="";
  }

  // ── AI: Gerar Cardapio ────────────────────────────────────────────────────
  async function generateMealPlan(){
    if(!genIngredients.trim()){setGenError("Informe ao menos um ingrediente.");return;}
    setGenLoading(true);setGenError("");setGenResult(null);
    const catalog=FOODS.map(f=>({id:f.id,name:f.name,group:f.group,kcalCozido:f.cookedCal,kcalCru:f.rawCal,porcoes:f.measures.map((m,i)=>({index:i,label:m.label,g:m.g}))}));
    const userCtx=bmr?`TMB: ${bmr} kcal. TDEE: ${tdee} kcal. Meta: ${dailyGoal} kcal. Objetivo: ${GOAL_OPTIONS.find(g=>g.id===profile.goal)?.label}.`:`Meta calorica: ${dailyGoal} kcal.`;
    const prompt=`Voce e um nutricionista brasileiro criando um cardapio diario pratico.\n\nCONTEXTO: ${userCtx}${profile.nome?` Nome: ${profile.nome}.`:""}\n\nINGREDIENTES DISPONIVEIS (almoco/jantar):\n${genIngredients}\n\nPREFERENCIAS:\n${genPrefs||"Nenhuma."}\n\nCATALOGO (use APENAS estes IDs):\n${JSON.stringify(catalog)}\n\nINSTRUCOES:\n- 6 refeicoes: cafe, lanche1, almoco, lanche2, jantar, ceia\n- Use os ingredientes informados no almoco e jantar\n- Total de kcal entre 90%-105% de ${dailyGoal} kcal\n- Almoco/jantar: proteina + carbo + vegetal\n- Use somente foodId e measureIndex do catalogo\n\nRESPONDA SOMENTE JSON:\n{"meals":[{"mealId":"cafe","items":[{"foodId":4,"measureIndex":1}]}],"totalCalEstimado":1800,"notes":"dica breve"}`;
    try{
      const response=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:prompt}]})});
      const data=await response.json();
      const raw=data.content?.map(b=>b.text||"").join("").trim();
      const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
      const hydratedMeals=parsed.meals.map(meal=>{const mDef=MEALS.find(m=>m.id===meal.mealId);return{mealId:meal.mealId,items:(meal.items||[]).map(it=>{const food=FOODS.find(f=>f.id===it.foodId);if(!food)return null;const measure=food.measures[it.measureIndex]||food.measures[0];return{food,measure,cal:calcCal(food,measure.g,mDef?.cooked||false),mealId:meal.mealId,cooked:mDef?.cooked||false};}).filter(Boolean)};});
      setGenResult({hydratedMeals,notes:parsed.notes,totalCalEstimado:parsed.totalCalEstimado});setGenStep("preview");
    }catch{setGenError("Erro ao gerar. Tente novamente.");}
    setGenLoading(false);
  }
  function applyGeneratedMenu(replace){
    if(!genResult)return;
    const newItems=genResult.hydratedMeals.flatMap(meal=>meal.items.map(it=>({id:Date.now()+Math.random(),mealId:meal.mealId,foodId:it.food.id,name:it.food.name,measure:it.measure.label,grams:it.measure.g,cal:it.cal,color:it.food.color,group:it.food.group,cooked:it.cooked})));
    setMenu(replace?newItems:[...menu,...newItems]);
    setExpanded({cafe:true,lanche1:true,almoco:true,lanche2:true,jantar:true,ceia:true});
    setActiveTab("cardapio");showToast(replace?"Cardapio aplicado!":"Itens adicionados!");
    setGenStep("form");setGenResult(null);
  }

  // ── AI: Sugestao + Lista de Compras ──────────────────────────────────────
  async function generateSuggestion(){
    setSugLoading(true);setSugError("");setSugResult(null);
    const catalog=FOODS.map(f=>({id:f.id,name:f.name,group:f.group,kcalCozido:f.cookedCal,porcoes:f.measures.map((m,i)=>({index:i,label:m.label,g:m.g}))}));
    const userCtx=bmr?`TMB: ${bmr} kcal. TDEE: ${tdee} kcal. Meta: ${dailyGoal} kcal. Objetivo: ${GOAL_OPTIONS.find(g=>g.id===profile.goal)?.label}.`:`Meta calorica diaria: ${dailyGoal} kcal.`;
    const cookMealLabel={almoco:"apenas o almoco",jantar:"apenas o jantar",ambos:"almoco e jantar",nenhum:"nenhuma refeicao quente"};
    const prompt=`Voce e um nutricionista e personal chef brasileiro. Crie um planejamento diario completo.

CONTEXTO DO USUARIO:
${userCtx}
${profile.nome?`Nome: ${profile.nome}.`:""}
Refeicoes que o usuario vai cozinhar: ${cookMealLabel[sugCookMeal]}.
Pessoas a cozinhar: ${sugPeople}.
${sugIngred?`Ingredientes ja disponiveis: ${sugIngred}.`:""}
${sugPrefs?`Preferencias/restricoes: ${sugPrefs}.`:"Sem restricoes especiais."}

CATALOGO DE ALIMENTOS DO APP:
${JSON.stringify(catalog)}

INSTRUCOES:
1. Crie um menu do dia completo (6 refeicoes) usando alimentos do catalogo, respeitando a meta de ${dailyGoal} kcal.
2. Para as refeicoes que o usuario VAI cozinhar (${cookMealLabel[sugCookMeal]}), inclua dicas de preparo simples e praticas.
3. Gere uma lista de compras organizada por setor do supermercado, considerando ${sugPeople} pessoa(s) e o menu criado. Subtraia o que o usuario ja tem (${sugIngred||"nada informado"}).
4. A lista de compras deve ter quantidades realistas (ex: "Frango peito - 300g", "Arroz - 500g").

RESPONDA SOMENTE JSON VALIDO:
{
  "menu": [
    { "mealId": "cafe", "items": [{ "foodId": 13, "measureIndex": 1 }] }
  ],
  "totalCalEstimado": 1850,
  "cookingTips": [
    { "mealId": "almoco", "tips": ["Tempere o frango com alho, limao e sal 30min antes.", "Grelhe em frigideira antiaderente por 6-7 min de cada lado."] }
  ],
  "shoppingList": [
    { "category": "Proteinas / Frios", "items": ["Frango peito - 300g", "Ovos - 6 unidades"] },
    { "category": "Hortifruti", "items": ["Brocolis - 200g", "Cenoura - 2 unidades", "Banana - 3 unidades"] },
    { "category": "Graos / Cereais", "items": ["Arroz integral - 500g", "Aveia - 200g"] },
    { "category": "Laticinios", "items": ["Iogurte grego - 2 potes (170g)"] },
    { "category": "Padaria", "items": ["Pao de forma integral - 1 pacote"] }
  ],
  "notes": "Dica nutricional breve e pratica."
}`;
    try{
      const response=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:prompt}]})});
      const data=await response.json();
      const raw=data.content?.map(b=>b.text||"").join("").trim();
      const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
      // Hydrate menu
      const hydratedMenu=parsed.menu.map(meal=>{const mDef=MEALS.find(m=>m.id===meal.mealId);return{mealId:meal.mealId,items:(meal.items||[]).map(it=>{const food=FOODS.find(f=>f.id===it.foodId);if(!food)return null;const measure=food.measures[it.measureIndex]||food.measures[0];return{food,measure,cal:calcCal(food,measure.g,mDef?.cooked||false),cooked:mDef?.cooked||false};}).filter(Boolean)};});
      setSugResult({hydratedMenu,totalCalEstimado:parsed.totalCalEstimado,cookingTips:parsed.cookingTips||[],shoppingList:parsed.shoppingList||[],notes:parsed.notes});
      setSugStep("result");
    }catch(e){setSugError("Erro ao gerar sugestao. Tente novamente.");}
    setSugLoading(false);
  }

  function applySuggestedMenu(replace){
    if(!sugResult)return;
    const newItems=sugResult.hydratedMenu.flatMap(meal=>meal.items.map(it=>({id:Date.now()+Math.random(),mealId:meal.mealId,foodId:it.food.id,name:it.food.name,measure:it.measure.label,grams:it.measure.g,cal:it.cal,color:it.food.color,group:it.food.group,cooked:it.cooked})));
    setMenu(replace?newItems:[...menu,...newItems]);
    setExpanded({cafe:true,lanche1:true,almoco:true,lanche2:true,jantar:true,ceia:true});
    setActiveTab("cardapio");showToast("Cardapio aplicado!");setSugStep("form");setSugResult(null);
  }

  function copyShoppingList(){
    if(!sugResult)return;
    const text=sugResult.shoppingList.map(cat=>`${cat.category}:\n${cat.items.map(i=>`  • ${i}`).join("\n")}`).join("\n\n");
    navigator.clipboard.writeText(text).then(()=>{setSugCopied(true);setTimeout(()=>setSugCopied(false),2000);});
  }

  const TABS=[["cardapio","📋","Cardapio"],["alimentos","🔍","Alimentos"],["substituicoes","🔄","Trocas"],["gerar","✨","Gerar"],["sugestao","🛒","Sugestao"],["receitas","👨‍🍳","Receitas"],["semana","📅","Semana"],["precos","💰","Precos"],["relatorio","📊","Relatorio"],["tmb","🧮","TMB"],["dados","💾","Dados"]];

  return (
    <div style={{fontFamily:"'Source Sans 3',sans-serif",minHeight:"100vh",background:"#F2EDE4",color:"#2A2420",position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Source+Sans+3:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .btn{cursor:pointer;border:none;transition:all .15s;font-family:'Source Sans 3',sans-serif}.btn:active{transform:scale(.97)}
        .card{background:#FDFAF4;border-radius:14px;box-shadow:0 1px 8px rgba(60,40,10,.08);border:1px solid #E8E0D0}
        .inp{background:#FDFAF4;border:1.5px solid #DDD5C4;border-radius:10px;padding:9px 14px;font-family:'Source Sans 3',sans-serif;font-size:14px;outline:none;width:100%;transition:border .18s;color:#2A2420}
        .inp:focus{border-color:#8B5E3C}
        .sel{appearance:none;background:#FDFAF4;border:1.5px solid #DDD5C4;border-radius:10px;padding:9px 14px;font-family:'Source Sans 3',sans-serif;font-size:14px;outline:none;width:100%;color:#2A2420;cursor:pointer}
        .sel:focus{border-color:#8B5E3C}
        .pill{padding:5px 11px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid transparent;transition:all .15s;background:#E8E0D0;color:#5C4020;white-space:nowrap}
        .pill.on{background:#8B5E3C;color:#FDFAF4}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#C8B8A0;border-radius:2px}
        .sl{animation:sl .22s ease}@keyframes sl{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .overlay{position:fixed;inset:0;background:rgba(20,10,5,.6);z-index:100;display:flex;align-items:flex-end;justify-content:center}
        .modal{background:#FDFAF4;border-radius:22px 22px 0 0;padding:20px 16px 30px;width:100%;max-width:480px;max-height:82vh;overflow-y:auto}
        .tag{display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:700}
        .toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:20px;font-weight:600;font-size:13px;z-index:200;animation:fu .3s ease;white-space:nowrap;max-width:90vw;text-align:center}
        @keyframes fu{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
        .lbl{display:block;font-size:11px;font-weight:700;color:#8B7050;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px;margin-top:14px}
        .seg{display:flex;border-radius:10px;overflow:hidden;border:1.5px solid #DDD5C4}
        .seg-btn{flex:1;padding:8px 4px;background:#FDFAF4;border:none;font-family:'Source Sans 3',sans-serif;font-size:12px;font-weight:600;color:#8B7050;cursor:pointer;transition:all .15s;text-align:center}
        .seg-btn.on{background:#8B5E3C;color:#FDFAF4}
        .stat-row{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px dashed #EDE5D8}
        .action-btn{display:flex;align-items:center;gap:12px;background:#FDFAF4;border:1.5px solid #E8E0D0;border-radius:12px;padding:14px;cursor:pointer;transition:all .15s;width:100%;text-align:left;font-family:'Source Sans 3',sans-serif}
        .action-btn:hover{background:#F0E8DC;border-color:#C8A87A}
        .goal-card{border:2px solid transparent;border-radius:12px;padding:11px 14px;cursor:pointer;transition:all .15s;background:#FDFAF4}
        .goal-card.on{border-color:#8B5E3C;background:#FFF8F0}
        .shimmer{background:linear-gradient(90deg,#EDE5D8 25%,#F5EFE6 50%,#EDE5D8 75%);background-size:200%;animation:sh 1.5s infinite}
        @keyframes sh{0%{background-position:200%}100%{background-position:-200%}}
        .chip{display:inline-block;padding:4px 10px;border-radius:16px;font-size:11px;font-weight:600;margin:3px;cursor:pointer;border:1.5px solid #DDD5C4;background:#FDFAF4;color:#5C4020;transition:all .15s}
        .chip.sel{background:#8B5E3C;color:#FDFAF4;border-color:#8B5E3C}
        .cook-pick{border:2px solid #E8E0D0;border-radius:12px;padding:12px 14px;cursor:pointer;transition:all .15s;background:#FDFAF4;text-align:left;width:100%;font-family:'Source Sans 3',sans-serif}
        .cook-pick.on{border-color:#8B5E3C;background:#FFF8F0}
        .shop-cat{margin-bottom:14px}
        .shop-cat-title{font-weight:700;font-size:13px;color:#5C3018;margin-bottom:6px;display:flex;align-items:center;gap:6px}
        .shop-item{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px dashed #EDE5D8;font-size:13px}
        .check-box{width:18px;height:18px;border-radius:5px;border:2px solid #C8B8A0;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}
        .check-box.checked{background:#8B5E3C;border-color:#8B5E3C}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {/* HEADER */}
      <div style={{background:"linear-gradient(150deg,#2C1A0E 0%,#5C3018 55%,#8B5E3C 100%)",color:"#F5E8D0",padding:"18px 16px 0"}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <p style={{fontSize:10,letterSpacing:".22em",textTransform:"uppercase",opacity:.6,marginBottom:2}}>Plano Alimentar</p>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700}}>Dieta Diaria</h1>
            {profile.nome&&<span style={{fontSize:12,opacity:.7}}>Ola, {profile.nome.split(" ")[0]}!</span>}
          </div>
          <div style={{margin:"12px 0 4px",background:"rgba(255,255,255,.15)",borderRadius:8,height:8,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:barColor,borderRadius:8,transition:"width .5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <span style={{fontSize:13,opacity:.85}}><strong style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>{totalCal}</strong> / <strong>{dailyGoal}</strong> kcal</span>
            <span style={{fontSize:12,opacity:.6}}>{pct}% · saldo {totalCal<=dailyGoal?"-":"+"}{Math.abs(dailyGoal-totalCal)} kcal</span>
          </div>
          <div style={{display:"flex",gap:1,overflowX:"auto"}}>
            {TABS.map(([tab,ico,lbl])=>(
              <button key={tab} onClick={()=>setActiveTab(tab)} style={{background:activeTab===tab?"#FDFAF4":"transparent",color:activeTab===tab?"#2C1A0E":"#F5E8D0",border:"none",padding:"8px 9px",borderRadius:"8px 8px 0 0",fontWeight:600,fontSize:10,cursor:"pointer",transition:"all .18s",opacity:activeTab===tab?1:.72,flexShrink:0}}>
                {ico} {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"0 14px 90px"}}>

        {/* ══ CARDAPIO ══ */}
        {activeTab==="cardapio"&&(
          <div className="sl" style={{paddingTop:14,display:"flex",flexDirection:"column",gap:10}}>
            {MEALS.map(meal=>{
              const items=menu.filter(i=>i.mealId===meal.id);const mcal=mealCals[meal.id];const open=expanded[meal.id];
              const mealCost=items.reduce((s,item)=>{
                const food=FOODS.find(f=>f.id===item.foodId);
                if(!food) return s;
                const p=getEffectivePrice(food,customPrices);
                return s+p*item.grams*(item.qty||1)/100;
              },0);
              return(
                <div key={meal.id} className="card" style={{overflow:"hidden"}}>
                  {/* Meal header */}
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}>
                    <span onClick={()=>setExpanded(p=>({...p,[meal.id]:!p[meal.id]}))} style={{fontSize:20,flexShrink:0,cursor:"pointer"}}>{meal.icon}</span>
                    <div onClick={()=>setExpanded(p=>({...p,[meal.id]:!p[meal.id]}))} style={{flex:1,cursor:"pointer"}}>
                      <span style={{fontWeight:700,fontSize:14}}>{meal.label}</span>
                      <br/><span style={{fontSize:11,color:"#8B7050"}}>{meal.time}</span>
                    </div>
                    <div onClick={()=>setExpanded(p=>({...p,[meal.id]:!p[meal.id]}))} style={{textAlign:"right",flexShrink:0,cursor:"pointer"}}>
                      {mcal>0?<><span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#5C3018"}}>{mcal}</span><br/><span style={{fontSize:10,color:"#8B7050"}}>kcal</span></>:<span style={{fontSize:16,color:"#C8B8A0"}}>-</span>}
                    </div>
                    {/* Pie chart + cost for main meals */}
                    {["cafe","almoco","jantar"].includes(meal.id) && items.length>0 && (
                      <div onClick={()=>setExpanded(p=>({...p,[meal.id]:!p[meal.id]}))} style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <MealPieChart items={items}/>
                        {mealCost>0&&<span style={{fontSize:10,fontWeight:700,color:"#286028",whiteSpace:"nowrap"}}>💰 {fmtPrice(mealCost)}</span>}
                      </div>
                    )}
                    {/* Quick add button */}
                    <button className="btn" onClick={e=>{e.stopPropagation();setTargetMeal(meal.id);setActiveTab("alimentos");}}
                      style={{background:"#8B5E3C",color:"#FFF",borderRadius:8,padding:"5px 10px",fontSize:16,fontWeight:700,flexShrink:0,lineHeight:1}}>+</button>
                    <span onClick={()=>setExpanded(p=>({...p,[meal.id]:!p[meal.id]}))} style={{fontSize:11,color:"#A89878",display:"inline-block",transform:open?"rotate(90deg)":"rotate(0)",transition:"transform .2s",cursor:"pointer"}}>▶</span>
                  </div>
                  {open&&(
                    <div style={{borderTop:"1px solid #EDE5D8",padding:"6px 10px 8px"}}>
                      {items.length===0?<p style={{fontSize:12,color:"#A89878",padding:"6px 4px",fontStyle:"italic"}}>Nenhum alimento. Toque em + para adicionar.</p>
                        :items.map(item=>{
                          const food = FOODS.find(f=>f.id===item.foodId);
                          const isEditing = editItemId === item.id;
                          const qty = item.qty||1;
                          return(
                          <div key={item.id}>
                            <div style={{display:"flex",alignItems:"center",gap:7,padding:"7px 4px",borderBottom: isEditing ? "none" : "1px dashed #EDE5D8"}}>
                              <div style={{width:30,height:30,borderRadius:8,background:item.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{GROUP_ICONS[item.group]||"🍴"}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</p>
                                <p style={{fontSize:11,color:"#8B7050"}}>{qty>1?`${qty}× `:""}{ item.measure}</p>
                              </div>
                              {/* Quantity stepper inline */}
                              <div style={{display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
                                <button className="btn" onClick={()=>changeQty(item.id,-1)} style={{background:"#EDE5D8",borderRadius:6,width:22,height:22,fontSize:14,fontWeight:700,color:"#5C3018",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>−</button>
                                <span style={{fontWeight:700,fontSize:13,color:"#5C3018",minWidth:14,textAlign:"center"}}>{qty}</span>
                                <button className="btn" onClick={()=>changeQty(item.id,+1)} style={{background:"#EDE5D8",borderRadius:6,width:22,height:22,fontSize:14,fontWeight:700,color:"#5C3018",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>+</button>
                              </div>
                              <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:"#5C3018",flexShrink:0,minWidth:54,textAlign:"right"}}>{item.cal} kcal</span>
                              <div style={{display:"flex",gap:3,flexShrink:0}}>
                                <button className="btn" onClick={()=>{setEditItemId(isEditing?null:item.id);setCustomGrams("");}} style={{background:isEditing?"#8B5E3C":"#EDE5D8",color:isEditing?"#FFF":"#5C3018",borderRadius:7,padding:"3px 7px",fontSize:11,fontWeight:600}}>✏️</button>
                                <button className="btn" onClick={()=>findSub(item)} style={{background:"#EDE5D8",borderRadius:7,padding:"3px 7px",fontSize:11,fontWeight:600,color:"#5C3018"}}>🔄</button>
                                <button className="btn" onClick={()=>{removeItem(item.id);if(isEditing)setEditItemId(null);}} style={{background:"#FDECEA",borderRadius:7,padding:"3px 7px",fontSize:12,color:"#C0392B",fontWeight:700}}>✕</button>
                              </div>
                            </div>
                            {isEditing && food && (
                              <div style={{background:"#F5EFE6",borderRadius:"0 0 10px 10px",padding:"10px 12px",marginBottom:4,borderBottom:"1px dashed #EDE5D8"}}>
                                <p style={{fontSize:11,fontWeight:700,color:"#8B7050",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Alterar porcao:</p>
                                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                                  {food.measures.map((m,i)=>(
                                    <button key={i} className="btn" onClick={()=>editItemPortion(item.id,food,m,item.cooked)}
                                      style={{background:item.measure===m.label||item.measure.startsWith(m.label.split(" ")[0])&&item.measure===m.label?"#8B5E3C":"#FDFAF4",color:item.measure===m.label?"#FFF":"#2A2420",border:`1.5px solid ${item.measure===m.label?"#8B5E3C":"#DDD5C4"}`,borderRadius:18,padding:"5px 11px",fontSize:12,fontWeight:600}}>
                                      {m.label} <span style={{opacity:.65}}>· {calcCal(food,m.g,item.cooked)*qty} kcal</span>
                                    </button>
                                  ))}
                                </div>
                                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                  <input className="inp" type="number" min="1" max="2000" placeholder="Gramas personalizado..." value={customGrams} onChange={e=>setCustomGrams(e.target.value)} style={{flex:1,padding:"7px 12px",fontSize:13}}/>
                                  <button className="btn" onClick={()=>editItemCustomGrams(item.id,food,customGrams,item.cooked)} style={{background:"#5C3018",color:"#FFF",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:700,flexShrink:0}}>OK</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );})}
                      {["cafe","almoco","jantar"].includes(meal.id) && items.length>0 && <MacroTotalsRow items={items}/>}
                    </div>
                  )}
                </div>
              );
            })}
            {menu.length>0&&(
              <div style={{background:"linear-gradient(135deg,#2C1A0E,#5C3018)",borderRadius:14,padding:"16px",color:"#F5E8D0"}}>
                <p style={{fontSize:10,letterSpacing:".18em",textTransform:"uppercase",opacity:.6,marginBottom:4}}>Resumo do Dia</p>
                <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:10}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700}}>{totalCal}</span>
                  <span style={{opacity:.7,fontSize:13}}>kcal · meta {dailyGoal} kcal</span>
                </div>
                {(()=>{
                  const totalCost=menu.reduce((s,item)=>{
                    const food=FOODS.find(f=>f.id===item.foodId);
                    if(!food) return s;
                    const p=getEffectivePrice(food,customPrices);
                    if(!p) return s;
                    return s+p*item.grams*(item.qty||1)/100;
                  },0);
                  return totalCost>0&&(
                    <div style={{background:"rgba(255,255,255,.1)",borderRadius:8,padding:"6px 12px",marginBottom:10,display:"inline-flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:14}}>💰</span>
                      <span style={{fontSize:13,fontWeight:700}}>Custo estimado do dia: R$ {totalCost.toFixed(2).replace(".",",")}</span>
                    </div>
                  );
                })()}
                <div style={{display:"flex",flexWrap:"wrap",gap:"7px 16px"}}>
                  {MEALS.map(m=>mealCals[m.id]>0&&(<div key={m.id}><p style={{fontSize:10,opacity:.6}}>{m.icon} {m.label}</p><p style={{fontSize:14,fontWeight:700}}>{mealCals[m.id]} kcal</p></div>))}
                </div>
              </div>
            )}
            {menu.length>0&&<NutrientAnalysis menu={menu} dailyGoal={dailyGoal} totalCal={totalCal} weight={+profile.weight||0} onGoToAlimentos={()=>setActiveTab("alimentos")}/>}
          </div>
        )}

        {/* ══ ALIMENTOS ══ */}
        {activeTab==="alimentos"&&(
          <div className="sl" style={{paddingTop:14}}>
            {/* Continue or go back banner */}
            {lastAdded&&(
              <div style={{background:"#F0FAF2",border:"1px solid #90C97E",borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>✅</span>
                <div style={{flex:1}}>
                  <p style={{fontWeight:700,fontSize:13,color:"#155724"}}>{lastAdded.foodName} adicionado!</p>
                  <p style={{fontSize:11,color:"#286028"}}>{lastAdded.mealLabel}</p>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button className="btn" onClick={()=>setLastAdded(null)} style={{background:"#D4EDDA",color:"#155724",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:700}}>+ Mais</button>
                  <button className="btn" onClick={()=>{setLastAdded(null);setActiveTab("cardapio");}} style={{background:"#5C3018",color:"#FFF",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:700}}>Ver cardapio</button>
                </div>
              </div>
            )}
            <div className="card" style={{padding:"12px 14px",marginBottom:12}}>
              <p style={{fontSize:11,fontWeight:700,color:"#8B7050",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Adicionar a refeicao:</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{MEALS.map(m=>(<button key={m.id} className={`pill ${targetMeal===m.id?"on":""}`} onClick={()=>setTargetMeal(m.id)}>{m.icon} {m.label}</button>))}</div>
              {MEALS.find(m=>m.id===targetMeal)?.cooked&&(<div style={{marginTop:10,background:"#FFF8EC",border:"1px solid #E8C07D",borderRadius:8,padding:"7px 12px",display:"flex",gap:8}}><span>ℹ️</span><p style={{fontSize:12,color:"#7A4A00"}}>Calorias calculadas com valores do alimento <strong>cozido</strong> para esta refeicao.</p></div>)}
            </div>
            <input className="inp" placeholder="Buscar alimento..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:10}}/>
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:8}}>
              {groups.map(g=>(<button key={g} className={`pill ${selGroup===g?"on":""}`} onClick={()=>setSelGroup(g)}>{g!=="Todos"?GROUP_ICONS[g]:"✦"} {g}</button>))}
            </div>
            {/* Custom food button */}
            <button className="btn" onClick={()=>setCustomFood({name:"",calPer100:"",grams:"",mealId:targetMeal})}
              style={{width:"100%",background:"linear-gradient(135deg,#2C1A0E,#5C3018)",color:"#F5E8D0",borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:12,textAlign:"left"}}>
              <span style={{fontSize:24}}>✏️</span>
              <div>
                <p style={{fontWeight:700,fontSize:14}}>Alimento personalizado</p>
                <p style={{fontSize:12,opacity:.75}}>Informe o nome, kcal/100g e peso para calcular exatamente</p>
              </div>
            </button>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtered.map(food=>{
                const isCook=MEALS.find(m=>m.id===targetMeal)?.cooked;const changed=food.rawCal!==food.cookedCal;
                return(
                  <div key={food.id} className="card" style={{padding:"13px 14px"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                      <div style={{width:38,height:38,borderRadius:9,background:food.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{GROUP_ICONS[food.group]||"🍴"}</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}>
                          <span style={{fontWeight:700,fontSize:14}}>{food.name}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <p style={{fontSize:12,color:"#8B7050"}}><strong style={{color:"#5C3018"}}>{isCook?food.cookedCal:food.rawCal} kcal</strong>/100g{isCook&&changed&&<span style={{color:"#A89878",fontSize:11}}> · cru: {food.rawCal} kcal</span>}</p>
                          {food.price>0&&<span style={{fontSize:11,color:"#286028",fontWeight:700,background:"#E8F5EC",padding:"1px 7px",borderRadius:10}}>💰 {fmtPrice(getEffectivePrice(food,customPrices))}/100g</span>}
                        </div>
                        {food.priceDesc&&<p style={{fontSize:9,color:"#A89878",marginTop:1}}>📍 {food.priceDesc.split("/").slice(1).join(" · ")}</p>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {food.measures.map((m,i)=>{
                        const p=calcPrice(food,m.g,customPrices);
                        return(<button key={i} className="btn" onClick={()=>setAddModal({food,measure:m})} style={{background:food.color+"2A",border:`1.5px solid ${food.color}88`,padding:"6px 11px",fontSize:12,borderRadius:20,fontWeight:600,color:"#2A2420"}}>
                          + {m.label}
                          <span style={{opacity:.65}}> · {calcCal(food,m.g,isCook)} kcal</span>
                          {p!==null&&<span style={{color:"#286028",fontWeight:700,opacity:.85}}> · {fmtPrice(p)}</span>}
                        </button>);
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ SUBSTITUICOES ══ */}
        {activeTab==="substituicoes"&&(
          <div className="sl" style={{paddingTop:14}}>
            {!subTarget?(
              <div style={{textAlign:"center",padding:"48px 20px"}}>
                <div style={{fontSize:48,marginBottom:14}}>🔄</div>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#8B7050",marginBottom:8}}>Substituicoes Equivalentes</p>
                <p style={{fontSize:14,color:"#A89878"}}>No <strong>Cardapio</strong>, toque em <strong>"Trocar"</strong> para ver opcoes com calorias equivalentes adequadas a cada refeicao.</p>
              </div>
            ):subTarget&&(
              <SubstituicoesContent
                subTarget={subTarget}
                subResults={subResults}
                subMode={subMode} setSubMode={setSubMode}
                subSearch={subSearch} setSubSearch={setSubSearch}
                applySub={applySub}
                calcCal={calcCal}
              />
            )}
          </div>
        )}

        {/* ══ GERAR IA ══ */}
        {activeTab==="gerar"&&(
          <div className="sl" style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
            {genStep==="form"&&(
              <>
                <div style={{background:"linear-gradient(135deg,#2C1A0E,#6B3A1F)",borderRadius:16,padding:"20px",color:"#F5E8D0"}}>
                  <div style={{fontSize:32,marginBottom:8}}>✨</div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,marginBottom:4}}>Gerar Cardapio com IA</p>
                  <p style={{fontSize:13,opacity:.8,lineHeight:1.5}}>Informe o que tem disponivel e a IA monta o dia completo respeitando sua meta de <strong>{dailyGoal} kcal</strong>.</p>
                </div>
                <div className="card" style={{padding:"16px"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:4}}>O que voce tem para almoco/jantar?</p>
                  <p style={{fontSize:12,color:"#8B7050",marginBottom:10}}>Escreva livremente ou use os chips abaixo.</p>
                  <textarea className="inp" rows={3} placeholder="Ex: frango, arroz integral, feijao, batata doce, brocolis, cenoura..." value={genIngredients} onChange={e=>setGenIngredients(e.target.value)} style={{resize:"vertical",lineHeight:1.5}}/>
                  <p style={{fontSize:11,color:"#8B7050",marginTop:10,marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em"}}>Adicionar rapido:</p>
                  <div style={{display:"flex",flexWrap:"wrap"}}>
                    {["Frango","Carne bovina","Ovo","Atum","Salmao","Arroz","Feijao","Batata doce","Macarrao","Brocolis","Cenoura","Abobrinha","Banana","Maca","Aveia","Castanha de caju"].map(chip=>{
                      const sel=genIngredients.toLowerCase().includes(chip.toLowerCase());
                      return(<span key={chip} className={`chip ${sel?"sel":""}`} onClick={()=>setGenIngredients(p=>sel?p:p?p+", "+chip:chip)}>{chip}</span>);
                    })}
                  </div>
                </div>
                <div className="card" style={{padding:"16px"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:4}}>Preferencias e restricoes</p>
                  <textarea className="inp" rows={2} placeholder="Ex: nao gosto de peixe, sem lactose..." value={genPrefs} onChange={e=>setGenPrefs(e.target.value)} style={{resize:"vertical",lineHeight:1.5}}/>
                </div>
                {genError&&<div style={{background:"#FDECEA",border:"1px solid #F4CCCC",borderRadius:10,padding:"10px 14px",color:"#C0392B",fontSize:13}}>⚠️ {genError}</div>}
                <button className="btn" onClick={generateMealPlan} disabled={genLoading} style={{background:genLoading?"#C8B8A0":"linear-gradient(135deg,#5C3018,#8B5E3C)",color:"#F5E8D0",borderRadius:14,padding:"16px",fontSize:15,fontWeight:700,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                  {genLoading?<><span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>⏳</span>Gerando...</>:"✨ Gerar Cardapio Completo"}
                </button>
                {genLoading&&<div style={{display:"flex",flexDirection:"column",gap:8}}>{MEALS.map(m=>(<div key={m.id} className="card" style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}><div className="shimmer" style={{width:40,height:40,borderRadius:10,flexShrink:0}}/><div style={{flex:1}}><div className="shimmer" style={{height:14,borderRadius:6,marginBottom:6,width:"60%"}}/><div className="shimmer" style={{height:11,borderRadius:6,width:"40%"}}/></div><div className="shimmer" style={{width:55,height:20,borderRadius:6}}/></div>))}</div>}
              </>
            )}
            {genStep==="preview"&&genResult&&(
              <>
                <div style={{background:"linear-gradient(135deg,#2C1A0E,#6B3A1F)",borderRadius:16,padding:"16px 18px",color:"#F5E8D0"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:2}}>Cardapio pronto! 🎉</p>
                  <p style={{fontSize:13,opacity:.8}}>Total: <strong>{genResult.hydratedMeals.flatMap(m=>m.items).reduce((s,it)=>s+it.cal,0)} kcal</strong> · Meta: <strong>{dailyGoal} kcal</strong></p>
                </div>
                {genResult.notes&&<div style={{background:"#FFF8EC",border:"1px solid #E8C07D",borderRadius:12,padding:"12px 14px",display:"flex",gap:10}}><span>💡</span><p style={{fontSize:13,color:"#7A4A00",lineHeight:1.5}}>{genResult.notes}</p></div>}
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {genResult.hydratedMeals.map(meal=>{
                    const mDef=MEALS.find(m=>m.id===meal.mealId);if(!meal.items.length)return null;const mCal=meal.items.reduce((s,it)=>s+it.cal,0);
                    return(<div key={meal.mealId} className="card" style={{overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"#F5EFE6",fontWeight:700,fontSize:13}}>
                        <span style={{fontSize:18}}>{mDef?.icon}</span><span style={{flex:1}}>{mDef?.label}</span>
                        <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:"#5C3018"}}>{mCal} kcal</span>
                      </div>
                      <div style={{padding:"6px 10px 8px"}}>
                        {meal.items.map((it,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 4px",borderBottom:"1px dashed #EDE5D8"}}>
                          <div style={{width:30,height:30,borderRadius:7,background:it.food.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{GROUP_ICONS[it.food.group]||"🍴"}</div>
                          <div style={{flex:1}}><p style={{fontWeight:600,fontSize:13}}>{it.food.name}</p><p style={{fontSize:11,color:"#8B7050"}}>{it.measure.label}</p></div>
                          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:"#5C3018"}}>{it.cal} kcal</span>
                        </div>))}
                      </div>
                    </div>);
                  })}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <button className="btn" onClick={()=>applyGeneratedMenu(true)} style={{background:"linear-gradient(135deg,#5C3018,#8B5E3C)",color:"#F5E8D0",borderRadius:12,padding:"14px",fontSize:14,fontWeight:700,width:"100%"}}>Usar este cardapio (substituir dia)</button>
                  <button className="btn" onClick={()=>applyGeneratedMenu(false)} style={{background:"#EDE5D8",color:"#5C3018",borderRadius:12,padding:"14px",fontSize:14,fontWeight:700,width:"100%"}}>Adicionar ao cardapio atual</button>
                  <button className="btn" onClick={()=>{setGenStep("form");setGenResult(null);}} style={{background:"transparent",color:"#8B7050",borderRadius:12,padding:"10px",fontSize:13,fontWeight:600,width:"100%"}}>Gerar novamente</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ SUGESTAO ══ */}
        {activeTab==="sugestao"&&(
          <div className="sl" style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
            {sugStep==="form"&&(
              <>
                <div style={{background:"linear-gradient(135deg,#1A3020,#2E6040)",borderRadius:16,padding:"20px",color:"#E8F5ED"}}>
                  <div style={{fontSize:32,marginBottom:8}}>🛒</div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,marginBottom:4}}>Sugestao + Lista de Compras</p>
                  <p style={{fontSize:13,opacity:.85,lineHeight:1.5}}>A IA sugere o menu do dia e gera a lista de compras organizada por setor do mercado.</p>
                </div>

                {/* Qual refeicao vai cozinhar */}
                <div className="card" style={{padding:"16px"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:4}}>O que voce vai cozinhar hoje?</p>
                  <p style={{fontSize:12,color:"#8B7050",marginBottom:12}}>A IA adapta o menu e as dicas de preparo conforme sua resposta.</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {[
                      ["almoco","🍽️","So o almoco","Janta simples / sem cozinhar"],
                      ["jantar","🌙","So o jantar","Almoco sera fora / simples"],
                      ["ambos","🍽️🌙","Almoco e jantar","Cozinhar as duas refeicoes quentes"],
                      ["nenhum","🥗","Nenhum","Apenas lanchinhos e refeicoes frias"],
                    ].map(([val,ico,lbl,desc])=>(
                      <button key={val} className={`cook-pick ${sugCookMeal===val?"on":""}`} onClick={()=>setSugCookMeal(val)}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:22}}>{ico}</span>
                          <div><p style={{fontWeight:700,fontSize:14}}>{lbl}</p><p style={{fontSize:12,color:"#8B7050"}}>{desc}</p></div>
                          {sugCookMeal===val&&<span style={{marginLeft:"auto",color:"#8B5E3C",fontSize:18}}>✓</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card" style={{padding:"16px"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:4}}>Quantas pessoas?</p>
                  <div className="seg">
                    {["1","2","3","4+"].map(n=>(<button key={n} className={`seg-btn ${sugPeople===n?"on":""}`} onClick={()=>setSugPeople(n)}>{n} {n==="1"?"pessoa":"pessoas"}</button>))}
                  </div>
                </div>

                <div className="card" style={{padding:"16px"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:4}}>Ja tenho em casa:</p>
                  <p style={{fontSize:12,color:"#8B7050",marginBottom:10}}>Opcional. Serao descontados da lista de compras.</p>
                  <textarea className="inp" rows={2} placeholder="Ex: arroz, feijao, azeite, ovos..." value={sugIngred} onChange={e=>setSugIngred(e.target.value)} style={{resize:"vertical",lineHeight:1.5}}/>
                </div>

                <div className="card" style={{padding:"16px"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:4}}>Preferencias / restricoes</p>
                  <textarea className="inp" rows={2} placeholder="Ex: sem gluten, nao gosto de peixe, quero opcoes baratas..." value={sugPrefs} onChange={e=>setSugPrefs(e.target.value)} style={{resize:"vertical",lineHeight:1.5}}/>
                </div>

                {sugError&&<div style={{background:"#FDECEA",border:"1px solid #F4CCCC",borderRadius:10,padding:"10px 14px",color:"#C0392B",fontSize:13}}>⚠️ {sugError}</div>}

                <button className="btn" onClick={generateSuggestion} disabled={sugLoading}
                  style={{background:sugLoading?"#C8B8A0":"linear-gradient(135deg,#1A3020,#2E6040)",color:"#E8F5ED",borderRadius:14,padding:"16px",fontSize:15,fontWeight:700,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                  {sugLoading?<><span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>⏳</span>Gerando sugestao...</>:"🛒 Gerar Menu + Lista de Compras"}
                </button>

                {sugLoading&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[1,2,3].map(i=>(<div key={i} className="card" style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}><div className="shimmer" style={{width:40,height:40,borderRadius:10,flexShrink:0}}/><div style={{flex:1}}><div className="shimmer" style={{height:14,borderRadius:6,marginBottom:6,width:"70%"}}/><div className="shimmer" style={{height:11,borderRadius:6,width:"50%"}}/></div></div>))}
                </div>}
              </>
            )}

            {sugStep==="result"&&sugResult&&(
              <>
                {/* Header resultado */}
                <div style={{background:"linear-gradient(135deg,#1A3020,#2E6040)",borderRadius:16,padding:"16px 18px",color:"#E8F5ED"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:2}}>Pronto! 🛒🎉</p>
                  <p style={{fontSize:13,opacity:.85}}>Menu criado · {sugResult.totalCalEstimado} kcal estimado · meta {dailyGoal} kcal</p>
                </div>

                {sugResult.notes&&<div style={{background:"#F0FAF2",border:"1px solid #90C97E",borderRadius:12,padding:"12px 14px",display:"flex",gap:10}}><span>💡</span><p style={{fontSize:13,color:"#286028",lineHeight:1.5}}>{sugResult.notes}</p></div>}

                {/* Menu sugerido */}
                <div className="card" style={{padding:"16px"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,marginBottom:12}}>🍽️ Menu do Dia</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {sugResult.hydratedMenu.map(meal=>{
                      const mDef=MEALS.find(m=>m.id===meal.mealId);if(!meal.items.length)return null;
                      const mCal=meal.items.reduce((s,it)=>s+it.cal,0);
                      const tips=sugResult.cookingTips.find(t=>t.mealId===meal.mealId);
                      return(
                        <div key={meal.mealId} style={{borderRadius:10,border:"1px solid #E8E0D0",overflow:"hidden",marginBottom:2}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"#F5EFE6",fontWeight:700,fontSize:13}}>
                            <span style={{fontSize:17}}>{mDef?.icon}</span><span style={{flex:1}}>{mDef?.label}</span>
                            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:"#5C3018"}}>{mCal} kcal</span>
                          </div>
                          <div style={{padding:"6px 12px 8px"}}>
                            {meal.items.map((it,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<meal.items.length-1?"1px dashed #EDE5D8":"none"}}>
                              <span style={{fontSize:14}}>{GROUP_ICONS[it.food.group]||"🍴"}</span>
                              <div style={{flex:1}}><p style={{fontWeight:600,fontSize:13}}>{it.food.name}</p><p style={{fontSize:11,color:"#8B7050"}}>{it.measure.label}</p></div>
                              <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:"#5C3018"}}>{it.cal} kcal</span>
                            </div>))}
                            {tips&&tips.tips.length>0&&(
                              <div style={{marginTop:8,background:"#FFF8EC",borderRadius:8,padding:"8px 10px"}}>
                                <p style={{fontSize:11,fontWeight:700,color:"#8B5000",marginBottom:4,textTransform:"uppercase",letterSpacing:".06em"}}>👨‍🍳 Preparo:</p>
                                {tips.tips.map((tip,i)=>(<p key={i} style={{fontSize:12,color:"#7A4A00",lineHeight:1.5,marginBottom:i<tips.tips.length-1?4:0}}>· {tip}</p>))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:14}}>
                    <button className="btn" onClick={()=>applySuggestedMenu(true)} style={{flex:1,background:"linear-gradient(135deg,#1A3020,#2E6040)",color:"#E8F5ED",borderRadius:10,padding:"11px",fontSize:13,fontWeight:700}}>Aplicar no cardapio</button>
                    <button className="btn" onClick={()=>applySuggestedMenu(false)} style={{flex:1,background:"#EDE5D8",color:"#5C3018",borderRadius:10,padding:"11px",fontSize:13,fontWeight:700}}>Adicionar ao existente</button>
                  </div>
                </div>

                {/* Lista de compras */}
                <div className="card" style={{padding:"16px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700}}>🛒 Lista de Compras</p>
                    <button className="btn" onClick={copyShoppingList}
                      style={{background:sugCopied?"#D4EDDA":"#EDE5D8",color:sugCopied?"#155724":"#5C3018",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                      {sugCopied?"✓ Copiado!":"📋 Copiar"}
                    </button>
                  </div>
                  <p style={{fontSize:12,color:"#8B7050",marginBottom:14}}>Para {sugPeople} pessoa(s) · itens que voce ja tem foram removidos.</p>
                  {sugResult.shoppingList.map((cat,ci)=>(
                    <ShoppingCategory key={ci} category={cat}/>
                  ))}
                </div>

                <button className="btn" onClick={()=>{setSugStep("form");setSugResult(null);}}
                  style={{background:"transparent",color:"#8B7050",borderRadius:12,padding:"10px",fontSize:13,fontWeight:600,width:"100%",border:"1.5px solid #E8E0D0"}}>
                  ← Gerar nova sugestao
                </button>
              </>
            )}
          </div>
        )}

        {/* ══ SEMANA ══ */}
        {activeTab==="semana"&&<SemanaTab/>}

        {/* ══ PRECOS ══ */}
        {activeTab==="precos"&&<PrecosTab customPrices={customPrices} setCustomPrices={setCustomPrices}/>}

        {/* ══ RECEITAS ══ */}
        {activeTab==="receitas"&&<ReceitasTab setActiveTab={setActiveTab} setTargetMeal={setTargetMeal} addItem={addItem} MEALS_REF={MEALS}/>}

        {/* ══ RELATORIO ══ */}
        {activeTab==="relatorio"&&(
          <RelatórioTab
            menu={menu} history={history} dailyGoal={dailyGoal}
            profile={profile} weight={+profile.weight||0}
            saveDay={saveDay} todayKey={todayKey}
          />
        )}

        {/* ══ TMB ══ */}
        {activeTab==="tmb"&&(
          <div className="sl" style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
            <div className="card" style={{padding:"16px"}}>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,marginBottom:4}}>Dados Pessoais</p>
              <p style={{fontSize:12,color:"#8B7050",marginBottom:12}}>Formula de Mifflin-St Jeor</p>
              <label className="lbl" style={{marginTop:0}}>Nome</label>
              <input className="inp" placeholder="Seu nome" value={profile.nome} onChange={e=>updateProfile("nome",e.target.value)}/>
              <label className="lbl">Sexo biologico</label>
              <div className="seg"><button className={`seg-btn ${profile.sex==="M"?"on":""}`} onClick={()=>updateProfile("sex","M")}>Masculino</button><button className={`seg-btn ${profile.sex==="F"?"on":""}`} onClick={()=>updateProfile("sex","F")}>Feminino</button></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <div><label className="lbl">Idade</label><input className="inp" type="number" min="10" max="110" placeholder="anos" value={profile.age} onChange={e=>updateProfile("age",e.target.value)}/></div>
                <div><label className="lbl">Peso (kg)</label><input className="inp" type="number" min="30" max="300" placeholder="kg" value={profile.weight} onChange={e=>updateProfile("weight",e.target.value)}/></div>
                <div><label className="lbl">Altura (cm)</label><input className="inp" type="number" min="100" max="250" placeholder="cm" value={profile.height} onChange={e=>updateProfile("height",e.target.value)}/></div>
              </div>
              <label className="lbl">Nivel de atividade</label>
              <select className="sel" value={profile.activity} onChange={e=>updateProfile("activity",e.target.value)}>
                {ACTIVITY_LEVELS.map(a=><option key={a.id} value={a.id}>{a.label} - {a.desc}</option>)}
              </select>
            </div>
            {bmr&&(
              <div className="card" style={{padding:"16px"}}>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,marginBottom:12}}>Seu Metabolismo</p>
                <div className="stat-row"><span style={{fontSize:13,color:"#5C4020"}}>🔥 TMB (repouso total)</span><span><span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700}}>{bmr}</span><span style={{fontSize:11,color:"#8B7050",marginLeft:3}}>kcal/dia</span></span></div>
                <div className="stat-row"><span style={{fontSize:13,color:"#5C4020"}}>⚡ TDEE (com atividade)</span><span><span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700}}>{tdee}</span><span style={{fontSize:11,color:"#8B7050",marginLeft:3}}>kcal/dia</span></span></div>
                <div className="stat-row" style={{borderBottom:"none"}}><span style={{fontSize:13,color:"#5C4020"}}>🎯 Meta atual</span><span><span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"#8B5E3C"}}>{dailyGoal}</span><span style={{fontSize:11,color:"#8B7050",marginLeft:3}}>kcal/dia</span></span></div>
              </div>
            )}
            {bmr&&(
              <div className="card" style={{padding:"16px"}}>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,marginBottom:12}}>Objetivo Calorico</p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {GOAL_OPTIONS.map(g=>{const val=tdee?Math.max(1200,tdee+g.delta):null;return(
                    <div key={g.id} className={`goal-card ${profile.goal===g.id?"on":""}`} onClick={()=>{updateProfile("goal",g.id);setDailyGoalManual(null);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div><p style={{fontWeight:700,fontSize:14}}>{g.label}</p><p style={{fontSize:12,color:"#8B7050"}}>{g.desc}</p></div>
                      {val&&<span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color:"#5C3018",flexShrink:0}}>{val} kcal</span>}
                    </div>
                  );})}
                </div>
                <label className="lbl">Ou meta manual (kcal)</label>
                <input className="inp" type="number" min="800" max="5000" placeholder={`Ex: ${derivedGoal}`} value={dailyGoalManual??""} onChange={e=>setDailyGoalManual(e.target.value?+e.target.value:null)}/>
              </div>
            )}
            {!bmr&&<div style={{textAlign:"center",padding:"32px 20px"}}><div style={{fontSize:48,marginBottom:12}}>🧮</div><p style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#8B7050",marginBottom:6}}>Preencha seus dados acima</p><p style={{fontSize:13,color:"#A89878"}}>Calcularemos sua TMB, TDEE e meta ideal.</p></div>}
          </div>
        )}

        {/* ══ DADOS ══ */}
        {activeTab==="dados"&&(
          <div className="sl" style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
            <div className="card" style={{padding:"16px"}}>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,marginBottom:4}}>Exportar Cardapio</p>
              <p style={{fontSize:13,color:"#8B7050",marginBottom:10}}>Salve o dia atual no historico para ver nos relatorios semanais.</p>
              <button className="btn action-btn" onClick={saveDay} style={{marginBottom:10}}>
                <span style={{fontSize:28}}>📅</span>
                <div><p style={{fontWeight:700,fontSize:14}}>Salvar dia no histórico</p><p style={{fontSize:12,color:"#8B7050"}}>{totalCal} kcal · {menu.length} itens</p></div>
              </button>
              <p style={{fontSize:13,color:"#8B7050",marginBottom:14}}>Gera um PDF com todas as refeicoes e total calorico.</p>
              <button className="btn action-btn" onClick={()=>{if(menu.length===0){showToast("Adicione alimentos primeiro","err");return;}exportPDF(menu,totalCal,dailyGoal,profile);}}>
                <span style={{fontSize:28}}>📄</span>
                <div><p style={{fontWeight:700,fontSize:14}}>Exportar como PDF</p><p style={{fontSize:12,color:"#8B7050"}}>{menu.length} itens · {totalCal} kcal</p></div>
              </button>
            </div>
            <div className="card" style={{padding:"16px"}}>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,marginBottom:4}}>Backup</p>
              <p style={{fontSize:13,color:"#8B7050",marginBottom:14}}>Salve e restaure cardapio, perfil e metas.</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button className="btn action-btn" onClick={()=>exportJSON(menu,profile,dailyGoal,customPrices)}><span style={{fontSize:28}}>💾</span><div><p style={{fontWeight:700,fontSize:14}}>Exportar backup (.json)</p><p style={{fontSize:12,color:"#8B7050"}}>{menu.length} itens</p></div></button>
                <button className="btn action-btn" onClick={()=>fileRef.current.click()}><span style={{fontSize:28}}>📂</span><div><p style={{fontWeight:700,fontSize:14}}>Importar backup (.json)</p><p style={{fontSize:12,color:"#8B7050"}}>Restaura cardapio e perfil</p></div></button>
                <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={handleImport}/>
              </div>
            </div>
            <div className="card" style={{padding:"16px"}}>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,marginBottom:4}}>Reiniciar Dia</p>
              <button className="btn action-btn" onClick={()=>{if(menu.length===0){showToast("Cardapio ja esta vazio","err");return;}setMenu([]);showToast("Cardapio limpo!");}} style={{borderColor:"#F4CCCC"}}>
                <span style={{fontSize:28}}>🗑️</span><div><p style={{fontWeight:700,fontSize:14,color:"#C0392B"}}>Limpar cardapio</p><p style={{fontSize:12,color:"#8B7050"}}>Acao irreversivel</p></div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL refeicao */}
      {addModal&&(
        <div className="overlay" onClick={()=>setAddModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,marginBottom:2}}>{addModal.food.name}</p>
            <p style={{fontSize:13,color:"#8B7050",marginBottom:16}}>{addModal.measure.label}</p>
            <p style={{fontSize:11,fontWeight:700,color:"#8B7050",letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>Adicionar a qual refeicao?</p>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {MEALS.map(m=>{const c=calcCal(addModal.food,addModal.measure.g,m.cooked);return(
                <button key={m.id} className="btn" onClick={()=>addItem(addModal.food,addModal.measure,m.id)}
                  style={{display:"flex",alignItems:"center",gap:12,background:"#F2EDE4",borderRadius:12,padding:"11px 14px",textAlign:"left"}}>
                  <span style={{fontSize:20}}>{m.icon}</span>
                  <div style={{flex:1}}><p style={{fontWeight:700,fontSize:14}}>{m.label}</p><div style={{display:"flex",alignItems:"center",gap:6,marginTop:1}}><span style={{fontSize:11,color:"#8B7050"}}>{m.time}</span></div></div>
                  <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:"#5C3018"}}>{c} kcal</span>
                </button>
              );})}
            </div>
            <button className="btn" onClick={()=>setAddModal(null)} style={{marginTop:12,width:"100%",background:"#EDE5D8",borderRadius:10,padding:"11px",fontSize:14,fontWeight:600,color:"#5C4020"}}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL complemento de pao */}
      {breadToast&&(
        <div className="overlay" onClick={()=>setBreadToast(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:32,marginBottom:8}}>🍞</div>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,marginBottom:4}}>Adicionar complemento?</p>
            <p style={{fontSize:13,color:"#8B7050",marginBottom:16}}>O pao fica melhor acompanhado! Escolha o que vai passar:</p>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[
                FOODS.find(f=>f.id===80), // Requeijao normal
                FOODS.find(f=>f.id===60), // Requeijao light
                FOODS.find(f=>f.id===74), // Manteiga
                FOODS.find(f=>f.id===59), // Queijo mussarela
                FOODS.find(f=>f.id===77), // Peito de peru
                FOODS.find(f=>f.id===78), // Presunto magro
              ].filter(Boolean).map(food=>{
                const m = food.measures[0];
                return(
                  <button key={food.id} className="btn" onClick={()=>{
                    addItem(food,m,breadToast);
                    setBreadToast(null);
                  }} style={{display:"flex",alignItems:"center",gap:12,background:"#F5EFE6",borderRadius:12,padding:"11px 14px",textAlign:"left",border:"1px solid #E8E0D0"}}>
                    <span style={{fontSize:20}}>{GROUP_ICONS[food.group]||"🍴"}</span>
                    <div style={{flex:1}}>
                      <p style={{fontWeight:700,fontSize:14}}>{food.name}</p>
                      <p style={{fontSize:11,color:"#8B7050"}}>{m.label}</p>
                    </div>
                    <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:"#5C3018"}}>{calcCal(food,m.g,false)} kcal</span>
                  </button>
                );
              })}
            </div>
            <button className="btn" onClick={()=>setBreadToast(null)} style={{marginTop:12,width:"100%",background:"#EDE5D8",borderRadius:10,padding:"11px",fontSize:14,fontWeight:600,color:"#5C4020"}}>Sem complemento</button>
          </div>
        </div>
      )}

      {/* MODAL alimento personalizado */}
      {customFood&&(
        <div className="overlay" onClick={()=>setCustomFood(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <span style={{fontSize:28}}>✏️</span>
              <div>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700}}>Alimento Personalizado</p>
                <p style={{fontSize:12,color:"#8B7050"}}>Valores baseados no rotulo ou referencia (FatSecret, TACO, etc.)</p>
              </div>
            </div>

            <label className="lbl" style={{marginTop:0}}>Nome do alimento</label>
            <input className="inp" placeholder="Ex: Bolo de cenoura caseiro" value={customFood.name}
              onChange={e=>setCustomFood(p=>({...p,name:e.target.value}))}/>

            <label className="lbl">Calorias por 100g (kcal)</label>
            <input className="inp" type="number" min="1" max="9000" placeholder="Ex: 320"
              value={customFood.calPer100}
              onChange={e=>setCustomFood(p=>({...p,calPer100:e.target.value}))}/>

            <label className="lbl">Peso da porcao (gramas)</label>
            <input className="inp" type="number" min="1" max="5000" placeholder="Ex: 150"
              value={customFood.grams}
              onChange={e=>setCustomFood(p=>({...p,grams:e.target.value}))}/>

            {/* Live calc preview */}
            {customFood.calPer100>0 && customFood.grams>0 && (
              <div style={{background:"#F5EFE6",borderRadius:10,padding:"10px 14px",margin:"12px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,color:"#8B7050"}}>Total estimado:</span>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#5C3018"}}>
                  {Math.round(parseFloat(customFood.calPer100)*parseInt(customFood.grams)/100)} kcal
                </span>
              </div>
            )}

            <label className="lbl">Adicionar a qual refeicao</label>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
              {MEALS.map(m=>(
                <button key={m.id} className="btn" onClick={()=>setCustomFood(p=>({...p,mealId:m.id}))}
                  style={{display:"flex",alignItems:"center",gap:10,background:customFood.mealId===m.id?"#FFF8F0":"#F2EDE4",borderRadius:10,padding:"9px 14px",border:`1.5px solid ${customFood.mealId===m.id?"#8B5E3C":"transparent"}`}}>
                  <span style={{fontSize:18}}>{m.icon}</span>
                  <span style={{fontWeight:700,fontSize:13}}>{m.label}</span>
                  {customFood.mealId===m.id&&<span style={{marginLeft:"auto",color:"#8B5E3C",fontSize:16}}>✓</span>}
                </button>
              ))}
            </div>

            <button className="btn" onClick={()=>addCustomFood(customFood)}
              style={{width:"100%",background:"linear-gradient(135deg,#5C3018,#8B5E3C)",color:"#F5E8D0",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700}}>
              Adicionar ao Cardapio
            </button>
            <button className="btn" onClick={()=>setCustomFood(null)}
              style={{width:"100%",background:"#EDE5D8",borderRadius:12,padding:"11px",fontSize:13,fontWeight:600,color:"#5C4020",marginTop:8}}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {toast&&<div className="toast" style={{background:toast.type==="err"?"#C0392B":"#2C1A0E",color:"#F5E8D0"}}>{toast.type==="err"?"⚠️ ":"✓ "}{toast.msg}</div>}
    </div>
  );
}

// ── RelatórioTab ─────────────────────────────────────────────────────────────
function calcNutrientsForMenu(menuItems) {
  let cal=0,p=0,c=0,f=0,fi=0,su=0,na=0,k=0,ch=0;
  menuItems.forEach(item => {
    if(item.isCustom){ cal+=item.cal; return; }
    const food = FOODS.find(fd=>fd.id===item.foodId);
    if(!food) { cal+=item.cal; return; }
    const g = item.grams*(item.qty||1);
    const m = food.macro||{};
    cal += item.cal*(item.qty||1);
    p   += (m.p||0)*g/100;
    c   += (m.c||0)*g/100;
    f   += (m.f||0)*g/100;
    fi  += (m.fi||0)*g/100;
    su  += (m.su||0)*g/100;
    na  += (m.na||0)*g/100;
    k   += (m.k||0)*g/100;
    ch  += (m.ch||0)*g/100;
  });
  return {cal:Math.round(cal),p:Math.round(p),c:Math.round(c),f:Math.round(f),fi:Math.round(fi),su:Math.round(su),na:Math.round(na),k:Math.round(k),ch:Math.round(ch)};
}

function RelatórioTab({ menu, history, dailyGoal, profile, weight, saveDay, todayKey }) {
  const [subTab, setSubTab] = useState("calorias");

  // Build 7-day window ending today
  const today = new Date();
  const days = Array.from({length:7},(_,i)=>{
    const d = new Date(today); d.setDate(today.getDate()-6+i);
    return d.toISOString().split("T")[0];
  });
  const dayLabels = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];
  const getDayLabel = (iso) => {
    const d = new Date(iso+"T12:00:00"); return dayLabels[d.getDay()];
  };

  // Current day data (unsaved)
  const todayIso = todayKey();
  const getMenuForDay = (iso) => iso===todayIso ? menu : (history[iso]?.menu||[]);
  const dayData = days.map(iso => ({
    iso, label:getDayLabel(iso), ...calcNutrientsForMenu(getMenuForDay(iso)),
    isToday: iso===todayIso
  }));

  // Goals
  const proteinGoal = weight>0 ? weight*2 : 50;
  const goals = {
    cal: dailyGoal, p: proteinGoal, c: Math.round(dailyGoal*0.5/4),
    f: Math.round(dailyGoal*0.3/9), fi:25, su:25, na:2300, k:3500, ch:300
  };

  // Today totals
  const todayNut = dayData.find(d=>d.isToday)||{cal:0,p:0,c:0,f:0,fi:0,su:0,na:0,k:0,ch:0};

  // Bar chart helper
  const maxVal = (key) => Math.max(...dayData.map(d=>d[key]||0), goals[key]*0.1, 1);

  function BarChart({ dataKey, color, goalKey }) {
    const mv = maxVal(dataKey);
    const gv = goals[goalKey||dataKey];
    return (
      <div style={{display:"flex",alignItems:"flex-end",gap:4,height:120,padding:"8px 0 4px",position:"relative"}}>
        {/* Goal line */}
        {gv && (
          <div style={{position:"absolute",left:0,right:0,bottom:4+Math.min(gv/mv,1)*112,height:1,background:"#E8A030",borderTop:"2px dashed #E8A030",zIndex:1,pointerEvents:"none"}}/>
        )}
        {dayData.map((d,i)=>{
          const val = d[dataKey]||0;
          const h = Math.max(2, (val/mv)*112);
          const pctGoal = gv ? Math.round(val/gv*100) : null;
          const isOver = pctGoal && pctGoal>105;
          const barColor = d.isToday ? color : color+"99";
          return (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              {val>0&&<span style={{fontSize:8,color:"#8B7050",fontWeight:700,lineHeight:1}}>{pctGoal}%</span>}
              <div style={{width:"100%",height:h,background:isOver?"#D04040":barColor,borderRadius:"4px 4px 0 0",minHeight:val>0?2:0,transition:"height .4s ease"}}/>
              <span style={{fontSize:9,color:d.isToday?"#5C3018":"#A89878",fontWeight:d.isToday?700:400}}>{d.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  function StatRow({ label, val, unit, goalVal, color }) {
    const pct = goalVal>0 ? Math.min(999,Math.round(val/goalVal*100)) : null;
    const ok = pct!==null&&pct>=85&&pct<=115;
    const over = pct!==null&&pct>115;
    return (
      <div style={{display:"flex",alignItems:"center",padding:"9px 0",borderBottom:"1px dashed #EDE5D8",gap:8}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>
        <span style={{flex:1,fontSize:13,color:"#2A2420",fontWeight:500}}>{label}</span>
        <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#2C1A0E"}}>{val}</span>
        <span style={{fontSize:11,color:"#8B7050",width:28}}>{unit}</span>
        {pct!==null&&(
          <span style={{background:ok?"#D4EDDA":over?"#FDECEA":"#FFF3CD",color:ok?"#155724":over?"#C0392B":"#856404",padding:"2px 7px",borderRadius:10,fontSize:11,fontWeight:700,minWidth:40,textAlign:"center"}}>
            {pct}%
          </span>
        )}
        <span style={{fontSize:10,color:"#A89878",width:50,textAlign:"right"}}>{goalVal?`/${goalVal}${unit}`:""}</span>
      </div>
    );
  }

  return (
    <div className="sl" style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
      {/* Save day banner if unsaved */}
      {!history[todayIso]&&menu.length>0&&(
        <div style={{background:"#FFF8EC",border:"1px solid #E8C07D",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>💡</span>
          <p style={{flex:1,fontSize:12,color:"#7A4A00"}}>Salve o dia atual para aparecer no historico semanal.</p>
          <button className="btn" onClick={saveDay} style={{background:"#8B5E3C",color:"#FFF",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,flexShrink:0}}>Salvar</button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="seg">
        {[["calorias","📈 Calorias"],["macros","🥗 Macros"],["nutrientes","🔬 Nutrientes"]].map(([t,l])=>(
          <button key={t} className={`seg-btn ${subTab===t?"on":""}`} onClick={()=>setSubTab(t)}>{l}</button>
        ))}
      </div>

      {/* ── CALORIAS ── */}
      {subTab==="calorias"&&(
        <>
          <div className="card" style={{padding:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700}}>Calorias — 7 dias</p>
              <span style={{fontSize:11,color:"#8B7050"}}>Meta: {dailyGoal} kcal</span>
            </div>
            <p style={{fontSize:12,color:"#8B7050",marginBottom:4}}>Hoje: <strong style={{color:"#5C3018",fontSize:16}}>{todayNut.cal}</strong> kcal · {Math.round(todayNut.cal/dailyGoal*100)}% da meta</p>
            <BarChart dataKey="cal" color="#E8A07D" goalKey="cal"/>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
              <div style={{width:24,height:2,background:"#E8A030",borderTop:"2px dashed #E8A030"}}/>
              <span style={{fontSize:10,color:"#8B7050"}}>linha de meta</span>
              <div style={{width:12,height:12,background:"#E8A07D",borderRadius:2,marginLeft:8}}/>
              <span style={{fontSize:10,color:"#8B7050"}}>dias salvos</span>
            </div>
          </div>
          {/* Weekly averages */}
          <div className="card" style={{padding:"16px"}}>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:10}}>Media da Semana</p>
            {(()=>{
              const withData=dayData.filter(d=>d.cal>0);
              if(!withData.length) return <p style={{fontSize:13,color:"#A89878",fontStyle:"italic"}}>Salve ao menos um dia para ver a media.</p>;
              const avg=Math.round(withData.reduce((s,d)=>s+d.cal,0)/withData.length);
              const pct=Math.round(avg/dailyGoal*100);
              return(
                <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:"#5C3018"}}>{avg}</span>
                  <span style={{fontSize:13,color:"#8B7050"}}>kcal/dia</span>
                  <span style={{background:pct>=85&&pct<=115?"#D4EDDA":"#FFF3CD",color:pct>=85&&pct<=115?"#155724":"#856404",padding:"2px 10px",borderRadius:10,fontSize:12,fontWeight:700}}>{pct}% da meta</span>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* ── MACROS ── */}
      {subTab==="macros"&&(
        <>
          {[
            {key:"p",label:"Proteína",color:"#C97B5A",unit:"g",goal:goals.p},
            {key:"c",label:"Carboidrato",color:"#C8A840",unit:"g",goal:goals.c},
            {key:"f",label:"Gordura",color:"#4A8050",unit:"g",goal:goals.f},
          ].map(({key,label,color,unit,goal})=>(
            <div key={key} className="card" style={{padding:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:2}}>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}}>{label}</p>
                <span style={{fontSize:11,color:"#8B7050"}}>Meta: {goal}{unit}/dia</span>
              </div>
              <p style={{fontSize:12,color:"#8B7050",marginBottom:4}}>Hoje: <strong style={{color:"#5C3018"}}>{todayNut[key]}{unit}</strong> · {Math.round(todayNut[key]/goal*100)}%</p>
              <BarChart dataKey={key} color={color} goalKey={key}/>
            </div>
          ))}

          {/* Alimentos Ingeridos — tabela macros */}
          {menu.length>0&&(
            <div className="card" style={{padding:"16px"}}>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,marginBottom:14}}>Alimentos Ingeridos</p>
              {/* Header */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 52px 52px 52px",gap:4,padding:"0 0 8px",borderBottom:"1px solid #EDE5D8",marginBottom:4}}>
                <span style={{fontSize:12,color:"#8B7050",fontWeight:600}}>Alimento</span>
                {[["Carbs","#C8A840"],["Gord","#4A8050"],["Prot","#C97B5A"]].map(([lbl,clr])=>(
                  <div key={lbl} style={{textAlign:"right"}}>
                    <div style={{fontSize:11,fontWeight:700,color:clr}}>{lbl}</div>
                    <div style={{fontSize:10,color:"#A89878"}}>(g)</div>
                  </div>
                ))}
              </div>
              {/* Rows */}
              {menu.map((item,i)=>{
                const food=FOODS.find(f=>f.id===item.foodId);
                const q=item.qty||1;
                const m=food?.macro;
                const pc=m?Math.round(m.c*item.grams/100*q):null;
                const pf=m?Math.round(m.f*item.grams/100*q):null;
                const pp=m?Math.round(m.p*item.grams/100*q):null;
                const mealDef=MEALS.find(ml=>ml.id===item.mealId);
                return(
                  <div key={item.id} style={{display:"grid",gridTemplateColumns:"1fr 52px 52px 52px",gap:4,padding:"8px 0",borderBottom:"1px dashed #EDE5D8",alignItems:"center"}}>
                    <div>
                      <p style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</p>
                      <p style={{fontSize:10,color:"#A89878"}}>{mealDef?.icon} {item.measure}{q>1?` ×${q}`:""}</p>
                    </div>
                    {[pc,pf,pp].map((v,j)=>(
                      <div key={j} style={{textAlign:"right",fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:v===null?"#C8B8A0":j===0?"#C8A840":j===1?"#4A8050":"#C97B5A"}}>
                        {v===null?"–":v}
                      </div>
                    ))}
                  </div>
                );
              })}
              {/* Total row */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 52px 52px 52px",gap:4,padding:"10px 0 0",alignItems:"center"}}>
                <span style={{fontWeight:700,fontSize:14,color:"#2C1A0E"}}>Total</span>
                {[todayNut.c,todayNut.f,todayNut.p].map((v,j)=>(
                  <div key={j} style={{textAlign:"right",fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:j===0?"#C8A840":j===1?"#4A8050":"#C97B5A"}}>{v}</div>
                ))}
              </div>
              {/* Goals row */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 52px 52px 52px",gap:4,padding:"4px 0",background:"#F5EFE6",borderRadius:8,marginTop:4,paddingLeft:6,paddingRight:6}}>
                <span style={{fontSize:10,color:"#8B7050"}}>Meta diária</span>
                {[goals.c,goals.f,goals.p].map((v,j)=>(
                  <div key={j} style={{textAlign:"right",fontSize:10,color:"#8B7050"}}>{v}g</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── NUTRIENTES ── */}
      {subTab==="nutrientes"&&(
        <>
          <div className="card" style={{padding:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700}}>Nutrientes de Hoje</p>
              <span style={{fontSize:10,color:"#8B7050",background:"#EDE5D8",padding:"2px 8px",borderRadius:8}}>Meta diária</span>
            </div>
            <StatRow label="Calorias"   val={todayNut.cal}  unit="kcal" goalVal={goals.cal}  color="#E8A07D"/>
            <StatRow label="Proteína"   val={todayNut.p}    unit="g"    goalVal={goals.p}    color="#C97B5A"/>
            <StatRow label="Carboidrato"val={todayNut.c}    unit="g"    goalVal={goals.c}    color="#F7ECC8"/>
            <StatRow label="Fibras"     val={todayNut.fi}   unit="g"    goalVal={goals.fi}   color="#90C97E"/>
            <StatRow label="Açúcar"     val={todayNut.su}   unit="g"    goalVal={goals.su}   color="#E07070"/>
            <StatRow label="Gordura"    val={todayNut.f}    unit="g"    goalVal={goals.f}    color="#6AAF6E"/>
            <StatRow label="Colesterol" val={todayNut.ch}   unit="mg"   goalVal={goals.ch}   color="#9060C0"/>
            <StatRow label="Sódio"      val={todayNut.na}   unit="mg"   goalVal={goals.na}   color="#F0924A"/>
            <StatRow label="Potássio"   val={todayNut.k}    unit="mg"   goalVal={goals.k}    color="#4A8050"/>
            <div style={{marginTop:12,background:"#F5EFE6",borderRadius:10,padding:"10px 12px"}}>
              <p style={{fontSize:11,color:"#8B7050",lineHeight:1.6}}>
                🟢 <strong>85–115%</strong> da meta = ideal · 🟡 Abaixo · 🔴 Acima de 115%
              </p>
              <p style={{fontSize:11,color:"#8B7050",marginTop:4}}>Metas: sódio &lt;2300mg, açúcar &lt;25g, colesterol &lt;300mg (OMS/ANVISA).</p>
            </div>
          </div>

          {/* Alimentos Ingeridos — tabela nutrientes detalhada */}
          {menu.length>0&&(
            <div className="card" style={{padding:"16px"}}>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,marginBottom:4}}>Alimentos Ingeridos</p>
              <p style={{fontSize:12,color:"#8B7050",marginBottom:12}}>Contribuicao de cada alimento por nutriente</p>
              {/* Scrollable table */}
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"'Source Sans 3',sans-serif",minWidth:480}}>
                  <thead>
                    <tr style={{borderBottom:"2px solid #EDE5D8"}}>
                      <th style={{textAlign:"left",padding:"6px 4px",color:"#8B7050",fontWeight:700,fontSize:11,minWidth:100}}>Alimento</th>
                      {[["Kcal","#E8A07D"],["Prot","#C97B5A"],["Carb","#C8A840"],["Fib","#90C97E"],["Açúc","#E07070"],["Gord","#4A8050"],["Col","#9060C0"],["Na","#F0924A"],["K","#4A8050"]].map(([h,c])=>(
                        <th key={h} style={{textAlign:"right",padding:"6px 3px",color:c,fontWeight:700,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {menu.map((item)=>{
                      const food=FOODS.find(f=>f.id===item.foodId);
                      const q=item.qty||1;
                      const m=food?.macro;
                      const g=item.grams;
                      const r=(v)=>m?Math.round(v*g/100*q):null;
                      const vals=[item.cal*q, r(m?.p), r(m?.c), r(m?.fi), r(m?.su), r(m?.f), r(m?.ch), r(m?.na), r(m?.k)];
                      const mealDef=MEALS.find(ml=>ml.id===item.mealId);
                      return(
                        <tr key={item.id} style={{borderBottom:"1px dashed #EDE5D8"}}>
                          <td style={{padding:"7px 4px"}}>
                            <div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:100}}>{item.name}</div>
                            <div style={{fontSize:9,color:"#A89878"}}>{mealDef?.icon} {q>1?`×${q} `:""}{ item.measure.replace(/\(.*\)/,"").trim()}</div>
                          </td>
                          {vals.map((v,j)=>(
                            <td key={j} style={{textAlign:"right",padding:"7px 3px",fontFamily:"'Playfair Display',serif",fontWeight:600,fontSize:12,color:v===null?"#D0C8C0":v===0?"#C8B8A0":"#2A2420"}}>
                              {v===null?"–":v}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:"2px solid #C8B8A0",background:"#F5EFE6"}}>
                      <td style={{padding:"8px 4px",fontWeight:700,fontSize:12,color:"#2C1A0E"}}>Total</td>
                      {[todayNut.cal,todayNut.p,todayNut.c,todayNut.fi,todayNut.su,todayNut.f,todayNut.ch,todayNut.na,todayNut.k].map((v,j)=>(
                        <td key={j} style={{textAlign:"right",padding:"8px 3px",fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color:"#2C1A0E"}}>{v}</td>
                      ))}
                    </tr>
                    <tr style={{background:"#EDE5D8"}}>
                      <td style={{padding:"5px 4px",fontSize:10,color:"#8B7050",fontWeight:600}}>Meta</td>
                      {[goals.cal,goals.p,goals.c,goals.fi,goals.su,goals.f,goals.ch,goals.na,goals.k].map((v,j)=>(
                        <td key={j} style={{textAlign:"right",padding:"5px 3px",fontSize:10,color:"#8B7050"}}>{v}</td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── SemanaTab ─────────────────────────────────────────────────────────────────
// Recipes adapted from "Refeições Saudáveis para Congelar" – Patrícia Stênico Nutri
// Macros per 100g (or portion stated) sourced directly from the book.

const RECEITAS_SEMANA = {
  carne_moida: {
    nome:"Carne Moída Refogada com Tomate",
    fonte:"Patrícia Stênico – pág. 40",
    desc:"Carne moída de patinho refogada com tomate pelado, cebola e cheiro verde. Ideal para congelar em marmitas.",
    porcao:"100g",
    cal:204, p:29, c:2, g:8.9,
    fi:0.5, su:1.5, na:350, k:320,
    tempo:"30 min", freeze:"3 meses",
    cor:"#C97B5A",
    ingredientes:["1 kg Carne moída patinho","1 lata tomate pelado","1 cebola","pasta de alho","azeite","sal, pimenta, cheiro verde"],
    preparo:"Refogue cebola e alho no azeite. Junte a carne e doure bem. Adicione tomate pelado e acerte temperos.",
    custo:4.90,
    custoDesc:"100g carne~R$4,49 + temperos~R$0,41",
  },
  frango_desfiado: {
    nome:"Frango Desfiado da Nutri",
    fonte:"Patrícia Stênico – pág. 42",
    desc:"Peito de frango cozido na pressão com tomate, desfiado e temperado. Versátil para recheios e marmitas.",
    porcao:"100g",
    cal:213, p:24.3, c:1.5, g:11,
    fi:0, su:0.8, na:280, k:370,
    tempo:"25 min", freeze:"3 meses",
    cor:"#E8C07D",
    ingredientes:["1,5 kg Peito de frango em cubos","1 lata tomate pelado","2 cebolas","pasta de alho","azeite","sal, pimenta"],
    preparo:"Refogue cebola e alho. Sele o frango. Cubra com água fervente 1cm acima. Pressão 20 min. Desfie com garfo.",
    custo:3.40,
    custoDesc:"100g frango~R$2,99 + temperos~R$0,41",
  },
  iscas_frango: {
    nome:"Iscas de Frango ao Pomodoro",
    fonte:"Patrícia Stênico – pág. 43",
    desc:"Filé de frango em tiras cozido na pressão com tomate pelado. Suculento, prático e congelável.",
    porcao:"100g",
    cal:213, p:24.3, c:1.5, g:11,
    fi:0, su:0.8, na:290, k:360,
    tempo:"20 min", freeze:"3 meses",
    cor:"#F4A57A",
    ingredientes:["1,5 kg Filé de frango em tiras","1 lata tomate pelado","2 cebolas","pasta de alho","azeite","sal, pimenta, cebolinha"],
    preparo:"Refogue cebola e alho. Sele o frango em tiras. Junte tomate e água. Pressão 6 min. Adicione cebolinha.",
    custo:3.40,
    custoDesc:"100g frango~R$2,99 + tomate/temperos~R$0,41",
  },
  ragu_paleta: {
    nome:"Ragú de Paleta / Carne Desfiada",
    fonte:"Patrícia Stênico – pág. 52",
    desc:"Paleta bovina desfiada na pressão com cenoura, shoyu e páprica. Perfeito com purê, arroz ou macarrão.",
    porcao:"100g",
    cal:172, p:24.3, c:1.9, g:7.5,
    fi:0.3, su:1, na:310, k:380,
    tempo:"50 min", freeze:"3 meses",
    cor:"#B06040",
    ingredientes:["1,5 kg Paleta em cubos","1 cenoura","pasta de alho","1 cebola","shoyu","páprica","azeite","sal, pimenta"],
    preparo:"Sele a carne em lotes no azeite. Refogue cebola e alho. Junte cenoura, shoyu e água. Pressão 40 min. Desfie.",
    custo:5.10,
    custoDesc:"100g paleta~R$4,69 + temperos~R$0,41",
  },
  pernil_desfiado: {
    nome:"Pernil Desfiado na Panela de Pressão",
    fonte:"Patrícia Stênico – pág. 49",
    desc:"Pernil suíno em cubos com páprica defumada e extrato de tomate. Desfia fácil e congela muito bem.",
    porcao:"100g",
    cal:255, p:19, c:5.2, g:16,
    fi:0.3, su:2, na:420, k:295,
    tempo:"60 min", freeze:"3 meses",
    cor:"#D4A060",
    ingredientes:["1 kg Pernil suíno em cubos","extrato de tomate","pimentão vermelho","cebola","páprica defumada","pimenta calabresa","louro","azeite"],
    preparo:"Sele o pernil em lotes. Refogue cebola, pimentão e alho. Junte extrato, temperos e água. Pressão 45 min. Desfie.",
    custo:4.50,
    custoDesc:"100g pernil~R$3,90 + temperos~R$0,60",
  },
  // Bases
  arroz_branco: {
    nome:"Arroz Branco Cozido",
    fonte:"Patrícia Stênico – pág. 34",
    porcao:"100g",
    cal:109, p:1.5, c:14.5, g:5,
    fi:0.4, su:0, na:5, k:35,
    cor:"#F7ECC8",
    custo:0.43,
  },
  arroz_integral: {
    nome:"Arroz Integral Cozido",
    fonte:"Patrícia Stênico – pág. 35",
    porcao:"100g",
    cal:157, p:2.3, c:25.4, g:4.9,
    fi:1.8, su:0, na:5, k:79,
    cor:"#C8B89A",
    custo:0.55,
  },
  feijao: {
    nome:"Feijão Carioca",
    fonte:"Patrícia Stênico – pág. 41",
    porcao:"50g (2 col. sopa)",
    cal:94, p:5.8, c:16, g:8,
    fi:8.5, su:0.3, na:2, k:255,
    cor:"#C8946A",
    custo:0.60,
  },
  macacao_integral: {
    nome:"Macarrão Integral Cozido",
    fonte:"Patrícia Stênico – pág. 46",
    porcao:"80g",
    cal:99, p:4.2, c:21.2, g:0.4,
    fi:1.8, su:0.6, na:6, k:44,
    cor:"#F5D490",
    custo:0.44,
  },
  molho_tomate: {
    nome:"Molho de Tomate Artesanal",
    fonte:"Patrícia Stênico – pág. 48",
    porcao:"100g",
    cal:67, p:2.1, c:12, g:2,
    fi:2.5, su:6, na:60, k:280,
    cor:"#E07070",
    custo:0.55,
  },
  pure_batata: {
    nome:"Purê Mix Batata com Alho-Poró",
    fonte:"Patrícia Stênico – pág. 50",
    porcao:"100g",
    cal:146, p:1.8, c:20, g:6.2,
    fi:1.5, su:1, na:90, k:320,
    cor:"#F0E8C0",
    custo:0.72,
  },
  quinoa: {
    nome:"Quinoa Cozida",
    fonte:"Patrícia Stênico – pág. 51",
    porcao:"60g (4 col. sopa)",
    cal:72, p:2.6, c:12.7, g:1.1,
    fi:2.8, su:0, na:7, k:172,
    cor:"#C8D8A0",
    custo:1.20,
  },
  mousseline: {
    nome:"Mousseline de Mandioquinha com Batata",
    fonte:"Patrícia Stênico – pág. 47",
    porcao:"100g",
    cal:87, p:1.6, c:18, g:0.7,
    fi:1.9, su:1.7, na:14, k:271,
    cor:"#F0D8A0",
    custo:0.65,
  },
  grao_bico: {
    nome:"Grão-de-Bico Cozido",
    fonte:"Patrícia Stênico – pág. 44",
    porcao:"50g (2 col. sopa)",
    cal:82, p:4.4, c:13.7, g:1.3,
    fi:7.6, su:4.8, na:7, k:145,
    cor:"#C8A860",
    custo:0.80,
  },
};

// 6 unique combos (protein + base + acompanhamento)
const COMBOS_SEMANA = [
  {
    id:"A",
    refeicao:"Almoço",
    proteina: "carne_moida",
    bases: ["arroz_branco","feijao"],
    extra: {nome:"Brócolis refogado", cal:28, p:2.8, c:5, g:0.4, fi:2.6, custo:0.95},
    cor:"#C97B5A",
    tip:"Monte marmita com 100g carne + 100g arroz + 1 concha feijão. Congele por até 3 meses.",
  },
  {
    id:"B",
    refeicao:"Jantar",
    proteina: "iscas_frango",
    bases: ["macacao_integral","molho_tomate"],
    extra: null,
    cor:"#F4A57A",
    tip:"Descongele as iscas e misture 2-3 col. sopa de creme de ricota para um strogonoff saudável.",
  },
  {
    id:"C",
    refeicao:"Almoço",
    proteina: "frango_desfiado",
    bases: ["arroz_integral","feijao"],
    extra: {nome:"Salada verde (alface + tomate)", cal:18, p:1, c:3.5, g:0.2, fi:1.5, custo:0.90},
    cor:"#E8C07D",
    tip:"O frango desfiado pode também rechear tapioca, omelete ou torta no jantar da semana.",
  },
  {
    id:"D",
    refeicao:"Jantar",
    proteina: "ragu_paleta",
    bases: ["pure_batata"],
    extra: {nome:"Legumes refogados (cenoura + abobrinha)", cal:30, p:1.5, c:6, g:0.5, fi:2, custo:0.80},
    cor:"#B06040",
    tip:"O ragú de paleta é perfeito com purê ou polenta cremosa. Congele separado do acompanhamento.",
  },
  {
    id:"E",
    refeicao:"Almoço",
    proteina: "pernil_desfiado",
    bases: ["arroz_integral","grao_bico"],
    extra: {nome:"Couve refogada", cal:32, p:3.5, c:4, g:1, fi:2, custo:0.40},
    cor:"#D4A060",
    tip:"O pernil desfiado substitui embutidos com muito mais saúde. Sirva com arroz integral e grão-de-bico.",
  },
  {
    id:"F",
    refeicao:"Jantar",
    proteina: "ragu_paleta",
    bases: ["quinoa","mousseline"],
    extra: {nome:"Brócolis cozido", cal:28, p:2.8, c:5, g:0.4, fi:2.6, custo:0.80},
    cor:"#B06040",
    tip:"Ragú + quinoa + mousseline é uma refeição completa e nutritiva. A quinoa substitui o arroz com mais proteína.",
  },
];

// 2 semanas × 7 dias, cada dia tem almoço e jantar
const PLANO_SEMANAS = [
  // SEMANA 1
  [
    {dia:"Segunda",    almoco:"A", jantar:"B"},
    {dia:"Terça",     almoco:"C", jantar:"D"},
    {dia:"Quarta",    almoco:"A", jantar:"F"},
    {dia:"Quinta",    almoco:"E", jantar:"B"},
    {dia:"Sexta",     almoco:"C", jantar:"D"},
    {dia:"Sábado",    almoco:"E", jantar:"F"},
    {dia:"Domingo",   almoco:"A", jantar:"B"},
  ],
  // SEMANA 2
  [
    {dia:"Segunda",   almoco:"C", jantar:"D"},
    {dia:"Terça",     almoco:"E", jantar:"F"},
    {dia:"Quarta",    almoco:"A", jantar:"B"},
    {dia:"Quinta",    almoco:"C", jantar:"F"},
    {dia:"Sexta",     almoco:"E", jantar:"D"},
    {dia:"Sábado",    almoco:"A", jantar:"F"},
    {dia:"Domingo",   almoco:"C", jantar:"B"},
  ],
];

function calcCombo(comboId) {
  const combo = COMBOS_SEMANA.find(c=>c.id===comboId);
  if(!combo) return {cal:0,p:0,c:0,g:0,fi:0,custo:0};
  const prot = RECEITAS_SEMANA[combo.proteina];
  const bases = combo.bases.map(b=>RECEITAS_SEMANA[b]);
  const ex = combo.extra;
  const cal  = prot.cal  + bases.reduce((s,b)=>s+b.cal,0)  + (ex?.cal||0);
  const p    = prot.p    + bases.reduce((s,b)=>s+b.p,0)    + (ex?.p||0);
  const c    = prot.c    + bases.reduce((s,b)=>s+b.c,0)    + (ex?.c||0);
  const g    = prot.g    + bases.reduce((s,b)=>s+b.g,0)    + (ex?.g||0);
  const fi   = (prot.fi||0) + bases.reduce((s,b)=>s+(b.fi||0),0) + (ex?.fi||0);
  const custo= prot.custo+ bases.reduce((s,b)=>s+b.custo,0)+ (ex?.custo||0);
  return {cal:Math.round(cal),p:Math.round(p*10)/10,c:Math.round(c*10)/10,g:Math.round(g*10)/10,fi:Math.round(fi*10)/10,custo};
}

function RefeicaoCard({ comboId, tipo }) {
  const combo = COMBOS_SEMANA.find(c=>c.id===comboId);
  if(!combo) return null;
  const prot  = RECEITAS_SEMANA[combo.proteina];
  const bases = combo.bases.map(b=>RECEITAS_SEMANA[b]);
  const totals = calcCombo(comboId);
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{borderRadius:14,border:`1.5px solid ${combo.cor}55`,overflow:"hidden",background:"#FDFAF4"}}>
      {/* Header */}
      <div onClick={()=>setOpen(p=>!p)} style={{padding:"12px 14px",cursor:"pointer",background:`${combo.cor}11`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>{tipo==="Almoço"?"🍽️":"🌙"}</span>
          <div style={{flex:1}}>
            <p style={{fontWeight:700,fontSize:13,color:"#2C1A0E"}}>{tipo} · {prot.nome}</p>
            <p style={{fontSize:11,color:"#8B7050",marginTop:2}}>
              {bases.map(b=>b.nome.split(" ")[0]).join(" · ")}
              {combo.extra && ` · ${combo.extra.nome}`}
            </p>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#5C3018"}}>{totals.cal}</p>
            <p style={{fontSize:9,color:"#8B7050"}}>kcal</p>
          </div>
          <span style={{fontSize:11,color:"#A89878",transform:open?"rotate(90deg)":"rotate(0)",transition:"transform .2s"}}>▶</span>
        </div>
        {/* Quick macro badges */}
        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
          {[
            {l:"Prot",v:totals.p+"g",c:"#C97B5A"},
            {l:"Carb",v:totals.c+"g",c:"#C8A840"},
            {l:"Gord",v:totals.g+"g",c:"#4A8050"},
            {l:"Fibras",v:totals.fi+"g",c:"#90C97E"},
            {l:"Custo",v:"R$"+totals.custo.toFixed(2).replace(".",","),c:"#286028"},
          ].map(({l,v,c})=>(
            <span key={l} style={{fontSize:10,fontWeight:700,color:c,background:c+"18",padding:"2px 7px",borderRadius:8}}>{l}: {v}</span>
          ))}
        </div>
      </div>

      {/* Expanded */}
      {open&&(
        <div style={{padding:"12px 14px",borderTop:`1px solid ${combo.cor}33`,display:"flex",flexDirection:"column",gap:12}}>
          {/* Protein detail */}
          <div style={{background:`${prot.cor}18`,borderRadius:10,padding:"10px 12px"}}>
            <p style={{fontWeight:700,fontSize:12,color:"#5C3018",marginBottom:4}}>🥩 {prot.nome}</p>
            <p style={{fontSize:11,color:"#8B7050",marginBottom:6,lineHeight:1.5}}>{prot.desc}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,fontSize:11}}>
              <span style={{color:"#8B7050"}}>📏 Porção: <strong>{prot.porcao}</strong></span>
              <span style={{color:"#5C3018"}}>🔥 {prot.cal} kcal</span>
              <span style={{color:"#C97B5A"}}>Proteína: {prot.p}g</span>
              <span style={{color:"#C8A840"}}>Carb: {prot.c}g</span>
              <span style={{color:"#4A8050"}}>Gordura: {prot.g}g</span>
              <span style={{color:"#286028"}}>💰 R$ {prot.custo.toFixed(2).replace(".",",")}/porção</span>
            </div>
            <p style={{fontSize:10,color:"#A89878",marginTop:6}}>📖 {prot.fonte} · ❄️ Freeze: {prot.freeze}</p>
          </div>

          {/* Bases */}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:"#8B7050",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>🍚 Acompanhamentos</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {bases.map(b=>(
                <div key={b.nome} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#F5EFE6",borderRadius:8,padding:"7px 10px"}}>
                  <div>
                    <p style={{fontSize:12,fontWeight:600}}>{b.nome}</p>
                    <p style={{fontSize:10,color:"#A89878"}}>{b.porcao} · {b.p}g prot · {b.c}g carb</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#5C3018"}}>{b.cal}</p>
                    <p style={{fontSize:9,color:"#286028"}}>R$ {b.custo.toFixed(2).replace(".",",")}</p>
                  </div>
                </div>
              ))}
              {combo.extra&&(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#EDF5EC",borderRadius:8,padding:"7px 10px"}}>
                  <div>
                    <p style={{fontSize:12,fontWeight:600}}>{combo.extra.nome}</p>
                    <p style={{fontSize:10,color:"#A89878"}}>{combo.extra.p}g prot · {combo.extra.fi}g fibras</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#5C3018"}}>{combo.extra.cal}</p>
                    <p style={{fontSize:9,color:"#286028"}}>R$ {combo.extra.custo.toFixed(2).replace(".",",")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div style={{background:"linear-gradient(135deg,#2C1A0E,#5C3018)",borderRadius:10,padding:"10px 14px",color:"#F5E8D0"}}>
            <p style={{fontSize:11,opacity:.7,marginBottom:4}}>Total da refeição</p>
            <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:6}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700}}>{totals.cal}</span>
              <span style={{opacity:.7,fontSize:12}}>kcal</span>
              <span style={{marginLeft:"auto",fontSize:14,fontWeight:700,color:"#90C97E"}}>💰 R$ {totals.custo.toFixed(2).replace(".",",")}</span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px 14px",fontSize:11}}>
              <span>Prot: <strong>{totals.p}g</strong></span>
              <span>Carb: <strong>{totals.c}g</strong></span>
              <span>Gord: <strong>{totals.g}g</strong></span>
              <span>Fibras: <strong>{totals.fi}g</strong></span>
            </div>
          </div>

          {/* Tip */}
          <div style={{background:"#FFF8EC",border:"1px solid #E8C07D",borderRadius:10,padding:"9px 12px"}}>
            <p style={{fontSize:12,color:"#7A4A00",lineHeight:1.5}}>💡 {combo.tip}</p>
          </div>

          {/* Prep hint */}
          {prot.preparo&&(
            <div style={{background:"#F0F8FF",border:"1px solid #B8D8F0",borderRadius:10,padding:"9px 12px"}}>
              <p style={{fontSize:11,fontWeight:700,color:"#1A4A6E",marginBottom:4}}>👨‍🍳 Modo de preparo resumido</p>
              <p style={{fontSize:12,color:"#1A4A6E",lineHeight:1.5}}>{prot.preparo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SemanaTab() {
  const [semana, setSemana] = React.useState(0); // 0 = week 1, 1 = week 2
  const [diaIdx, setDiaIdx] = React.useState(0);

  const planoSemana = PLANO_SEMANAS[semana];
  const diaAtual = planoSemana[diaIdx];
  const totalAlmoco = calcCombo(diaAtual.almoco);
  const totalJantar = calcCombo(diaAtual.jantar);
  const totalDia = {
    cal: totalAlmoco.cal + totalJantar.cal,
    custo: totalAlmoco.custo + totalJantar.custo,
  };

  // Summary of all 6 unique recipes
  const todosOsCombos = COMBOS_SEMANA.map(c=>{
    const t=calcCombo(c.id);
    return {...c, totals:t};
  });

  return (
    <div className="sl" style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1A2840,#2E5080)",borderRadius:16,padding:"16px 18px",color:"#E8F0FD"}}>
        <div style={{fontSize:28,marginBottom:6}}>📅</div>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,marginBottom:4}}>Plano de 2 Semanas</p>
        <p style={{fontSize:13,opacity:.85,lineHeight:1.5}}>
          6 combinações de almoço e jantar baseadas no livro <em>Refeições Saudáveis para Congelar</em> – Patrícia Stênico Nutri.
        </p>
        <p style={{fontSize:11,opacity:.6,marginTop:6}}>💰 Preços ref. Irani Tancredo Neves / Cascavel-PR 2025</p>
      </div>

      {/* Week selector */}
      <div className="seg">
        <button className={`seg-btn ${semana===0?"on":""}`} onClick={()=>{setSemana(0);setDiaIdx(0);}}>Semana 1</button>
        <button className={`seg-btn ${semana===1?"on":""}`} onClick={()=>{setSemana(1);setDiaIdx(0);}}>Semana 2</button>
      </div>

      {/* Day selector */}
      <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4}}>
        {planoSemana.map((d,i)=>(
          <button key={i} onClick={()=>setDiaIdx(i)} className="btn"
            style={{flexShrink:0,padding:"6px 11px",borderRadius:20,fontSize:11,fontWeight:700,
              background:diaIdx===i?"#2E5080":"#EDE5D8",
              color:diaIdx===i?"#FFF":"#5C4020"}}>
            {d.dia.slice(0,3)}
          </button>
        ))}
      </div>

      {/* Day header */}
      <div style={{background:"#F5EFE6",borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <p style={{fontWeight:700,fontSize:15,color:"#2C1A0E"}}>{diaAtual.dia} · Semana {semana+1}</p>
          <p style={{fontSize:12,color:"#8B7050"}}>{totalDia.cal} kcal neste dia · 💰 R$ {totalDia.custo.toFixed(2).replace(".",",")}</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn" onClick={()=>setDiaIdx(Math.max(0,diaIdx-1))}
            style={{background:"#EDE5D8",borderRadius:8,padding:"6px 10px",fontSize:14,color:"#5C3018"}}>‹</button>
          <button className="btn" onClick={()=>setDiaIdx(Math.min(6,diaIdx+1))}
            style={{background:"#EDE5D8",borderRadius:8,padding:"6px 10px",fontSize:14,color:"#5C3018"}}>›</button>
        </div>
      </div>

      {/* Meal cards */}
      <RefeicaoCard comboId={diaAtual.almoco} tipo="Almoço"/>
      <RefeicaoCard comboId={diaAtual.jantar} tipo="Jantar"/>

      {/* Weekly cost summary */}
      <div className="card" style={{padding:"14px"}}>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:10}}>💰 Custo da Semana {semana+1}</p>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {planoSemana.map((d,i)=>{
            const a=calcCombo(d.almoco);const j=calcCombo(d.jantar);
            const total=a.custo+j.custo;
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 8px",borderRadius:8,background:diaIdx===i?"#FFF8EC":"transparent",cursor:"pointer"}} onClick={()=>setDiaIdx(i)}>
                <span style={{fontSize:12,fontWeight:700,color:"#5C3018",minWidth:56}}>{d.dia.slice(0,3)}</span>
                <div style={{flex:1,height:8,background:"#EDE5D8",borderRadius:4,overflow:"hidden"}}>
                  <div style={{width:`${Math.min(100,total/15*100)}%`,height:"100%",background:"#2E5080",borderRadius:4}}/>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:"#286028",minWidth:50,textAlign:"right"}}>R$ {total.toFixed(2).replace(".",",")}</span>
              </div>
            );
          })}
          <div style={{borderTop:"2px solid #EDE5D8",paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <span style={{fontSize:13,fontWeight:700,color:"#2C1A0E"}}>Total estimado (almoço+jantar)</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#286028"}}>
              R$ {planoSemana.reduce((s,d)=>s+calcCombo(d.almoco).custo+calcCombo(d.jantar).custo,0).toFixed(2).replace(".",",")}
            </span>
          </div>
        </div>
      </div>

      {/* All 6 recipes overview */}
      <div className="card" style={{padding:"14px"}}>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:4}}>📋 As 6 Combinações do Plano</p>
        <p style={{fontSize:12,color:"#8B7050",marginBottom:10}}>Todas baseadas no livro de Patrícia Stênico Nutri</p>
        {todosOsCombos.map(combo=>{
          const prot=RECEITAS_SEMANA[combo.proteina];
          return(
            <div key={combo.id} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:"1px dashed #EDE5D8"}}>
              <div style={{width:32,height:32,borderRadius:8,background:combo.cor+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,fontWeight:700,color:combo.cor}}>
                {combo.id}
              </div>
              <div style={{flex:1}}>
                <p style={{fontSize:12,fontWeight:700,color:"#2C1A0E"}}>{prot.nome}</p>
                <p style={{fontSize:10,color:"#A89878"}}>+ {combo.bases.map(b=>RECEITAS_SEMANA[b].nome.split(" ")[0]).join(" + ")}{combo.extra?` + ${combo.extra.nome.split("(")[0].trim()}`:""}</p>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#5C3018"}}>{combo.totals.cal} kcal</p>
                <p style={{fontSize:10,color:"#286028"}}>R$ {combo.totals.custo.toFixed(2).replace(".",",")}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Book credit */}
      <div style={{background:"#F0F4F8",borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
        <p style={{fontSize:12,color:"#5C7080",lineHeight:1.6}}>
          📖 Receitas extraídas de <strong>Refeições Saudáveis para Congelar</strong><br/>
          Patrícia Stênico – Nutricionista<br/>
          <span style={{fontSize:10,opacity:.7}}>Macros e calorias conforme publicados no livro digital.</span>
        </p>
      </div>
    </div>
  );
}

// ── PrecosTab ─────────────────────────────────────────────────────────────────
function PrecosTab({ customPrices, setCustomPrices }) {
  const [search, setSearch]     = useState("");
  const [selGroup, setSelGroup] = useState("Todos");
  const [editId, setEditId]     = useState(null);
  const [editVal, setEditVal]   = useState("");
  const [saved, setSaved]       = useState({});

  const groups = ["Todos", ...Array.from(new Set(FOODS.map(f=>f.group)))];
  const filtered = FOODS
    .filter(f =>
      (selGroup==="Todos"||f.group===selGroup) &&
      f.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a,b) => a.name.localeCompare(b.name, "pt-BR"));

  function getP(food) {
    if(customPrices[food.id]!==undefined) return customPrices[food.id];
    return food.price||0;
  }

  function savePrice(food) {
    const v = parseFloat(editVal.replace(",","."));
    if(isNaN(v)||v<0) return;
    setCustomPrices(prev=>({...prev,[food.id]:v}));
    setSaved(prev=>({...prev,[food.id]:true}));
    setTimeout(()=>setSaved(prev=>({...prev,[food.id]:false})),1800);
    setEditId(null);setEditVal("");
  }

  function resetPrice(food) {
    setCustomPrices(prev=>{const n={...prev};delete n[food.id];return n;});
  }

  const editedCount = Object.keys(customPrices).length;

  return (
    <div className="sl" style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1A3028,#286040)",borderRadius:16,padding:"16px 18px",color:"#E8F5ED"}}>
        <div style={{fontSize:28,marginBottom:6}}>💰</div>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,marginBottom:4}}>Tabela de Preços</p>
        <p style={{fontSize:13,opacity:.85,lineHeight:1.5}}>
          Edite o preço de qualquer alimento. O novo valor será usado em todo o app — Alimentos, Cardápio, Receitas e Backup.
        </p>
        {editedCount>0&&(
          <div style={{marginTop:10,background:"rgba(255,255,255,.15)",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700}}>
            ✏️ {editedCount} preço{editedCount>1?"s":""} editado{editedCount>1?"s":""} por você
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{background:"#FFF8EC",border:"1px solid #E8C07D",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#7A4A00",lineHeight:1.6}}>
        ℹ️ Preços de referência do Irani Tancredo Neves / Cascavel-PR (2025). Toque em ✏️ para atualizar com o valor atual do seu mercado. Preços editados ficam salvos no backup.
      </div>

      {/* Search & filter */}
      <input className="inp" placeholder="Buscar alimento..." value={search} onChange={e=>setSearch(e.target.value)}/>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6}}>
        {groups.map(g=>(
          <button key={g} className={`pill ${selGroup===g?"on":""}`} onClick={()=>setSelGroup(g)}>
            {g!=="Todos"?GROUP_ICONS[g]:"✦"} {g}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 44px",gap:6,padding:"6px 10px",background:"#EDE5D8",borderRadius:10}}>
        <span style={{fontSize:11,fontWeight:700,color:"#8B7050"}}>Alimento</span>
        <span style={{fontSize:11,fontWeight:700,color:"#8B7050",textAlign:"right"}}>R$/100g</span>
        <span style={{fontSize:11,fontWeight:700,color:"#286028",textAlign:"right"}}>Referência</span>
        <span style={{fontSize:11,fontWeight:700,color:"#8B7050",textAlign:"center"}}></span>
      </div>

      {/* Food rows */}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {filtered.map(food=>{
          const p = getP(food);
          const isCustom = customPrices[food.id]!==undefined;
          const isEditing = editId===food.id;
          const isSaved = saved[food.id];
          return (
            <div key={food.id} className="card" style={{padding:"0",overflow:"hidden",border:isCustom?"1.5px solid #90C97E":"1px solid #E8E0D0"}}>
              {/* Main row */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 44px",gap:6,padding:"10px 10px",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <div style={{width:28,height:28,borderRadius:7,background:food.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>
                    {GROUP_ICONS[food.group]||"🍴"}
                  </div>
                  <div style={{minWidth:0}}>
                    <p style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{food.name}</p>
                    <p style={{fontSize:9,color:"#A89878"}}>{food.group}{isCustom?" · editado":""}</p>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  {isSaved
                    ? <span style={{fontSize:12,color:"#155724",fontWeight:700}}>✓ Salvo!</span>
                    : <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:isCustom?"#155724":"#5C3018"}}>
                        {p>0?`R$ ${p.toFixed(2).replace(".",",")}`:"-"}
                      </span>
                  }
                </div>
                <div style={{textAlign:"right",fontSize:9,color:"#A89878",lineHeight:1.4}}>
                  {food.priceDesc?.split("/")[0]}
                </div>
                <div style={{display:"flex",justifyContent:"center"}}>
                  <button className="btn" onClick={()=>{setEditId(isEditing?null:food.id);setEditVal(p>0?String(p.toFixed(2)).replace(".",","):"");}}
                    style={{background:isEditing?"#8B5E3C":"#EDE5D8",color:isEditing?"#FFF":"#5C3018",borderRadius:7,padding:"4px 8px",fontSize:12}}>
                    {isEditing?"✕":"✏️"}
                  </button>
                </div>
              </div>

              {/* Inline editor */}
              {isEditing&&(
                <div style={{borderTop:"1px solid #EDE5D8",padding:"10px 12px",background:"#F5EFE6",display:"flex",flexDirection:"column",gap:8}}>
                  <p style={{fontSize:11,color:"#8B7050",fontWeight:700}}>Editar preço por 100g (em reais)</p>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:13,color:"#5C3018",fontWeight:700,flexShrink:0}}>R$</span>
                    <input className="inp" type="number" step="0.01" min="0" max="9999" placeholder="Ex: 4,99"
                      value={editVal} onChange={e=>setEditVal(e.target.value)}
                      style={{flex:1,padding:"8px 12px",fontSize:14}}
                      onKeyDown={e=>e.key==="Enter"&&savePrice(food)}
                      autoFocus/>
                    <button className="btn" onClick={()=>savePrice(food)}
                      style={{background:"#286028",color:"#FFF",borderRadius:9,padding:"8px 16px",fontWeight:700,fontSize:13,flexShrink:0}}>
                      Salvar
                    </button>
                  </div>
                  {/* Portion preview */}
                  {editVal&&!isNaN(parseFloat(editVal.replace(",",".")))&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {food.measures.map((m,i)=>{
                        const v=parseFloat(editVal.replace(",","."));
                        const pc=v*m.g/100;
                        return(
                          <span key={i} style={{background:"#E8F5EC",color:"#155724",borderRadius:8,padding:"3px 9px",fontSize:11,fontWeight:600}}>
                            {m.label} → R$ {pc.toFixed(2).replace(".",",")}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {isCustom&&(
                    <button className="btn" onClick={()=>{resetPrice(food);setEditId(null);}}
                      style={{background:"#FDECEA",color:"#C0392B",borderRadius:8,padding:"6px",fontSize:11,fontWeight:600}}>
                      ↩ Restaurar preço original (R$ {(food.price||0).toFixed(2).replace(".",",")}/100g)
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset all */}
      {editedCount>0&&(
        <button className="btn" onClick={()=>setCustomPrices({})}
          style={{background:"#FDECEA",color:"#C0392B",borderRadius:10,padding:"11px",fontSize:13,fontWeight:600,border:"1px solid #F4CCCC"}}>
          ↩ Restaurar todos os preços originais ({editedCount} editado{editedCount>1?"s":""})
        </button>
      )}
    </div>
  );
}

// ── ReceitasTab ───────────────────────────────────────────────────────────────
const RECEITAS = [
  // ── CAFÉ DA MANHÃ ──────────────────────────────────────────────────────────
  {
    id:"cafe1", meal:"cafe", mealLabel:"Café da Manhã", icon:"☕",
    name:"Bowl Proteico de Iogurte",
    desc:"Café da manhã rápido, rico em proteína e fibras. Sem açúcar, muito saboroso e fácil de montar.",
    cal:320, tempo:"5 min", dificuldade:"Fácil",
    cor:"#C8E0F4",
    ingredientes:[
      {q:"1 pote (170g)", item:"Iogurte grego natural (ou Batavo Pense Zero)", cal:97*1.7, prot:9*1.7,
        precoRef:5.90, precoDesc:"pote 170g", loja:"Irani / supermercados"},
      {q:"1 scoop (30g)", item:"Whey concentrado Growth (baunilha ou natural)", cal:114, prot:22,
        precoRef:4.50, precoDesc:"por dose (kg ~R$149)", loja:"Lojas de suplemento / online"},
      {q:"3 col. sopa (30g)", item:"Granola zero açúcar", cal:98, prot:3.3,
        precoRef:1.20, precoDesc:"por 30g (pct 300g ~R$12)", loja:"Irani / supermercados"},
      {q:"5 morangos (75g)", item:"Morango fresco (ou banana picada)", cal:24, prot:0.5,
        precoRef:1.50, precoDesc:"bandeja 300g ~R$6", loja:"Feira / Irani Hortifruti"},
    ],
    preparo:[
      "Coloque o iogurte numa tigela funda.",
      "Misture o whey diretamente no iogurte até dissolver bem (fica como um creme).",
      "Adicione a granola por cima para manter o crocante.",
      "Finalize com os morangos ou fruta de preferência.",
    ],
    dica:"💡 Se usar Batavo Pense Zero, fica com aprox. 265 kcal e ainda mais proteína por kcal.",
    importItems:[
      {foodId:7,  measureIndex:1}, // iogurte grego pote grande
      {foodId:42, measureIndex:0}, // whey 1 scoop
      {foodId:112,measureIndex:0}, // granola zero
      {foodId:50, measureIndex:0}, // morango
    ],
  },
  {
    id:"cafe2", meal:"cafe", mealLabel:"Café da Manhã", icon:"☕",
    name:"Panqueca de Aveia com Ovo",
    desc:"2 ingredientes, 10 minutos, muita proteína. Pode adicionar whey na massa para turbinar.",
    cal:280, tempo:"10 min", dificuldade:"Fácil",
    cor:"#F5D87A",
    ingredientes:[
      {q:"40g (~1/2 xícara)", item:"Aveia em flocos", cal:147, prot:5.6,
        precoRef:0.90, precoDesc:"por 40g (500g ~R$11)", loja:"Irani Mercearia"},
      {q:"2 ovos", item:"Ovo inteiro", cal:155, prot:13,
        precoRef:1.60, precoDesc:"2 ovos (dz ~R$9,50)", loja:"Irani Feira"},
      {q:"1 scoop (30g) — opcional", item:"Whey baunilha (mistura na massa)", cal:114, prot:22,
        precoRef:4.50, precoDesc:"por dose", loja:"Suplementos"},
      {q:"1 col. chá (5g)", item:"Azeite de oliva para untar", cal:44, prot:0,
        precoRef:0.40, precoDesc:"por 5g (500ml ~R$40)", loja:"Irani Mercearia"},
    ],
    preparo:[
      "Bata os ovos com a aveia (e o whey se quiser) no liquidificador por 30 segundos.",
      "Aqueça uma frigideira antiaderente com azeite em fogo médio.",
      "Despeje a massa formando 2 panquecas médias.",
      "Cozinhe por 2-3 min de cada lado até dourar.",
      "Sirva com geleia zero açúcar ou banana amassada por cima.",
    ],
    dica:"💡 Com whey baunilha a massa fica naturalmente adocicada, sem precisar de açúcar.",
    importItems:[
      {foodId:113,measureIndex:1}, // aveia 1/2 xicara
      {foodId:4,  measureIndex:1}, // 2 ovos
      {foodId:29, measureIndex:0}, // azeite 1 col cha
    ],
  },
  {
    id:"cafe3", meal:"cafe", mealLabel:"Café da Manhã", icon:"☕",
    name:"Tapioca Proteica com Cottage",
    desc:"Café da manhã brasileiro, leve e equilibrado. A tapioca é fonte de carbo rápido e o cottage garante a proteína.",
    cal:260, tempo:"5 min", dificuldade:"Fácil",
    cor:"#F0E8D8",
    ingredientes:[
      {q:"80g (tapioca media)", item:"Tapioca (goma de tapioca hidratada)", cal:267, prot:0.6,
        precoRef:1.20, precoDesc:"por 80g (500g ~R$7,50)", loja:"Irani Mercearia"},
      {q:"100g (~1/2 xícara)", item:"Queijo cottage", cal:98, prot:11,
        precoRef:3.80, precoDesc:"pote 200g ~R$7,60", loja:"Irani Frios"},
      {q:"1 fatia (20g)", item:"Peito de peru fatiado (opcional, para mais proteína)", cal:22, prot:3.6,
        precoRef:1.50, precoDesc:"por fatia (200g ~R$15)", loja:"Irani Frios"},
      {q:"2 rodelas (40g)", item:"Tomate fatiado", cal:7, prot:0.4,
        precoRef:0.60, precoDesc:"tomate kg ~R$5,90", loja:"Irani Hortifruti"},
    ],
    preparo:[
      "Aqueça a frigideira antiaderente sem gordura em fogo médio.",
      "Despeje a goma de tapioca e espalhe em círculo com aprox. 20cm de diâmetro.",
      "Quando a borda endurecer (~2 min), vire com uma espátula.",
      "Recheie com o cottage, peito de peru e tomate.",
      "Dobre ao meio e sirva imediatamente.",
    ],
    dica:"💡 Adicione folhas de rúcula ou manjericão para dar sabor sem calorias.",
    importItems:[
      {foodId:63, measureIndex:1}, // tapioca media
      {foodId:6,  measureIndex:1}, // cottage 100g
      {foodId:77, measureIndex:0}, // peito de peru 1 fatia
      {foodId:20, measureIndex:0}, // tomate 2 rodelas
    ],
  },

  // ── JANTAR ─────────────────────────────────────────────────────────────────
  {
    id:"janta1", meal:"jantar", mealLabel:"Jantar", icon:"🌙",
    name:"Hambúrguer Caseiro de Patinho",
    desc:"Hambúrguer fitness feito com carne magra. Nutritivo, saciante e muito mais saudável que fast-food.",
    cal:480, tempo:"20 min", dificuldade:"Média",
    cor:"#C97B5A",
    ingredientes:[
      {q:"120g (~1 palma)", item:"Carne moída patinho (moldada em hambúrguer)", cal:276, prot:31,
        precoRef:5.40, precoDesc:"120g (kg ~R$44,90)", loja:"Irani Açougue"},
      {q:"1 unidade (50g)", item:"Pão francês (ou pão integral — 2 fatias)", cal:150, prot:4,
        precoRef:0.80, precoDesc:"1 unidade (6 un ~R$4,90)", loja:"Irani Padaria"},
      {q:"100g (prato raso)", item:"Alface picada", cal:15, prot:1.3,
        precoRef:0.70, precoDesc:"pé alface ~R$2,90", loja:"Irani Hortifruti"},
      {q:"4 rodelas (80g)", item:"Tomate em rodelas", cal:14, prot:0.7,
        precoRef:0.50, precoDesc:"tomate kg ~R$5,90", loja:"Irani Hortifruti"},
      {q:"8 rodelas (80g)", item:"Pepino em rodelas", cal:12, prot:0.6,
        precoRef:0.60, precoDesc:"pepino un ~R$2,50", loja:"Irani Hortifruti"},
      {q:"1 col. sopa (17g)", item:"Ketchup Heinz (opcional)", cal:15, prot:0.3,
        precoRef:0.50, precoDesc:"frasco 397g ~R$11,90", loja:"Irani Mercearia"},
    ],
    preparo:[
      "Tempere a carne moída com sal, pimenta, alho e ervas a gosto. Molde 1 hambúrguer de 120g (~2cm de espessura).",
      "Grelhe em frigideira antiaderente quente, sem gordura, por 4-5 min de cada lado.",
      "Enquanto grelha, prepare as folhas e legumes.",
      "Monte: base do pão → alface → hambúrguer → tomate → pepino → ketchup → tampa.",
      "Sirva com a salada de pepino e tomate ao lado.",
    ],
    dica:"💡 Use 90g de carne para versão mais light (~380 kcal). O segredo do suculento é não apertar demais ao grelhar.",
    importItems:[
      {foodId:76, measureIndex:1}, // carne moida 1 palma
      {foodId:12, measureIndex:0}, // pao frances
      {foodId:19, measureIndex:2}, // alface prato
      {foodId:20, measureIndex:1}, // tomate 4 rodelas
      {foodId:67, measureIndex:1}, // pepino 8 rodelas
      {foodId:108,measureIndex:0}, // ketchup
    ],
  },
  {
    id:"janta2", meal:"jantar", mealLabel:"Jantar", icon:"🌙",
    name:"Hambúrguer de Frango na Frigideira",
    desc:"Versão ainda mais leve com peito de frango moído ou picado. Surpreendentemente saboroso!",
    cal:400, tempo:"20 min", dificuldade:"Média",
    cor:"#E8C07D",
    ingredientes:[
      {q:"120g (~1 palma)", item:"Frango peito moído/picado fino", cal:198, prot:37,
        precoRef:3.60, precoDesc:"120g (kg ~R$29,90)", loja:"Irani Açougue"},
      {q:"2 fatias (50g)", item:"Pão de forma integral", cal:120, prot:4.5,
        precoRef:0.90, precoDesc:"2 fatias (pct 500g ~R$8,90)", loja:"Irani Padaria/Mercearia"},
      {q:"60g (porção media)", item:"Alface picada", cal:9, prot:0.8,
        precoRef:0.50, precoDesc:"pé alface ~R$2,90", loja:"Irani Hortifruti"},
      {q:"4 rodelas (80g)", item:"Tomate em rodelas", cal:14, prot:0.7,
        precoRef:0.50, precoDesc:"tomate kg ~R$5,90", loja:"Irani Hortifruti"},
      {q:"1 col. sopa (25g)", item:"Requeijão light (no pão, como substituto da maionese)", cal:43, prot:2,
        precoRef:0.80, precoDesc:"copo 200g ~R$6,50", loja:"Irani Frios"},
      {q:"1 col. chá (5g)", item:"Azeite de oliva (para grelhar)", cal:44, prot:0,
        precoRef:0.40, precoDesc:"por 5g (500ml ~R$40)", loja:"Irani Mercearia"},
    ],
    preparo:[
      "Tempere o frango picado com sal, pimenta, 1 dente de alho amassado e cheiro-verde.",
      "Modele 1 hambúrguer compacto de 120g.",
      "Grelhe no azeite quente por 5-6 min de cada lado (frango precisa cozinhar bem por dentro).",
      "Passe requeijão light nas fatias de pão.",
      "Monte: pão → alface → hambúrguer de frango → tomate.",
    ],
    dica:"💡 Adicione 1 col. sopa de mostarda (10 kcal) para dar sabor sem comprometer a dieta.",
    importItems:[
      {foodId:1,  measureIndex:1}, // frango 1 palma
      {foodId:46, measureIndex:1}, // pao integral 2 fatias
      {foodId:19, measureIndex:1}, // alface porcao media
      {foodId:20, measureIndex:1}, // tomate 4 rodelas
      {foodId:60, measureIndex:0}, // requeijao light
      {foodId:29, measureIndex:0}, // azeite
    ],
  },
  {
    id:"janta3", meal:"jantar", mealLabel:"Jantar", icon:"🌙",
    name:"Wrap de Frango com Couve e Pepino",
    desc:"Jantar leve, sem pão, alto em proteína. Usa alface ou couve como embrulho — crocante e refrescante.",
    cal:310, tempo:"15 min", dificuldade:"Fácil",
    cor:"#6AAF6E",
    ingredientes:[
      {q:"120g (~1 palma)", item:"Frango peito grelhado e desfiado", cal:198, prot:37,
        precoRef:3.60, precoDesc:"120g (kg ~R$29,90)", loja:"Irani Açougue"},
      {q:"4 folhas grandes", item:"Alface americana (ou couve manteiga) como wrap", cal:10, prot:0.8,
        precoRef:0.70, precoDesc:"pé alface ~R$2,90", loja:"Irani Hortifruti"},
      {q:"8 rodelas (80g)", item:"Pepino em rodelas finas", cal:12, prot:0.6,
        precoRef:0.60, precoDesc:"pepino un ~R$2,50", loja:"Irani Hortifruti"},
      {q:"2 rodelas (40g)", item:"Tomate em rodelas", cal:7, prot:0.4,
        precoRef:0.30, precoDesc:"tomate kg ~R$5,90", loja:"Irani Hortifruti"},
      {q:"50g (~2 col. sopa)", item:"Queijo cottage (como molho cremoso)", cal:49, prot:5.5,
        precoRef:1.90, precoDesc:"50g (200g ~R$7,60)", loja:"Irani Frios"},
      {q:"1 col. chá (5g)", item:"Azeite + limão para temperar", cal:44, prot:0,
        precoRef:0.40, precoDesc:"por 5g", loja:"Irani Mercearia"},
    ],
    preparo:[
      "Grelhe o frango com sal, alho e pimenta. Desfie ou corte em tiras.",
      "Tempere o cottage com sal, limão e azeite (vira um molho cremoso rápido).",
      "Lave e seque bem as folhas de alface — elas são a 'tortilha'.",
      "Monte em cada folha: cottage → frango → pepino → tomate.",
      "Enrole e prenda com palito de dente.",
    ],
    dica:"💡 Sem carboidrato do pão, ideal para quem está em deficit calórico. Adicione 1/2 abacate (+120 kcal) para mais saciedade.",
    importItems:[
      {foodId:1,  measureIndex:1}, // frango 1 palma
      {foodId:19, measureIndex:1}, // alface
      {foodId:67, measureIndex:1}, // pepino 8 rodelas
      {foodId:20, measureIndex:0}, // tomate 2 rodelas
      {foodId:6,  measureIndex:0}, // cottage 50g
      {foodId:29, measureIndex:0}, // azeite
    ],
  },
];

function ReceitasTab({ setActiveTab, setTargetMeal, addItem, MEALS_REF }) {
  const [filter, setFilter] = useState("todos");
  const [openId, setOpenId] = useState(null);
  const [imported, setImported] = useState({});

  const shown = RECEITAS.filter(r => filter==="todos" || r.meal===filter);

  function importarReceita(r) {
    if(!addItem) return;
    const mealDef = MEALS_REF.find(m=>m.id===r.meal);
    r.importItems.forEach((it, idx) => {
      const food = FOODS.find(f=>f.id===it.foodId);
      if(!food) return;
      const measure = food.measures[it.measureIndex] || food.measures[0];
      // stagger ids to avoid collision
      setTimeout(()=>addItem(food, measure, r.meal), idx*5);
    });
    setImported(p=>({...p,[r.id]:true}));
    setActiveTab("cardapio");
  }

  return (
    <div className="sl" style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
      <div style={{background:"linear-gradient(135deg,#1A3020,#2E6040)",borderRadius:16,padding:"18px",color:"#E8F5ED"}}>
        <div style={{fontSize:32,marginBottom:8}}>👨‍🍳</div>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:4}}>Receitas Saudáveis</p>
        <p style={{fontSize:13,opacity:.85,lineHeight:1.5}}>
          Receitas práticas, baixas em caloria e ricas em proteína — perfeitas para o <strong>café da manhã</strong> e o <strong>jantar</strong> em casa.
        </p>
        <p style={{fontSize:11,opacity:.65,marginTop:8}}>
          💰 Preços de referência: Irani Tancredo Neves / Cascavel-PR (estimativa 2025)
        </p>
      </div>

      <div className="seg">
        <button className={`seg-btn ${filter==="todos"?"on":""}`} onClick={()=>setFilter("todos")}>Todas (6)</button>
        <button className={`seg-btn ${filter==="cafe"?"on":""}`} onClick={()=>setFilter("cafe")}>☕ Café (3)</button>
        <button className={`seg-btn ${filter==="jantar"?"on":""}`} onClick={()=>setFilter("jantar")}>🌙 Jantar (3)</button>
      </div>

      {shown.map(r=>{
        const isOpen = openId===r.id;
        const totalPreco = r.ingredientes.reduce((s,i)=>s+(i.precoRef||0),0);
        return (
          <div key={r.id} className="card" style={{overflow:"hidden",border:`1.5px solid ${r.cor}66`}}>
            <div onClick={()=>setOpenId(isOpen?null:r.id)} style={{padding:"14px 16px",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{width:48,height:48,borderRadius:12,background:r.cor+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>
                  {r.meal==="cafe"?"🥣":"🍔"}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:3}}>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}>{r.name}</p>
                    <span style={{background:r.cor+"44",color:"#3A2010",padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:700}}>{r.mealLabel}</span>
                  </div>
                  <p style={{fontSize:12,color:"#8B7050",lineHeight:1.4,marginBottom:6}}>{r.desc}</p>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:700,color:"#5C3018"}}>🔥 {r.cal} kcal</span>
                    <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#8B7050"}}>⏱️ {r.tempo}</span>
                    <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#286028",fontWeight:700}}>
                      💰 ~R$ {totalPreco.toFixed(2).replace(".",",")}
                    </span>
                  </div>
                </div>
                <span style={{fontSize:12,color:"#A89878",display:"inline-block",transform:isOpen?"rotate(90deg)":"rotate(0)",transition:"transform .2s",flexShrink:0,marginTop:4}}>▶</span>
              </div>
            </div>

            {isOpen&&(
              <div style={{borderTop:`1px solid ${r.cor}44`,padding:"14px 16px",display:"flex",flexDirection:"column",gap:14}}>

                {/* Ingredientes com preços */}
                <div>
                  <p style={{fontWeight:700,fontSize:11,color:"#5C3018",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>🛒 Ingredientes e Custos</p>
                  <div style={{borderRadius:10,overflow:"hidden",border:"1px solid #EDE5D8"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 44px 44px 80px",gap:4,padding:"6px 10px",background:"#EDE5D8"}}>
                      <span style={{fontSize:10,color:"#8B7050",fontWeight:700}}>Ingrediente</span>
                      <span style={{fontSize:10,color:"#E8A07D",fontWeight:700,textAlign:"right"}}>Kcal</span>
                      <span style={{fontSize:10,color:"#C97B5A",fontWeight:700,textAlign:"right"}}>Prot</span>
                      <span style={{fontSize:10,color:"#286028",fontWeight:700,textAlign:"right"}}>Custo</span>
                    </div>
                    {r.ingredientes.map((ing,i)=>(
                      <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 44px 44px 80px",gap:4,padding:"9px 10px",borderTop:"1px dashed #EDE5D8",background:i%2===0?"#FDFAF4":"#FAF6EF"}}>
                        <div>
                          <p style={{fontSize:12,fontWeight:600,lineHeight:1.3}}>{ing.item}</p>
                          <p style={{fontSize:10,color:"#A89878"}}>{ing.q}</p>
                          <p style={{fontSize:9,color:"#90C070"}}>📍 {ing.loja}</p>
                        </div>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:"#5C3018",textAlign:"right",alignSelf:"center"}}>{Math.round(ing.cal)}</span>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:12,fontWeight:700,color:"#C97B5A",textAlign:"right",alignSelf:"center"}}>{Math.round(ing.prot)}g</span>
                        <div style={{textAlign:"right",alignSelf:"center"}}>
                          <p style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:"#286028"}}>R$ {(ing.precoRef||0).toFixed(2).replace(".",",")}</p>
                          <p style={{fontSize:9,color:"#8B7050"}}>{ing.precoDesc}</p>
                        </div>
                      </div>
                    ))}
                    {/* Total row */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 44px 44px 80px",gap:4,padding:"9px 10px",background:"#F0E8DC",borderTop:"2px solid #C8B8A0"}}>
                      <span style={{fontWeight:700,fontSize:13,color:"#2C1A0E"}}>Total da receita</span>
                      <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#5C3018",textAlign:"right"}}>{r.cal}</span>
                      <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:"#C97B5A",textAlign:"right"}}>{Math.round(r.ingredientes.reduce((s,i)=>s+i.prot,0))}g</span>
                      <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#286028",textAlign:"right"}}>R$ {totalPreco.toFixed(2).replace(".",",")}</span>
                    </div>
                  </div>
                  <p style={{fontSize:10,color:"#A89878",marginTop:6}}>* Preços estimados com base em valores praticados no Irani Tancredo Neves e mercados de Cascavel-PR. Podem variar.</p>
                </div>

                {/* Modo de preparo */}
                <div>
                  <p style={{fontWeight:700,fontSize:11,color:"#5C3018",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>👨‍🍳 Modo de Preparo</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {r.preparo.map((passo,i)=>(
                      <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                        <div style={{width:22,height:22,borderRadius:"50%",background:r.cor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"white",flexShrink:0,marginTop:1}}>{i+1}</div>
                        <p style={{fontSize:13,color:"#2A2420",lineHeight:1.5,flex:1}}>{passo}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{background:`${r.cor}22`,border:`1px solid ${r.cor}66`,borderRadius:10,padding:"10px 12px"}}>
                  <p style={{fontSize:12,color:"#3A2010",lineHeight:1.5}}>{r.dica}</p>
                </div>

                {/* IMPORT BUTTON */}
                <button className="btn" onClick={()=>importarReceita(r)}
                  style={{background:imported[r.id]?"linear-gradient(135deg,#155724,#286028)":"linear-gradient(135deg,#1A3020,#2E6040)",color:"#E8F5ED",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {imported[r.id]
                    ? <><span>✅</span> Importado para o Cardápio!</>
                    : <><span>📥</span> Importar para o Cardápio — {r.mealLabel}</>
                  }
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── MacroTotalsRow ────────────────────────────────────────────────────────────
function MacroTotalsRow({ items }) {
  let tP=0,tC=0,tF=0;
  items.forEach(it=>{
    const fd=FOODS.find(f=>f.id===it.foodId);
    if(!fd||!fd.macro) return;
    const q=it.qty||1;
    tP+=fd.macro.p*it.grams/100*q;
    tC+=fd.macro.c*it.grams/100*q;
    tF+=fd.macro.f*it.grams/100*q;
  });
  if(tP+tC+tF<1) return null;
  return(
    <div style={{display:"flex",gap:8,padding:"7px 4px 2px",borderTop:"1px solid #EDE5D8",marginTop:2}}>
      <span style={{fontSize:10,color:"#8B7050",fontWeight:600}}>Macros:</span>
      <span style={{fontSize:10,fontWeight:700,color:"#C97B5A"}}>Prot. {Math.round(tP)}g</span>
      <span style={{fontSize:10,fontWeight:700,color:"#A08040"}}>Carb. {Math.round(tC)}g</span>
      <span style={{fontSize:10,fontWeight:700,color:"#4A8050"}}>Gord. {Math.round(tF)}g</span>
    </div>
  );
}

// ── SubstituicoesContent ──────────────────────────────────────────────────────
function SubstituicoesContent({ subTarget, subResults, subMode, setSubMode, subSearch, setSubSearch, applySub, calcCal }) {
  const mealDef = MEALS.find(m=>m.id===subTarget.mealId);
  const allowedGroups = MEAL_GROUPS[subTarget.mealId] || [];
  const browseFiltered = FOODS.filter(f =>
    f.id !== subTarget.foodId &&
    (subSearch.trim()==="" || f.name.toLowerCase().includes(subSearch.toLowerCase()))
  );
  return (
    <>
      <div style={{background:"linear-gradient(135deg,#5C3018,#2C1A0E)",borderRadius:13,padding:"14px 16px",color:"#F5E8D0",marginBottom:10}}>
        <p style={{fontSize:10,opacity:.6,textTransform:"uppercase",letterSpacing:".15em",marginBottom:3}}>{mealDef?.icon} {mealDef?.label} · Substituindo</p>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700}}>{subTarget.name}</p>
        <p style={{fontSize:13,opacity:.8}}>{subTarget.measure} · {subTarget.cal} kcal</p>
      </div>
      <div className="seg" style={{marginBottom:12}}>
        <button className={`seg-btn ${subMode==="smart"?"on":""}`} onClick={()=>{setSubMode("smart");setSubSearch("");}}>✨ Sugestoes inteligentes</button>
        <button className={`seg-btn ${subMode==="browse"?"on":""}`} onClick={()=>setSubMode("browse")}>🔍 Buscar qualquer alimento</button>
      </div>
      {subMode==="smart"&&(
        <>
          <div style={{marginBottom:10}}>
            <p style={{fontSize:11,color:"#8B7050",marginBottom:5}}>Opcoes com <strong>±15% de calorias</strong> adequadas para <strong>{mealDef?.label}</strong>:</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {allowedGroups.map(g=>(
                <span key={g} style={{background:"#EDE5D8",color:"#5C3018",padding:"2px 9px",borderRadius:12,fontSize:11,fontWeight:600}}>
                  {GROUP_ICONS[g]} {g}
                </span>
              ))}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {subResults.length===0
              ? <div style={{textAlign:"center",padding:"20px 16px",background:"#FDFAF4",borderRadius:12,border:"1px solid #E8E0D0"}}>
                  <p style={{color:"#A89878",fontSize:13,marginBottom:6}}>Nenhuma substituicao automatica encontrada.</p>
                  <button className="btn" onClick={()=>setSubMode("browse")} style={{background:"#EDE5D8",color:"#5C3018",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600}}>Buscar manualmente →</button>
                </div>
              : subResults.map((r,i)=>(
                <div key={i} className="card" style={{padding:"11px 13px",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:8,background:r.food.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{GROUP_ICONS[r.food.group]||"🍴"}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                      <p style={{fontWeight:700,fontSize:13}}>{r.food.name}</p>
                      <span style={{background:"#EDE5D8",color:"#5C3018",padding:"1px 6px",borderRadius:10,fontSize:10,fontWeight:700}}>{r.food.group}</span>
                    </div>
                    <p style={{fontSize:11,color:"#8B7050"}}>{r.measure.label}</p>
                    <div style={{display:"flex",gap:5,marginTop:2}}>
                      <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:"#5C3018"}}>{r.cal} kcal</span>
                      <span className="tag" style={{background:r.diff===0?"#D4EDDA":"#FFF3CD",color:r.diff===0?"#155724":"#856404"}}>{r.diff===0?"= igual":`${r.cal>subTarget.cal?"+":"-"}${r.diff} kcal`}</span>
                    </div>
                  </div>
                  <button className="btn" onClick={()=>applySub(subTarget,r.food,r.measure)} style={{background:"#5C3018",color:"#F5E8D0",borderRadius:9,padding:"7px 12px",fontWeight:700,fontSize:12,flexShrink:0}}>Usar</button>
                </div>
              ))
            }
          </div>
        </>
      )}
      {subMode==="browse"&&(
        <>
          <input className="inp" placeholder="Buscar qualquer alimento..." value={subSearch} onChange={e=>setSubSearch(e.target.value)} style={{marginBottom:10}}/>
          <p style={{fontSize:11,color:"#8B7050",marginBottom:8}}>{browseFiltered.length} alimentos · toque em uma porcao para substituir</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {browseFiltered.map(food=>(
              <div key={food.id} className="card" style={{padding:"11px 13px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{width:32,height:32,borderRadius:8,background:food.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{GROUP_ICONS[food.group]||"🍴"}</div>
                  <div>
                    <p style={{fontWeight:700,fontSize:13}}>{food.name}</p>
                    <span style={{background:"#EDE5D8",color:"#5C3018",padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>{food.group}</span>
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {food.measures.map((m,i)=>{
                    const c=calcCal(food,m.g,subTarget.cooked);
                    const pct=subTarget.cal>0?Math.round(Math.abs(c-subTarget.cal)/subTarget.cal*100):0;
                    return(
                      <button key={i} className="btn" onClick={()=>applySub(subTarget,food,m)}
                        style={{background:food.color+"22",border:`1.5px solid ${food.color}88`,borderRadius:18,padding:"5px 10px",fontSize:11,fontWeight:600,color:"#2A2420",display:"flex",alignItems:"center",gap:4}}>
                        {m.label}
                        <span style={{fontSize:10,opacity:.75}}>· {c} kcal</span>
                        {pct<=15&&<span style={{background:"#D4EDDA",color:"#155724",borderRadius:8,padding:"0 5px",fontSize:9,fontWeight:700}}>≈</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ── Meal Macro Pie Chart ──────────────────────────────────────────────────────
function MealPieChart({ items }) {
  let totP=0, totC=0, totF=0;
  items.forEach(item=>{
    const food=FOODS.find(f=>f.id===item.foodId);
    if(!food||!food.macro) return;
    const q=item.qty||1, g=item.grams;
    totP += food.macro.p * g/100 * q;
    totC += food.macro.c * g/100 * q;
    totF += food.macro.f * g/100 * q;
  });
  const total = totP+totC+totF;
  if(total<1) return null;
  const pP=totP/total, pC=totC/total, pF=totF/total;
  const size=44, r=18, cx=22, cy=22;
  function slice(pct, start) {
    if(pct<=0) return "";
    if(pct>=1) pct=0.9999;
    const a=start*Math.PI*2-Math.PI/2, b=(start+pct)*Math.PI*2-Math.PI/2;
    const x1=cx+r*Math.cos(a), y1=cy+r*Math.sin(a);
    const x2=cx+r*Math.cos(b), y2=cy+r*Math.sin(b);
    return `M${cx},${cy} L${x1},${y1} A${r},${r},0,${pct>0.5?1:0},1,${x2},${y2} Z`;
  }
  const s1=0, s2=s1+pP, s3=s2+pC;
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
      <svg width={size} height={size} style={{flexShrink:0}}>
        {pP>0&&<path d={slice(pP,s1)} fill="#E8A07D"/>}
        {pC>0&&<path d={slice(pC,s2)} fill="#F7ECC8"/>}
        {pF>0&&<path d={slice(pF,s3)} fill="#90C97E"/>}
        <circle cx={cx} cy={cy} r={10} fill="white"/>
      </svg>
      <div style={{fontSize:9,lineHeight:1.6}}>
        <div style={{color:"#C97B5A",fontWeight:700}}>P {Math.round(pP*100)}%</div>
        <div style={{color:"#A08040",fontWeight:700}}>C {Math.round(pC*100)}%</div>
        <div style={{color:"#4A8050",fontWeight:700}}>G {Math.round(pF*100)}%</div>
      </div>
    </div>
  );
}

// ── Nutrient Analysis Component ───────────────────────────────────────────────
function NutrientAnalysis({ menu, dailyGoal, totalCal, weight, onGoToAlimentos }) {
  const groupsPresent = new Set(menu.map(i => i.group));

  // Calculate total protein consumed
  const totalProteinG = menu.reduce((sum, item) => {
    const food = FOODS.find(f => f.id === item.foodId);
    if (!food || !food.macro) return sum;
    return sum + food.macro.p * item.grams / 100 * (item.qty||1);
  }, 0);
  const proteinGoalG = weight > 0 ? weight * 2 : null;
  const proteinOk = proteinGoalG ? totalProteinG >= proteinGoalG * 0.85 : true;
  const checks = [
    {
      key:"proteina", label:"Proteina", icon:"🥩",
      ok: groupsPresent.has("Proteina") || groupsPresent.has("Suplemento"),
      tip:"Adicione uma fonte de proteina (frango, ovo, atum, iogurte grego, whey) para preservar massa muscular e aumentar saciedade.",
      mealHint:"Cafe, Almoco ou Jantar"
    },
    {
      key:"vegetal", label:"Vegetais", icon:"🥦",
      ok: groupsPresent.has("Vegetal"),
      tip:"Inclua pelo menos 1 porcao de vegetais (brocolis, cenoura, abobrinha, alface) para fibras, vitaminas e minerais essenciais.",
      mealHint:"Almoco ou Jantar"
    },
    {
      key:"fruta", label:"Frutas", icon:"🍎",
      ok: groupsPresent.has("Fruta"),
      tip:"Adicione uma fruta ao dia (banana, maca, laranja) para vitamina C, potassio e fibras naturais.",
      mealHint:"Lanche da Manha ou Tarde"
    },
    {
      key:"carbo", label:"Carboidratos", icon:"🍚",
      ok: groupsPresent.has("Carboidrato"),
      tip:"Inclua uma fonte de carboidrato (arroz, batata doce, aveia, pao integral) para energia sustentada ao longo do dia.",
      mealHint:"Cafe da Manha ou Almoco"
    },
    {
      key:"laticinios", label:"Calcio / Laticinios", icon:"🥛",
      ok: groupsPresent.has("Laticinios") || groupsPresent.has("Bebida"),
      tip:"Adicione leite ou iogurte para calcio e proteinas. Uma xicara de leite ou um pote de iogurte ja cobre bem esse grupo.",
      mealHint:"Cafe da Manha ou Ceia"
    },
    {
      key:"leguminosa", label:"Leguminosas / Fibras", icon:"🫘",
      ok: groupsPresent.has("Leguminosa"),
      tip:"Feijao, lentilha ou grao-de-bico fornecem fibras soluveis, ferro e proteina vegetal. Uma concha no almoco ou jantar e suficiente.",
      mealHint:"Almoco ou Jantar"
    },
    {
      key:"gordura", label:"Gordura boa", icon:"🫒",
      ok: groupsPresent.has("Gordura"),
      tip:"Inclua uma gordura saudavel (azeite, abacate, castanha) para absorcao de vitaminas liposoluveis e saude cardiovascular.",
      mealHint:"Almoco ou Jantar"
    },
  ];

  const missing = checks.filter(c => !c.ok);
  const calOk = totalCal >= dailyGoal * 0.85 && totalCal <= dailyGoal * 1.05;
  const calLow = totalCal < dailyGoal * 0.85;
  const calOver = totalCal > dailyGoal * 1.05;

  if (missing.length === 0 && calOk && proteinOk) {
    return (
      <div className="card" style={{padding:"14px 16px",background:"#F0FAF2",border:"1px solid #90C97E",marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:28}}>✅</span>
          <div>
            <p style={{fontWeight:700,fontSize:14,color:"#155724"}}>Cardapio equilibrado!</p>
            <p style={{fontSize:12,color:"#286028"}}>Todos os grupos nutricionais estao cobertos e as calorias estao dentro da meta.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{padding:"16px",marginTop:4,border:"1px solid #E8C07D",background:"#FFFBF2"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{fontSize:22}}>🔎</span>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#5C3018"}}>Analise Nutricional</p>
      </div>

      {/* Protein goal */}
      {proteinGoalG && (
        <div style={{background:proteinOk?"#F0FAF2":"#FFF3CD",border:`1px solid ${proteinOk?"#90C97E":"#FFD966"}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:proteinOk?0:4}}>
            <span>{proteinOk?"✅":"🥩"}</span>
            <div style={{flex:1}}>
              <p style={{fontWeight:700,fontSize:13,color:proteinOk?"#155724":"#856404"}}>
                Proteina: {Math.round(totalProteinG)}g / {Math.round(proteinGoalG)}g necessarios
              </p>
              <p style={{fontSize:11,color:proteinOk?"#286028":"#856404"}}>
                Meta: 2g por kg de peso corporal ({weight}kg)
              </p>
            </div>
            <div style={{background:proteinOk?"#D4EDDA":"#FFF0B8",borderRadius:8,padding:"3px 9px",fontSize:12,fontWeight:700,color:proteinOk?"#155724":"#856404"}}>
              {Math.round(totalProteinG/proteinGoalG*100)}%
            </div>
          </div>
          {!proteinOk&&(
            <p style={{fontSize:12,color:"#856404",marginTop:4}}>
              Faltam <strong>{Math.round(proteinGoalG-totalProteinG)}g</strong> de proteina. Adicione frango, ovo, atum, iogurte grego ou whey nas proximas refeicoes.
            </p>
          )}
        </div>
      )}

      {/* Calorie status */}
      {calLow&&(
        <div style={{background:"#FFF3CD",border:"1px solid #FFD966",borderRadius:10,padding:"10px 12px",marginBottom:10,display:"flex",gap:8}}>
          <span>⚡</span>
          <div>
            <p style={{fontWeight:700,fontSize:13,color:"#856404"}}>Calorias abaixo da meta</p>
            <p style={{fontSize:12,color:"#856404"}}>Voce consumiu {totalCal} kcal mas sua meta e {dailyGoal} kcal. Faltam {dailyGoal-totalCal} kcal. Um deficit muito grande pode levar a perda de massa muscular.</p>
          </div>
        </div>
      )}
      {calOver&&(
        <div style={{background:"#FDECEA",border:"1px solid #F4CCCC",borderRadius:10,padding:"10px 12px",marginBottom:10,display:"flex",gap:8}}>
          <span>⚠️</span>
          <div>
            <p style={{fontWeight:700,fontSize:13,color:"#C0392B"}}>Calorias acima da meta</p>
            <p style={{fontSize:12,color:"#C0392B"}}>Voce consumiu {totalCal-dailyGoal} kcal acima da meta. Considere reduzir porcoes ou trocar algum item no Cardapio.</p>
          </div>
        </div>
      )}

      {/* Missing groups */}
      {missing.length > 0 && (
        <div>
          <p style={{fontSize:12,color:"#8B7050",marginBottom:8}}>Grupos nutricionais ausentes ou com baixa cobertura:</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {missing.map(c=>(
              <div key={c.key} style={{background:"#FFF8F0",border:"1px solid #E8C07D",borderRadius:10,padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:18}}>{c.icon}</span>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:700,fontSize:13,color:"#5C3018"}}>{c.label}</p>
                    <p style={{fontSize:10,color:"#A89878"}}>Sugerido para: {c.mealHint}</p>
                  </div>
                  <span style={{background:"#FDECEA",color:"#C0392B",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700}}>ausente</span>
                </div>
                <p style={{fontSize:12,color:"#7A4A00",lineHeight:1.5}}>{c.tip}</p>
              </div>
            ))}
          </div>
          <button className="btn" onClick={onGoToAlimentos}
            style={{marginTop:12,width:"100%",background:"#5C3018",color:"#F5E8D0",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700}}>
            + Adicionar alimentos faltantes
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shopping List Category Component ─────────────────────────────────────────
function ShoppingCategory({ category }) {
  const [checked, setChecked] = useState({});
  const catIcons = {
    "Proteinas":"🥩","Frios":"🧊","Hortifruti":"🥦","Graos":"🌾","Cereais":"🌾",
    "Laticinios":"🥛","Padaria":"🍞","Suplementos":"💊","Outros":"📦"
  };
  const icon = Object.entries(catIcons).find(([k])=>category.category.toLowerCase().includes(k.toLowerCase()))?.[1] || "🛒";
  return (
    <div className="shop-cat">
      <div className="shop-cat-title"><span>{icon}</span>{category.category}</div>
      {category.items.map((item,i)=>(
        <div key={i} className="shop-item" onClick={()=>setChecked(p=>({...p,[i]:!p[i]}))}>
          <div className={`check-box ${checked[i]?"checked":""}`}>{checked[i]&&<span style={{color:"white",fontSize:11,fontWeight:700}}>✓</span>}</div>
          <span style={{textDecoration:checked[i]?"line-through":"none",color:checked[i]?"#A89878":"#2A2420",flex:1}}>{item}</span>
        </div>
      ))}
    </div>
  );
}
