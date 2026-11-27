const fs = require("node:fs");
const path = require("node:path");
const execFileSync = require("node:child_process").execFileSync;

// Game
const PLAYER_CONFIG_FILENAME = "player.json";
const RANGERS_UNIT = "5f0d3d1d58db0524bada47fee54b41e3";
const NEW_SQUAD_COUNT = 999_999;
const NEW_INFIRMARY_SIZE = 999_999;

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
        console.error("Backup failed: ", error?.message ? error.message : "[NO_ERROR_MESSAGE]");
        return;
    }
    try{
        console.log(`Extracting [${PLAYER_CONFIG_FILENAME}].`);
        execFileSync("7z.exe", ["e", filename, PLAYER_CONFIG_FILENAME, "-aoa"], { cwd: PATH_OF.IN() });
        console.log("Extraction done.");
    }catch(error){
        console.log("=======================| ERROR |========================");
        console.error("Extraction failed: ", error?.message ? error.message : "[NO_ERROR_MESSAGE]");
        return;
    }
    // JSON modification
    try{
        console.log(`Modifying [${PLAYER_CONFIG_FILENAME}].`);
        const jsonText = fs.readFileSync(PATH_OF.IN(PLAYER_CONFIG_FILENAME), { encoding: "utf-8" });
        const json = JSON.parse(jsonText);
    }catch{
        console.log("=======================| ERROR |========================");
        console.error("Modification failed: ", error?.message ? error.message : "[NO_ERROR_MESSAGE]");
        return;
    }
    try{
        console.log(`Archiving [${PLAYER_CONFIG_FILENAME}].`);
        execFileSync("7z.exe", ["a", filename, PLAYER_CONFIG_FILENAME, "-sdel"], { cwd: PATH_OF.IN() });
        console.log("Archivation done.");
    }catch(error){
        console.log("=======================| ERROR |========================");
        console.error("Archivation failed: ", error?.message ? error.message : "[NO_ERROR_MESSAGE]");
        return;
    }
    try{
        console.log(`Moving the save file to [${FOLDER_NAMES.OUTPUT}].`);
        fs.renameSync(PATH_OF.IN(filename), PATH_OF.OUT(filename));
        console.log("Move done.");
    }catch(error){
        console.log("=======================| ERROR |========================");
        console.error("Move failed: ", error?.message ? error.message : "[NO_ERROR_MESSAGE]");
        return;
    }
}
return;

function modifyJson(){
    const armies = playerJson.m_GlobalMaps[0].m_Armies;
    for(const army of armies){
        try{
            const data = getArmyData(army);
            const faction = getArmyFactionFromData(data);
            if(faction !== "Crusaders") continue;
            const id = army?.Id;
            console.log("Found a crusader army. ID: ", id);
            upgradeArmyData(data);
        }catch(error){ console.log("Encountered an error: ", error?.message); }
    }
}

function findValue(obj, target) {
    for (const key of Object.keys(obj)) {
        const value = obj[key];

        if (value === target) {
            // if (regex.test(value)) {
            return key;
        }

        if (value !== null && typeof value === "object") {
            const result = findValue(value, target);

            if (result !== undefined) {
                return `${key}.${result}`;
            }
        }
    }

    return undefined;
}

function getArmyData(army){
    if(!army || !(typeof army === "object")) throw new Error("Army has no [Data].");
    if(!Object.hasOwn(army, "Data")) throw new Error("Army has no [Data].");
    if(!army || !(typeof army.Data === "object")) throw new Error("Army has no [Data].");
    return army.Data;
}
function getArmyFactionFromData(data){
    if(!Object.hasOwn(data, "Faction")) throw new Error("Army has no [Faction].");
    const faction = data.Faction;
    // console.log("Faction: ", faction);
    return faction;
}
function upgradeArmyData(data){
    console.log("Current max squad count: ", data.MaxSquadsCount.m_BaseValue);
    // console.log("Max squad count modifiers: ", data.MaxSquadsCount.PersistentModifierList);
    const squads = data.m_Squads;
    for(const squad of squads){
        squad.Unit = RANGERS_UNIT;
        squad.Count = NEW_SQUAD_COUNT;
        console.log(`Squad changed to Rangers X ${NEW_SQUAD_COUNT}.`);
    }
    data.MaxSquadsCount.m_BaseValue = 14;
    // data.MaxSquadsCount.PersistentModifierList = [];
    console.log("Upgraded max squad count: ", data.MaxSquadsCount.m_BaseValue);
    // console.log("Max squad count modifiers: ", data.MaxSquadsCount.PersistentModifierList);
    console.log("==============================DONE==============================");
}

// const leader = playerJson.m_LeadersManager.m_Leaders[6];
// const army = playerJson.m_GlobalMaps[0].m_Armies[21];
// const squads = army.Data.m_Squads;
// // console.log(findValue(playerJson, "5640"));
// // return;
// // console.log(b.m_GlobalMaps["0"].m_Armies["21"].Data.m_ArmyName.ArmyName);
// // console.log(b.m_GlobalMaps[0].m_Armies[21]);

// console.log("leader.m_Stats.InfirmarySize.m_BaseValue: ", leader.m_Stats.InfirmarySize.m_BaseValue);
// console.log("army.Data.MaxSquadsCount.m_BaseValue: ", army.Data.MaxSquadsCount.m_BaseValue);
// console.log("army.Data.MaxSquadsCount.PersistentModifierList: ", army.Data.MaxSquadsCount.PersistentModifierList);

// console.log("================UPDATING================");

// leader.m_Stats.InfirmarySize.m_BaseValue = NEW_INFIRMARY_SIZE;
// for(const armySquad of squads){
//     armySquad.Unit = RANGERS_UNIT;
//     armySquad.Count = NEW_SQUAD_COUNT;
// }
// army.Data.MaxSquadsCount.m_BaseValue = 14;
// army.Data.MaxSquadsCount.PersistentModifierList = [];

// console.log("================UPDATED================");

// console.log("leader.m_Stats.InfirmarySize.m_BaseValue: ", leader.m_Stats.InfirmarySize.m_BaseValue);
// console.log("army.Data.MaxSquadsCount.m_BaseValue: ", army.Data.MaxSquadsCount.m_BaseValue);
// console.log("army.Data.MaxSquadsCount.PersistentModifierList: ", army.Data.MaxSquadsCount.PersistentModifierList);

fs.writeFileSync("./out/player.json", JSON.stringify(playerJson), { encoding: "utf-8" });