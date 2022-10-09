// import * as Cfx from 'fivem-js';
import axios from "axios";
import qs from 'qs'

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
  
  const returningPlayer = getReturningPlayer(discordID);
  console.log(returningPlayer);
  const hardwareIDs = getPlayerTokens(player);
  
  if (!returningPlayer)
    addNewPlayer(discordID, hardwareIDs, deferrals);

  deferrals.done();
});


async function checkIsWhitelisted(discordID: string, deferrals: any): Promise<void> {
  await axios.get(`${GetConvar("DISCORD_API", "")}/guilds/${GetConvar("GUILD_ID", "")}/members/${discordID}`, {
    headers: {
      "Authorization": "Bot " + GetConvar("BOT_TOKEN", ""),
      "Content-Type": "application/x-www-form-urlencoded"
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

async function getReturningPlayer(discordID: string): Promise<string> {
  return axios.get(`${GetConvar("GSRP_BE", "")}/register/returning/${discordID}`)
  .then(response => {
    const id: string = response.data.id;
    return id ? id : "";
  })
}

async function addNewPlayer(discordID: string, hardwareIDs: Array<string>, deferrals: any) {
  console.log("New player:", discordID, hardwareIDs);
  axios.post(`${GetConvar("GSRP_BE", "")}/register/new-player`, {
    id: discordID,
    hardwareIds: hardwareIDs
  }, { headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  }).then(response => {
    console.log("ADD NEW PLAYER RESPONSE:" + response)
  }).catch(response => {
    deferrals.done("Error adding new player data: " + String(response));
  });
}