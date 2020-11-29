const fs = require("fs");
const {
  WAConnection,
  MessageType,
  ReconnectMode,
  waChatKey,
  WA_MESSAGE_STUB_TYPES,
  decodeMediaMessageBuffer,
} = require("@adiwajshing/baileys");
const ffmpeg = require("fluent-ffmpeg");
const sharp = require("sharp");
const streamifier = require("streamifier");
const Axios = require("axios");
async function connectToWhatsApp() {
  const conn = new WAConnection(); // instantiate
  conn.autoReconnect = ReconnectMode.onConnectionLost; // only automatically reconnect when the connection breaks
  conn.logger.level = "fatal"; // set to 'debug' to see what kind of stuff you can implement
  // attempt to reconnect at most 10 times in a row
  conn.connectOptions.maxRetries = 10;
  conn.chatOrderingKey = waChatKey(true); // order chats such that pinned chats are on top
  conn.on("credentials-updated", () => {
    console.log(`credentials updated`);
    const authInfo = conn.base64EncodedAuthInfo(); // get all the auth info we need to restore this session
    fs.writeFileSync("./auth_info.json", JSON.stringify(authInfo, null, "\t")); // save this info to a file
  });
  fs.existsSync("./auth_info.json") && conn.loadAuthInfo("./auth_info.json");
  await conn.connect();

  conn.on("message-new", async (m) => {
    // if (!m.message) return;
    // handleCommand(m);
  });
  conn.on("chat-update", async (chatUpdate) => {
    if (chatUpdate.messages) {
      let m = chatUpdate.messages.all()[0];
      if (!m.message) return;
      handleCommand(m);
    }
  });
  async function handleCommand(m) {
    const messageType = Object.keys(m.message)[0];
    if (
      messageType == MessageType.image &&
      m.message.imageMessage.url &&
      m.message.imageMessage.caption == "/sticker"
    ) {
      let image = await conn.downloadMediaMessage(m);
      let sticker = await sharp(image).resize(512, 512).webp().toBuffer();
      await conn.sendMessage(m.key.remoteJid, sticker, MessageType.sticker);
      console.log("Sticker Image sent to: " + m.key.remoteJid);
    } else if (
      messageType == MessageType.video &&
      m.message.videoMessage.url &&
      m.message.videoMessage.caption == "/sticker"
    ) {
      let processOptions = {
        fps: 10,
        startTime: `00:00:00.0`,
        endTime: `00:00:05.0`,
        loop: 0,
      };
      let tempFile = `${Math.floor(Math.random() * 100000)}.webp`;
      let videoBuffer = await conn.downloadMediaMessage(m);
      const videoStream = await streamifier.createReadStream(videoBuffer);
      let success = await new Promise((resolve, reject) => {
        var command = ffmpeg(videoStream)
          .inputFormat("mp4")
          .on("error", function (err) {
            console.log("An error occurred: " + err.message);
            reject(err);
          })
          .on("start", function (cmd) {
            console.log("Started " + cmd);
          })
          .addOutputOptions([
            `-vcodec`,
            `libwebp`,
            `-vf`,
            `crop=w='min(min(iw\,ih)\,500)':h='min(min(iw\,ih)\,500)',scale=500:500,setsar=1,fps=${processOptions.fps}`,
            `-loop`,
            `${processOptions.loop}`,
            `-ss`,
            processOptions.startTime,
            `-t`,
            processOptions.endTime,
            `-preset`,
            `default`,
            `-an`,
            `-vsync`,
            `0`,
            `-s`,
            `512:512`,
          ])
          .toFormat("webp")
          .on("end", () => {
            resolve(true);
          })
          .saveToFile("temp/" + tempFile);
      });
      if (!success) {
        console.log("Erro ao processar o video");
        return;
      }
      var bufferwebp = await fs.readFileSync("temp/" + tempFile);
      fs.unlinkSync("temp/" + tempFile);
      await conn.sendMessage(m.key.remoteJid, bufferwebp, MessageType.sticker);
      console.log("Sticker Animated sent to: " + m.key.remoteJid);
    } else if (
      m.message.conversation &&
      m.message.conversation.startsWith("/imagem")
    ) {
      let search = m.message.conversation.split(" ")[1];
      let { data } = await Axios.get(
        `https://api.fdci.se/rep.php?gambar=${search}`
      );
      if (!data) {
        console.log("No data from: " + search);
        return;
      }
      let response = await Axios.get(
        data[Math.floor(Math.random() * data.length)],
        {
          responseType: "arraybuffer",
        }
      );
      if (!response.data) return;
      await conn.sendMessage(
        m.key.remoteJid,
        response.data,
        MessageType.image,
        {
          caption: "gatosgatocatcats".includes(search) ? "Miau" : null,
        }
      );
      console.log("Random Image sent to: " + m.key.remoteJid);
    }
  }
  conn.on("close", ({ reason, isReconnecting }) =>
    console.log(
      "oh no got disconnected: " + reason + ", reconnecting: " + isReconnecting
    )
  );
}

connectToWhatsApp().catch((err) => console.log("unexpected error: " + err));
