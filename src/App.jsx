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
  cafe:    ["Carboidrato","Laticinios","Fruta","Proteina","Gordura","Suplemento","Bebida"],
  lanche1: ["Fruta","Laticinios","Carboidrato","Proteina","Gordura","Suplemento","Bebida"],
  almoco:  ["Proteina","Carboidrato","Leguminosa","Vegetal","Gordura"],
  lanche2: ["Fruta","Laticinios","Carboidrato","Proteina","Gordura","Suplemento","Bebida"],
  jantar:  ["Proteina","Carboidrato","Leguminosa","Vegetal","Gordura"],
  ceia:    ["Laticinios","Fruta","Carboidrato","Proteina","Suplemento","Bebida"],
};


const FOODS = [
  // macro: p=protein g, c=carb g, f=fat g per 100g
  { id:1,  name:"Frango (peito grelhado)",  rawCal:110, cookedCal:165, group:"Proteina",   color:"#E8C07D", macro:{p:31,c:0,f:3.6},
    measures:[{label:"1/2 palma da mao (80g)",g:80},{label:"1 palma da mao (120g)",g:120},{label:"1 palma cheia (150g)",g:150}]},
  { id:2,  name:"Bife bovino (patinho)",    rawCal:143, cookedCal:180, group:"Proteina",   color:"#C97B5A", macro:{p:26,c:0,f:6},
    measures:[{label:"1/2 palma da mao (80g)",g:80},{label:"1 palma da mao (120g)",g:120},{label:"1 palma cheia (150g)",g:150}]},
  { id:3,  name:"Atum em lata (natural)",   rawCal:128, cookedCal:128, group:"Proteina",   color:"#7BA7C4", macro:{p:28,c:0,f:1},
    measures:[{label:"Lata pequena (80g)",g:80},{label:"3 col. sopa (45g)",g:45},{label:"Lata grande (170g)",g:170}]},
  { id:4,  name:"Ovo cozido / mexido",      rawCal:143, cookedCal:155, group:"Proteina",   color:"#F5E080", macro:{p:13,c:1,f:11},
    measures:[{label:"1 ovo (50g)",g:50},{label:"2 ovos (100g)",g:100},{label:"3 ovos (150g)",g:150}]},
  { id:41, name:"Ovo frito (com oleo)",     rawCal:143, cookedCal:196, group:"Proteina",   color:"#F5C840", macro:{p:13,c:1,f:15},
    measures:[{label:"1 ovo frito (55g)",g:55},{label:"2 ovos fritos (110g)",g:110}]},
  { id:5,  name:"Salmao",                   rawCal:142, cookedCal:208, group:"Proteina",   color:"#F4A57A", macro:{p:25,c:0,f:12},
    measures:[{label:"1/2 palma da mao (100g)",g:100},{label:"1 palma da mao (150g)",g:150}]},
  { id:6,  name:"Queijo cottage",           rawCal:98,  cookedCal:98,  group:"Proteina",   color:"#D4E8C2", macro:{p:11,c:3,f:4},
    measures:[{label:"2 col. sopa (50g)",g:50},{label:"1/2 xicara (100g)",g:100}]},
  { id:42, name:"Whey concentrado Growth",  rawCal:380, cookedCal:380, group:"Suplemento", color:"#B8D4F0", macro:{p:74,c:8,f:4},
    measures:[{label:"1 scoop (30g)",g:30},{label:"2 scoops (60g)",g:60}]},
  { id:43, name:"Barra proteina Max Titanium", rawCal:330, cookedCal:330, group:"Suplemento", color:"#D0B8F0", macro:{p:33,c:30,f:7},
    measures:[{label:"1 barra (60g)",g:60},{label:"Meia barra (30g)",g:30}]},
  { id:7,  name:"Iogurte grego natural",    rawCal:97,  cookedCal:97,  group:"Laticinios", color:"#C8E0F4", macro:{p:9,c:4,f:5},
    measures:[{label:"Pote pequeno (80g)",g:80},{label:"Pote grande (170g)",g:170}]},
  { id:44, name:"Iogurte Batavo Pense Zero",rawCal:45,  cookedCal:45,  group:"Laticinios", color:"#A8D8F0", macro:{p:6,c:5,f:0},
    measures:[{label:"Pote 100g",g:100},{label:"Pote 170g",g:170}]},
  { id:30, name:"Leite desnatado",          rawCal:35,  cookedCal:35,  group:"Laticinios", color:"#E8F4FA", macro:{p:3.5,c:5,f:0.2},
    measures:[{label:"1/2 copo (100ml)",g:100},{label:"1 copo (200ml)",g:200}]},
  { id:57, name:"Leite integral",           rawCal:61,  cookedCal:61,  group:"Laticinios", color:"#F0E8D0", macro:{p:3.2,c:4.8,f:3.3},
    measures:[{label:"1/2 copo (100ml)",g:100},{label:"1 copo (200ml)",g:200}]},
  { id:58, name:"Leite semidesnatado",      rawCal:47,  cookedCal:47,  group:"Laticinios", color:"#E0EEF8", macro:{p:3.3,c:4.9,f:1.5},
    measures:[{label:"1/2 copo (100ml)",g:100},{label:"1 copo (200ml)",g:200}]},
  { id:59, name:"Queijo mussarela",         rawCal:280, cookedCal:280, group:"Laticinios", color:"#F8F0D8", macro:{p:22,c:2,f:20},
    measures:[{label:"1 fatia (20g)",g:20},{label:"2 fatias (40g)",g:40},{label:"3 fatias (60g)",g:60}]},
  { id:60, name:"Requeijao light",          rawCal:170, cookedCal:170, group:"Laticinios", color:"#F5ECE0", macro:{p:8,c:4,f:12},
    measures:[{label:"1 col. sopa (25g)",g:25},{label:"2 col. sopa (50g)",g:50}]},
  { id:80, name:"Requeijao cremoso normal", rawCal:240, cookedCal:240, group:"Laticinios", color:"#F0E0C0", macro:{p:7,c:4,f:20},
    measures:[{label:"1 col. sopa (25g)",g:25},{label:"2 col. sopa (50g)",g:50}]},
  { id:81, name:"Cafe puro (sem acucar)",   rawCal:2,   cookedCal:2,   group:"Bebida",     color:"#6B3A1F", macro:{p:0.1,c:0,f:0},
    measures:[{label:"Xicara pequena (50ml)",g:50},{label:"Xicara media (100ml)",g:100},{label:"Caneco (200ml)",g:200}]},
  { id:82, name:"Cafe com leite integral",  rawCal:42,  cookedCal:42,  group:"Bebida",     color:"#9C6840", macro:{p:1.6,c:2.4,f:1.7},
    measures:[{label:"Xicara (100ml)",g:100},{label:"Caneco (200ml)",g:200}]},
  { id:83, name:"Cafe com leite desnatado", rawCal:28,  cookedCal:28,  group:"Bebida",     color:"#B08860", macro:{p:1.8,c:2.5,f:0.1},
    measures:[{label:"Xicara (100ml)",g:100},{label:"Caneco (200ml)",g:200}]},
  { id:84, name:"Suco de laranja natural",  rawCal:45,  cookedCal:45,  group:"Bebida",     color:"#F5A030", macro:{p:0.7,c:10,f:0.2},
    measures:[{label:"Copo pequeno (150ml)",g:150},{label:"Copo medio (200ml)",g:200}]},
  { id:8,  name:"Arroz branco",             rawCal:358, cookedCal:130, group:"Carboidrato", color:"#F7ECC8", macro:{p:2.5,c:28,f:0.3},
    measures:[{label:"1/2 escumadeira (50g coz.)",g:50},{label:"1 escumadeira (100g coz.)",g:100},{label:"2 escumadeiras (200g coz.)",g:200}]},
  { id:9,  name:"Arroz integral",           rawCal:350, cookedCal:111, group:"Carboidrato", color:"#C8B89A", macro:{p:2.6,c:23,f:0.9},
    measures:[{label:"1 escumadeira (100g coz.)",g:100},{label:"2 escumadeiras (200g coz.)",g:200}]},
  { id:10, name:"Batata doce",              rawCal:76,  cookedCal:86,  group:"Carboidrato", color:"#E8A07D", macro:{p:1.6,c:20,f:0.1},
    measures:[{label:"1 fatia fina (40g)",g:40},{label:"2 fatias (80g)",g:80},{label:"3 fatias (120g)",g:120}]},
  { id:11, name:"Macarrao",                 rawCal:356, cookedCal:131, group:"Carboidrato", color:"#F5D490", macro:{p:4.5,c:28,f:0.9},
    measures:[{label:"1 colher de servir (80g coz.)",g:80},{label:"2 colheres de servir (160g coz.)",g:160}]},
  { id:45, name:"Pao de forma natural",     rawCal:265, cookedCal:265, group:"Carboidrato", color:"#E8C890", macro:{p:8,c:50,f:4},
    measures:[{label:"1 fatia (25g)",g:25},{label:"2 fatias (50g)",g:50}]},
  { id:46, name:"Pao de forma integral",    rawCal:240, cookedCal:240, group:"Carboidrato", color:"#C8A870", macro:{p:9,c:46,f:3},
    measures:[{label:"1 fatia (25g)",g:25},{label:"2 fatias (50g)",g:50}]},
  { id:12, name:"Pao frances",              rawCal:300, cookedCal:300, group:"Carboidrato", color:"#D4A96A", macro:{p:8,c:58,f:3},
    measures:[{label:"1 unidade (50g)",g:50},{label:"Metade (25g)",g:25}]},
  { id:13, name:"Aveia em flocos",          rawCal:389, cookedCal:389, group:"Carboidrato", color:"#C8A87A", macro:{p:13,c:66,f:7},
    measures:[{label:"2 col. sopa (20g)",g:20},{label:"1/2 xicara (40g)",g:40}]},
  { id:47, name:"Granola tradicional",      rawCal:410, cookedCal:410, group:"Carboidrato", color:"#D4B870", macro:{p:8,c:65,f:10},
    measures:[{label:"2 col. sopa (25g)",g:25},{label:"1/2 xicara (50g)",g:50}]},
  { id:48, name:"Granola fit (sem acucar)", rawCal:360, cookedCal:360, group:"Carboidrato", color:"#B8A860", macro:{p:10,c:60,f:8},
    measures:[{label:"2 col. sopa (25g)",g:25},{label:"1/2 xicara (50g)",g:50}]},
  { id:61, name:"Batata inglesa cozida",    rawCal:72,  cookedCal:77,  group:"Carboidrato", color:"#E8D8A0", macro:{p:2,c:17,f:0.1},
    measures:[{label:"Batata pequena (80g)",g:80},{label:"3 rodelas (60g)",g:60},{label:"5 rodelas (100g)",g:100}]},
  { id:62, name:"Quinoa cozida",            rawCal:368, cookedCal:120, group:"Carboidrato", color:"#C8D8A0", macro:{p:4.4,c:22,f:1.9},
    measures:[{label:"3 col. sopa (60g)",g:60},{label:"1/2 xicara (90g)",g:90}]},
  { id:63, name:"Tapioca (goma pronta)",    rawCal:334, cookedCal:334, group:"Carboidrato", color:"#F0E8D8", macro:{p:0.7,c:83,f:0.2},
    measures:[{label:"Tapioca pequena (50g)",g:50},{label:"Tapioca media (80g)",g:80}]},
  { id:64, name:"Cuscuz de milho cozido",   rawCal:350, cookedCal:112, group:"Carboidrato", color:"#F5D8A0", macro:{p:2.4,c:23,f:0.5},
    measures:[{label:"Fatia (80g)",g:80},{label:"2 fatias (160g)",g:160}]},
  { id:14, name:"Mandioca cozida",          rawCal:125, cookedCal:125, group:"Carboidrato", color:"#F0E0A0", macro:{p:1,c:30,f:0.3},
    measures:[{label:"2 fatias (80g)",g:80},{label:"3 fatias (120g)",g:120},{label:"4 fatias (160g)",g:160}]},
  { id:15, name:"Feijao carioca",           rawCal:335, cookedCal:77,  group:"Leguminosa",  color:"#C8946A", macro:{p:4.8,c:14,f:0.5},
    measures:[{label:"1 concha (80g coz.)",g:80},{label:"Concha cheia (100g coz.)",g:100}]},
  { id:16, name:"Feijao preto",             rawCal:341, cookedCal:82,  group:"Leguminosa",  color:"#6A4A3A", macro:{p:5.2,c:14,f:0.5},
    measures:[{label:"1 concha (80g coz.)",g:80},{label:"Concha cheia (100g coz.)",g:100}]},
  { id:17, name:"Lentilha",                 rawCal:352, cookedCal:116, group:"Leguminosa",  color:"#A07050", macro:{p:9,c:20,f:0.4},
    measures:[{label:"1 concha pequena (60g coz.)",g:60},{label:"1 concha (80g coz.)",g:80},{label:"Concha cheia (100g coz.)",g:100}]},
  { id:65, name:"Grao de bico",             rawCal:364, cookedCal:164, group:"Leguminosa",  color:"#C8A860", macro:{p:8.9,c:27,f:2.6},
    measures:[{label:"3 col. sopa (50g coz.)",g:50},{label:"1 concha (80g coz.)",g:80}]},
  { id:66, name:"Ervilha",                  rawCal:339, cookedCal:77,  group:"Leguminosa",  color:"#90C060", macro:{p:5,c:14,f:0.4},
    measures:[{label:"2 col. sopa (40g coz.)",g:40},{label:"3 col. sopa (60g coz.)",g:60}]},
  { id:18, name:"Brocolis",                 rawCal:34,  cookedCal:28,  group:"Vegetal",     color:"#6AAF6E", macro:{p:2.8,c:5,f:0.4},
    measures:[{label:"2 buques pequenos (50g)",g:50},{label:"3 buques medios (80g)",g:80},{label:"Porcao generosa (130g)",g:130}]},
  { id:19, name:"Alface",                   rawCal:15,  cookedCal:15,  group:"Vegetal",     color:"#90C97E", macro:{p:1.3,c:2,f:0.2},
    measures:[{label:"Porcao pequena (30g)",g:30},{label:"Porcao media (60g)",g:60},{label:"Prato de salada (100g)",g:100}]},
  { id:20, name:"Tomate",                   rawCal:18,  cookedCal:18,  group:"Vegetal",     color:"#E07070", macro:{p:0.9,c:3.9,f:0.2},
    measures:[{label:"2 rodelas (40g)",g:40},{label:"4 rodelas (80g)",g:80},{label:"Tomate medio inteiro (100g)",g:100}]},
  { id:21, name:"Cenoura",                  rawCal:41,  cookedCal:35,  group:"Vegetal",     color:"#F0924A", macro:{p:0.9,c:9,f:0.2},
    measures:[{label:"3 rodelas (30g)",g:30},{label:"5 rodelas (50g)",g:50},{label:"Porcao (80g)",g:80}]},
  { id:22, name:"Abobrinha",                rawCal:17,  cookedCal:15,  group:"Vegetal",     color:"#A0C870", macro:{p:1.2,c:3,f:0.3},
    measures:[{label:"3 fatias (60g)",g:60},{label:"5 fatias (100g)",g:100},{label:"Porcao (150g)",g:150}]},
  { id:23, name:"Couve refogada",           rawCal:40,  cookedCal:32,  group:"Vegetal",     color:"#4A9050", macro:{p:3.5,c:4,f:1},
    measures:[{label:"2 col. sopa (30g)",g:30},{label:"Porcao (60g)",g:60}]},
  { id:67, name:"Pepino",                   rawCal:15,  cookedCal:15,  group:"Vegetal",     color:"#80C878", macro:{p:0.7,c:3,f:0.1},
    measures:[{label:"4 rodelas (40g)",g:40},{label:"8 rodelas (80g)",g:80},{label:"1/2 pepino (100g)",g:100}]},
  { id:68, name:"Repolho",                  rawCal:25,  cookedCal:20,  group:"Vegetal",     color:"#A8D890", macro:{p:1.3,c:5,f:0.1},
    measures:[{label:"Porcao pequena (50g)",g:50},{label:"Porcao media (100g)",g:100}]},
  { id:69, name:"Espinafre",                rawCal:23,  cookedCal:17,  group:"Vegetal",     color:"#3A9050", macro:{p:2.9,c:3.6,f:0.4},
    measures:[{label:"Porcao (50g)",g:50},{label:"Porcao generosa (100g)",g:100}]},
  { id:70, name:"Chuchu cozido",            rawCal:24,  cookedCal:24,  group:"Vegetal",     color:"#90C890", macro:{p:1,c:5,f:0.2},
    measures:[{label:"3 fatias (60g)",g:60},{label:"5 fatias (100g)",g:100}]},
  { id:71, name:"Beterraba cozida",         rawCal:43,  cookedCal:43,  group:"Vegetal",     color:"#C04060", macro:{p:1.7,c:10,f:0.2},
    measures:[{label:"2 rodelas (40g)",g:40},{label:"4 rodelas (80g)",g:80}]},
  { id:72, name:"Vagem cozida",             rawCal:31,  cookedCal:25,  group:"Vegetal",     color:"#70A858", macro:{p:1.8,c:5,f:0.2},
    measures:[{label:"Porcao (60g)",g:60},{label:"Porcao generosa (100g)",g:100}]},
  { id:24, name:"Banana",                   rawCal:89,  cookedCal:89,  group:"Fruta",       color:"#F5E050", macro:{p:1.1,c:23,f:0.3},
    measures:[{label:"Banana pequena (80g)",g:80},{label:"Banana media (120g)",g:120}]},
  { id:25, name:"Maca",                     rawCal:52,  cookedCal:52,  group:"Fruta",       color:"#D4534A", macro:{p:0.3,c:14,f:0.2},
    measures:[{label:"Maca pequena (130g)",g:130},{label:"Maca media (180g)",g:180}]},
  { id:26, name:"Laranja",                  rawCal:47,  cookedCal:47,  group:"Fruta",       color:"#F5A030", macro:{p:0.9,c:12,f:0.1},
    measures:[{label:"Laranja media (130g)",g:130},{label:"Laranja grande (180g)",g:180}]},
  { id:27, name:"Abacate",                  rawCal:160, cookedCal:160, group:"Fruta",       color:"#5E9960", macro:{p:2,c:9,f:15},
    measures:[{label:"1/2 unidade (80g)",g:80},{label:"Col. sopa (25g)",g:25}]},
  { id:28, name:"Mamao",                    rawCal:32,  cookedCal:32,  group:"Fruta",       color:"#F5A060", macro:{p:0.5,c:8,f:0.1},
    measures:[{label:"Fatia (130g)",g:130},{label:"Fatia grande (200g)",g:200}]},
  { id:49, name:"Manga",                    rawCal:65,  cookedCal:65,  group:"Fruta",       color:"#F0B830", macro:{p:0.8,c:17,f:0.3},
    measures:[{label:"Fatia media (100g)",g:100},{label:"1/2 manga (150g)",g:150}]},
  { id:50, name:"Morango",                  rawCal:32,  cookedCal:32,  group:"Fruta",       color:"#E05060", macro:{p:0.7,c:7.7,f:0.3},
    measures:[{label:"5 morangos (75g)",g:75},{label:"1 xicara (150g)",g:150}]},
  { id:51, name:"Uva",                      rawCal:69,  cookedCal:69,  group:"Fruta",       color:"#9060C0", macro:{p:0.7,c:18,f:0.2},
    measures:[{label:"Porcao pequena (80g)",g:80},{label:"1 cacho medio (150g)",g:150}]},
  { id:52, name:"Abacaxi",                  rawCal:50,  cookedCal:50,  group:"Fruta",       color:"#F0D040", macro:{p:0.5,c:13,f:0.1},
    measures:[{label:"1 fatia (80g)",g:80},{label:"2 fatias (160g)",g:160}]},
  { id:53, name:"Kiwi",                     rawCal:61,  cookedCal:61,  group:"Fruta",       color:"#90B840", macro:{p:1.1,c:15,f:0.5},
    measures:[{label:"1 unidade (80g)",g:80},{label:"2 unidades (160g)",g:160}]},
  { id:54, name:"Melancia",                 rawCal:30,  cookedCal:30,  group:"Fruta",       color:"#E86070", macro:{p:0.6,c:8,f:0.2},
    measures:[{label:"Fatia fina (150g)",g:150},{label:"Fatia media (250g)",g:250}]},
  { id:55, name:"Pera",                     rawCal:57,  cookedCal:57,  group:"Fruta",       color:"#C8D890", macro:{p:0.4,c:15,f:0.1},
    measures:[{label:"Pera pequena (120g)",g:120},{label:"Pera media (170g)",g:170}]},
  { id:79, name:"Melao",                    rawCal:34,  cookedCal:34,  group:"Fruta",       color:"#F0E090", macro:{p:0.8,c:8,f:0.2},
    measures:[{label:"Fatia media (150g)",g:150},{label:"Fatia grande (250g)",g:250}]},
  { id:29, name:"Azeite de oliva",          rawCal:884, cookedCal:884, group:"Gordura",     color:"#C8B84A", macro:{p:0,c:0,f:100},
    measures:[{label:"1 col. cha (5g)",g:5},{label:"1 col. sopa (14g)",g:14}]},
  { id:56, name:"Castanha de caju torrada", rawCal:553, cookedCal:553, group:"Gordura",     color:"#D4A060", macro:{p:18,c:33,f:44},
    measures:[{label:"~10 unidades (20g)",g:20},{label:"~15 unidades (30g)",g:30}]},
  { id:73, name:"Amendoim torrado",         rawCal:599, cookedCal:599, group:"Gordura",     color:"#C89050", macro:{p:26,c:22,f:49},
    measures:[{label:"Punhado pequeno (20g)",g:20},{label:"Punhado medio (30g)",g:30}]},
  { id:74, name:"Manteiga",                 rawCal:717, cookedCal:717, group:"Gordura",     color:"#F0D070", macro:{p:0.9,c:0,f:81},
    measures:[{label:"1 ponta de faca (5g)",g:5},{label:"1 col. cha (10g)",g:10}]},
  { id:75, name:"Sardinha em lata (oleo)",  rawCal:208, cookedCal:208, group:"Proteina",    color:"#A0C0D0", macro:{p:21,c:0,f:12},
    measures:[{label:"1/2 lata (55g)",g:55},{label:"1 lata (110g)",g:110}]},
  { id:76, name:"Carne moida (patinho)",    rawCal:143, cookedCal:230, group:"Proteina",    color:"#B06040", macro:{p:26,c:0,f:16},
    measures:[{label:"1/2 palma da mao (80g)",g:80},{label:"1 palma da mao (120g)",g:120}]},
  { id:77, name:"Peito de peru fatiado",    rawCal:109, cookedCal:109, group:"Proteina",    color:"#D8C0A0", macro:{p:18,c:2,f:3},
    measures:[{label:"1 fatia (20g)",g:20},{label:"2 fatias (40g)",g:40},{label:"3 fatias (60g)",g:60}]},
  { id:78, name:"Presunto magro fatiado",   rawCal:145, cookedCal:145, group:"Proteina",    color:"#E0A090", macro:{p:19,c:2,f:7},
    measures:[{label:"1 fatia (20g)",g:20},{label:"2 fatias (40g)",g:40}]},
];

