// import * as Cfx from 'fivem-js';
import axios from "axios";

let discordID: string;

on("playerConnecting", async (name: string, setKickReason, deferrals) => {
  deferrals.defer();

  const player = global.source;
  const identifiers = [];

  deferrals.update("Getting player identifiers")
  for (let i = 0; i < GetNumPlayerIdentifiers(String(player)); i++) {
    const [provider, id] = GetPlayerIdentifier(String(player), i).split(':');
    identifiers[provider] = id;
  }
  
  discordID = identifiers["discord"];

  if (!discordID) {
    deferrals.done("No Discord ID found for this user. Please open Discord before starting FiveM to join this server.");
    return;
  }

  deferrals.update("Checking Discord for player whitelisting")
  await checkIsWhitelisted(discordID, deferrals);

  console.log("2xf-dc:register");
  emit("2xf-dc:register", discordID);
  
  const returningPlayer = "";
  const hardwareIDs = getPlayerTokens(player);
  
  if (!returningPlayer)
    addNewPlayer(discordID, hardwareIDs, deferrals);

  deferrals.done();
});


async function checkIsWhitelisted(discordID: string, deferrals: any): Promise<void> {
  await axios.get(`${GetConvar("DISCORD_API", "")}/guilds/${GetConvar("GUILD_ID", "")}/members/${discordID}`, {
    headers: {
      "Authorization": "Bot " + GetConvar("BOT_TOKEN", ""),
      "Content-Type": "application/json"
    }
  }).then(response => {
    if (response.data.roles.includes(GetConvar("GUILD_ROLE_ID", ""))) {
      deferrals.update("Player is whitelisted, proceeding");
      return;
    }
      
    else deferrals.done("Player not whitelisted, please follow the whitelisting procedure in the Discord before joining");
  }).catch(response => {
    deferrals.done("Axios request error: " + String(response));
  });
}

async function addNewPlayer(discordID: string, hardwareIDs: Array<string>, deferrals: any) {
  console.log("HWIDS", hardwareIDs);
  axios.post("/add-new-user", {
    id: discordID,
    hardwareIds: hardwareIDs
  }).catch(response => {
    deferrals.done("Error adding new player data: " + String(response));
  });
}