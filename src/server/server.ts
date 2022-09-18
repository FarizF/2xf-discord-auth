// import * as Cfx from 'fivem-js';
import axios from "axios";

on("playerConnecting", async (name, setKickReason, deferrals) => {
  deferrals.defer();

  const player = global.source;
  const identifiers: string[] = [];

  deferrals.update("Getting player identifiers")
  for (let i = 0; i < GetNumPlayerIdentifiers(String(player)); i++) {
    const identifier = GetPlayerIdentifier(String(player), i);
    identifiers.push(identifier);
  }
  
  const discord = identifiers.find((identifier) => identifier.includes("discord"));

  if (!discord) {
    deferrals.done("No Discord ID found for this user. Please open Discord before starting FiveM to join this server.");
    return;
  }

  deferrals.update("Checking Discord for player whitelisting")
  const discordID = discord.split(":")[1];
  await checkIsWhitelisted(discordID, deferrals);

  setImmediate(() => emitNet("2xf-dc:register", discordID));
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