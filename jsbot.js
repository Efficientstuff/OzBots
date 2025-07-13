const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    
    const channelId = ''; // discord channel id to send in
    const channel = client.channels.cache.get(channelId);
    if (channel) {
        channel.send('The bot has logged in!');
    } else {
        console.warn(`Channel with ID ${channelId} not found.`);
    }
});

async function scrapeDeals() {
    try {
        const response = await axios.get('https://www.ozbargain.com.au/');
        const html = response.data;
        const $ = cheerio.load(html);

        const deals = [];
        // grabs elements from site
        $('.node.node-ozbdeal.node-teaser').each((index, element) => {
            const title = $(element).find('h2.title').text().trim();
            const urlPath = $(element).find('h2.title a').attr('href');
            const imageUrl = $(element).find('.foxshot-container img').attr('src');
            const descriptions = $(element).find('.content p').text().trim()

            if (urlPath) {
                const fullUrl = `https://www.ozbargain.com.au${urlPath}`;
                deals.push({title, url: fullUrl, imageUrl, descriptions});
            } else {
                console.log('URL path is undefined for:', title);
            }
        });

        return deals;
    } catch (error) {
        console.error('Error scraping deals:', error);
        return [];
    }
}


client.on('messageCreate', async message => {
    if (message.content === 'deals') {
        try {
            const deals = await scrapeDeals();

            if (deals.length ==0) {
                await message.channel.send('No deals found at this time')
                return;
            }

            for (const deal of deals) {
                await message.channel.send('@everyone')
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(deal.title)
                    .setURL(deal.url)
                    .setAuthor({ name: "Some Name", iconURL: "https://i.imgur.com/F9BhEoz.png", url: "https://discord4j.com" })
                    .setDescription(deal.descriptions)
                    .setThumbnail("https://i.imgur.com/F9BhEoz.png")
                    .addFields(
                        { name: "field title", value: "value", inline: false },
                        { name: "\u200B", value: "\u200B", inline: false },
                        { name: "inline field", value: "value", inline: true },
                        { name: "inline field", value: "value", inline: true },
                        { name: "inline field", value: "value", inline: true }
                    )
                    .setImage(deal.imageUrl)
                    .setTimestamp()
                    .setFooter({ text: "footer", iconURL: "https://i.imgur.com/F9BhEoz.png" });

                await message.channel.send({ embeds: [embed] });

            }
        } catch (error) {
            console.error('Error occurred:', error);
            message.channel.send('Sorry, there was an error fetching the deals.');
        }
        
    } else if (message.content.startsWith('!clear')) {
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.channel.send('You do not have permission to manage messages.');
        }

        const args = message.content.split(' ').slice(1);
        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.channel.send('Please specify a number between 1 and 100.');
        }

        message.channel.bulkDelete(amount, true).catch(err => {
            console.error(err);
            message.channel.send('There was an error trying to delete messages in this channel!');
        });
    }


});



client.login('process.env.API_KEY');


