/**
 * BALAYYA: HUNTER ASSASSIN (బాలయ్య గేమ్)
 * Complete Authentic Hunter Assassin with:
 * 1. ACTION HERO BALAYYA SPRITE (Preserved exactly from Image 4, with swinging legs & shotgun)
 * 2. SMALL SPACE CORRIDOR MOVEMENT (14px radius, slides through narrow gaps and tight spaces)
 * 3. ENERGY & DRINKS RECOVERY (Drinking Mansion House bottles restores HP/energy and adds to bottle count)
 * 4. FULLSCREEN IMMERSIVE BOARD (Wide screen playfield, zero wasted horizontal space)
 * 5. DISTINCT VISUAL THEMES FOR EVERY LEVEL (Alpha, Cargo Night, Cyber Armory, Obsidian Gold, Crimson Boss)
 * 6. UNLIMITED LEVELS (Infinite levels 1 to 100+ with escalating difficulty & bosses every 5 levels)
 * 7. ZERO POPUPS OVER GAME BOARD (Clean unobscured playfield, all info in header bar)
 * 8. MENU IMAGE PRESERVED (Akhanda namaskaram pose on Home Menu)
 */

(function () {
  'use strict';

  // --- Persistent Storage ---
  let isSoundEnabled = localStorage.getItem('balayya-hunter-sound') !== 'false';
  let maxUnlockedLevel = 1;
  try {
    const u = parseInt(localStorage.getItem('balayya-hunter-max-unlocked'), 10);
    if (Number.isSafeInteger(u) && u >= 1) {
      maxUnlockedLevel = Math.min(50, u);
    }
  } catch (e) {}

  let currentStageIdx = 0;
  try {
    const s = parseInt(localStorage.getItem('balayya-hunter-stage'), 10);
    if (Number.isSafeInteger(s) && s >= 1 && s <= maxUnlockedLevel) {
      currentStageIdx = s - 1;
    } else {
      currentStageIdx = Math.max(0, maxUnlockedLevel - 1);
    }
  } catch (e) {}

  let totalBottles = 0;
  try {
    const b = parseInt(localStorage.getItem('balayya-hunter-bottles'), 10);
    if (Number.isSafeInteger(b) && b >= 0) totalBottles = b;
  } catch (e) {}

  // --- 5 DISTINCT VISUAL THEMES ---
  const THEME_STYLES = {
    alpha: {
      name: "Warehouse Alpha",
      floorColor: "#b8b2a5",
      gridColor: "rgba(0, 0, 0, 0.06)",
      wallBorder: "#1a1e28",
      wallBase: "#242730",
      wallTop: "#5b6272",
      wallHighlight: "#767f94",
      crateBase: "#b56d28",
      crateBorder: "#5a310c",
      crateCross: "#7c4311",
      containerBase: "#9c3131",
      containerBorder: "#4a1111",
      containerTop: "#c54747"
    },
    cargo: {
      name: "Midnight Naval Cargo",
      floorColor: "#1e293b",
      gridColor: "rgba(56, 189, 248, 0.08)",
      wallBorder: "#090d16",
      wallBase: "#0f172a",
      wallTop: "#334155",
      wallHighlight: "#0284c7",
      crateBase: "#856a4b",
      crateBorder: "#45321f",
      crateCross: "#634a31",
      containerBase: "#1e40af",
      containerBorder: "#172554",
      containerTop: "#3b82f6"
    },
    armory: {
      name: "Cyber Armory Fortress",
      floorColor: "#181e1e",
      gridColor: "rgba(34, 197, 94, 0.1)",
      wallBorder: "#091410",
      wallBase: "#11221c",
      wallTop: "#1e523c",
      wallHighlight: "#22c55e",
      crateBase: "#4d5d36",
      crateBorder: "#2a361c",
      crateCross: "#3b4d26",
      containerBase: "#ca8a04",
      containerBorder: "#713f12",
      containerTop: "#eab308"
    },
    command: {
      name: "Obsidian Gold Command",
      floorColor: "#212128",
      gridColor: "rgba(255, 215, 0, 0.08)",
      wallBorder: "#18120b",
      wallBase: "#281e14",
      wallTop: "#5c4527",
      wallHighlight: "#f59e0b",
      crateBase: "#78350f",
      crateBorder: "#451a03",
      crateCross: "#92400e",
      containerBase: "#581c87",
      containerBorder: "#3b0764",
      containerTop: "#7e22ce"
    },
    boss: {
      name: "Crimson Bunker Stronghold",
      floorColor: "#261619",
      gridColor: "rgba(239, 68, 68, 0.12)",
      wallBorder: "#22080c",
      wallBase: "#3b1419",
      wallTop: "#681e28",
      wallHighlight: "#ef4444",
      crateBase: "#422006",
      crateBorder: "#241002",
      crateCross: "#542a08",
      containerBase: "#dc2626",
      containerBorder: "#7f1d1d",
      containerTop: "#f87171"
    }
  };

  // --- AUTHENTIC HUNTER ASSASSIN DENSE STAGE GENERATOR (LEVELS 1 TO 25+) ---
  const THEME_KEYS = ['alpha', 'cargo', 'armory', 'command', 'boss'];
  const PROCEDURAL_SPECIALS = [
    { name: "SHADOW STEALTH 🕶️", desc: "Stand behind crates to hide from police flashlights! Drink bottles to restore HP!" },
    { name: "SPEED DASH ⚡", desc: "Collect golden lightning orbs for 2x sprint! Bottles restore energy!" },
    { name: "SMOKE BOMBS 💨", desc: "Smoke grenades blind police! Dodge moving lasers!" },
    { name: "CCTV CAMERAS 📹", desc: "Dodge rotating blue CCTV surveillance cones! Running makes sound waves!" }
  ];

  const STAGE_CACHE = {};
  const BASE_STAGES = [];

  function addCrates(crates, x, y, ctype) {
    const S = 42;
    if (ctype === 'horizontal_pair') {
      crates.push({ x: x, y: y, w: S, h: S });
      crates.push({ x: x + S, y: y, w: S, h: S });
    } else if (ctype === 'vertical_pair') {
      crates.push({ x: x, y: y, w: S, h: S });
      crates.push({ x: x, y: y + S, w: S, h: S });
    } else if (ctype === 'corner_L') {
      crates.push({ x: x, y: y, w: S, h: S });
      crates.push({ x: x + S, y: y, w: S, h: S });
      crates.push({ x: x, y: y + S, w: S, h: S });
    } else if (ctype === 'quad') {
      crates.push({ x: x, y: y, w: S, h: S });
      crates.push({ x: x + S, y: y, w: S, h: S });
      crates.push({ x: x, y: y + S, w: S, h: S });
      crates.push({ x: x + S, y: y + S, w: S, h: S });
    } else {
      crates.push({ x: x, y: y, w: S, h: S });
    }
  }

  // --- OFFICIAL 50-LEVEL HUNTER ASSASSIN DESIGN BOOK (5 WORLDS, 50 LEVELS) ---
  const LEVEL_BOOK = [
    // World 1 — Training Zone (Levels 1–10)
    { id: 1, world: 1, worldName: "World 1 — Training Zone", name: "Warehouse Infiltration", diff: "Easy", guards: 2, env: "Concrete Divider & Crates", mission: "Eliminate 2 guards using stealth flank", cameras: 0, lasers: 0, isBoss: false },
    { id: 2, world: 1, worldName: "World 1 — Training Zone", name: "Dual L-Choke", diff: "Easy", guards: 3, env: "Dual L-Walls & Choke", mission: "Avoid spotlight and eliminate 3 guards", cameras: 0, lasers: 0, isBoss: false },
    { id: 3, world: 1, worldName: "World 1 — Training Zone", name: "Training Building", diff: "Easy", guards: 2, env: "Training rooms and corridors", mission: "Reach the exit without detection", cameras: 0, lasers: 0, isBoss: false },
    { id: 4, world: 1, worldName: "World 1 — Training Zone", name: "Parking Area", diff: "Easy", guards: 3, env: "Parked cars and concrete barriers", mission: "Eliminate all guards", cameras: 0, lasers: 0, isBoss: false },
    { id: 5, world: 1, worldName: "World 1 — Training Zone", name: "Small Office", diff: "Easy", guards: 3, env: "Office desks and meeting rooms", mission: "Find the key and unlock the exit", cameras: 0, lasers: 0, isBoss: true, bossName: "Inspector Verma", bossHp: 300 },
    { id: 6, world: 1, worldName: "World 1 — Training Zone", name: "Container Yard", diff: "Easy", guards: 4, env: "Shipping containers", mission: "Hide behind containers and escape", cameras: 0, lasers: 0, isBoss: false },
    { id: 7, world: 1, worldName: "World 1 — Training Zone", name: "Security Room", diff: "Easy", guards: 4, env: "Monitor desk and camera cones", mission: "Disable the security camera", cameras: 2, lasers: 0, isBoss: false },
    { id: 8, world: 1, worldName: "World 1 — Training Zone", name: "Small Factory", diff: "Easy", guards: 5, env: "Machinery and work benches", mission: "Find the keycard", cameras: 2, lasers: 0, isBoss: false },
    { id: 9, world: 1, worldName: "World 1 — Training Zone", name: "Underground Room", diff: "Easy", guards: 5, env: "Pipes and narrow corridors", mission: "Eliminate the target guard", cameras: 2, lasers: 0, isBoss: false },
    { id: 10, world: 1, worldName: "World 1 — Training Zone", name: "Police Training Base", diff: "Easy", guards: 6, env: "Training rooms and patrol lanes", mission: "Complete all objectives and escape", cameras: 2, lasers: 0, isBoss: true, bossName: "DSP Rathore", bossHp: 400 },

    // World 2 — City Streets (Levels 11–20)
    { id: 11, world: 2, worldName: "World 2 — City Streets", name: "Narrow Street", diff: "Normal", guards: 5, env: "Buildings and alleyways", mission: "Reach the opposite exit", cameras: 2, lasers: 0, isBoss: false },
    { id: 12, world: 2, worldName: "World 2 — City Streets", name: "Shopping Mall", diff: "Normal", guards: 6, env: "Shop units and central atrium", mission: "Eliminate 2 target guards", cameras: 2, lasers: 0, isBoss: false },
    { id: 13, world: 2, worldName: "World 2 — City Streets", name: "City Parking Lot", diff: "Normal", guards: 6, env: "Cars, pillars and ramps", mission: "Collect a keycard", cameras: 2, lasers: 0, isBoss: false },
    { id: 14, world: 2, worldName: "World 2 — City Streets", name: "Restaurant Area", diff: "Normal", guards: 7, env: "Dining area and kitchen corridors", mission: "Escape without triggering the alarm", cameras: 2, lasers: 0, isBoss: false },
    { id: 15, world: 2, worldName: "World 2 — City Streets", name: "Apartment Building", diff: "Normal", guards: 7, env: "Apartments and stairwells", mission: "Reach the rooftop", cameras: 2, lasers: 0, isBoss: true, bossName: "Captain Rane", bossHp: 480 },
    { id: 16, world: 2, worldName: "World 2 — City Streets", name: "Police Checkpoint", diff: "Normal", guards: 8, env: "Road barriers and guard booths", mission: "Disable 2 cameras", cameras: 2, lasers: 0, isBoss: false },
    { id: 17, world: 2, worldName: "World 2 — City Streets", name: "Metro Station", diff: "Normal", guards: 8, env: "Platforms and ticket gates", mission: "Find the underground exit", cameras: 2, lasers: 0, isBoss: false },
    { id: 18, world: 2, worldName: "World 2 — City Streets", name: "Construction Site", diff: "Normal", guards: 9, env: "Scaffolding and material stacks", mission: "Eliminate the commander", cameras: 2, lasers: 0, isBoss: false },
    { id: 19, world: 2, worldName: "World 2 — City Streets", name: "City Hospital", diff: "Normal", guards: 10, env: "Wards and treatment rooms", mission: "Rescue the captured agent", cameras: 2, lasers: 0, isBoss: false },
    { id: 20, world: 2, worldName: "World 2 — City Streets", name: "City Police Station", diff: "Normal", guards: 10, env: "Reception, cells and records room", mission: "Steal the secret access file and escape", cameras: 3, lasers: 1, isBoss: true, bossName: "ACP Ajay", bossHp: 550 },

    // World 3 — Industrial Zone (Levels 21–30)
    { id: 21, world: 3, worldName: "World 3 — Industrial Zone", name: "Large Warehouse", diff: "Medium–Hard", guards: 10, env: "Storage lanes and loading bays", mission: "Find 2 keys", cameras: 3, lasers: 1, isBoss: false },
    { id: 22, world: 3, worldName: "World 3 — Industrial Zone", name: "Factory Floor", diff: "Medium–Hard", guards: 11, env: "Assembly lines and machinery", mission: "Avoid moving machinery and escape", cameras: 3, lasers: 1, isBoss: false },
    { id: 23, world: 3, worldName: "World 3 — Industrial Zone", name: "Power Station", diff: "Medium–Hard", guards: 12, env: "Generator rooms and cable lanes", mission: "Disable electricity", cameras: 3, lasers: 1, isBoss: false },
    { id: 24, world: 3, worldName: "World 3 — Industrial Zone", name: "Oil Refinery", diff: "Medium–Hard", guards: 12, env: "Pipes, tanks and catwalks", mission: "Eliminate 3 target guards", cameras: 3, lasers: 2, isBoss: false },
    { id: 25, world: 3, worldName: "World 3 — Industrial Zone", name: "Cargo Terminal", diff: "Medium–Hard", guards: 13, env: "Cargo stacks and loading lanes", mission: "Locate a hidden package", cameras: 3, lasers: 2, isBoss: true, bossName: "Major Raghav", bossHp: 620 },
    { id: 26, world: 3, worldName: "World 3 — Industrial Zone", name: "Railway Station", diff: "Medium–Hard", guards: 14, env: "Platforms and service tunnels", mission: "Escape before the train leaves", cameras: 3, lasers: 2, isBoss: false },
    { id: 27, world: 3, worldName: "World 3 — Industrial Zone", name: "Underground Laboratory", diff: "Medium–Hard", guards: 14, env: "Lab rooms and specimen storage", mission: "Steal the research file", cameras: 3, lasers: 2, isBoss: false },
    { id: 28, world: 3, worldName: "World 3 — Industrial Zone", name: "Chemical Factory", diff: "Medium–Hard", guards: 15, env: "Tank rooms and safety corridors", mission: "Find the antidote", cameras: 3, lasers: 2, isBoss: false },
    { id: 29, world: 3, worldName: "World 3 — Industrial Zone", name: "Military Storage", diff: "Medium–Hard", guards: 16, env: "Armory shelves and access doors", mission: "Unlock the weapon storage room", cameras: 3, lasers: 2, isBoss: false },
    { id: 30, world: 3, worldName: "World 3 — Industrial Zone", name: "Industrial Headquarters", diff: "Medium–Hard", guards: 18, env: "Office block and control room", mission: "Defeat the security commander", cameras: 3, lasers: 2, isBoss: true, bossName: "Commander Vikram", bossHp: 700 },

    // World 4 — Military Base (Levels 31–40)
    { id: 31, world: 4, worldName: "World 4 — Military Base", name: "Army Checkpoint", diff: "Hard–Expert", guards: 18, env: "Guard towers and vehicle barriers", mission: "Break through the checkpoint", cameras: 3, lasers: 2, isBoss: false },
    { id: 32, world: 4, worldName: "World 4 — Military Base", name: "Military Barracks", diff: "Hard–Expert", guards: 19, env: "Bunk rooms and central corridor", mission: "Find the commander's key", cameras: 3, lasers: 2, isBoss: false },
    { id: 33, world: 4, worldName: "World 4 — Military Base", name: "Radar Station", diff: "Hard–Expert", guards: 20, env: "Radar control building and dish yard", mission: "Disable the radar", cameras: 3, lasers: 2, isBoss: false },
    { id: 34, world: 4, worldName: "World 4 — Military Base", name: "Armored Vehicle Yard", diff: "Hard–Expert", guards: 21, env: "Vehicle bays and perimeter lanes", mission: "Avoid armored patrols", cameras: 3, lasers: 3, isBoss: false },
    { id: 35, world: 4, worldName: "World 4 — Military Base", name: "Communication Center", diff: "Hard–Expert", guards: 22, env: "Server rooms and antenna access", mission: "Disable the alarm system", cameras: 3, lasers: 3, isBoss: true, bossName: "Colonel Devraj", bossHp: 780 },
    { id: 36, world: 4, worldName: "World 4 — Military Base", name: "Underground Bunker", diff: "Hard–Expert", guards: 23, env: "Blast doors and bunker corridors", mission: "Find the secret entrance", cameras: 3, lasers: 3, isBoss: false },
    { id: 37, world: 4, worldName: "World 4 — Military Base", name: "Missile Facility", diff: "Hard–Expert", guards: 24, env: "Control room and secured chambers", mission: "Disable the control system", cameras: 3, lasers: 3, isBoss: false },
    { id: 38, world: 4, worldName: "World 4 — Military Base", name: "Military Prison", diff: "Hard–Expert", guards: 25, env: "Cell blocks and guard stations", mission: "Rescue the prisoner", cameras: 3, lasers: 3, isBoss: false },
    { id: 39, world: 4, worldName: "World 4 — Military Base", name: "Command Center", diff: "Hard–Expert", guards: 27, env: "Command floor and briefing room", mission: "Defeat 2 elite guards", cameras: 3, lasers: 3, isBoss: false },
    { id: 40, world: 4, worldName: "World 4 — Military Base", name: "General's Headquarters", diff: "Hard–Expert", guards: 30, env: "HQ offices and secure exit", mission: "Defeat the general and escape", cameras: 3, lasers: 3, isBoss: true, bossName: "General Rawat", bossHp: 850 },

    // World 5 — Secret Assassin Missions (Levels 41–50)
    { id: 41, world: 5, worldName: "World 5 — Secret Assassin Missions", name: "Secret Laboratory", diff: "Master", guards: 30, env: "Research pods and server vault", mission: "Steal the classified data", cameras: 3, lasers: 3, isBoss: false },
    { id: 42, world: 5, worldName: "World 5 — Secret Assassin Missions", name: "High-Security Mansion", diff: "Master", guards: 32, env: "Grand hall and private rooms", mission: "Find and eliminate the target", cameras: 3, lasers: 3, isBoss: false },
    { id: 43, world: 5, worldName: "World 5 — Secret Assassin Missions", name: "Airport Security Zone", diff: "Master", guards: 34, env: "Terminal gates and runway service lanes", mission: "Escape through the runway", cameras: 3, lasers: 3, isBoss: false },
    { id: 44, world: 5, worldName: "World 5 — Secret Assassin Missions", name: "Underground Secret Base", diff: "Master", guards: 35, env: "Core chamber and maintenance tunnels", mission: "Destroy the security system", cameras: 3, lasers: 3, isBoss: false },
    { id: 45, world: 5, worldName: "World 5 — Secret Assassin Missions", name: "Prison Escape Facility", diff: "Master", guards: 36, env: "Cell wings and control booth", mission: "Rescue 2 captured agents", cameras: 3, lasers: 3, isBoss: true, bossName: "Shadow Master", bossHp: 920 },
    { id: 46, world: 5, worldName: "World 5 — Secret Assassin Missions", name: "Nuclear Facility", diff: "Master", guards: 38, env: "Reactor hall and control stations", mission: "Stop the countdown", cameras: 3, lasers: 3, isBoss: false },
    { id: 47, world: 5, worldName: "World 5 — Secret Assassin Missions", name: "Night City Skyscraper", diff: "Master", guards: 40, env: "Office floors and elevator lobby", mission: "Reach the top floor", cameras: 3, lasers: 3, isBoss: false },
    { id: 48, world: 5, worldName: "World 5 — Secret Assassin Missions", name: "Assassin Headquarters", diff: "Master", guards: 42, env: "Training arena and hidden passages", mission: "Defeat the rival assassin", cameras: 3, lasers: 3, isBoss: false },
    { id: 49, world: 5, worldName: "World 5 — Secret Assassin Missions", name: "Secret Government Base", diff: "Master", guards: 45, env: "Security rings and central archive", mission: "Defeat the elite security squad", cameras: 3, lasers: 3, isBoss: false },
    { id: 50, world: 5, worldName: "World 5 — Secret Assassin Missions", name: "Final Boss Fortress", diff: "Master", guards: 50, env: "Boss arena and fortress corridors", mission: "Defeat the final boss and escape", cameras: 3, lasers: 3, isBoss: true, bossName: "Apex Commissioner Shankar", bossHp: 1000 }
  ];

  function getStage(idx) {
    if (STAGE_CACHE[idx]) {
      const cached = STAGE_CACHE[idx];
      return {
        ...cached,
        staticBottles: cached.staticBottles.map(b => ({ ...b, collected: false })),
        speedOrbs: cached.speedOrbs.map(s => ({ ...s, collected: false })),
        smokeOrbs: cached.smokeOrbs.map(s => ({ ...s, collected: false }))
      };
    }

    const meta = LEVEL_BOOK[idx % LEVEL_BOOK.length];
    const levelNum = meta.id;
    const world = meta.world;
    const isBoss = meta.isBoss;
    const theme = THEME_KEYS[(world - 1) % THEME_KEYS.length];

    // Arena dimensions expand progressively with world difficulty
    const width = Math.min(1240, 960 + (world - 1) * 60);
    const height = Math.min(720, 620 + (world - 1) * 20);

    const walls = [
      { x: 0, y: 0, w: width, h: 32 },
      { x: 0, y: height - 32, w: width, h: 32 },
      { x: 0, y: 0, w: 32, h: height },
      { x: width - 32, y: 0, w: 32, h: height }
    ];

    const crates = [];
    const redContainers = [];
    const staticBottles = [];
    const speedOrbs = [];
    const smokeOrbs = [];
    const cameras = [];
    const lasers = [];
    const police = [];

    const playerStart = { x: 80, y: height - 70 };
    const exitPos = { x: width - 80, y: 60 };

    const centerW = Math.min(300, 220 + world * 16);
    const centerH = Math.min(200, 140 + world * 12);
    const centerX = Math.floor((width - centerW) / 2);
    const centerY = Math.floor((height - centerH) / 2);

    if (levelNum === 1) {
      // EXACT HUNTER ASSASSIN LEVEL 1 ARCHITECTURE (PDF Page 8, 10, 11)
      playerStart.x = 510;
      playerStart.y = height - 60;
      exitPos.x = 510;
      exitPos.y = 55;

      // 1. Concrete Vertical Partition Wall (Top-Left)
      walls.push({ x: 320, y: 32, w: 28, h: 260 });

      // 2. Concrete L-Shaped Corner Wall (Bottom-Left)
      walls.push({ x: 130, y: 460, w: 218, h: 28 });
      walls.push({ x: 320, y: 340, w: 28, h: 148 });

      // 3. Wooden Cover Crates & Stone Pedestals (PDF Page 8 & 10)
      crates.push({ x: 60, y: 150, w: 50, h: 50 });
      crates.push({ x: 60, y: 320, w: 50, h: 50 });

      // Center-Right Wooden Crate Stack (The Main Cover behind which player flanks!)
      crates.push({ x: 510, y: 160, w: 84, h: 84 });
      crates.push({ x: 594, y: 160, w: 84, h: 84 });
      crates.push({ x: 510, y: 244, w: 84, h: 84 });

      // Dark Stone Pedestals (Stone Blocks with Rivets - PDF Page 8 & 10)
      crates.push({ x: 420, y: 170, w: 42, h: 42, isStone: true });
      crates.push({ x: 420, y: 370, w: 42, h: 42, isStone: true });
      crates.push({ x: 740, y: 170, w: 42, h: 42, isStone: true });
      crates.push({ x: 740, y: 370, w: 42, h: 42, isStone: true });

      // Bottom-Right Wooden Crates
      crates.push({ x: 740, y: 450, w: 84, h: 84 });
      crates.push({ x: 824, y: 450, w: 84, h: 84 });

      // 4. 2 Handcrafted Guards (PDF Page 8, 10, 11)
      police.push({
        x: 210,
        y: 220,
        angle: -Math.PI / 2,
        speed: 1.5,
        fov: 1.2,
        range: 210,
        waypoints: [
          { x: 210, y: 130, lookAngle: -Math.PI / 2, waitTicks: 65 },
          { x: 210, y: 380, lookAngle: Math.PI / 2, waitTicks: 70 }
        ]
      });
      police.push({
        x: 620,
        y: 360,
        angle: -Math.PI / 2,
        speed: 1.5,
        fov: 1.2,
        range: 210,
        waypoints: [
          { x: 620, y: 450, lookAngle: Math.PI / 2, waitTicks: 70 },
          { x: 620, y: 130, lookAngle: -Math.PI / 2, waitTicks: 65 }
        ]
      });

      staticBottles.push({ x: 85, y: 240, collected: false });
      staticBottles.push({ x: width - 85, y: 240, collected: false });
      speedOrbs.push({ x: 210, y: 70, collected: false });
    } else if (levelNum === 2) {
      // EXACT HUNTER ASSASSIN LEVEL 2 DUAL L-CHOKE (PDF Page 2 & 7)
      playerStart.x = 500;
      playerStart.y = height - 60;
      exitPos.x = 500;
      exitPos.y = 55;

      // Left L-Wall
      walls.push({ x: 240, y: 310, w: 170, h: 28 });
      walls.push({ x: 382, y: 120, w: 28, h: 218 });

      // Right L-Wall
      walls.push({ x: 590, y: 210, w: 170, h: 28 });
      walls.push({ x: 590, y: 210, w: 28, h: 230 });

      // Crates
      crates.push({ x: 60, y: 80, w: 50, h: 50 });
      crates.push({ x: 60, y: height - 130, w: 50, h: 50 });
      crates.push({ x: width - 110, y: 80, w: 50, h: 50 });
      crates.push({ x: width - 110, y: height - 130, w: 50, h: 50 });
      crates.push({ x: 470, y: 210, w: 50, h: 50, isStone: true });
      crates.push({ x: 470, y: 350, w: 50, h: 50, isStone: true });

      // 3 Guards (PDF Page 2)
      police.push({
        x: 480,
        y: 80,
        angle: 0,
        speed: 1.5,
        fov: 1.25,
        range: 220,
        waypoints: [
          { x: 420, y: 80, lookAngle: 0, waitTicks: 65 },
          { x: 560, y: 80, lookAngle: Math.PI, waitTicks: 70 }
        ]
      });
      police.push({
        x: 500,
        y: 280,
        angle: Math.PI / 2,
        speed: 1.5,
        fov: 1.25,
        range: 220,
        waypoints: [
          { x: 500, y: 160, lookAngle: -Math.PI / 2, waitTicks: 60 },
          { x: 500, y: 420, lookAngle: Math.PI / 2, waitTicks: 65 }
        ]
      });
      police.push({
        x: width - 100,
        y: 280,
        angle: -Math.PI / 2,
        speed: 1.5,
        fov: 1.25,
        range: 220,
        waypoints: [
          { x: width - 100, y: 360, lookAngle: Math.PI / 2, waitTicks: 70 },
          { x: width - 100, y: 140, lookAngle: -Math.PI / 2, waitTicks: 60 }
        ]
      });

      staticBottles.push({ x: 90, y: 180, collected: false });
      staticBottles.push({ x: width - 90, y: 220, collected: false });
      staticBottles.push({ x: 500, y: 70, collected: false });
      speedOrbs.push({ x: 90, y: 90, collected: false });
    } else if (levelNum >= 6 && levelNum <= 40) {
      // 13 DISTINCT PDF IMAGE SKETCH PATTERNS (LEVELS 6 TO 40)
      const sketchIdx = (levelNum - 6) % 13;
      const midX = Math.floor(width / 2);
      const midY = Math.floor(height / 2);

      switch (sketchIdx) {
        case 0: // SKETCH 0: Dual L-Choke Corridors (PDF Page 2 & 7)
          walls.push({ x: 200, y: 150, w: 150, h: 28 });
          walls.push({ x: 200, y: 150, w: 28, h: 160 });
          walls.push({ x: width - 350, y: height - 180, w: 150, h: 28 });
          walls.push({ x: width - 230, y: height - 310, w: 28, h: 160 });
          crates.push({ x: 70, y: 120, w: 50, h: 50 });
          crates.push({ x: width - 180, y: 80, w: 50, h: 50 });
          crates.push({ x: midX - 25, y: midY - 25, w: 50, h: 50, isStone: true });
          break;

        case 1: // SKETCH 1: Cross-Dock Intersecting Lanes (PDF Page 3)
          walls.push({ x: 120, y: midY - 14, w: midX - 200, h: 28 });
          walls.push({ x: midX + 80, y: midY - 14, w: midX - 200, h: 28 });
          walls.push({ x: midX - 14, y: 90, w: 28, h: midY - 150 });
          walls.push({ x: midX - 14, y: midY + 60, w: 28, h: midY - 150 });
          crates.push({ x: 180, y: 130, w: 50, h: 50 });
          crates.push({ x: width - 230, y: 130, w: 50, h: 50 });
          crates.push({ x: 180, y: height - 180, w: 50, h: 50 });
          crates.push({ x: width - 230, y: height - 180, w: 50, h: 50 });
          break;

        case 2: // SKETCH 2: Dense Crate Maze (PDF Page 4)
          crates.push({ x: 180, y: 120, w: 84, h: 84 });
          crates.push({ x: width - 264, y: 120, w: 84, h: 84 });
          crates.push({ x: 180, y: height - 204, w: 84, h: 84 });
          crates.push({ x: width - 264, y: height - 204, w: 84, h: 84 });
          crates.push({ x: midX - 42, y: midY - 42, w: 84, h: 84 });
          walls.push({ x: midX - 70, y: 70, w: 140, h: 26 });
          walls.push({ x: midX - 70, y: height - 96, w: 140, h: 26 });
          break;

        case 3: // SKETCH 3: Red Shipping Container Yard (PDF Page 5 #154)
          redContainers.push({ x: 180, y: 120, w: 130, h: 62 });
          redContainers.push({ x: width - 310, y: 120, w: 130, h: 62 });
          redContainers.push({ x: 180, y: height - 182, w: 130, h: 62 });
          redContainers.push({ x: width - 310, y: height - 182, w: 130, h: 62 });
          walls.push({ x: midX - 14, y: midY - 60, w: 28, h: 120 });
          crates.push({ x: midX - 60, y: midY - 21, w: 42, h: 42 });
          crates.push({ x: midX + 18, y: midY - 21, w: 42, h: 42 });
          break;

        case 4: // SKETCH 4: Zigzag Baffles (PDF Page 6)
          walls.push({ x: 100, y: 140, w: Math.floor(width * 0.45), h: 28 });
          walls.push({ x: width - Math.floor(width * 0.45) - 100, y: midY - 14, w: Math.floor(width * 0.45), h: 28 });
          walls.push({ x: 100, y: height - 170, w: Math.floor(width * 0.45), h: 28 });
          crates.push({ x: 70, y: midY - 25, w: 50, h: 50 });
          crates.push({ x: width - 180, y: 80, w: 50, h: 50 });
          break;

        case 5: // SKETCH 5: Vertical Divider + L-Wall (PDF Page 8, 10, 11)
          walls.push({ x: midX - 60, y: 32, w: 28, h: Math.floor(height * 0.5) });
          walls.push({ x: midX + 60, y: midY, w: 28, h: Math.floor(height * 0.42) });
          walls.push({ x: midX + 60, y: midY, w: 150, h: 28 });
          crates.push({ x: 140, y: 180, w: 60, h: 60 });
          crates.push({ x: width - 200, y: 180, w: 60, h: 60 });
          crates.push({ x: midX - 25, y: height - 120, w: 50, h: 50, isStone: true });
          break;

        case 6: // SKETCH 6: Four-Room Security Quadrants (PDF Page 12)
          walls.push({ x: 140, y: 80, w: 120, h: 26 });
          walls.push({ x: 140, y: 80, w: 26, h: 100 });
          walls.push({ x: width - 260, y: 80, w: 120, h: 26 });
          walls.push({ x: width - 166, y: 80, w: 26, h: 100 });
          walls.push({ x: 140, y: height - 110, w: 120, h: 26 });
          walls.push({ x: 140, y: height - 180, w: 26, h: 96 });
          walls.push({ x: width - 260, y: height - 110, w: 120, h: 26 });
          walls.push({ x: width - 166, y: height - 180, w: 26, h: 96 });
          crates.push({ x: midX - 25, y: midY - 25, w: 50, h: 50 });
          break;

        case 7: // SKETCH 7: T-Junction Security Checkpoint (PDF Page 13)
          walls.push({ x: midX - 110, y: midY - 40, w: 220, h: 28 });
          walls.push({ x: midX - 14, y: midY - 40, w: 28, h: Math.floor(height * 0.38) });
          crates.push({ x: 140, y: midY - 25, w: 50, h: 50 });
          crates.push({ x: width - 190, y: midY - 25, w: 50, h: 50 });
          crates.push({ x: midX - 80, y: 100, w: 42, h: 42, isStone: true });
          crates.push({ x: midX + 38, y: 100, w: 42, h: 42, isStone: true });
          break;

        case 8: // SKETCH 8: Central Vault Ring (Citadel Strongroom)
          walls.push({ x: midX - 100, y: midY - 70, w: 200, h: 140 });
          crates.push({ x: 100, y: 100, w: 50, h: 50 });
          crates.push({ x: width - 150, y: 100, w: 50, h: 50 });
          crates.push({ x: 100, y: height - 150, w: 50, h: 50 });
          crates.push({ x: width - 150, y: height - 150, w: 50, h: 50 });
          break;

        case 9: // SKETCH 9: H-Corridor Transit Depot
          walls.push({ x: 220, y: 100, w: 28, h: height - 200 });
          walls.push({ x: width - 248, y: 100, w: 28, h: height - 200 });
          walls.push({ x: 220, y: midY - 14, w: width - 468, h: 28 });
          crates.push({ x: 80, y: midY - 25, w: 50, h: 50 });
          crates.push({ x: width - 130, y: midY - 25, w: 50, h: 50 });
          break;

        case 10: // SKETCH 10: Twin Bunkers
          walls.push({ x: 160, y: midY - 75, w: 120, h: 150 });
          walls.push({ x: width - 280, y: midY - 75, w: 120, h: 150 });
          crates.push({ x: midX - 25, y: 90, w: 50, h: 50, isStone: true });
          crates.push({ x: midX - 25, y: height - 140, w: 50, h: 50, isStone: true });
          break;

        case 11: // SKETCH 11: Perimeter Pillar Hall
          crates.push({ x: 200, y: 130, w: 50, h: 50, isStone: true });
          crates.push({ x: midX - 25, y: 130, w: 50, h: 50, isStone: true });
          crates.push({ x: width - 250, y: 130, w: 50, h: 50, isStone: true });
          crates.push({ x: 200, y: height - 180, w: 50, h: 50, isStone: true });
          crates.push({ x: midX - 25, y: height - 180, w: 50, h: 50, isStone: true });
          crates.push({ x: width - 250, y: height - 180, w: 50, h: 50, isStone: true });
          walls.push({ x: midX - 14, y: midY - 40, w: 28, h: 80 });
          break;

        case 12: // SKETCH 12: Checkerboard Citadel (PDF Page 9)
          walls.push({ x: 180, y: 90, w: 75, h: 55 });
          walls.push({ x: width - 255, y: 90, w: 75, h: 55 });
          walls.push({ x: midX - 37, y: midY - 27, w: 75, h: 55 });
          walls.push({ x: 180, y: height - 145, w: 75, h: 55 });
          walls.push({ x: width - 255, y: height - 145, w: 75, h: 55 });
          crates.push({ x: 90, y: midY - 25, w: 50, h: 50 });
          crates.push({ x: width - 140, y: midY - 25, w: 50, h: 50 });
          break;
      }

      // Bottles & Powerups
      staticBottles.push({ x: 90, y: 180, collected: false });
      staticBottles.push({ x: width - 100, y: 220, collected: false });
      staticBottles.push({ x: midX, y: 70, collected: false });
      if (world >= 3) {
        staticBottles.push({ x: 90, y: height - 220, collected: false });
        staticBottles.push({ x: width - 100, y: height - 80, collected: false });
      }

      speedOrbs.push({ x: 90, y: 90, collected: false });
      smokeOrbs.push({ x: width - 90, y: height - 80, collected: false });

      // Cameras matching PDF specifications
      if (meta.cameras >= 2) {
        cameras.push({ x: 260, y: 36, angle: Math.PI / 2, range: 210, fov: 1.0 });
        cameras.push({ x: width - 260, y: 36, angle: Math.PI / 2, range: 210, fov: 1.0 });
      }
      if (meta.cameras >= 3) {
        cameras.push({ x: midX, y: 36, angle: Math.PI / 2, range: 210, fov: 1.0 });
      }

      // Lasers matching PDF specifications
      if (meta.lasers >= 1) {
        lasers.push({ x1: 280, x2: 380, y: 150, minY: 120, maxY: 210, speedY: 1.2, dir: 1, active: true });
      }
      if (meta.lasers >= 2) {
        lasers.push({ x1: width - 380, x2: width - 280, y: height - 160, minY: height - 220, maxY: height - 110, speedY: 1.3, dir: -1, active: true });
      }
      if (meta.lasers >= 3) {
        lasers.push({ x1: midX - 80, x2: midX + 80, y: 75, minY: 55, maxY: 110, speedY: 1.1, dir: 1, active: true });
      }
    } else {
      // WORLD 1 (LEVELS 3-5) & WORLD 5 (LEVELS 41-50 MASTER CITADEL)
      // Central Facility / Room matching Hunter Assassin PDF architecture
      walls.push({ x: centerX, y: centerY, w: centerW, h: centerH });

      // Connected Tactical Partitions & Cover Dividers (Authentic Hunter Assassin Architecture)
      const midY = Math.floor(height * 0.5);
      walls.push({ x: 140, y: 90, w: 140, h: 32 });
      walls.push({ x: 140, y: height - 160, w: 140, h: 32 });
      walls.push({ x: Math.floor(width * 0.5) - 60, y: 60, w: 120, h: 32 });
      walls.push({ x: Math.floor(width * 0.5) - 60, y: height - 100, w: 120, h: 32 });
      walls.push({ x: width - 260, y: 160, w: 120, h: 32 });
      walls.push({ x: width - 260, y: height - 160, w: 120, h: 32 });

      // Crate stacks along corridors
      crates.push({ x: 70, y: midY - 25, w: 50, h: 50 });
      crates.push({ x: width - 120, y: midY - 25, w: 50, h: 50 });
      crates.push({ x: centerX - 55, y: centerY + 30, w: 46, h: 46 });
      crates.push({ x: centerX + centerW + 10, y: centerY + 30, w: 46, h: 46 });

      // Additional maze partitions for high difficulty
      if (world >= 2) {
        walls.push({ x: centerX - 80, y: centerY + 40, w: 26, h: 80 });
        walls.push({ x: centerX + centerW + 55, y: centerY - 20, w: 26, h: 80 });
      }
      if (world >= 3) {
        walls.push({ x: centerX + 40, y: centerY - 70, w: 80, h: 24 });
        walls.push({ x: centerX + 40, y: centerY + centerH + 45, w: 80, h: 24 });
      }
      if (world >= 4) {
        walls.push({ x: 260, y: 150, w: 26, h: 70 });
        walls.push({ x: width - 290, y: height - 220, w: 26, h: 70 });
      }

      // Red Corrugated Containers for World 2 (Cargo Harbor - PDF Page 5 #154)
      if (world === 2) {
        redContainers.push({ x: 190, y: 130, w: 120, h: 58 });
        redContainers.push({ x: width - 310, y: 140, w: 120, h: 58 });
        redContainers.push({ x: 200, y: height - 190, w: 120, h: 58 });
        redContainers.push({ x: width - 320, y: height - 190, w: 120, h: 58 });
      }

      // Crate stacks
      crates.push({ x: 36, y: 36, w: 40, h: 40 });
      crates.push({ x: 78, y: 36, w: 40, h: 40 });
      crates.push({ x: width - 120, y: 36, w: 40, h: 40 });
      crates.push({ x: width - 78, y: 36, w: 40, h: 40 });
      crates.push({ x: 36, y: height - 150, w: 40, h: 40 });
      crates.push({ x: width - 120, y: height - 120, w: 40, h: 40 });
      crates.push({ x: width - 78, y: height - 120, w: 40, h: 40 });

      if (world >= 2) {
        crates.push({ x: 240, y: 80, w: 40, h: 40 });
        crates.push({ x: width - 260, y: height - 120, w: 40, h: 40 });
      }
      if (world >= 3) {
        crates.push({ x: 240, y: height - 100, w: 40, h: 40 });
        crates.push({ x: width - 280, y: 160, w: 40, h: 40 });
      }

      // Confiscated Mansion House bottles to recover
      staticBottles.push({ x: 90, y: 180, collected: false });
      staticBottles.push({ x: width - 100, y: 220, collected: false });
      staticBottles.push({ x: centerX + Math.floor(centerW / 2), y: 70, collected: false });
      if (world >= 3) {
        staticBottles.push({ x: 90, y: height - 220, collected: false });
        staticBottles.push({ x: width - 100, y: height - 80, collected: false });
      }

      // Tactical powerups
      speedOrbs.push({ x: 90, y: 90, collected: false });
      if (levelNum >= 3) smokeOrbs.push({ x: width - 90, y: height - 80, collected: false });

      // Cameras matching PDF specifications
      if (meta.cameras >= 2) {
        cameras.push({ x: 260, y: 36, angle: Math.PI / 2, range: 210, fov: 1.0 });
        cameras.push({ x: width - 260, y: 36, angle: Math.PI / 2, range: 210, fov: 1.0 });
      }
      if (meta.cameras >= 3) {
        cameras.push({ x: Math.floor(width / 2), y: 36, angle: Math.PI / 2, range: 210, fov: 1.0 });
      }

      // Lasers matching PDF specifications
      if (meta.lasers >= 1) {
        lasers.push({ x1: 280, x2: 380, y: 150, minY: 120, maxY: 210, speedY: 1.2, dir: 1, active: true });
      }
      if (meta.lasers >= 2) {
        lasers.push({ x1: width - 380, x2: width - 280, y: height - 160, minY: height - 220, maxY: height - 110, speedY: 1.3, dir: -1, active: true });
      }
      if (meta.lasers >= 3) {
        lasers.push({ x1: centerX + 20, x2: centerX + centerW - 20, y: 75, minY: 55, maxY: 110, speedY: 1.1, dir: 1, active: true });
      }
    }

    if (levelNum >= 3) {
      // Levels 3–50: Multi-guard non-parallel corridor and perimeter patrols
      const candidatePatrols = [
        // 0: East corridor vertical patrol
        [
          { x: width - 90, y: 140, lookAngle: Math.PI / 2, waitTicks: 65 },
          { x: width - 90, y: 310, lookAngle: Math.PI, waitTicks: 70 }
        ],
        // 1: North corridor horizontal patrol
        [
          { x: 360, y: 80, lookAngle: 0, waitTicks: 60 },
          { x: 490, y: 80, lookAngle: Math.PI / 2, waitTicks: 60 }
        ],
        // 2: South corridor horizontal patrol
        [
          { x: Math.floor(width * 0.5) - 60, y: height - 80, lookAngle: 0, waitTicks: 65 },
          { x: Math.floor(width * 0.5) + 80, y: height - 80, lookAngle: Math.PI, waitTicks: 65 }
        ],
        // 3: West corridor vertical patrol
        [
          { x: 85, y: 220, lookAngle: Math.PI / 2, waitTicks: 60 },
          { x: 85, y: 370, lookAngle: -Math.PI / 2, waitTicks: 60 }
        ],
        // 4: Central-North courtyard patrol
        [
          { x: centerX + 40, y: centerY - 110, lookAngle: 0, waitTicks: 70 },
          { x: centerX + centerW - 40, y: centerY - 110, lookAngle: Math.PI, waitTicks: 70 }
        ],
        // 5: Central-South courtyard patrol
        [
          { x: centerX + centerW - 40, y: centerY + centerH + 85, lookAngle: Math.PI, waitTicks: 65 },
          { x: centerX + 40, y: centerY + centerH + 85, lookAngle: 0, waitTicks: 65 }
        ],
        // 6: North-East corner perimeter patrol
        [
          { x: width - 140, y: 80, lookAngle: 0, waitTicks: 60 },
          { x: width - 90, y: 80, lookAngle: Math.PI / 2, waitTicks: 60 },
          { x: width - 90, y: 150, lookAngle: Math.PI, waitTicks: 60 }
        ],
        // 7: South-East corner perimeter patrol
        [
          { x: width - 90, y: height - 160, lookAngle: -Math.PI / 2, waitTicks: 65 },
          { x: width - 90, y: height - 80, lookAngle: Math.PI, waitTicks: 65 },
          { x: width - 160, y: height - 80, lookAngle: 0, waitTicks: 65 }
        ],
        // 8: South-West staging patrol
        [
          { x: 130, y: height - 80, lookAngle: 0, waitTicks: 60 },
          { x: 230, y: height - 80, lookAngle: -Math.PI / 2, waitTicks: 60 }
        ],
        // 9: North-West perimeter patrol
        [
          { x: 85, y: 80, lookAngle: 0, waitTicks: 65 },
          { x: 130, y: 80, lookAngle: Math.PI / 2, waitTicks: 65 },
          { x: 85, y: 140, lookAngle: -Math.PI / 2, waitTicks: 65 }
        ],
        // 10: East-Central hallway vertical patrol
        [
          { x: width - 85, y: Math.floor(height * 0.38), lookAngle: Math.PI / 2, waitTicks: 65 },
          { x: width - 85, y: Math.floor(height * 0.55), lookAngle: -Math.PI / 2, waitTicks: 65 }
        ],
        // 11: West-Central hallway cross patrol
        [
          { x: 85, y: Math.floor(height * 0.45), lookAngle: 0, waitTicks: 65 },
          { x: 135, y: Math.floor(height * 0.45), lookAngle: Math.PI, waitTicks: 65 }
        ]
      ];

      const allObstacles = [...walls, ...crates, ...redContainers];
      function isPointClear(px, py, radius = 18) {
        if (px < radius + 32 || px > width - radius - 32 || py < radius + 32 || py > height - radius - 32) return false;
        for (let i = 0; i < allObstacles.length; i++) {
          const o = allObstacles[i];
          const cx = Math.max(o.x, Math.min(px, o.x + o.w));
          const cy = Math.max(o.y, Math.min(py, o.y + o.h));
          if (Math.hypot(px - cx, py - cy) < radius + 4) return false;
        }
        return true;
      }

      function findClearPoint(px, py, radius = 18) {
        if (isPointClear(px, py, radius)) return { x: px, y: py };
        for (let d = 16; d <= 140; d += 16) {
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
            const sx = Math.round(px + Math.cos(angle) * d);
            const sy = Math.round(py + Math.sin(angle) * d);
            if (isPointClear(sx, sy, radius)) return { x: sx, y: sy };
          }
        }
        return { x: px, y: py };
      }

      const numGuards = meta.guards;
      for (let g = 0; g < numGuards; g++) {
        const isThisBoss = isBoss && (g === numGuards - 1);

        if (isThisBoss) {
          // Boss patrols the central open courtyard
          const bossClear = findClearPoint(centerX + Math.floor(centerW / 2), Math.max(70, centerY - 110), 26);
          const bossWp1 = findClearPoint(centerX + 50, Math.max(70, centerY - 110), 26);
          const bossWp2 = findClearPoint(centerX + centerW - 50, Math.max(70, centerY - 110), 26);
          police.push({
            x: bossClear.x,
            y: bossClear.y,
            angle: Math.PI / 2,
            speed: 1.8 + world * 0.05,
            fov: 1.45 + world * 0.02,
            range: 270 + world * 10,
            isBoss: true,
            name: meta.bossName || "BOSS",
            maxHp: meta.bossHp || (300 + world * 150),
            hp: meta.bossHp || (300 + world * 150),
            isEnraged: false,
            waypoints: [
              { x: bossWp1.x, y: bossWp1.y, lookAngle: 0, waitTicks: 75 },
              { x: bossWp2.x, y: bossWp2.y, lookAngle: Math.PI, waitTicks: 75 }
            ]
          });
        } else {
          const templateIdx = g % candidatePatrols.length;
          const baseWps = candidatePatrols[templateIdx];
          const cycle = Math.floor(g / candidatePatrols.length);
          const offsetX = ((cycle % 3) - 1) * 18;
          const offsetY = Math.floor(cycle / 3) * 14;

          const wps = baseWps.map(wp => {
            let testX = wp.x + offsetX;
            let testY = wp.y + offsetY;
            const clearPt = findClearPoint(testX, testY, 18);
            return {
              x: clearPt.x,
              y: clearPt.y,
              lookAngle: wp.lookAngle,
              waitTicks: wp.waitTicks + ((g * 13) % 25)
            };
          });

          const startWp = wps[0];
          police.push({
            x: startWp.x,
            y: startWp.y,
            angle: startWp.lookAngle || 0,
            speed: 1.55 + Math.min(0.45, world * 0.08),
            fov: 1.25 + Math.min(0.2, world * 0.04),
            range: 220 + Math.min(50, world * 10),
            waypoints: wps
          });
        }
      }
    }

    const specialDesc = isBoss
      ? `Major ${meta.bossName} Confrontation! Massive ${meta.bossHp} HP, machine gun burst & elite police force!`
      : `${meta.mission}. ${meta.guards} corrupt guards in ${meta.env}.`;

    const stageObj = {
      id: levelNum,
      world: meta.world,
      worldName: meta.worldName,
      name: meta.name,
      difficulty: meta.diff,
      environment: meta.env,
      mission: meta.mission,
      theme,
      specialName: isBoss ? `${meta.bossName.toUpperCase()} BATTLE 👑🚨` : `MISSION: ${meta.name.toUpperCase()}`,
      specialDesc,
      width,
      height,
      targetCount: police.length,
      bottleRequired: Math.min(3, Math.floor(levelNum / 8)),
      isBossStage: isBoss,
      playerStart,
      exitPos,
      walls,
      crates,
      redContainers,
      staticBottles,
      speedOrbs,
      smokeOrbs,
      cameras,
      lasers,
      police
    };

    STAGE_CACHE[idx] = stageObj;
    return {
      ...stageObj,
      staticBottles: stageObj.staticBottles.map(b => ({ ...b })),
      speedOrbs: stageObj.speedOrbs.map(s => ({ ...s })),
      smokeOrbs: stageObj.smokeOrbs.map(s => ({ ...s }))
    };
  }

  // --- Runtime Game State ---
  let screenMode = 'menu';
  let gameState = 'playing';

  // Compact 14px radius allows moving through small spaces, tight gaps & narrow doors!
  let player = {
    x: 100,
    y: 540,
    targetX: 100,
    targetY: 540,
    path: [],
    angle: 0,
    radius: 14,
    speed: 4.2,
    baseSpeed: 4.2,
    speedBoostTimer: 0,
    hp: 100,
    maxHp: 100,
    isMoving: false,
    animTick: 0,
    facingRight: true,
    isStealthed: false
  };

  let destinationMarker = {
    x: 0,
    y: 0,
    active: false,
    radius: 8,
    alpha: 1.0
  };

  let keys = { w: false, a: false, s: false, d: false };
  let policeList = [];
  let bullets = [];
  let particles = [];
  let floatingTexts = [];
  let droppedBottles = [];
  let staticBottles = [];
  let speedOrbs = [];
  let smokeOrbs = [];
  let smokeClouds = [];
  let cameras = [];
  let lasers = [];
  let eliminatedCount = 0;
  let collectedStageBottles = 0;
  let screenShake = 0;
  let animFrameId = null;

  // A* Grid Data (Fine 16px grid)
  const CELL_SIZE = 16;
  let gridCols = 0;
  let gridRows = 0;
  let walkGrid = [];

  // --- DOM Elements ---
  const homeView = document.getElementById('homeView');
  const gameView = document.getElementById('gameView');
  const canvas = document.getElementById('hunterCanvas');
  const ctx = canvas.getContext('2d');

  // Home Screen Elements
  const btnHomeContinue = document.getElementById('btnHomeContinue');
  const btnContinueText = document.getElementById('btnContinueText');
  const btnOpenHowToPlay = document.getElementById('btnOpenHowToPlay');
  const btnOpenLegend = document.getElementById('btnOpenLegend');
  const btnOpenLevels = document.getElementById('btnOpenLevels');
  const btnResetProgress = document.getElementById('btnResetProgress');
  const btnHomeSoundToggle = document.getElementById('btnHomeSoundToggle');

  // Home Dialogs
  const modalHowToPlay = document.getElementById('modalHowToPlay');
  const modalLegend = document.getElementById('modalLegend');
  const btnCloseHowToPlay = document.getElementById('btnCloseHowToPlay');
  const btnCloseLegend = document.getElementById('btnCloseLegend');

  // Full-Card Level Directory View (Entire Card)
  const levelsView = document.getElementById('levelsView');
  const btnLevelsBackHome = document.getElementById('btnLevelsBackHome');
  const levelsBottleCount = document.getElementById('levelsBottleCount');
  const levelsCardGrid = document.getElementById('levelsCardGrid');

  // In-Game Top Header Elements (Outside Board)
  const hudTargetText = document.getElementById('hudTargetText');
  const hudBottleText = document.getElementById('hudBottleText');
  const hudLevelBadge = document.getElementById('hudLevelBadge');
  const taskLevelName = document.getElementById('taskLevelName');
  const hudCenterHp = document.getElementById('hudCenterHp');

  const bossBarBox = document.getElementById('bossBarBox');
  const bossHpText = document.getElementById('bossHpText');
  const bossHpFill = document.getElementById('bossHpFill');

  const playerHpFill = document.getElementById('playerHpFill');
  const playerHpText = document.getElementById('playerHpText');

  const btnGameSound = document.getElementById('btnGameSound');
  const btnGamePause = document.getElementById('btnGamePause');
  const btnReturnHome = document.getElementById('btnReturnHome');

  // Modals inside Game
  const modalVictory = document.getElementById('modalVictory');
  const modalDefeat = document.getElementById('modalDefeat');
  const modalPaused = document.getElementById('modalPaused');
  const modalGameComplete = document.getElementById('modalGameComplete');
  const victorySummary = document.getElementById('victorySummary');

  const btnNextStage = document.getElementById('btnNextStage');
  const btnRetryStage = document.getElementById('btnRetryStage');
  const btnResumeGame = document.getElementById('btnResumeGame');
  const btnPlayAgain = document.getElementById('btnPlayAgain');
  const btnVictoryHome = document.getElementById('btnVictoryHome');
  const btnVictoryLevels = document.getElementById('btnVictoryLevels');
  const btnDefeatHome = document.getElementById('btnDefeatHome');
  const btnDefeatLevels = document.getElementById('btnDefeatLevels');
  const btnPauseHome = document.getElementById('btnPauseHome');
  const btnPauseLevels = document.getElementById('btnPauseLevels');
  const btnPauseSound = document.getElementById('btnPauseSound');
  const pauseSoundText = document.getElementById('pauseSoundText');
  const toastBadge = document.getElementById('toastBadge');

  // Audio & Image Assets
  let audioCtx = null;
  const domBgm = document.getElementById('gameBgm');
  const domBgm1 = document.getElementById('gameBgm1');
  const domBgm2 = document.getElementById('gameBgm2');
  const domBgm3 = document.getElementById('gameBgm3');
  const domBottle = document.getElementById('bottleAudio');
  const domCrash = document.getElementById('crashAudio');
  const domSpotted = document.getElementById('spottedAudio');
  const domBossVictory = document.getElementById('bossVictoryAudio');
  const domLevelVictory = document.getElementById('levelVictoryAudio');
  const domBossDefeat = document.getElementById('bossDefeatAudio');

  // Dynamic Multi-Track BGM Engine for Zigzag Alternating Swaps across Levels
  const MusicManager = {
    currentKey: null,
    currentAudio: null,
    tracks: {
      track1: { audio: domBgm1 || domBgm || new Audio('assets/audio/bgm.mp3'), offset: 0, name: "Mass Anthem" },
      track2: { audio: domBgm2 || new Audio('assets/audio/bgm.m4a'), offset: 0, name: "Tactical Stealth" },
      track3: { audio: domBgm3 || new Audio('assets/audio/bgm_full.mp3'), offset: 42, name: "High-Octane Action" },
      track4: { audio: domBgm1 || domBgm || new Audio('assets/audio/bgm.mp3'), offset: 35, name: "Warehouse Infiltration" },
      boss:   { audio: domBgm3 || new Audio('assets/audio/bgm_full.mp3'), offset: 88, name: "Apex Boss Showdown" }
    },
    playLevelMusic(levelNum = 1, isBoss = false, restart = true) {
      if (!isSoundEnabled) return;
      initAudio();
      let key = 'track1';
      if (isBoss) {
        key = 'boss';
      } else {
        // True Zigzag Level-to-Level Swapping!
        const sequence = ['track1', 'track2', 'track3', 'track4'];
        key = sequence[(levelNum - 1) % sequence.length];
      }
      const entry = this.tracks[key] || this.tracks.track1;

      // When swapping tracks, smoothly pause previous audio
      if (this.currentAudio && this.currentAudio !== entry.audio) {
        try {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        } catch (e) {}
      }

      this.currentKey = key;
      this.currentAudio = entry.audio;
      this.currentAudio.loop = true;
      this.currentAudio.volume = 0.65;

      if (restart) {
        try {
          this.currentAudio.currentTime = entry.offset || 0;
        } catch (e) {}
      }

      const p = this.currentAudio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    },
    stop(reset = false) {
      if (this.currentAudio) {
        try {
          this.currentAudio.pause();
          if (reset) {
            const entry = this.tracks[this.currentKey];
            this.currentAudio.currentTime = entry ? (entry.offset || 0) : 0;
          }
        } catch (e) {}
      }
    },
    resume() {
      if (!isSoundEnabled || !this.currentAudio) return;
      initAudio();
      const p = this.currentAudio.play();
      if (p !== undefined) p.catch(() => {});
    }
  };

  const assets = {
    bottle: new Image(),
    fail: new Image(),
    hero: new Image(),
    heroBody: new Image(),
    heroLegL: new Image(),
    heroLegR: new Image(),
    bgm: domBgm || new Audio('assets/audio/bgm.mp3'),
    crash: domCrash || new Audio('assets/audio/crash.mp3?v=3'),
    bottleSfx: domBottle || new Audio('assets/audio/mansion_house.mp3'),
    spotted: domSpotted || new Audio('assets/audio/spotted.mp3'),
    bossVictory: domBossVictory || new Audio('assets/audio/boss_victory.mp3?v=1'),
    levelVictory: domLevelVictory || new Audio('assets/audio/level_victory.mp3?v=3'),
    bossDefeat: domBossDefeat || new Audio('assets/audio/boss_defeat.mp3?v=1')
  };

  assets.bottle.src = 'assets/images/bottle.png';
  assets.fail.src = 'assets/images/fail.jpg';
  assets.hero.src = 'assets/images/balayya_hero.png';
  assets.heroBody.src = 'assets/images/hero_body.png';
  assets.heroLegL.src = 'assets/images/hero_leg_l.png';
  assets.heroLegR.src = 'assets/images/hero_leg_r.png';
  assets.bgm.loop = true;
  assets.bgm.volume = 0.65;
  assets.crash.volume = 0.95;
  assets.bottleSfx.volume = 1.0;
  assets.spotted.volume = 1.0;
  if (assets.bossVictory) assets.bossVictory.volume = 1.0;
  if (assets.levelVictory) assets.levelVictory.volume = 1.0;
  if (assets.bossDefeat) assets.bossDefeat.volume = 1.0;

  function initAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSynthTakedown() {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, audioCtx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.45, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.24);
    } catch (e) {}
  }

  function playBottleSound() {
    if (!isSoundEnabled) return;
    try {
      assets.bottleSfx.currentTime = 0;
      assets.bottleSfx.play().catch(() => {});
    } catch (e) {}
    playSynthBottleChime();
  }

  function playSynthBottleChime() {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      [880, 1320, 1760].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.22, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.2);
      });
    } catch (e) {}
  }

  function playSynthGunshot() {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(340, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  }

  function playSynthSiren() {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(900, audioCtx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.36);
    } catch (e) {}
  }

  let lastSpottedSoundTime = 0;
  function playSpottedSound() {
    if (!isSoundEnabled) return;
    initAudio();
    const now = Date.now();
    if (now - lastSpottedSoundTime < 600) return;
    lastSpottedSoundTime = now;
    try {
      assets.spotted.currentTime = 0;
      const p = assets.spotted.play();
      if (p !== undefined) p.catch(() => {});
    } catch (e) {}
  }

  function playMusic(restart = false) {
    if (!isSoundEnabled) return;
    const meta = (typeof currentStageIdx !== 'undefined' && LEVEL_BOOK[currentStageIdx])
      ? LEVEL_BOOK[currentStageIdx]
      : { id: 1, isBoss: false };
    MusicManager.playLevelMusic(meta.id, meta.isBoss, restart);
  }

  function stopMusic(reset = false) {
    MusicManager.stop(reset);
  }

  function toggleSound() {
    initAudio();
    isSoundEnabled = !isSoundEnabled;
    try {
      localStorage.setItem('balayya-hunter-sound', String(isSoundEnabled));
    } catch (e) {}

    updateSoundUI();
    if (!isSoundEnabled) {
      stopMusic();
      if (assets.bossVictory) {
        try {
          assets.bossVictory.pause();
        } catch (e) {}
      }
      if (assets.levelVictory) {
        try {
          assets.levelVictory.pause();
        } catch (e) {}
      }
      if (assets.bossDefeat) {
        try {
          assets.bossDefeat.pause();
        } catch (e) {}
      }
      if (assets.crash) {
        try {
          assets.crash.pause();
        } catch (e) {}
      }
    } else {
      MusicManager.resume();
    }
  }

  function updateSoundUI() {
    const text = isSoundEnabled ? '🔊 Sound on' : '🔇 Sound off';
    if (btnHomeSoundToggle) btnHomeSoundToggle.textContent = text;
    if (btnGameSound) btnGameSound.textContent = isSoundEnabled ? '🔊' : '🔇';
    if (pauseSoundText) pauseSoundText.textContent = isSoundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
  }

  function showToast(msg) {
    if (!toastBadge) return;
    toastBadge.textContent = msg;
    toastBadge.classList.add('show');
    setTimeout(() => toastBadge.classList.remove('show'), 2600);
  }

  // --- Strict Letterboxed Dimensions (Full-Screen Filling, Zero Wasted Space) ---
  function updateDimensions() {
    if (screenMode !== 'game') return;
    const stage = getStage(currentStageIdx);
    const wrapper = canvas.parentElement;
    if (!wrapper) return;

    const availW = wrapper.clientWidth;
    const availH = wrapper.clientHeight;
    if (!availW || !availH) return;

    const scale = Math.min(availW / stage.width, availH / stage.height);
    const cssW = Math.round(stage.width * scale);
    const cssH = Math.round(stage.height * scale);

    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(stage.width * dpr);
    canvas.height = Math.round(stage.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (gameState !== 'playing') {
      render();
    }
  }

  window.addEventListener('resize', updateDimensions);

  // --- MATHEMATICAL CONTINUOUS COLLISION & PUSH-OUT SOLVER ---
  function resolveCircleBoxCollision(entity, box) {
    const closestX = Math.max(box.x, Math.min(entity.x, box.x + box.w));
    const closestY = Math.max(box.y, Math.min(entity.y, box.y + box.h));
    const dx = entity.x - closestX;
    const dy = entity.y - closestY;
    const distSq = dx * dx + dy * dy;
    const r = entity.radius;

    if (distSq < r * r) {
      const dist = Math.sqrt(distSq);
      if (dist > 1e-4) {
        const overlap = (r - dist) + 0.15;
        entity.x += (dx / dist) * overlap;
        entity.y += (dy / dist) * overlap;
      } else {
        const dLeft = entity.x - box.x;
        const dRight = (box.x + box.w) - entity.x;
        const dTop = entity.y - box.y;
        const dBottom = (box.y + box.h) - entity.y;
        const minD = Math.min(dLeft, dRight, dTop, dBottom);
        if (minD === dLeft) entity.x = box.x - r - 0.15;
        else if (minD === dRight) entity.x = box.x + box.w + r + 0.15;
        else if (minD === dTop) entity.y = box.y - r - 0.15;
        else entity.y = box.y + box.h + r + 0.15;
      }
      return true;
    }
    return false;
  }

  function resolveAllCollisions(entity, obstacles) {
    for (let iter = 0; iter < 4; iter++) {
      let resolved = false;
      for (let i = 0; i < obstacles.length; i++) {
        if (resolveCircleBoxCollision(entity, obstacles[i])) {
          resolved = true;
        }
      }
      if (!resolved) break;
    }
  }

  function moveWithSlide(entity, vx, vy, obstacles) {
    entity.x += vx;
    resolveAllCollisions(entity, obstacles);
    entity.y += vy;
    resolveAllCollisions(entity, obstacles);
  }

  function checkCircleBoxCollision(circle, boxes) {
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const closestX = Math.max(b.x, Math.min(circle.x, b.x + b.w));
      const closestY = Math.max(b.y, Math.min(circle.y, b.y + b.h));
      const dx = circle.x - closestX;
      const dy = circle.y - closestY;
      if (dx * dx + dy * dy < circle.radius * circle.radius) {
        return true;
      }
    }
    return false;
  }

  // --- Ray-Casting & Line of Sight ---
  function rayBoxIntersect(ox, oy, dx, dy, box) {
    let tmin = 0;
    let tmax = 1200;

    if (Math.abs(dx) < 1e-6) {
      if (ox < box.x || ox > box.x + box.w) return null;
    } else {
      let t1 = (box.x - ox) / dx;
      let t2 = (box.x + box.w - ox) / dx;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }

    if (Math.abs(dy) < 1e-6) {
      if (oy < box.y || oy > box.y + box.h) return null;
    } else {
      let t1 = (box.y - oy) / dy;
      let t2 = (box.y + box.h - oy) / dy;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }

    return tmin > 0 ? tmin : null;
  }

  function getRayDistance(ox, oy, angle, maxDist, obstacles) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let closestDist = maxDist;

    for (let i = 0; i < obstacles.length; i++) {
      const hit = rayBoxIntersect(ox, oy, dx, dy, obstacles[i]);
      if (hit !== null && hit < closestDist) {
        closestDist = hit;
      }
    }
    return closestDist;
  }

  // --- A* Pathfinding (Compact 14px Radius Allows Small Space Navigation) ---
  function buildPathfindingGrid(stage) {
    gridCols = Math.ceil(stage.width / CELL_SIZE);
    gridRows = Math.ceil(stage.height / CELL_SIZE);
    walkGrid = new Array(gridCols);

    const allObstacles = [...stage.walls, ...stage.crates, ...stage.redContainers];

    for (let c = 0; c < gridCols; c++) {
      walkGrid[c] = new Uint8Array(gridRows);
      for (let r = 0; r < gridRows; r++) {
        const cellX = c * CELL_SIZE + CELL_SIZE / 2;
        const cellY = r * CELL_SIZE + CELL_SIZE / 2;
        // Fine 3px clearance allows easily moving through narrow doorways and tight gaps
        const isBlocked = checkCircleBoxCollision(
          { x: cellX, y: cellY, radius: player.radius + 3 },
          allObstacles
        );
        walkGrid[c][r] = isBlocked ? 0 : 1;
      }
    }
  }

  function findPath(startX, startY, endX, endY, stage) {
    if (!walkGrid || walkGrid.length === 0 || !walkGrid[0]) {
      buildPathfindingGrid(stage);
    }

    let startC = Math.max(0, Math.min(gridCols - 1, Math.floor(startX / CELL_SIZE)));
    let startR = Math.max(0, Math.min(gridRows - 1, Math.floor(startY / CELL_SIZE)));
    let endC = Math.max(0, Math.min(gridCols - 1, Math.floor(endX / CELL_SIZE)));
    let endR = Math.max(0, Math.min(gridRows - 1, Math.floor(endY / CELL_SIZE)));

    // Snap start cell if entity is brushing against an obstacle
    if (walkGrid[startC] && walkGrid[startC][startR] === 0) {
      let foundStart = false;
      for (let rad = 1; rad <= 6 && !foundStart; rad++) {
        for (let dc = -rad; dc <= rad && !foundStart; dc++) {
          for (let dr = -rad; dr <= rad && !foundStart; dr++) {
            const nc = startC + dc;
            const nr = startR + dr;
            if (nc >= 0 && nc < gridCols && nr >= 0 && nr < gridRows && walkGrid[nc][nr] === 1) {
              startC = nc;
              startR = nr;
              foundStart = true;
            }
          }
        }
      }
    }

    // Snap to nearest walkable cell if clicked on a wall or crate
    if (walkGrid[endC] && walkGrid[endC][endR] === 0) {
      let found = false;
      for (let rad = 1; rad <= 8 && !found; rad++) {
        for (let dc = -rad; dc <= rad && !found; dc++) {
          for (let dr = -rad; dr <= rad && !found; dr++) {
            const nc = endC + dc;
            const nr = endR + dr;
            if (nc >= 0 && nc < gridCols && nr >= 0 && nr < gridRows && walkGrid[nc][nr] === 1) {
              endC = nc;
              endR = nr;
              found = true;
            }
          }
        }
      }
      if (!found) return [];
    }

    if (startC === endC && startR === endR) {
      return [{ x: endC * CELL_SIZE + CELL_SIZE / 2, y: endR * CELL_SIZE + CELL_SIZE / 2 }];
    }

    const openSet = [];
    const closedSet = new Uint8Array(gridCols * gridRows);
    const gScore = new Float32Array(gridCols * gridRows).fill(Infinity);
    const parentMap = new Int32Array(gridCols * gridRows).fill(-1);

    const startIdx = startC * gridRows + startR;
    const endIdx = endC * gridRows + endR;

    gScore[startIdx] = 0;
    openSet.push({ idx: startIdx, c: startC, r: startR, f: Math.hypot(endC - startC, endR - startR) });

    const neighbors = [
      { dc: 1, dr: 0, cost: 1 },
      { dc: -1, dr: 0, cost: 1 },
      { dc: 0, dr: 1, cost: 1 },
      { dc: 0, dr: -1, cost: 1 },
      { dc: 1, dr: 1, cost: 1.414 },
      { dc: 1, dr: -1, cost: 1.414 },
      { dc: -1, dr: 1, cost: 1.414 },
      { dc: -1, dr: -1, cost: 1.414 }
    ];

    let foundTarget = false;
    let maxIterations = 800;

    while (openSet.length > 0 && maxIterations-- > 0) {
      let bestIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[bestIdx].f) bestIdx = i;
      }
      const current = openSet.splice(bestIdx, 1)[0];

      if (current.idx === endIdx) {
        foundTarget = true;
        break;
      }

      closedSet[current.idx] = 1;

      for (let i = 0; i < neighbors.length; i++) {
        const n = neighbors[i];
        const nc = current.c + n.dc;
        const nr = current.r + n.dr;

        if (nc < 0 || nc >= gridCols || nr < 0 || nr >= gridRows) continue;
        if (walkGrid[nc][nr] === 0) continue;

        if (n.dc !== 0 && n.dr !== 0) {
          if (walkGrid[current.c + n.dc][current.r] === 0 || walkGrid[current.c][current.r + n.dr] === 0) {
            continue;
          }
        }

        const nIdx = nc * gridRows + nr;
        if (closedSet[nIdx] === 1) continue;

        const tentativeG = gScore[current.idx] + n.cost;
        if (tentativeG < gScore[nIdx]) {
          parentMap[nIdx] = current.idx;
          gScore[nIdx] = tentativeG;
          const h = Math.hypot(endC - nc, endR - nr);
          const f = tentativeG + h;

          const existing = openSet.find(o => o.idx === nIdx);
          if (existing) existing.f = f;
          else openSet.push({ idx: nIdx, c: nc, r: nr, f });
        }
      }
    }

    if (!foundTarget) return [];

    const rawPath = [];
    let curr = endIdx;
    let maxBacktrack = gridCols * gridRows;
    while (curr !== -1 && maxBacktrack-- > 0) {
      const c = Math.floor(curr / gridRows);
      const r = curr % gridRows;
      rawPath.unshift({ x: c * CELL_SIZE + CELL_SIZE / 2, y: r * CELL_SIZE + CELL_SIZE / 2 });
      curr = parentMap[curr];
    }

    return smoothPath(rawPath, [...stage.walls, ...stage.crates, ...stage.redContainers]);
  }

  function smoothPath(path, obstacles) {
    if (path.length <= 2) return path;
    const smoothed = [path[0]];
    let currentIdx = 0;

    while (currentIdx < path.length - 1) {
      let furthestClear = currentIdx + 1;
      const maxLookahead = Math.min(path.length - 1, currentIdx + 7);
      for (let next = maxLookahead; next > currentIdx + 1; next--) {
        if (isLineClear(smoothed[smoothed.length - 1], path[next], obstacles)) {
          furthestClear = next;
          break;
        }
      }
      smoothed.push(path[furthestClear]);
      currentIdx = furthestClear;
    }
    return smoothed;
  }

  function isLineClear(p1, p2, obstacles) {
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(1, Math.ceil(dist / 14));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const testX = p1.x + (p2.x - p1.x) * t;
      const testY = p1.y + (p2.y - p1.y) * t;
      if (checkCircleBoxCollision({ x: testX, y: testY, radius: player.radius + 2 }, obstacles)) {
        return false;
      }
    }
    return true;
  }

  // --- Stage Loading & Initial Setup ---
  function loadStage(idx) {
    if (assets.bossVictory) {
      try {
        assets.bossVictory.pause();
        assets.bossVictory.currentTime = 0;
      } catch (e) {}
    }
    if (assets.levelVictory) {
      try {
        assets.levelVictory.pause();
        assets.levelVictory.currentTime = 0;
      } catch (e) {}
    }
    if (assets.bossDefeat) {
      try {
        assets.bossDefeat.pause();
        assets.bossDefeat.currentTime = 0;
      } catch (e) {}
    }
    if (assets.crash) {
      try {
        assets.crash.pause();
        assets.crash.currentTime = 0;
      } catch (e) {}
    }
    if (idx >= maxUnlockedLevel) {
      idx = Math.max(0, maxUnlockedLevel - 1);
    }
    const stage = getStage(idx);
    currentStageIdx = idx;
    try {
      localStorage.setItem('balayya-hunter-stage', String(currentStageIdx + 1));
    } catch (e) {}

    buildPathfindingGrid(stage);

    player.x = stage.playerStart.x;
    player.y = stage.playerStart.y;
    player.targetX = player.x;
    player.targetY = player.y;
    player.path = [];
    player.targetEnemy = null;
    player.stuckTicks = 0;
    player.angle = 0;
    player.hp = player.maxHp;
    player.speed = player.baseSpeed;
    player.speedBoostTimer = 0;
    player.isMoving = false;
    player.animTick = 0;
    player.facingRight = true;
    player.isStealthed = false;

    destinationMarker.active = false;

    // Load Police with Escalating Strength & Desynchronized Patrol Routines
    policeList = stage.police.map((p, i) => {
      const initialIdx = (p.waypoints && p.waypoints.length > 0) ? (i % p.waypoints.length) : 0;
      const initialWp = (p.waypoints && p.waypoints[initialIdx]) ? p.waypoints[initialIdx] : null;
      const isStartIdle = (i % 2 === 1);
      return {
        id: i,
        name: p.name || `Officer ${i + 1}`,
        x: p.x,
        y: p.y,
        angle: p.angle,
        targetAngle: p.angle,
        waypoints: p.waypoints.map(wp => ({ ...wp })),
        waypointIdx: initialIdx,
        speed: p.speed || 1.6,
        radius: p.isBoss ? 24 : 18,
        fov: p.fov || 1.35,
        range: p.range || 230,
        state: isStartIdle ? 'idle' : 'patrol',
        idleTimer: isStartIdle ? (40 + (i * 25) % 50) : 0,
        idleSweepPhase: i * 1.3,
        baseLookAngle: initialWp && initialWp.lookAngle !== undefined ? initialWp.lookAngle : p.angle,
        alertTimer: 0,
        investigateTimer: 0,
        investigateTarget: null,
        path: [],
        alertIcon: '',
        alertIconTimer: 0,
        shootCooldown: 0,
        isBoss: !!p.isBoss,
        isScout: !!p.isScout,
        hp: p.hp || (p.isBoss ? 300 : 1),
        maxHp: p.maxHp || (p.isBoss ? 300 : 1),
        isEnraged: false,
        blindTimer: 0,
        animTick: Math.random() * 100
      };
    });

    staticBottles = stage.staticBottles.map(b => ({ ...b }));
    speedOrbs = stage.speedOrbs.map(s => ({ ...s }));
    smokeOrbs = stage.smokeOrbs.map(sm => ({ ...sm }));
    smokeClouds = [];
    cameras = stage.cameras.map(c => ({ ...c }));
    lasers = stage.lasers.map(l => ({ ...l }));

    bullets = [];
    particles = [];
    floatingTexts = [];
    droppedBottles = [];
    eliminatedCount = 0;
    collectedStageBottles = 0;

    if (btnContinueText) {
      btnContinueText.textContent = `CONTINUE • LEVEL ${stage.id}`;
    }

    updateDimensions();
    updateHUD();
  }

  function updateHUD() {
    const stage = getStage(currentStageIdx);

    if (hudTargetText) hudTargetText.textContent = `${eliminatedCount}/${stage.targetCount}`;
    if (hudBottleText) hudBottleText.textContent = String(totalBottles);

    if (taskLevelName) {
      taskLevelName.textContent = stage.isBossStage ? `LVL ${stage.id} 👑` : `LVL ${stage.id}`;
    }

    if (playerHpFill && playerHpText && playerHpFill.style) {
      const pct = Math.max(0, Math.min(100, Math.round((player.hp / player.maxHp) * 100)));
      playerHpFill.style.width = `${pct}%`;
      playerHpText.textContent = `${pct}%`;
      if (pct < 35) playerHpFill.style.background = '#ef4444';
      else if (pct < 60) playerHpFill.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';
      else playerHpFill.style.background = 'linear-gradient(90deg, #22c55e, #10b981)';
    }

    const boss = policeList.find(p => p.isBoss);
    if (boss && boss.state !== 'eliminated') {
      if (bossBarBox) {
        bossBarBox.classList.remove('hidden');
        if (bossHpText) bossHpText.textContent = `${Math.max(0, boss.hp)} / ${boss.maxHp} HP`;
        if (bossHpFill && bossHpFill.style) {
          const bossPct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
          bossHpFill.style.width = `${bossPct}%`;
          if (boss.isEnraged) bossHpFill.style.background = '#dc2626';
          else bossHpFill.style.background = 'linear-gradient(90deg, #ef4444, #f97316, #eab308)';
        }
      }
    } else {
      if (bossBarBox) bossBarBox.classList.add('hidden');
    }

    if (btnGameSound) {
      btnGameSound.textContent = isSoundEnabled ? '🔊' : '🔇';
    }
  }

  // --- Screen State Switching ---
  function showHomeScreen() {
    screenMode = 'menu';
    stopMusic(true);
    cancelAnimationFrame(animFrameId);
    if (assets.bossVictory) {
      try {
        assets.bossVictory.pause();
        assets.bossVictory.currentTime = 0;
      } catch (e) {}
    }
    if (assets.levelVictory) {
      try {
        assets.levelVictory.pause();
        assets.levelVictory.currentTime = 0;
      } catch (e) {}
    }
    if (assets.bossDefeat) {
      try {
        assets.bossDefeat.pause();
        assets.bossDefeat.currentTime = 0;
      } catch (e) {}
    }
    if (assets.crash) {
      try {
        assets.crash.pause();
        assets.crash.currentTime = 0;
      } catch (e) {}
    }

    if (homeView) homeView.classList.remove('hidden');
    if (gameView) gameView.classList.add('hidden');
    if (levelsView) levelsView.classList.add('hidden');
    if (bossBarBox) bossBarBox.classList.add('hidden');
    if (modalVictory) modalVictory.classList.add('hidden');
    if (modalDefeat) modalDefeat.classList.add('hidden');
    if (modalPaused) modalPaused.classList.add('hidden');
    if (modalGameComplete) modalGameComplete.classList.add('hidden');

    const displayLvl = Math.min(50, Math.max(1, currentStageIdx + 1));
    if (btnContinueText) {
      btnContinueText.textContent = `CONTINUE • LEVEL ${displayLvl}`;
    }
  }

  function startMission() {
    initAudio();
    if (assets.bossVictory) {
      try {
        assets.bossVictory.pause();
        assets.bossVictory.currentTime = 0;
      } catch (e) {}
    }
    if (assets.levelVictory) {
      try {
        assets.levelVictory.pause();
        assets.levelVictory.currentTime = 0;
      } catch (e) {}
    }
    if (assets.bossDefeat) {
      try {
        assets.bossDefeat.pause();
        assets.bossDefeat.currentTime = 0;
      } catch (e) {}
    }
    if (assets.crash) {
      try {
        assets.crash.pause();
        assets.crash.currentTime = 0;
      } catch (e) {}
    }
    screenMode = 'game';
    gameState = 'playing';

    if (homeView) homeView.classList.add('hidden');
    if (levelsView) levelsView.classList.add('hidden');
    if (gameView) gameView.classList.remove('hidden');

    if (modalVictory) modalVictory.classList.add('hidden');
    if (modalDefeat) modalDefeat.classList.add('hidden');
    if (modalPaused) modalPaused.classList.add('hidden');
    if (modalGameComplete) modalGameComplete.classList.add('hidden');

    // Strict Progression Rule: Only allowed to play up to maxUnlockedLevel!
    if (currentStageIdx >= maxUnlockedLevel) {
      currentStageIdx = Math.max(0, maxUnlockedLevel - 1);
    }

    loadStage(currentStageIdx);
    updateDimensions();
    playMusic(true);
    canvas.focus();
    cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (gameState !== 'playing') return;
    gameState = 'paused';
    cancelAnimationFrame(animFrameId);
    stopMusic(false);

    const stage = getStage(currentStageIdx);
    const pauseSectorName = document.getElementById('pauseSectorName');
    const pauseGuardsText = document.getElementById('pauseGuardsText');
    const pauseBottlesText = document.getElementById('pauseBottlesText');
    const pauseTotalBottlesText = document.getElementById('pauseTotalBottlesText');

    if (pauseSectorName) pauseSectorName.textContent = `Sector ${stage.id}: ${stage.name}`;
    if (pauseGuardsText) pauseGuardsText.textContent = `${stage.targetCount - eliminatedCount} Remaining`;
    if (pauseBottlesText) pauseBottlesText.textContent = `${collectedStageBottles} / ${stage.staticBottles.length} Found`;
    if (pauseTotalBottlesText) pauseTotalBottlesText.textContent = `${totalBottles} Bottles`;

    if (bossBarBox) bossBarBox.classList.add('hidden');
    if (modalPaused) modalPaused.classList.remove('hidden');
  }

  function resumeGame() {
    if (gameState !== 'paused') return;
    gameState = 'playing';
    if (modalPaused) modalPaused.classList.add('hidden');
    const boss = policeList.find(p => p.isBoss);
    if (boss && boss.state !== 'eliminated' && bossBarBox) {
      bossBarBox.classList.remove('hidden');
    }
    playMusic(false);
    canvas.focus();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function togglePause() {
    if (gameState === 'playing') pauseGame();
    else if (gameState === 'paused') resumeGame();
  }

  function stageVictory() {
    gameState = 'victory';
    cancelAnimationFrame(animFrameId);
    stopMusic(true);
    if (bossBarBox) bossBarBox.classList.add('hidden');
    if (assets.bossDefeat) {
      try {
        assets.bossDefeat.pause();
        assets.bossDefeat.currentTime = 0;
      } catch (e) {}
    }
    if (assets.crash) {
      try {
        assets.crash.pause();
        assets.crash.currentTime = 0;
      } catch (e) {}
    }

    const clearedStage = getStage(currentStageIdx);
    const isBossClear = !!(clearedStage && (clearedStage.isBoss || clearedStage.isBossStage || (clearedStage.id % 5 === 0)));

    if (isBossClear) {
      if (isSoundEnabled && assets.bossVictory) {
        try {
          assets.bossVictory.currentTime = 0;
          const p = assets.bossVictory.play();
          if (p !== undefined) p.catch(() => {});
        } catch (e) {}
      }
    } else {
      if (isSoundEnabled) {
        // Normal Level Win: 60% probability for level_victory.mp3, 40% probability for crash.mp3!
        const playCrash = (Math.random() < 0.40);
        if (playCrash && assets.crash) {
          try {
            assets.crash.currentTime = 0;
            const p = assets.crash.play();
            if (p !== undefined) p.catch(() => {});
          } catch (e) {}
        } else if (assets.levelVictory) {
          try {
            assets.levelVictory.currentTime = 0;
            const p = assets.levelVictory.play();
            if (p !== undefined) p.catch(() => {});
          } catch (e) {}
        }
      }
      playSynthBottleChime();
    }

    const vicSectorName = document.getElementById('vicSectorName');
    const vicGuardsText = document.getElementById('vicGuardsText');
    const vicBottlesText = document.getElementById('vicBottlesText');
    const vicTotalBottlesText = document.getElementById('vicTotalBottlesText');
    const vicHpText = document.getElementById('vicHpText');

    if (vicSectorName) vicSectorName.textContent = `Sector ${clearedStage.id}: ${clearedStage.name}`;
    if (vicGuardsText) vicGuardsText.textContent = `${clearedStage.targetCount} / ${clearedStage.targetCount} Corrupt Police`;
    if (vicBottlesText) vicBottlesText.textContent = `${collectedStageBottles} / ${clearedStage.staticBottles.length} Bottles (+${collectedStageBottles * 3}% HP)`;
    if (vicTotalBottlesText) vicTotalBottlesText.textContent = `${totalBottles} Bottles`;
    if (vicHpText) vicHpText.textContent = `${player.hp}% HP`;

    // Unlock the next level
    const nextLevelNum = clearedStage.id + 1;
    if (nextLevelNum > maxUnlockedLevel) {
      maxUnlockedLevel = Math.min(50, nextLevelNum);
      try {
        localStorage.setItem('balayya-hunter-max-unlocked', String(maxUnlockedLevel));
      } catch (e) {}
    }

    currentStageIdx++;
    try {
      localStorage.setItem('balayya-hunter-stage', String(currentStageIdx + 1));
    } catch (e) {}

    if (currentStageIdx >= 50) {
      if (modalGameComplete) modalGameComplete.classList.remove('hidden');
      return;
    }

    if (victorySummary) {
      victorySummary.textContent = `All corrupt police eliminated! Sector loot secured.`;
    }

    if (btnNextStage) {
      btnNextStage.innerHTML = `<span>▷ NEXT LEVEL (LEVEL ${currentStageIdx + 1})</span>`;
    }

    if (modalVictory) modalVictory.classList.remove('hidden');
  }

  function stageDefeat() {
    gameState = 'defeat';
    cancelAnimationFrame(animFrameId);
    stopMusic(true);
    if (bossBarBox) bossBarBox.classList.add('hidden');

    // Never play boss victory or level victory dialogue on defeat/out time!
    if (assets.bossVictory) {
      try {
        assets.bossVictory.pause();
        assets.bossVictory.currentTime = 0;
      } catch (e) {}
    }
    if (assets.levelVictory) {
      try {
        assets.levelVictory.pause();
        assets.levelVictory.currentTime = 0;
      } catch (e) {}
    }

    const failedStage = getStage(currentStageIdx);
    const isBossDefeat = !!(failedStage && (failedStage.isBoss || failedStage.isBossStage || (failedStage.id % 5 === 0)));

    if (!isBossDefeat && assets.bossDefeat) {
      try {
        assets.bossDefeat.pause();
        assets.bossDefeat.currentTime = 0;
      } catch (e) {}
    }

    if (isSoundEnabled) {
      if (isBossDefeat && assets.bossDefeat) {
        try {
          assets.bossDefeat.currentTime = 0;
          const p = assets.bossDefeat.play();
          if (p !== undefined) p.catch(() => {});
        } catch (e) {}
      } else {
        try {
          assets.crash.currentTime = 0;
          const p = assets.crash.play();
          if (p !== undefined) p.catch(() => {});
        } catch (e) {}
      }
    }

    const defSectorName = document.getElementById('defSectorName');
    const defGuardsText = document.getElementById('defGuardsText');
    const defBottlesText = document.getElementById('defBottlesText');
    const defTotalBottlesText = document.getElementById('defTotalBottlesText');

    if (defSectorName) defSectorName.textContent = `Sector ${failedStage.id}: ${failedStage.name}`;
    if (defGuardsText) defGuardsText.textContent = `${eliminatedCount} / ${failedStage.targetCount} Targets`;
    if (defBottlesText) defBottlesText.textContent = `${collectedStageBottles} / ${failedStage.staticBottles.length} Bottles`;
    if (defTotalBottlesText) defTotalBottlesText.textContent = `${totalBottles} Bottles`;

    screenShake = 24;
    if (modalDefeat) modalDefeat.classList.remove('hidden');
  }

  function triggerNoiseAlert(noiseX, noiseY, hearingRadius) {
    const stage = getStage(currentStageIdx);
    policeList.forEach(p => {
      if (p.state === 'eliminated' || p.state === 'alert') return;
      const d = Math.hypot(p.x - noiseX, p.y - noiseY);
      if (d <= hearingRadius) {
        p.state = 'investigate';
        p.investigateTarget = { x: noiseX, y: noiseY };
        p.investigateTimer = 220;
        p.alertIcon = '?';
        p.alertIconTimer = 90;

        // Pathfind directly around obstacles towards suspicious sound
        p.path = findPath(p.x, p.y, noiseX, noiseY, stage);

        floatingTexts.push({
          x: p.x,
          y: p.y - 20,
          text: "?!",
          color: '#ffd27d',
          life: 0.9
        });
      }
    });
  }

  function triggerPartnerDeathAlert(deadP, stage, allObstacles) {
    const killX = deadP.x;
    const killY = deadP.y;

    policeList.forEach(other => {
      if (other === deadP || other.state === 'eliminated' || other.state === 'alert') return;

      const dist = Math.hypot(other.x - killX, other.y - killY);
      if (dist > 520) return; // Beyond hearing radius, skip calculation to keep game 100% fluid

      const angle = Math.atan2(killY - other.y, killX - other.x);
      let angleDiff = angle - other.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      let seesDeath = false;
      if (dist < other.range && Math.abs(angleDiff) < other.fov / 2) {
        const hitDist = getRayDistance(other.x, other.y, angle, dist, allObstacles);
        if (hitDist >= dist - 12) seesDeath = true;
      }

      const hearsDeath = dist <= 460;

      if (seesDeath || hearsDeath) {
        other.state = 'investigate';
        other.investigateTarget = { x: killX, y: killY };
        other.investigateTimer = 260;
        other.alertIcon = '!';
        other.alertIconTimer = 110;

        // Pathfind to investigate the crime scene
        other.path = findPath(other.x, other.y, killX, killY, stage);

        floatingTexts.push({
          x: other.x,
          y: other.y - 25,
          text: seesDeath ? "PARTNER DOWN! 🚨" : "OFFICER HIT?! ⚠️",
          color: '#f97316',
          life: 1.3
        });
      }
    });
  }

  // --- Bottle Theft Alert: When Balayya collects a Mansion House bottle, police rush directly to it ---
  function triggerBottleTheftAlert(bottleX, bottleY) {
    const stage = getStage(currentStageIdx);
    const allObstacles = [...stage.walls, ...stage.crates, ...stage.redContainers];

    policeList.forEach(p => {
      if (p.state === 'eliminated') return;

      const dist = Math.hypot(p.x - bottleX, p.y - bottleY);
      // Skip distant guards on large maps if plenty of guards to preserve 60 FPS
      if (dist > 620 && policeList.filter(g => g.state !== 'eliminated').length > 4) return;

      const angle = Math.atan2(bottleY - p.y, bottleX - p.x);
      let angleDiff = angle - p.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      let seesTheft = false;
      if (dist < p.range && Math.abs(angleDiff) < p.fov / 2) {
        const hitDist = getRayDistance(p.x, p.y, angle, dist, allObstacles);
        if (hitDist >= dist - 16) seesTheft = true;
      }

      // If police is patrolling, idling, or investigating, immediately rush directly to the bottle!
      if (p.state !== 'alert') {
        p.state = 'investigate';
        p.investigateTarget = { x: bottleX, y: bottleY };
        p.investigateTimer = 280;
        p.alertIcon = '!';
        p.alertIconTimer = 110;

        // Direct pathfinding to bottle coordinates around all obstacles
        p.path = findPath(p.x, p.y, bottleX, bottleY, stage);

        // Turn immediately to start moving directly towards the bottle
        if (p.path && p.path.length > 0) {
          p.targetAngle = Math.atan2(p.path[0].y - p.y, p.path[0].x - p.x);
          p.angle = p.targetAngle;
        } else {
          p.targetAngle = angle;
          p.angle = angle;
        }

        floatingTexts.push({
          x: p.x,
          y: p.y - 25,
          text: seesTheft ? "BOTTLE STOLEN! 🚨" : "MANSION HOUSE ALERT! 🍾",
          color: '#fbbf24',
          life: 1.3
        });
      } else {
        // If already in alert, direct attention to bottle if player broke line of sight
        p.lastKnownPlayerX = bottleX;
        p.lastKnownPlayerY = bottleY;
      }
    });

    screenShake = Math.max(screenShake, 4);
  }

  // --- Main Physics Loop (Energy Drinks, Small Space Movement, Zero Wall Crossing) ---
  function update() {
    const stage = getStage(currentStageIdx);
    const allObstacles = [...stage.walls, ...stage.crates, ...stage.redContainers];

    // Speed Boost Timer (Level 2 Special)
    if (player.speedBoostTimer > 0) {
      player.speedBoostTimer--;
      player.speed = player.baseSpeed * 1.85;
      if (Math.random() < 0.4) {
        particles.push({
          x: player.x + (Math.random() - 0.5) * 14,
          y: player.y + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 5 + 3,
          color: '#ffd700',
          life: 0.6
        });
      }
    } else {
      player.speed = player.baseSpeed;
    }

    // Dynamic Takedown Homing: If chasing a targeted police guard, continuously track their coordinates
    if (player.targetEnemy) {
      if (player.targetEnemy.state === 'eliminated') {
        player.targetEnemy = null;
      } else {
        const dEnemy = Math.hypot(player.targetEnemy.x - player.x, player.targetEnemy.y - player.y);
        if (dEnemy > 12) {
          player.path = [{ x: player.targetEnemy.x, y: player.targetEnemy.y }];
        }
      }
    }

    // 1. Move Player (Balayya) with Strict Solid Sliding Collision in Narrow Spaces
    let moveX = 0;
    let moveY = 0;

    if (keys.w) moveY -= 1;
    if (keys.s) moveY += 1;
    if (keys.a) moveX -= 1;
    if (keys.d) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      player.path = [];
      player.targetEnemy = null;
      destinationMarker.active = false;
      const len = Math.hypot(moveX, moveY);
      moveX = (moveX / len) * player.speed;
      moveY = (moveY / len) * player.speed;
      player.angle = Math.atan2(moveY, moveX);
      player.facingRight = moveX >= 0;

      moveWithSlide(player, moveX, moveY, allObstacles);
      player.isMoving = true;
    } else if (player.path.length > 0) {
      const nextWp = player.path[0];
      const dx = nextWp.x - player.x;
      const dy = nextWp.y - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 6) {
        player.path.shift();
        if (player.path.length === 0) {
          player.isMoving = false;
          destinationMarker.active = false;
        }
      } else {
        const step = Math.min(player.speed, dist);
        moveX = (dx / dist) * step;
        moveY = (dy / dist) * step;
        player.angle = Math.atan2(dy, dx);
        player.facingRight = dx >= 0;

        const oldX = player.x;
        const oldY = player.y;
        moveWithSlide(player, moveX, moveY, allObstacles);

        if (Math.hypot(player.x - oldX, player.y - oldY) < 0.15) {
          player.stuckTicks = (player.stuckTicks || 0) + 1;
          if (player.stuckTicks > 12) {
            player.path = [];
            player.targetEnemy = null;
            player.isMoving = false;
            destinationMarker.active = false;
            player.stuckTicks = 0;
          }
        } else {
          player.stuckTicks = 0;
          player.isMoving = true;
        }
      }
    } else {
      player.isMoving = false;
    }

    // Level 1 Special: Shadow Concealment behind Crates
    let isCoveredByCrate = false;
    stage.crates.forEach(c => {
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      if (Math.hypot(player.x - cx, player.y - cy) < 48) {
        isCoveredByCrate = true;
      }
    });
    player.isStealthed = isCoveredByCrate;

    // Walking animation ticker & dust particles
    if (player.isMoving) {
      player.animTick++;
      if (Math.random() < 0.2) {
        particles.push({
          x: player.x - Math.cos(player.angle) * 12,
          y: player.y + 4,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          size: Math.random() * 4 + 2,
          color: 'rgba(130, 120, 100, 0.45)',
          life: 0.5
        });
      }
    }

    if (destinationMarker.active) {
      destinationMarker.radius += 0.45;
      if (destinationMarker.radius > 22) destinationMarker.radius = 8;
      destinationMarker.alpha = Math.max(0.2, destinationMarker.alpha - 0.005);
    }

    // 2. LEVEL 2 SPECIAL: Speed Boost Orbs
    speedOrbs.forEach(orb => {
      if (!orb.collected) {
        const d = Math.hypot(orb.x - player.x, orb.y - player.y);
        if (d < 30) {
          orb.collected = true;
          player.speedBoostTimer = 360;
          playSynthBottleChime();
          floatingTexts.push({
            x: player.x,
            y: player.y - 25,
            text: "SUPERSONIC SPEED! ⚡",
            color: '#ffd700',
            life: 1.4
          });
        }
      }
    });

    // 3. LEVEL 3 SPECIAL: Smoke Grenades & Clouds
    smokeOrbs.forEach(sm => {
      if (!sm.collected) {
        const d = Math.hypot(sm.x - player.x, sm.y - player.y);
        if (d < 30) {
          sm.collected = true;
          smokeClouds.push({
            x: sm.x,
            y: sm.y,
            radius: 95,
            timer: 420
          });
          playSynthSiren();
          floatingTexts.push({
            x: player.x,
            y: player.y - 25,
            text: "SMOKE SCREEN DEPLOYED! 💨",
            color: '#cbd5e1',
            life: 1.5
          });
        }
      }
    });

    smokeClouds.forEach(sc => {
      sc.timer--;
      policeList.forEach(p => {
        if (Math.hypot(p.x - sc.x, p.y - sc.y) < sc.radius) {
          p.blindTimer = 60;
        }
      });
    });
    smokeClouds = smokeClouds.filter(sc => sc.timer > 0);

    // 4. LEVEL 4 SPECIAL: Rotating CCTV Surveillance Cameras
    cameras.forEach(cam => {
      cam.angle += cam.rotSpeed * cam.dir;
      if (cam.angle >= cam.maxAngle || cam.angle <= cam.minAngle) cam.dir *= -1;

      const toPlayerX = player.x - cam.x;
      const toPlayerY = player.y - cam.y;
      const dist = Math.hypot(toPlayerX, toPlayerY);
      const ang = Math.atan2(toPlayerY, toPlayerX);

      let diff = ang - cam.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      if (dist < cam.range && Math.abs(diff) < cam.fov / 2) {
        const hitDist = getRayDistance(cam.x, cam.y, ang, dist, allObstacles);
        if (hitDist >= dist - 8) {
          cam.alert = true;
          playSynthSiren();
          playSpottedSound();
          screenShake = 16;
          triggerNoiseAlert(player.x, player.y, 600);
          showToast("CCTV CAMERA DETECTED INTRUDER! 🚨");
        }
      } else {
        cam.alert = false;
      }
    });

    // 5. Moving Laser Tripwires (Inflicts -10 HP Shock Damage on Contact)
    lasers.forEach(laser => {
      laser.y += laser.speedY * laser.dir;
      if (laser.y >= laser.maxY || laser.y <= laser.minY) laser.dir *= -1;

      if (laser.hitCooldown > 0) laser.hitCooldown--;

      const minX = Math.min(laser.x1, laser.x2);
      const maxX = Math.max(laser.x1, laser.x2);
      if (player.x >= minX && player.x <= maxX && Math.abs(player.y - laser.y) < player.radius + 3) {
        if (!laser.hitCooldown || laser.hitCooldown <= 0) {
          laser.hitCooldown = 40;
          player.hp = Math.max(0, player.hp - 10);
          floatingTexts.push({
            x: player.x,
            y: player.y - 20,
            text: "-10 HP! ⚡ LASER HIT!",
            color: '#ef4444',
            life: 1.0
          });
          playSynthSiren();
          screenShake = 16;
          triggerNoiseAlert(player.x, player.y, 800);
          showToast("SECURITY LASER TRIPPED! 🚨 -10 HP");
          updateHUD();
          if (player.hp <= 0) stageDefeat();
        }
      }
    });

    // 6. Police AI & Movement (WITH STRICT SOLID WALL SLIDING)
    policeList.forEach(p => {
      if (p.state === 'eliminated') return;
      p.animTick++;
      if (p.blindTimer > 0) p.blindTimer--;
      if (p.hitCooldown > 0) p.hitCooldown--;

      // BOSS Enrage Mode at <150 HP
      if (p.isBoss && p.hp <= 150 && !p.isEnraged) {
        p.isEnraged = true;
        p.speed *= 1.3;
        p.range *= 1.2;
        screenShake = 22;
        playSynthSiren();
        playSpottedSound();
        showToast(`${p.name.toUpperCase()} ENRAGED! MAXIMUM POWER! 🚨`);
      }

      const toPlayerX = player.x - p.x;
      const toPlayerY = player.y - p.y;
      const distToPlayer = Math.hypot(toPlayerX, toPlayerY);
      const angleToPlayer = Math.atan2(toPlayerY, toPlayerX);

      // Measure distance to Balayya's body/torso (accurate across all angles and positions)
      const closestPlayerY = Math.max(player.y - 65, Math.min(p.y, player.y));
      const distToPlayerBody = Math.min(
        Math.hypot(player.x - p.x, player.y - p.y),
        Math.hypot(player.x - p.x, closestPlayerY - p.y),
        Math.hypot(player.x - p.x, player.y - 35 - p.y)
      );

      let angleDiff = angleToPlayer - p.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      let canSeePlayer = false;
      if (p.blindTimer <= 0) {
        const angTolerance = Math.atan2(player.radius, Math.max(1, distToPlayer));
        // Check if in flashlight vision cone OR in close frontal/side proximity
        const inVisionCone = (distToPlayer - player.radius < p.range && Math.abs(angleDiff) < (p.fov / 2 + angTolerance));
        const inCloseProximity = (distToPlayerBody < 45 && Math.abs(angleDiff) < Math.PI * 0.65);

        if (inVisionCone || inCloseProximity) {
          // Direct ray to player center
          const hitDist = getRayDistance(p.x, p.y, angleToPlayer, distToPlayer, allObstacles);
          if (hitDist >= distToPlayer - player.radius) {
            canSeePlayer = true;
          } else {
            // Check shoulder rays (left & right tangent) to prevent corner clipping false negatives
            const perpDist = player.radius * 0.75;
            const pLx = player.x - Math.sin(angleToPlayer) * perpDist;
            const pLy = player.y + Math.cos(angleToPlayer) * perpDist;
            const distL = Math.hypot(pLx - p.x, pLy - p.y);
            const angL = Math.atan2(pLy - p.y, pLx - p.x);
            let diffL = angL - p.angle;
            while (diffL > Math.PI) diffL -= Math.PI * 2;
            while (diffL < -Math.PI) diffL += Math.PI * 2;
            if (inCloseProximity || Math.abs(diffL) < p.fov / 2) {
              const hitL = getRayDistance(p.x, p.y, angL, distL, allObstacles);
              if (hitL >= distL - 4) canSeePlayer = true;
            }

            if (!canSeePlayer) {
              const pRx = player.x + Math.sin(angleToPlayer) * perpDist;
              const pRy = player.y - Math.cos(angleToPlayer) * perpDist;
              const distR = Math.hypot(pRx - p.x, pRy - p.y);
              const angR = Math.atan2(pRy - p.y, pRx - p.x);
              let diffR = angR - p.angle;
              while (diffR > Math.PI) diffR -= Math.PI * 2;
              while (diffR < -Math.PI) diffR += Math.PI * 2;
              if (inCloseProximity || Math.abs(diffR) < p.fov / 2) {
                const hitR = getRayDistance(p.x, p.y, angR, distR, allObstacles);
                if (hitR >= distR - 4) canSeePlayer = true;
              }
            }
          }
        }
      }

      if (canSeePlayer) {
        const wasAlert = (p.state === 'alert');
        p.state = 'alert';
        p.alertTimer = 180;
        p.targetAngle = angleToPlayer;
        p.path = []; // cancel investigation path when spotting player
        p.alertIcon = '!';
        p.alertIconTimer = 60;
        p.lastKnownPlayerX = player.x;
        p.lastKnownPlayerY = player.y;
        triggerNoiseAlert(p.x, p.y, 300);

        playSpottedSound();

        p.shootCooldown--;
        if (p.shootCooldown <= 0) {
          p.shootCooldown = p.isBoss ? (p.isEnraged ? 15 : 22) : 38;
          playSynthGunshot();
          triggerNoiseAlert(p.x, p.y, 600); // gunshot alerts nearby guards!
          const bulletSpeed = p.isBoss ? 8.5 : 7.2;
          bullets.push({
            x: p.x + Math.cos(p.angle) * 22,
            y: p.y + Math.sin(p.angle) * 22,
            vx: Math.cos(angleToPlayer) * bulletSpeed,
            vy: Math.sin(angleToPlayer) * bulletSpeed,
            isBossBullet: p.isBoss,
            life: 120
          });
        }
      } else if (p.state === 'alert') {
        // Line of Sight lost! Player slipped behind wall or crates!
        // Authentic Hunter Assassin stealth escape: guard rushes to last known position with '?' icon!
        p.state = 'investigate';
        p.alertIcon = '?';
        p.alertIconTimer = 160;
        p.investigateTimer = 140; // ~2.3 seconds of investigating the corner
        const targetX = (p.lastKnownPlayerX !== undefined) ? p.lastKnownPlayerX : player.x;
        const targetY = (p.lastKnownPlayerY !== undefined) ? p.lastKnownPlayerY : player.y;
        p.investigateTarget = { x: targetX, y: targetY };
        p.path = findPath(p.x, p.y, targetX, targetY, stage);
      }

      // Decrement visual alert badge timer
      if (p.alertIconTimer > 0) p.alertIconTimer--;

      // Patrol / Idle / Investigation Movement (ZERO ROBOTIC PARALLEL MOTION)
      if (p.state === 'patrol') {
        const wp = p.waypoints[p.waypointIdx];
        const toWpX = wp.x - p.x;
        const toWpY = wp.y - p.y;
        const distWp = Math.hypot(toWpX, toWpY);

        if (distWp < 14) {
          // Reached waypoint! Enter idle pause & look around with sweeping flashlight
          p.state = 'idle';
          p.idleTimer = wp.waitTicks || (60 + Math.floor(Math.random() * 35));
          p.baseLookAngle = (wp.lookAngle !== undefined) ? wp.lookAngle : p.angle;
          p.idleSweepPhase = 0;
        } else {
          p.targetAngle = Math.atan2(toWpY, toWpX);
          const vx = Math.cos(p.angle) * p.speed;
          const vy = Math.sin(p.angle) * p.speed;
          moveWithSlide(p, vx, vy, allObstacles);
        }
      } else if (p.state === 'idle') {
        p.idleTimer--;
        p.idleSweepPhase += 0.05;
        // Sweep flashlight cone left and right by ±40 degrees while idling!
        p.targetAngle = p.baseLookAngle + Math.sin(p.idleSweepPhase) * 0.7;

        if (p.idleTimer <= 0) {
          p.waypointIdx = (p.waypointIdx + 1) % p.waypoints.length;
          p.state = 'patrol';
        }
      } else if (p.state === 'investigate') {
        p.investigateTimer--;

        // Follow A* path to the investigation target (dead partner, noise, or stolen bottle)
        if (p.path && p.path.length > 0) {
          const nextPoint = p.path[0];
          const toTargetX = nextPoint.x - p.x;
          const toTargetY = nextPoint.y - p.y;
          const distT = Math.hypot(toTargetX, toTargetY);

          if (distT < 14) {
            p.path.shift();
          } else {
            const desiredAngle = Math.atan2(toTargetY, toTargetX);
            p.targetAngle = desiredAngle;
            let diffAngle = desiredAngle - p.angle;
            while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
            while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
            if (Math.abs(diffAngle) > 0.4) {
              p.angle += Math.sign(diffAngle) * 0.25;
            }
            const runSpeed = p.speed * 1.4; // Runs directly to investigate!
            const vx = Math.cos(p.angle) * runSpeed;
            const vy = Math.sin(p.angle) * runSpeed;
            moveWithSlide(p, vx, vy, allObstacles);
          }
        } else {
          // Arrived at destination: sweep 360 degrees to find killer or thief
          p.targetAngle += 0.06;
        }

        if (p.investigateTimer <= 0) {
          p.state = 'patrol';
          p.investigateTarget = null;
          p.path = [];
        }
      } else if (p.state === 'alert') {
        // When alert (flashlight on player), police stands ground and fires weapon from distance!
        // Police DOES NOT rush forward to touch the player and die.
        // Police DOES NOT push or repel the player.
        // Player is completely free to move, dodge, approach, and touch the police for takedown.
      }

      let rotDiff = p.targetAngle - p.angle;
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      p.angle += rotDiff * 0.16;

      // 7. Balayya Takedown Strike!
      // When the man moves in and touches the police, the police is eliminated immediately!
      // Generous responsive hit radius so player can freely touch and kill guards without frustration.
      const strikeRange = p.isBoss ? 80 : 72;
      if (distToPlayerBody < strikeRange) {
        if (player.targetEnemy === p && !p.isBoss) {
          player.targetEnemy = null;
        }
        if (p.isBoss) {
          if (!p.hitCooldown || p.hitCooldown <= 0) {
            p.hitCooldown = 20; // 20 frames cooldown between strikes (~0.33s)
            p.hp -= 60;
            playSynthTakedown();
            screenShake = 10;

            for (let i = 0; i < 10; i++) {
              particles.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7,
                size: Math.random() * 4 + 2,
                color: '#ef4444',
                life: 0.7
              });
            }

            floatingTexts.push({
              x: p.x,
              y: p.y - 25,
              text: "-60 HP! 💥",
              color: '#ef4444',
              life: 0.9
            });

            // Alert other guards that boss is under attack!
            triggerPartnerDeathAlert(p, stage, allObstacles);
            updateHUD();
          }

          if (p.hp <= 0) {
            p.state = 'eliminated';
            eliminatedCount++;
            triggerPartnerDeathAlert(p, stage, allObstacles);

            for (let i = 0; i < 3; i++) {
              droppedBottles.push({
                x: p.x + (i - 1) * 28,
                y: p.y + (Math.random() - 0.5) * 20,
                collected: false
              });
            }

            floatingTexts.push({
              x: p.x,
              y: p.y - 35,
              text: `${p.name.toUpperCase()} DEFEATED! 👑`,
              color: '#ffc72c',
              life: 1.8
            });

            updateHUD();
            if (eliminatedCount >= stage.targetCount) {
              setTimeout(stageVictory, 700);
            }
          }
        } else {
          p.state = 'eliminated';
          eliminatedCount++;
          playSynthTakedown();
          screenShake = 8;

          // ALERT PARTNERS: Nearby guards detect this death and rush to the crime scene!
          triggerPartnerDeathAlert(p, stage, allObstacles);

          for (let i = 0; i < 12; i++) {
            particles.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 7,
              vy: (Math.random() - 0.5) * 7,
              size: Math.random() * 4 + 2,
              color: ['#ff2a55', '#ffc72c', '#ffffff'][Math.floor(Math.random() * 3)],
              life: 0.7
            });
          }

          droppedBottles.push({
            x: p.x,
            y: p.y,
            collected: false
          });

          floatingTexts.push({
            x: p.x,
            y: p.y - 18,
            text: "MASS TAKEDOWN! ⚡",
            color: '#ffc72c',
            life: 1.0
          });

          updateHUD();

          if (eliminatedCount >= stage.targetCount) {
            setTimeout(stageVictory, 600);
          }
        }
      }
    });

    // 8. Bullets
    bullets.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      for (let i = 0; i < allObstacles.length; i++) {
        const obs = allObstacles[i];
        if (b.x >= obs.x && b.x <= obs.x + obs.w && b.y >= obs.y && b.y <= obs.y + obs.h) {
          b.life = 0;
          break;
        }
      }

      const dist = Math.hypot(b.x - player.x, b.y - player.y);
      if (dist < player.radius) {
        b.life = 0;
        const dmg = b.isBossBullet ? 35 : 25;
        player.hp -= dmg;
        screenShake = 12;

        floatingTexts.push({
          x: player.x,
          y: player.y - 15,
          text: `-${dmg} HP!`,
          color: '#ef4444',
          life: 0.85
        });

        updateHUD();

        if (player.hp <= 0) stageDefeat();
      }
    });
    bullets = bullets.filter(b => b.life > 0);

    // 9. Upright Mansion House Bottles (Drinks RESTORE ENERGY & ADD TO BOTTLE COUNT!)
    [...droppedBottles, ...staticBottles].forEach(b => {
      if (!b.collected) {
        const dist = Math.hypot(b.x - player.x, b.y - player.y);
        if (dist < 36) {
          b.collected = true;
          totalBottles++;
          collectedStageBottles++;
          try {
            localStorage.setItem('balayya-hunter-bottles', String(totalBottles));
          } catch (e) {}

          playBottleSound();

          // ALERT POLICE: Police immediately rush directly to the bottle location!
          triggerBottleTheftAlert(b.x, b.y);

          // ENERGY RESTORATION LOGIC (Small 3% increase per bottle)
          if (player.hp < player.maxHp) {
            const healAmt = Math.min(3, player.maxHp - player.hp);
            player.hp += healAmt;
            floatingTexts.push({
              x: b.x,
              y: b.y - 20,
              text: `+1 MANSION HOUSE! 🍾 +${healAmt}% HP`,
              color: '#4ade80',
              life: 1.4
            });
          } else {
            floatingTexts.push({
              x: b.x,
              y: b.y - 16,
              text: "+1 MANSION HOUSE! 🍾",
              color: '#ffd27d',
              life: 1.2
            });
          }

          updateHUD();
        }
      }
    });
    droppedBottles = droppedBottles.filter(b => !b.collected);

    // 10. Particles & Texts (Capped for Constant 60 FPS Performance)
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.045;
    });
    particles = particles.filter(p => p.life > 0);
    if (particles.length > 50) particles = particles.slice(-50);

    floatingTexts.forEach(ft => {
      ft.y -= 0.85;
      ft.life -= 0.030;
    });
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);
    if (floatingTexts.length > 12) floatingTexts = floatingTexts.slice(-12);
  }

  // --- Rendering Engine (Themes, Authentic Hero, Y-Sorting Depth) ---
  function render() {
    const stage = getStage(currentStageIdx);
    const theme = THEME_STYLES[stage.theme] || THEME_STYLES.alpha;
    const allObstacles = [...stage.walls, ...stage.crates, ...stage.redContainers];

    ctx.clearRect(0, 0, stage.width, stage.height);

    ctx.save();
    if (screenShake > 0) {
      screenShake--;
      ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    // 1. Level Themed Floor
    if (stage.world === 5) {
      // Authentic Hunter Assassin Checkerboard Floor (PDF Page 9)
      const tileSize = 44;
      for (let x = 0; x < stage.width; x += tileSize) {
        for (let y = 0; y < stage.height; y += tileSize) {
          const isEven = ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0);
          ctx.fillStyle = isEven ? '#1e293b' : '#273549';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    } else {
      ctx.fillStyle = theme.floorColor;
      ctx.fillRect(0, 0, stage.width, stage.height);

      // Floor Tile Grid
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 1;
      for (let x = 0; x < stage.width; x += 44) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, stage.height);
        ctx.stroke();
      }
      for (let y = 0; y < stage.height; y += 44) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(stage.width, y);
        ctx.stroke();
      }
    }

    // Floor Ambient Decals
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(100, 180, 200, 90);
    ctx.fillRect(stage.width - 320, 240, 180, 130);
    ctx.fillRect(140, stage.height - 240, 180, 80);

    // 2. Speed Boost Orbs
    speedOrbs.forEach(orb => {
      if (!orb.collected) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffd700';
        ctx.font = '900 20px "Chakra Petch", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', orb.x, orb.y);
        ctx.restore();
      }
    });

    // 3. Smoke Grenades & Clouds
    smokeOrbs.forEach(sm => {
      if (!sm.collected) {
        ctx.save();
        ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '900 18px "Chakra Petch", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💨', sm.x, sm.y);
        ctx.restore();
      }
    });

    smokeClouds.forEach(sc => {
      ctx.save();
      const grad = ctx.createRadialGradient(sc.x, sc.y, 10, sc.x, sc.y, sc.radius);
      grad.addColorStop(0, 'rgba(226, 232, 240, 0.85)');
      grad.addColorStop(0.7, 'rgba(148, 163, 184, 0.55)');
      grad.addColorStop(1, 'rgba(148, 163, 184, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sc.x, sc.y, sc.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. Rotating CCTV Surveillance Camera Cones
    cameras.forEach(cam => {
      ctx.save();
      const grad = ctx.createRadialGradient(cam.x, cam.y, 6, cam.x, cam.y, cam.range);
      if (cam.alert) {
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else {
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cam.x, cam.y);
      ctx.arc(cam.x, cam.y, cam.range, cam.angle - cam.fov / 2, cam.angle + cam.fov / 2);
      ctx.closePath();
      ctx.fill();

      // Camera Mount
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cam.alert ? '#ef4444' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Realistic Raycasted Flashlight Vision Cones
    policeList.forEach(p => {
      if (p.state === 'eliminated' || p.blindTimer > 0) return;

      const numRays = p.isBoss ? 36 : 26;
      const startAngle = p.angle - p.fov / 2;
      const step = p.fov / (numRays - 1);

      ctx.save();
      const isAlert = p.state === 'alert' || (p.isBoss && p.isEnraged);

      const grad = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, p.range);
      if (isAlert) {
        grad.addColorStop(0, 'rgba(255, 42, 85, 0.72)');
        grad.addColorStop(0.65, 'rgba(255, 42, 85, 0.35)');
        grad.addColorStop(1, 'rgba(255, 42, 85, 0)');
      } else {
        grad.addColorStop(0, 'rgba(255, 248, 180, 0.55)');
        grad.addColorStop(0.65, 'rgba(255, 235, 140, 0.24)');
        grad.addColorStop(1, 'rgba(255, 235, 140, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);

      for (let i = 0; i < numRays; i++) {
        const rayAngle = startAngle + step * i;
        const dist = getRayDistance(p.x, p.y, rayAngle, p.range, allObstacles);
        const rayEndX = p.x + Math.cos(rayAngle) * dist;
        const rayEndY = p.y + Math.sin(rayAngle) * dist;
        ctx.lineTo(rayEndX, rayEndY);
      }

      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // 6. Security Laser Tripwires
    lasers.forEach(laser => {
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(laser.x1, laser.y);
      ctx.lineTo(laser.x2, laser.y);
      ctx.stroke();

      ctx.fillStyle = '#22252a';
      ctx.fillRect(laser.x1 - 4, laser.y - 6, 8, 12);
      ctx.fillRect(laser.x2 - 4, laser.y - 6, 8, 12);
      ctx.restore();
    });

    // 7. Hunter Assassin Destination Marker & Trajectory Arrow (Image 2 style)
    if (destinationMarker.active) {
      ctx.save();
      const destX = destinationMarker.x;
      const destY = destinationMarker.y;
      const alpha = destinationMarker.alpha;

      // Hunter Assassin Orange Trajectory Arrow from Player to Destination (Image 2 Panel 1 & 2)
      const dx = destX - player.x;
      const dy = destY - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > player.radius + 6) {
        const angle = Math.atan2(dy, dx);
        ctx.strokeStyle = `rgba(249, 115, 22, ${Math.min(0.85, alpha)})`;
        ctx.lineWidth = 2.4;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.moveTo(player.x + Math.cos(angle) * player.radius, player.y + Math.sin(angle) * player.radius);
        const arrowDist = Math.max(0, dist - 16);
        const arrowHeadX = player.x + Math.cos(angle) * arrowDist;
        const arrowHeadY = player.y + Math.sin(angle) * arrowDist;
        ctx.lineTo(arrowHeadX, arrowHeadY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow head pointing towards destination ring
        ctx.fillStyle = `rgba(249, 115, 22, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(arrowHeadX + Math.cos(angle) * 10, arrowHeadY + Math.sin(angle) * 10);
        ctx.lineTo(arrowHeadX + Math.cos(angle + 2.5) * 8, arrowHeadY + Math.sin(angle + 2.5) * 8);
        ctx.lineTo(arrowHeadX + Math.cos(angle - 2.5) * 8, arrowHeadY + Math.sin(angle - 2.5) * 8);
        ctx.closePath();
        ctx.fill();
      }

      // Hunter Assassin Pulsing Orange Target Ring (Image 2 style)
      ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.9})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(destX, destY, destinationMarker.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Ring
      ctx.strokeStyle = `rgba(251, 146, 60, ${alpha * 0.45})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(destX, destY, destinationMarker.radius + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Center Pin Dot
      ctx.fillStyle = `rgba(249, 115, 22, ${alpha})`;
      ctx.beginPath();
      ctx.arc(destX, destY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // =========================================================================
    // Y-SORTED RENDERING LIST (ZERO CLIPPING INTO WALLS OR OBSTACLES)
    // =========================================================================
    const renderList = [];

    // Walls
    stage.walls.forEach(w => {
      renderList.push({
        type: 'wall',
        y: w.y + w.h,
        draw: () => {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.fillRect(w.x + 4, w.y + 6, w.w, w.h);

          ctx.fillStyle = theme.wallBorder;
          ctx.fillRect(w.x, w.y, w.w, w.h);

          ctx.fillStyle = theme.wallBase;
          ctx.fillRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);

          ctx.fillStyle = theme.wallTop;
          ctx.fillRect(w.x + 3, w.y + 3, w.w - 6, w.h - 6);

          ctx.fillStyle = theme.wallHighlight;
          ctx.fillRect(w.x + 3, w.y + 3, w.w - 6, 3);
        }
      });
    });

    // Crates [X] and Stone Pedestals (Authentic Hunter Assassin - PDF Page 8, 10, 11)
    stage.crates.forEach(c => {
      renderList.push({
        type: 'crate',
        y: c.y + c.h,
        draw: () => {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
          ctx.fillRect(c.x + 3, c.y + 4, c.w, c.h);

          if (c.isStone) {
            // Dark Stone Pedestal with Steel Border & Rivets (PDF Page 8, 10, 11)
            ctx.fillStyle = '#334155';
            ctx.fillRect(c.x, c.y, c.w, c.h);

            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(c.x, c.y, c.w, c.h);

            // Subtle inner cross
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(c.x + 4, c.y + 4);
            ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
            ctx.moveTo(c.x + c.w - 4, c.y + 4);
            ctx.lineTo(c.x + 4, c.y + c.h - 4);
            ctx.stroke();

            // Corner rivets
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(c.x + 3, c.y + 3, 3, 3);
            ctx.fillRect(c.x + c.w - 6, c.y + 3, 3, 3);
            ctx.fillRect(c.x + 3, c.y + c.h - 6, 3, 3);
            ctx.fillRect(c.x + c.w - 6, c.y + c.h - 6, 3, 3);
          } else {
            // Warm Timber Wood Crate with Cross Braces
            ctx.fillStyle = theme.crateBase;
            ctx.fillRect(c.x, c.y, c.w, c.h);

            ctx.strokeStyle = theme.crateBorder;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(c.x, c.y, c.w, c.h);

            ctx.strokeStyle = theme.crateCross;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(c.x + 3, c.y + 3);
            ctx.lineTo(c.x + c.w - 3, c.y + c.h - 3);
            ctx.moveTo(c.x + c.w - 3, c.y + 3);
            ctx.lineTo(c.x + 3, c.y + c.h - 3);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
            ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, 3);
          }
        }
      });
    });

    // Red Storage Containers (Authentic Corrugated Cargo Yard with Hazard Stripes - PDF Page 5 #154)
    stage.redContainers.forEach(r => {
      renderList.push({
        type: 'container',
        y: r.y + r.h,
        draw: () => {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.fillRect(r.x + 4, r.y + 5, r.w, r.h);

          ctx.fillStyle = theme.containerBase || '#b91c1c';
          ctx.fillRect(r.x, r.y, r.w, r.h);

          // Corrugated Horizontal Ribbing Lines (every 8px)
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.lineWidth = 1.5;
          for (let ly = r.y + 7; ly < r.y + r.h - 4; ly += 8) {
            ctx.beginPath();
            ctx.moveTo(r.x + 4, ly);
            ctx.lineTo(r.x + r.w - 4, ly);
            ctx.stroke();
          }

          // Outer Heavy Steel Frame
          ctx.strokeStyle = theme.containerBorder || '#7f1d1d';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(r.x, r.y, r.w, r.h);

          // Top Highlight
          ctx.fillStyle = theme.containerTop || '#ef4444';
          ctx.fillRect(r.x + 3, r.y + 2, r.w - 6, 3);

          // Yellow & Black Diagonal Hazard Stripes on Corners (PDF Page 5)
          const stripeW = Math.min(22, Math.floor(r.w * 0.25));
          const stripeH = Math.min(18, Math.floor(r.h * 0.35));

          [
            { x: r.x + r.w - stripeW, y: r.y },
            { x: r.x, y: r.y + r.h - stripeH }
          ].forEach(corner => {
            ctx.save();
            ctx.beginPath();
            ctx.rect(corner.x, corner.y, stripeW, stripeH);
            ctx.clip();
            ctx.fillStyle = '#facc15';
            ctx.fillRect(corner.x, corner.y, stripeW, stripeH);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            for (let s = -stripeH; s < stripeW + stripeH; s += 6) {
              ctx.beginPath();
              ctx.moveTo(corner.x + s, corner.y);
              ctx.lineTo(corner.x + s - stripeH, corner.y + stripeH);
              ctx.stroke();
            }
            ctx.restore();
          });
        }
      });
    });

    // Mansion House Bottles (Energy Drinks & Loot)
    [...droppedBottles, ...staticBottles].forEach(b => {
      if (b.collected) return;
      renderList.push({
        type: 'bottle',
        y: b.y + 14,
        draw: () => {
          ctx.save();
          ctx.translate(b.x, b.y);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(0, 14, 11, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 199, 44, 0.35)';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();

          if (assets.bottle.complete && assets.bottle.naturalWidth) {
            ctx.drawImage(assets.bottle, -10, -22, 20, 42);
          } else {
            ctx.fillStyle = '#ffc72c';
            ctx.fillRect(-7, -16, 14, 32);
          }
          ctx.restore();
        }
      });
    });

    // Patrolling Police Officers & Boss
    policeList.forEach(p => {
      if (p.state === 'eliminated') {
        renderList.push({
          type: 'police_dead',
          y: p.y,
          draw: () => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });
        return;
      }

      renderList.push({
        type: 'police',
        y: p.y + 8,
        draw: () => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          const policeStride = Math.sin(p.animTick * 0.24) * 8;

          // Stepping Boots
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.ellipse(-6, -8 + policeStride, 4, 7, 0, 0, Math.PI * 2);
          ctx.ellipse(-6, 8 - policeStride, 4, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.arc(2, 3, p.radius, 0, Math.PI * 2);
          ctx.fill();

          if (p.isBoss) {
            ctx.fillStyle = p.isEnraged ? '#b91c1c' : '#831843';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fill();

            // Gold Stars
            ctx.fillStyle = '#ffc72c';
            ctx.beginPath();
            ctx.arc(10, -10, 6, 0, Math.PI * 2);
            ctx.arc(10, 10, 6, 0, Math.PI * 2);
            ctx.fill();

            // Dual Searchlights / Shotguns
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(12, -7, 18, 5);
            ctx.fillRect(12, 2, 18, 5);

            // Red Commissioner Beret
            ctx.fillStyle = '#500724';
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffc72c';
            ctx.fillRect(9, -2, 5, 5);
          } else {
            ctx.fillStyle = p.isScout ? '#1e3a5f' : '#2c3e55';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1e2b3c';
            ctx.beginPath();
            ctx.arc(8, -8, 5, 0, Math.PI * 2);
            ctx.arc(8, 8, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(10, -3, 14, 6);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(20, -2, 5, 4);

            ctx.fillStyle = '#162232';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffc72c';
            ctx.fillRect(6, -2, 3, 4);
          }

          ctx.restore();

          if (p.blindTimer > 0) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '900 16px "Chakra Petch", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('BLINDED! 💨', p.x, p.y - 25);
          } else if (p.state === 'alert' || p.alertIcon === '!') {
            // Authentic Hunter Assassin Alert "!" badge
            ctx.save();
            ctx.fillStyle = '#ff2a55';
            ctx.shadowColor = '#ff2a55';
            ctx.shadowBlur = 10;
            ctx.font = '900 25px "Chakra Petch", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('!', p.x, p.y - 26);
            ctx.restore();
          } else if (p.state === 'investigate' || p.alertIcon === '?') {
            // Authentic Hunter Assassin Suspicion "?" badge (seen in PDF Page 2 & 3)
            ctx.save();
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 10;
            ctx.font = '900 22px "Chakra Petch", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('?', p.x, p.y - 24);
            ctx.restore();
          }
        }
      });
    });

    // BALAYYA - THE ACTION HERO (PRESERVED EXACTLY AS SHOWN IN IMAGE 4!)
    renderList.push({
      type: 'player',
      y: player.y + 4,
      draw: () => {
        ctx.save();
        ctx.translate(player.x, player.y);

        if (!player.facingRight) {
          ctx.scale(-1, 1);
        }

        const walkPhase = player.isMoving ? player.animTick * 0.32 : 0;
        const bodyBob = player.isMoving ? Math.abs(Math.sin(walkPhase)) * 4.5 : Math.sin(Date.now() * 0.003) * 1.2;
        const sprintLean = player.isMoving ? 0.07 : 0;
        const walkTilt = player.isMoving ? Math.sin(walkPhase) * 0.04 : 0;

        // Ground Shadow under feet
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 3, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hero Proportions (DOUBLED IN HEIGHT FOR 4K CRYSTAL CLEAR VISIBILITY)
        const heroH = 108;
        const heroW = 60;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (assets.hero.complete && assets.hero.naturalWidth) {
          ctx.save();
          ctx.translate(0, -heroH + 4 - bodyBob);
          ctx.rotate(sprintLean + walkTilt);
          ctx.drawImage(assets.hero, -heroW / 2, 0, heroW, heroH);
          ctx.restore();
        } else {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(-15, -heroH, 30, heroH);
        }

        // Speed Boost Aura
        if (player.speedBoostTimer > 0) {
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.ellipse(0, -heroH / 2, 34, heroH / 2 + 8, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Shadow Stealth Aura (Behind Crates)
        if (player.isStealthed) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.ellipse(0, -heroH / 2, 36, heroH / 2 + 10, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.restore();
      }
    });

    // Execute Y-Sorted Rendering
    renderList.sort((a, b) => a.y - b.y);
    renderList.forEach(item => item.draw());

    // 13. Bullets
    bullets.forEach(b => {
      ctx.fillStyle = b.isBossBullet ? '#ef4444' : '#fde047';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.isBossBullet ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 14. Particles & Floating Texts
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    floatingTexts.forEach(ft => {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = '900 16px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // --- Animation Loop ---
  function gameLoop() {
    if (screenMode !== 'game' || gameState !== 'playing') return;

    try {
      update();
      render();
    } catch (err) {
      console.error("Game loop error:", err);
    }

    animFrameId = requestAnimationFrame(gameLoop);
  }

  // --- Click-To-Move Input Mapping ---
  function handleInputPosition(clientX, clientY) {
    if (screenMode !== 'game' || gameState !== 'playing') return;
    const stage = getStage(currentStageIdx);
    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const scaleX = stage.width / rect.width;
    const scaleY = stage.height / rect.height;

    let targetX = Math.max(0, Math.min(stage.width, (clientX - rect.left) * scaleX));
    let targetY = Math.max(0, Math.min(stage.height, (clientY - rect.top) * scaleY));

    if (isNaN(targetX) || isNaN(targetY)) return;

    // Tap-to-Assassinate: If user tapped on or near a police guard, lock on and target them directly!
    const tappedEnemy = policeList.find(p => p.state !== 'eliminated' && Math.hypot(p.x - targetX, p.y - targetY) < 55);
    if (tappedEnemy) {
      player.targetEnemy = tappedEnemy;
      targetX = tappedEnemy.x;
      targetY = tappedEnemy.y;
    } else {
      player.targetEnemy = null;
      // Tap-to-Collect: If user tapped on or near a bottle, target bottle directly
      const tappedBottle = [...droppedBottles, ...staticBottles].find(b => !b.collected && Math.hypot(b.x - targetX, b.y - targetY) < 36);
      if (tappedBottle) {
        targetX = tappedBottle.x;
        targetY = tappedBottle.y;
      }
    }

    const allObstacles = [...stage.walls, ...stage.crates, ...stage.redContainers];

    // 1. Direct-Line Optimization: If direct path to clicked spot is clear of obstacles, dash directly!
    if (isLineClear(player, { x: targetX, y: targetY }, allObstacles)) {
      player.path = [{ x: targetX, y: targetY }];
    } else {
      // 2. Intelligent A* Navigation around corners and obstacles
      player.path = findPath(player.x, player.y, targetX, targetY, stage);
    }

    // 3. Fallback: If target is in an unreachable pocket, move as close as possible along the ray
    if (player.path.length === 0) {
      const rayAngle = Math.atan2(targetY - player.y, targetX - player.x);
      const maxDist = Math.hypot(targetX - player.x, targetY - player.y);
      const safeDist = Math.max(0, getRayDistance(player.x, player.y, rayAngle, maxDist, allObstacles) - player.radius - 2);
      if (safeDist > 10) {
        player.path = [{
          x: player.x + Math.cos(rayAngle) * safeDist,
          y: player.y + Math.sin(rayAngle) * safeDist
        }];
      }
    }

    if (player.path.length > 0) {
      const finalPoint = player.path[player.path.length - 1];
      destinationMarker.x = finalPoint.x;
      destinationMarker.y = finalPoint.y;
      destinationMarker.active = true;
      destinationMarker.radius = 8;
      destinationMarker.alpha = 1.0;
    }
  }

  // --- Initialize All User Inputs & Navigation ---
  function initInput() {
    canvas.addEventListener('pointerdown', (e) => {
      initAudio();
      if (isSoundEnabled && assets.bgm.paused) {
        playMusic();
      }
      handleInputPosition(e.clientX, e.clientY);
      canvas.focus();
    });

    canvas.addEventListener('pointermove', (e) => {
      if (e.buttons === 1 || e.pointerType === 'touch') {
        handleInputPosition(e.clientX, e.clientY);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) keys.w = true;
      if (['KeyS', 'ArrowDown'].includes(e.code)) keys.s = true;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) keys.a = true;
      if (['KeyD', 'ArrowRight'].includes(e.code)) keys.d = true;

      if (e.code === 'Escape' && screenMode === 'game') togglePause();
    });

    window.addEventListener('keyup', (e) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) keys.w = false;
      if (['KeyS', 'ArrowDown'].includes(e.code)) keys.s = false;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) keys.a = false;
      if (['KeyD', 'ArrowRight'].includes(e.code)) keys.d = false;
    });

    // Home Screen Buttons
    if (btnHomeContinue) btnHomeContinue.addEventListener('click', startMission);
    if (btnHomeSoundToggle) btnHomeSoundToggle.addEventListener('click', toggleSound);

    if (btnResetProgress) {
      btnResetProgress.addEventListener('click', () => {
        currentStageIdx = 0;
        maxUnlockedLevel = 1;
        try {
          localStorage.setItem('balayya-hunter-stage', '1');
          localStorage.setItem('balayya-hunter-max-unlocked', '1');
        } catch (e) {}
        if (btnContinueText) btnContinueText.textContent = 'CONTINUE • LEVEL 1';
        showToast("Progress reset to Level 1! Levels 2–50 locked.");
      });
    }

    // Home Sub-Modals
    if (btnOpenHowToPlay) btnOpenHowToPlay.addEventListener('click', () => modalHowToPlay.classList.remove('hidden'));
    if (btnCloseHowToPlay) btnCloseHowToPlay.addEventListener('click', () => modalHowToPlay.classList.add('hidden'));

    if (btnOpenLegend) btnOpenLegend.addEventListener('click', () => modalLegend.classList.remove('hidden'));
    if (btnCloseLegend) btnCloseLegend.addEventListener('click', () => modalLegend.classList.add('hidden'));

    function renderLevelsDirectory(activeFilter = 'all') {
      if (!levelsCardGrid) return;
      levelsCardGrid.innerHTML = '';

      const TOTAL_DIRECTORY_LEVELS = 50;
      for (let lvl = 1; lvl <= TOTAL_DIRECTORY_LEVELS; lvl++) {
        const meta = LEVEL_BOOK[lvl - 1] || { id: lvl, world: 1, name: `Sector ${lvl}`, diff: 'Normal', guards: 3, env: 'Warehouse', isBoss: false };
        const isBoss = meta.isBoss || (lvl % 10 === 0) || (lvl === 5 || lvl === 15 || lvl === 25 || lvl === 35 || lvl === 45 || lvl === 50);
        const isUnlocked = (lvl <= maxUnlockedLevel);
        const isCompleted = (lvl < maxUnlockedLevel);
        const isCurrent = (lvl === maxUnlockedLevel);

        if (activeFilter === 'w1' && (lvl < 1 || lvl > 10)) continue;
        if (activeFilter === 'w2' && (lvl < 11 || lvl > 20)) continue;
        if (activeFilter === 'w3' && (lvl < 21 || lvl > 30)) continue;
        if (activeFilter === 'w4' && (lvl < 31 || lvl > 40)) continue;
        if (activeFilter === 'w5' && (lvl < 41 || lvl > 50)) continue;
        if (activeFilter === 'boss' && !isBoss) continue;

        const worldId = meta.world || Math.min(5, Math.ceil(lvl / 10));
        const worldPillText = isBoss ? `👑 W${worldId} • BOSS` : (
          worldId === 1 ? '📦 W1 • DOCKS' :
          worldId === 2 ? '🚢 W2 • CARGO' :
          worldId === 3 ? '🏭 W3 • FACTORY' :
          worldId === 4 ? '🌑 W4 • NIGHT' : '👑 W5 • CITADEL'
        );

        const worldCardClass = `theme-card-w${worldId}`;
        const pillClass = `pill-w${worldId}`;
        const diffSlug = isBoss ? 'boss' : meta.diff.toLowerCase().replace(/[^a-z]/g, '');
        const diffClass = `diff-${diffSlug}`;
        const diffText = isBoss ? 'BOSS HUNT' : meta.diff.toUpperCase();

        const archetypeIcon = isBoss ? '👑' : (
          worldId === 1 ? '🧱' :
          worldId === 2 ? '🚢' :
          worldId === 3 ? '⚡' :
          worldId === 4 ? '🕶️' : '🏛️'
        );

        const rewardDiamonds = isBoss ? 250 : (lvl * 10 + 40);

        const tile = document.createElement('div');
        tile.className = `level-select-tile ${worldCardClass} ${isBoss ? 'boss-tile' : ''} ${!isUnlocked ? 'locked-tile' : (isCurrent ? 'current-tile' : 'completed-tile')}`;
        tile.setAttribute('data-level', String(lvl));

        const icon = isBoss ? '👑' : (!isUnlocked ? '🔒' : (isCompleted ? '⭐' : '🎯'));
        const levelLabel = isBoss ? `LEVEL ${lvl}<br><span class="tile-boss-tag">BOSS</span>` : `LEVEL ${lvl}`;
        const btnLabel = !isUnlocked ? '🔒 LOCKED' : (isCurrent ? 'PLAY ▶' : (isCompleted ? 'REPLAY ⭐' : 'PLAY ▶'));

        tile.innerHTML = `
          <div class="tile-icon-badge">${icon}</div>
          <div class="tile-number">${levelLabel}</div>
          <div class="tile-subtext ${pillClass}">${worldPillText}</div>
          <div class="tile-play-btn ${!isUnlocked ? 'locked-badge' : ''}">${btnLabel}</div>
        `;

        if (!isUnlocked) {
          tile.addEventListener('click', () => {
            tile.classList.remove('shake-anim');
            void tile.offsetWidth;
            tile.classList.add('shake-anim');
            showToast(`🔒 Level ${lvl} is locked! Beat Level ${lvl - 1} first to unlock!`);
          });
        } else {
          tile.addEventListener('click', () => {
            currentStageIdx = lvl - 1;
            try {
              localStorage.setItem('balayya-hunter-stage', String(lvl));
            } catch (err) {}
            if (levelsView) levelsView.classList.add('hidden');
            loadStage(currentStageIdx);
            startMission();
          });
        }

        levelsCardGrid.appendChild(tile);
      }
    }

    function openLevelsDirectory(filter = 'all') {
      screenMode = 'levels';
      stopMusic();
      cancelAnimationFrame(animFrameId);
      if (assets.bossVictory) {
        try {
          assets.bossVictory.pause();
          assets.bossVictory.currentTime = 0;
        } catch (e) {}
      }
      if (assets.levelVictory) {
        try {
          assets.levelVictory.pause();
          assets.levelVictory.currentTime = 0;
        } catch (e) {}
      }
      if (assets.bossDefeat) {
        try {
          assets.bossDefeat.pause();
          assets.bossDefeat.currentTime = 0;
        } catch (e) {}
      }
      if (assets.crash) {
        try {
          assets.crash.pause();
          assets.crash.currentTime = 0;
        } catch (e) {}
      }
      if (homeView) homeView.classList.add('hidden');
      if (gameView) gameView.classList.add('hidden');
      if (bossBarBox) bossBarBox.classList.add('hidden');
      if (modalVictory) modalVictory.classList.add('hidden');
      if (modalDefeat) modalDefeat.classList.add('hidden');
      if (modalPaused) modalPaused.classList.add('hidden');
      if (levelsView) levelsView.classList.remove('hidden');
      if (levelsBottleCount) levelsBottleCount.textContent = String(totalBottles);

      document.querySelectorAll('.level-tab-btn').forEach(tab => {
        if (tab.getAttribute('data-filter') === filter) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      renderLevelsDirectory(filter);
    }

    function closeLevelsDirectory() {
      if (levelsView) levelsView.classList.add('hidden');
      showHomeScreen();
    }

    if (btnOpenLevels) btnOpenLevels.addEventListener('click', () => openLevelsDirectory('all'));
    if (btnLevelsBackHome) btnLevelsBackHome.addEventListener('click', closeLevelsDirectory);

    document.querySelectorAll('.level-tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.level-tab-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.getAttribute('data-filter') || 'all';
        renderLevelsDirectory(filter);
      });
    });

    // In-Game Top Header Buttons
    if (btnGameSound) btnGameSound.addEventListener('click', toggleSound);
    if (btnGamePause) btnGamePause.addEventListener('click', togglePause);
    if (btnReturnHome) btnReturnHome.addEventListener('click', showHomeScreen);

    // In-Game Modal Buttons
    if (btnResumeGame) btnResumeGame.addEventListener('click', resumeGame);
    if (btnPauseSound) btnPauseSound.addEventListener('click', toggleSound);
    if (btnPauseHome) btnPauseHome.addEventListener('click', showHomeScreen);
    if (btnPauseLevels) btnPauseLevels.addEventListener('click', () => openLevelsDirectory('all'));
    if (btnVictoryHome) btnVictoryHome.addEventListener('click', showHomeScreen);
    if (btnVictoryLevels) btnVictoryLevels.addEventListener('click', () => openLevelsDirectory('all'));
    if (btnDefeatHome) btnDefeatHome.addEventListener('click', showHomeScreen);
    if (btnDefeatLevels) btnDefeatLevels.addEventListener('click', () => openLevelsDirectory('all'));

    if (btnNextStage) {
      btnNextStage.addEventListener('click', () => {
        loadStage(currentStageIdx);
        startMission();
      });
    }

    if (btnRetryStage) {
      btnRetryStage.addEventListener('click', () => {
        loadStage(currentStageIdx);
        startMission();
      });
    }

    if (btnPlayAgain) {
      btnPlayAgain.addEventListener('click', () => {
        currentStageIdx = 0;
        loadStage(0);
        startMission();
      });
    }
  }

  // --- Boot Application ---
  function boot() {
    initInput();
    updateSoundUI();
    loadStage(currentStageIdx);
    showHomeScreen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
