const { ChannelType, EmbedBuilder, codeBlock, inlineCode } = require("discord.js");
const { Listener } = require("gcommands");
const axios = require("axios");
const fs = require("fs");

async function download(url){
    const random = ~~(Math.random() * 1000);
    const { data } = await axios.get(url, {
        responseType: "stream"
    });
    const promise = new Promise((resolve, reject) => {
        data
            .pipe(
                fs.createWriteStream(`downloaded/log-${random}.md`)
                    .on("finish", resolve)
                    .on("error", reject)
            );
    })
    await promise;
    return `downloaded/log-${random}.md`;
}

async function verifyTextLength(text, maxLength=1024) {
    if(text.length > maxLength) {
        try {
            const response = await axios.post('https://hastebin.com/documents', text, {
                headers: {
                  'Content-Type': 'text/plain'
                }
              });
            const key = response.data.key;
            return `https://hastebin.com/${key}/`;
        } catch(e) {
            console.error(e);
            return "TEXT TOO LONG FOR HASTEBIN UPLOAD, OR HASTEBIN OUT OF SERVICE."
        }
    }
    else return text;
}

new Listener({
    name: "File Dump Checker",
    event: "messageCreate",
    run: async (msg) => {

        if(msg.author.bot) return;
        if(msg.channel.type != ChannelType.GuildText) return;
        if(msg.attachments.size < 1) return;
        
        const fileRegex = new RegExp(/(.*decent-logger-output.*.md)/gi);

        
        msg.attachments.forEach(async (attachment) => {

            if(!fileRegex.test(attachment.name)) return;

            const file = await download(attachment.url);
            const content = fs.readFileSync(file).toString();

            function getOneLiner(text, trim=true) {
                if(!content.includes(text)) return false;
                
                const result = content.split(text)[1].split("\n")[0];
                if(trim) return result.trim();
                else return result;
            }
            
            function getMultiLiner(start, stop, trim=true) {
                if(!content.includes(start)) return false;

                const result = content.split(start)[1].split(stop)[0];
                if(trim) return result.trim();
                else return result;
            }

            const embed = new EmbedBuilder()
                .addFields([
                    {
                        name: "Created at",
                        value: inlineCode(getOneLiner("Created: ")),
                        inline: true
                    },
                    {
                        name: "Timezone",
                        value: inlineCode(getOneLiner("TimeZone: ")),
                        inline: true
                    },
                    {
                        name: "Java Version | Headless Mode",
                        value: inlineCode(await verifyTextLength(getOneLiner("JAVA VERSION: ") + " | " + getOneLiner("HeadlessMode: "))),
                    },
                    {
                        name: "Server Version",
                        value: inlineCode(await verifyTextLength(getOneLiner("SERVER VERSION: "))),
                    },
                    {
                        name: "Decent Plugins",
                        value: codeBlock(await verifyTextLength(getMultiLiner("DECENT-PLUGINS:", "#")))
                    },
                    {
                        name: "Other Plugins",
                        value: codeBlock(await verifyTextLength(getMultiLiner("OTHER-PLUGINS:", "#")))
                    },
                    {
                        name: "Installed PAPI Extensions",
                        value: codeBlock(await verifyTextLength(getMultiLiner("PAPI Expansions:", "#") || "No results.."))
                    },
                    {
                        name: "Console Output",
                        value: codeBlock(await verifyTextLength(getMultiLiner("CONSOLE-OUTPUT:", "#")))
                    }
                ])
                .setColor("#87CEEB")

            await msg.channel.send({
                content: `> <:blue_star:1054775586897264701>・Summary of DecentLogs from <@${msg.author.id}>`,
                embeds: [
                    embed
                ]
            })

            fs.unlinkSync(file);
        })

    }
})