const GROUP_ICONS = {
  "Proteina":"🥩","Carboidrato":"🍚","Vegetal":"🥦","Fruta":"🍎",
  "Gordura":"🫒","Leguminosa":"🫘","Laticinios":"🥛","Suplemento":"💊","Bebida":"☕"
};

function calcCal(food, grams, cooked) {
  return Math.round(((cooked ? food.cookedCal : food.rawCal) * grams) / 100);
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

function exportJSON(menu, profile, dailyGoal) {
  const blob = new Blob([JSON.stringify({ version:1, exportedAt:new Date().toISOString(), menu, profile, dailyGoal }, null, 2)], { type:"application/json" });
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
  const [lastAdded, setLastAdded]   = useState(null); // {foodName, mealId, mealLabel}
  const [editItemId, setEditItemId] = useState(null);
  const [customGrams, setCustomGrams] = useState("");
  const fileRef = useRef();

  const [profile, setProfile]            = useState({ nome:"", sex:"M", age:"", weight:"", height:"", activity:"mod", goal:"lose_mod" });
  const [dailyGoalManual, setDailyGoalManual] = useState(null);

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
    const reader=new FileReader();reader.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.menu)setMenu(d.menu);if(d.profile)setProfile(d.profile);if(d.dailyGoal)setDailyGoalManual(d.dailyGoal);showToast("Backup importado!");}catch{showToast("Arquivo invalido.","err");}};
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

  const TABS=[["cardapio","📋","Cardapio"],["alimentos","🔍","Alimentos"],["substituicoes","🔄","Trocas"],["gerar","✨","Gerar"],["sugestao","🛒","Sugestao"],["tmb","🧮","TMB"],["dados","💾","Dados"]];

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
                    {/* Pie chart for main meals */}
                    {["cafe","almoco","jantar"].includes(meal.id) && items.length>0 && (
                      <div onClick={()=>setExpanded(p=>({...p,[meal.id]:!p[meal.id]}))} style={{cursor:"pointer"}}>
                        <MealPieChart items={items}/>
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
                        <p style={{fontSize:12,color:"#8B7050"}}><strong style={{color:"#5C3018"}}>{isCook?food.cookedCal:food.rawCal} kcal</strong>/100g{isCook&&changed&&<span style={{color:"#A89878",fontSize:11}}> · cru: {food.rawCal} kcal</span>}</p>
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {food.measures.map((m,i)=>(<button key={i} className="btn" onClick={()=>setAddModal({food,measure:m})} style={{background:food.color+"2A",border:`1.5px solid ${food.color}88`,padding:"6px 11px",fontSize:12,borderRadius:20,fontWeight:600,color:"#2A2420"}}>+ {m.label} <span style={{opacity:.65}}>({calcCal(food,m.g,isCook)} kcal)</span></button>))}
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
                <button className="btn action-btn" onClick={()=>exportJSON(menu,profile,dailyGoal)}><span style={{fontSize:28}}>💾</span><div><p style={{fontWeight:700,fontSize:14}}>Exportar backup (.json)</p><p style={{fontSize:12,color:"#8B7050"}}>{menu.length} itens</p></div></button>
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

      {toast&&<div className="toast" style={{background:toast.type==="err"?"#C0392B":"#2C1A0E",color:"#F5E8D0"}}>{toast.type==="err"?"⚠️ ":"✓ "}{toast.msg}</div>}
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
