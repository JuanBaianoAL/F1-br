export const CHAMPIONSHIP_TRACKS = [
 {
    id: 'monaco',
    name: 'MÔNACO',
    fullName: 'GP DE MÔNACO • MONTE CARLO 3.337M',
    minimapTitle: 'MONACO 3.34KM',
    theme: 'monaco',
    pitSide: 1, // Boxes do lado direito (reta do porto)
    lengthMeters: 3337,
    brakingPercentages: [0.09, 0.31, 0.57, 0.85],
    tunnelPercent: [0.44, 0.54],
    heights: [0, 3200, 7500, 8200, 4800, 1200, 400, 300, 300, 200, 200, 100],
    colors: {
      light: { road: '#464a52', grass: '#7d828c', rumble: '#cc0000', lane: '#ffffff' },
      dark:  { road: '#3e424a', grass: '#6e737d', rumble: '#ffffff', lane: '' },
      start: { road: '#ffffff', grass: '#7d828c', rumble: '#ffffff', lane: '' }
    },
    // Digitalizado ponto a ponto sobre o diagrama oficial de Monte Carlo (1000 x 650)
    points: [
      [112, 345], // Linha de Largada (Boulevard Albert 1er)
      [135, 285], // Reta principal
      [188, 212], // Entrada Sainte-Dévote
      [226, 184], // Curva 1: Sainte-Dévote (gancho direita no canto superior esquerdo)
      [268, 204], // Saída Sainte-Dévote
      [445, 248], // Subida longa Beau Rivage (2)
      [625, 275], // Base do Massenet
      [702, 255], // Curva 3: Massenet (curva longa para a esquerda)
      [718, 198], // Entrada Casino Square
      [742, 148], // Curva 4: Casino (direita)
      [815, 96],  // Reta até Mirabeau Haute
      [878, 62],  // Curva 5: Mirabeau Haute (direita no topo)
      [888, 88],  // Descida vertical para o grampo
      [878, 168], // Entrada Grand Hotel Hairpin
      [892, 195], // Curva 6: Grand Hotel / Loews Hairpin (U estreito apontando para baixo)
      [908, 168], // Saída do grampo
      [910, 98],  // Subida vertical para Mirabeau Bas
      [926, 82],  // Curva 7: Mirabeau Bas (direita)
      [974, 105], // Curva 8: Portier (contorno externo rumo ao mar)
      [976, 142], // Entrada do Túnel
      [915, 222], // Meio do Túnel (9)
      [825, 298], // Saída do Túnel
      [685, 336], // Reta beira-mar pós-túnel (bem separada de Beau Rivage)
      [535, 340], // Freada Nouvelle Chicane
      [505, 320], // Curva 10: Nouvelle Chicane (esquerda)
      [475, 356], // Curva 11: Nouvelle Chicane (direita)
      [435, 322], // Saída Nouvelle Chicane
      [295, 296], // Reta até Tabac
      [225, 284], // Curva 12: Tabac (esquerda junto à marina)
      [194, 325], // Curva 13: Louis Chiron
      [198, 362], // Curva 14: Entrada Piscina (degrau para fora)
      [172, 415], // Reta da Piscina
      [148, 468], // Curva 15: Chicane da Piscina
      [136, 495], // Curva 16: Saída Piscina
      [142, 575], // Reta até Rascasse
      [168, 618], // Curva 17: La Rascasse (grampo direita no fundo)
      [132, 632], // Curva 18: Saída Rascasse
      [74,  612], // Curva 19: Anthony Noghès (orelha esquerda)
      [68,  535], // Contorno externo final
      [88,  435]  // Retorno para a reta dos boxes
    ]
  },
    {
    id: 'monza',
    name: 'MONZA',
    fullName: 'GP DA ITÁLIA • MONZA 5.793M',
    minimapTitle: 'MONZA 5.79KM',
    theme: 'park',
    lengthMeters: 5793,
    pitSide: 1,
    brakingPercentages: [0.16, 0.37, 0.63, 0.87],
    heights: [0, 300, 900, 1100, 600, 200, 0, 100, 300, 200],
    colors: {
      light: { road: '#555555', grass: '#138a13', rumble: '#cc0000', lane: '#ffffff' },
      dark:  { road: '#4d4d4d', grass: '#0e700e', rumble: '#ffffff', lane: '' },
      start: { road: '#ffffff', grass: '#138a13', rumble: '#ffffff', lane: '' }
    },
    // Digitalizado ponto a ponto sobre o diagrama oficial de Monza (Start embaixo indo para a esquerda)
    points: [
      [735, 455], // Linha de Largada (Start/Finish embaixo à direita)
      [550, 460], // Meio da Reta Principal (Rettifilo)
      [365, 464], // Freada 1ª Variante (Variante del Rettifilo)
      [355, 444], // Curva 1 (direita)
      [338, 448], // Curva 2 (esquerda)
      [305, 464], // Saída da 1ª Variante
      [235, 468], // Início Curva Biassono (Curva Grande)
      [172, 454], // Meio Curva Biassono (3)
      [124, 405], // Saída Curva Biassono
      [98,  325], // Subida para 2ª Variante
      [78,  225], // Freada 2ª Variante (Variante della Roggia)
      [76,  196], // Curva 4 (esquerda)
      [62,  188], // Curva 5 (direita)
      [56,  156], // Saída da Roggia
      [28,  98],  // Aproximação Lesmo 1
      [14,  62],  // Curva di Lesmo 1 (6 - quina superior esquerda)
      [34,  38],  // Reta curta entre Lesmos
      [132, 22],  // Curva di Lesmo 2 (7 - quina superior)
      [162, 48],  // Saída Lesmo 2
      [245, 148], // Início Curva del Serraglio (diagonal longa)
      [345, 252], // Meio Curva del Serraglio
      [415, 326], // Freada Variante Ascari
      [432, 338], // Curva 8 (esquerda)
      [464, 332], // Curva 9 (direita)
      [498, 354], // Curva 10 (esquerda - saída Ascari)
      [655, 354], // Meio do Retão Oposto
      [875, 354], // Freada Curva Parabolica
      [912, 366], // Entrada Curva Parabolica (11)
      [924, 404], // Meio Curva Parabolica
      [892, 442], // Saída Curva Parabolica
      [825, 453]  // Retorno para a Reta Principal
    ]
  },
{
    id: 'silverstone',
    name: 'SILVERSTONE',
    fullName: 'GP DA GRÃ-BRETANHA • SILVERSTONE 5.891M',
    minimapTitle: 'SILVERST 5.89KM',
    theme: 'silverstone',
    pitSide: -1, // Boxes do lado esquerdo (interior da pista na reta Hamilton)
    lengthMeters: 5891,
    brakingPercentages: [0.12, 0.37, 0.69, 0.87],
    heights: [0, 300, 400, 200, 600, 200, 500, 800, 300, 100],
    colors: {
      light: { road: '#52565e', grass: '#1b8a2f', rumble: '#111111', lane: '#ffffff' },
      dark:  { road: '#484c54', grass: '#157326', rumble: '#ffffff', lane: '' },
      start: { road: '#ffffff', grass: '#1b8a2f', rumble: '#ffffff', lane: '' }
    },
    // Digitalizado ponto a ponto sobre o mapa oficial de Silverstone
    points: [
      [615, 845], // Linha de Largada (Hamilton Straight)
      [545, 745], // Meio da Reta Hamilton
      [482, 652], // Curva 1: Abbey (direita)
      [525, 515], // Curva 2: Farm (esquerda)
      [495, 425], // Entrada Village
      [462, 355], // Curva 3: Village (direita)
      [535, 335], // Curva 4: The Loop (grampo fechado esquerda)
      [510, 275], // Saída The Loop
      [455, 232], // Curva 5: Aintree (esquerda rumo à reta)
      [310, 365], // Meio da Wellington Straight
      [165, 505], // Freada Brooklands
      [158, 545], // Curva 6: Brooklands (esquerda)
      [215, 585], // Entrada Luffield
      [205, 635], // Curva 7: Luffield (arco longo direita)
      [155, 625], // Saída Luffield
      [88,  535], // Curva 8: Woodcote
      [78,  445], // Reta Nacional (antiga reta dos boxes)
      [105, 165], // Aproximação Copse
      [135, 115], // Curva 9: Copse (direita de alta)
      [235, 102], // Saída Copse
      [395, 138], // Curva 10: Maggotts (esquerda)
      [452, 122], // Curva 11: Becketts 1 (direita)
      [525, 175], // Curva 12: Becketts 2 (esquerda)
      [595, 165], // Curva 13: Becketts 3 (direita)
      [632, 225], // Curva 14: Chapel (direita para a reta)
      [785, 435], // Meio da Hangar Straight
      [935, 635], // Freada Stowe
      [948, 695], // Curva 15: Stowe (direita)
      [895, 745], // Saída Stowe
      [745, 835], // Freada Vale
      [735, 865], // Curva 16: Vale (esquerda)
      [748, 912], // Curva 17: Club 1 (direita)
      [695, 945], // Curva 18: Club 2 (saída para a reta)
      [652, 905]  // Retorno para a Reta Hamilton
    ]
  },
  {
    id: 'interlagos',
    name: 'INTERLAGOS',
    fullName: 'GP DO BRASIL • INTERLAGOS 4.309M',
    minimapTitle: 'INTERLAGOS 4.3KM',
    theme: 'interlagos',
    pitSide: -1, // Boxes do lado esquerdo (interior da pista na reta principal)
    lengthMeters: 4309,
    brakingPercentages: [0.13, 0.42, 0.64, 0.82],
    heights: [0, -2500, -5800, -4200, 1200, 1800, -1400, 400, -2600, 800, 6500, 11000],
    colors: {
      light: { road: '#555555', grass: '#109910', rumble: '#cc0000', lane: '#ffffff' },
      dark:  { road: '#4d4d4d', grass: '#0c820c', rumble: '#ffffff', lane: '' },
      start: { road: '#ffffff', grass: '#109910', rumble: '#ffffff', lane: '' }
    },
    // Digitalizado ponto a ponto sobre o mapa oficial de Interlagos (sentido anti-horário)
    points: [
      [255, 655], // Linha de Largada (Reta Principal descendo)
      [295, 815], // Reta antes do S do Senna
      [330, 935], // Freada Curva 1: S do Senna (esquerda)
      [365, 965], // Fundo Curva 1
      [405, 935], // Meio S do Senna
      [442, 918], // Curva 2: S do Senna (direita)
      [515, 945], // Entrada Curva do Sol
      [585, 948], // Curva 3: Curva do Sol
      [655, 905], // Saída Curva do Sol
      [715, 765], // Início da Reta Oposta
      [775, 535], // Meio da Reta Oposta
      [825, 315], // Fim da Reta Oposta (travagem)
      [812, 278], // Curva 4: Descida do Lago (esquerda)
      [745, 262], // Curva 5: Saída Descida do Lago
      [665, 260], // Reta curta até Ferradura
      [615, 295], // Entrada Ferradura
      [485, 465], // Reta descendo para Ferradura
      [425, 545], // Curva 6: Ferradura (direita)
      [345, 558], // Meio Ferradura
      [295, 525], // Curva 7: Laranjinha
      [272, 435], // Subida para Pinheirinho
      [285, 385], // Curva 8: Pinheirinho (direita)
      [355, 402], // Meio S do Pinheirinho
      [398, 375], // Curva 9: Saída Pinheirinho
      [385, 328], // Subida para o Bico de Pato
      [325, 265], // Aproximação Bico de Pato
      [312, 185], // Entrada Bico de Pato
      [332, 165], // Curva 10: Bico de Pato (grampo fechado)
      [365, 195], // Saída Bico de Pato
      [435, 262], // Curva 11: Mergulho
      [495, 260], // Fundo do Mergulho
      [555, 205], // Subida para Junção
      [625, 95],  // Aproximação Junção
      [615, 65],  // Curva 12: Junção (esquerda)
      [515, 35],  // Curva 13: Subida do Café
      [375, 58],  // Contorno Curva 14
      [285, 118], // Entrada reta dos boxes
      [245, 265], // Curva 15: Arquibancadas
      [218, 415], // Reta dos boxes superior
      [235, 545]  // Retorno para a Linha de Largada
    ]
  },{
    id: 'suzuka',
    name: 'SUZUKA',
    fullName: 'GP DO JAPÃO • SUZUKA 5.807M',
    minimapTitle: 'SUZUKA 5.81KM',
    theme: 'park',
    pitSide: 1, // Boxes do lado esquerdo (interior da pista na reta principal)
    lengthMeters: 5807,
    brakingPercentages: [0.09, 0.35, 0.49, 0.88],
    overpassPercent: 0.40,          // Passagem INFERIOR sob o viaduto (logo após Degner 2)
    viaductPercent: [0.74, 0.80],   // Passagem SUPERIOR sobre o viaduto (antes da 130R)
    // Altitude realista: descida na reta (-1400), subida nos Esses e Dunlop (+2400),
    // mergulho sob a ponte após Degner 2 (-2600), subida até Spoon (+3400) e viaduto (+3600)
    heights: [0, -1400, 500, 2400, 900, -2600, -1200, 1400, 3400, 3600, 1400, 200],
    colors: {
      light: { road: '#4e525a', grass: '#158222', rumble: '#cc0000', lane: '#ffffff' },
      dark:  { road: '#454950', grass: '#106b1b', rumble: '#ffffff', lane: '' },
      start: { road: '#ffffff', grass: '#158222', rumble: '#ffffff', lane: '' }
    },
    // Digitalizado ponto a ponto sobre o diagrama oficial de Suzuka (escala 1000 x 750)
    points: [
      [265, 682], // Linha de Largada (Reta Principal indo para a esquerda)
      [115, 706], // Freada Curva 1 (First Turn)
      [42,  702], // Entrada Curva 1
      [18,  668], // Curva 1 (ápice extremo esquerdo)
      [35,  625], // Curva 2 (saída para os Esses)
      [125, 622], // Curva 3: início dos Esses (esquerda)
      [168, 582], // Curva 4: S1 (direita)
      [212, 598], // Vale entre S1 e S2
      [252, 560], // Curva 5: S2 (esquerda)
      [295, 578], // Vale entre S2 e S3
      [338, 542], // Curva 6: S3 (direita)
      [388, 572], // Entrada Curva Dunlop
      [435, 578], // Curva 7: Dunlop (arco longo para a esquerda)
      [492, 535], // Saída Dunlop
      [505, 455], // Subida reta até Degner
      [476, 378], // Curva 8: Degner 1 (direita rápida)
      [498, 305], // Entrada Degner 2
      [518, 288], // Curva 9: Degner 2 (90° direita descendo para a ponte)
      [562, 308], // PASSAGEM INFERIOR (cruza POR BAIXO do viaduto!)
      [675, 342], // Curva 10: aproximação Hairpin
      [718, 392], // Curva 11: Hairpin (grampo U estreito)
      [738, 375], // Saída Hairpin
      [698, 295], // Início Curva 12 (200R)
      [708, 225], // Meio Curva 12 (arco para a direita)
      [765, 165], // Aproximação Spoon Curve
      [855, 145], // Entrada Spoon (Curva 13)
      [948, 148], // Curva 13: Spoon 1 (ápice inferior da colher)
      [982, 102], // Meio Spoon (contorno externo)
      [942, 55],  // Curva 14: Spoon 2 (saída para a reta oposta)
      [815, 112], // Início da Reta Oposta (descendo na diagonal)
      [665, 222], // Meio da Reta Oposta
      [562, 308], // VIADUTO SUPERIOR (cruza POR CIMA da pista!)
      [532, 348], // Curva 15: 130R (cotovelo esquerda de alta)
      [535, 445], // Reta descendo paralela à Dunlop
      [548, 512], // Aproximação Casio Triangle
      [518, 532], // Curva 16: entrada Casio Triangle (direita)
      [552, 565], // Curva 17: saída Casio Triangle (esquerda)
      [512, 608], // Curva 18: Última curva (direita)
      [455, 648], // Saída para a Reta Principal
      [355, 668]  // Retorno para a Linha de Largada
    ]
  }
];