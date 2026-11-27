const fs = require("node:fs");
const path = require("node:path");
const execFileSync = require("node:child_process").execFileSync;

// Game
const PLAYER_CONFIG_FILENAME = "player.json";
const RANGERS_UNIT = "5f0d3d1d58db0524bada47fee54b41e3";
const NEW_SQUAD_COUNT = 10_000_000;

// Script folders
const FOLDER_NAMES = {
    INPUT: "in",
    OUTPUT: "out",
    BACKUP: "backup"
};
const PATH_OF = {
    IN: (_) => path.join(FOLDER_NAMES.INPUT, _ ? _ : ""),
    OUT: (_) => path.join(FOLDER_NAMES.OUTPUT, _ ? _ : ""),
    BACKUP: (_) => path.join(FOLDER_NAMES.BACKUP, _ ? _ : "")
};

// Create the script folders if they do not exist
for(const key in FOLDER_NAMES){
    const folderName = FOLDER_NAMES[key];
    if(fs.existsSync(folderName)) continue;
    fs.mkdirSync(folderName);
}

function modifyJson(json){
    const globalMaps = getGlobalMapsFromJson(json);
    const armies = getArmiesFromGlobalMaps(globalMaps);
    for(const army of armies){
        try{
            const data = getDataFromArmy(army);
            const faction = getArmyFactionFromData(data);
            if(faction !== "Crusaders") continue; // Skip if not a player-controller army
            const id = army?.Id;
            console.log("Found a player-controlled army. ID: ", id);
            upgradeData(data);
        }catch(error){ console.log("Skipping army. Reason: ", error?.message ? error.message : "[NO_ERROR_MESSAGE]"); }
    }
}
// [Json] is the parsed file with no additional changes
function getGlobalMapsFromJson(json){
    if(!json || !(typeof json === "object")) throw new Error("[json] is falsey or is not an object.");
    if(!Object.hasOwn(json, "m_GlobalMaps")) throw new Error("[json] has no key [m_GlobalMaps].");
    const globalMaps = json.m_GlobalMaps;
    if(!Array.isArray(globalMaps)) throw new Error("[globalMaps] is not an array.");
    return globalMaps;
}
// [GlobalMaps] is config.m_GlobalMaps[]
function getArmiesFromGlobalMaps(globalMaps){
    if(!globalMaps || !Array.isArray(globalMaps)) throw new Error("[globalMaps] is falsey or is not an array.");
    const globalMap = globalMaps[0]; // When I checked, [m_GlobalMaps] had only 2 elements, the second element had an empty array in [m_Armies], I assume this is the non-crusade map
    if(!Object.hasOwn(globalMap, "m_Armies")) throw new Error("[globalMaps] has no key [m_Armies].");
    const armies = globalMap.m_Armies;
    if(!armies || !Array.isArray(armies)) throw new Error("[armies] is falsey or is not an array.");
    return armies;
}
// [Army] is config.m_GlobalMaps[i].m_Armies[j]
function getDataFromArmy(army){
    if(!army || !(typeof army === "object")) throw new Error("[army] is falsey or is not an object.");
    if(!Object.hasOwn(army, "Data")) throw new Error("[army] has no key [Data].");
    const data = army.Data;
    if(!(typeof data === "object")) throw new Error("[data] is not an object.");
    return data;
}
// [Data] is config.m_GlobalMaps[i].m_Armies[j].Data
function getArmyFactionFromData(data){
    if(!Object.hasOwn(data, "Faction")) throw new Error("[data] has no [Faction].");
    const faction = data.Faction;
    return faction;
}
// [Data] is config.m_GlobalMaps[i].m_Armies[j].Data
function upgradeData(data){
    console.log("Current max squad count: ", data.MaxSquadsCount.m_BaseValue);
    const squads = data.m_Squads;
    console.log("Current number of squads: ", squads.length);
    for(const squad of squads){
        squad.Unit = RANGERS_UNIT;
        squad.Count = NEW_SQUAD_COUNT;
        console.log(`Squad changed to [${RANGERS_UNIT}]x[${NEW_SQUAD_COUNT}].`);
    }
    data.MaxSquadsCount.m_BaseValue = 14;
    console.log("Upgraded max squad count: ", data.MaxSquadsCount.m_BaseValue);
    console.log("=======================| DONE |=========================");
}

// Main
const inputsFilenames = fs.readdirSync(PATH_OF.IN());
for(const filename of inputsFilenames){
    if(fs.lstatSync(PATH_OF.IN(filename)).isDirectory()) continue; // Skip if a directory
    if(!filename.endsWith(".zks")) continue; // Skip if not a save file [*.zks]
    try{
        console.log(`Working on save file [${filename}].`);
        console.log("Backing up.");
        fs.copyFileSync(PATH_OF.IN(filename), PATH_OF.BACKUP(filename));
        console.log("Backup done.");
    }catch(error){
        console.log("=======================| ERROR |========================");
        console.error("Backup failed. Message: ", error?.message ? error.message : "[NO_ERROR_MESSAGE]");
        continue;
    }
    try{
        console.log(`Extracting [${PLAYER_CONFIG_FILENAME}].`);
        execFileSync("7z.exe", ["e", filename, PLAYER_CONFIG_FILENAME, "-aoa"], { cwd: PATH_OF.IN() });
        console.log("Extraction done.");
    }catch(error){
        console.log("=======================| ERROR |========================");
        console.error("Extraction failed. Message: ", error?.message ? error.message : "[NO_ERROR_MESSAGE]");
        continue;
    }
    // JSON modification
    try{
        console.log(`Modifying [${PLAYER_CONFIG_FILENAME}].`);
        const jsonText = fs.readFileSync(PATH_OF.IN(PLAYER_CONFIG_FILENAME), { encoding: "utf-8" });
        const json = JSON.parse(jsonText);
        modifyJson(json);
        fs.writeFileSync(PATH_OF.IN(PLAYER_CONFIG_FILENAME), JSON.stringify(json), { encoding: "utf-8" });
        console.log(`Modification done.`);
    }catch(error){
        console.log("=======================| ERROR |========================");
        console.error("Modification failed. Message: ", error?.message ? error.message : "[NO_ERROR_MESSAGE]");
        continue;
    }
    try{
        console.log(`Archiving [${PLAYER_CONFIG_FILENAME}].`);
        execFileSync("7z.exe", ["a", filename, PLAYER_CONFIG_FILENAME, "-sdel"], { cwd: PATH_OF.IN() });
        console.log("Archivation done.");
    }catch(error){
        console.log("=======================| ERROR |========================");
        console.error("Archivation failed Message: ", error?.message ? error.message : "[NO_ERROR_MESSAGE]");
        continue;
    }
    try{
        console.log(`Moving [${filename}] to [${FOLDER_NAMES.OUTPUT}].`);
        fs.renameSync(PATH_OF.IN(filename), PATH_OF.OUT(filename));
        console.log("Move done.");
    }catch(error){
        console.log("=======================| ERROR |========================");
        console.error("Move failed. Message: ", error?.message ? error.message : "[NO_ERROR_MESSAGE]");
        continue;
    }
}