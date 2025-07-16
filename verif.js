require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const TOKEN         = process.env.BOT_TOKEN;
const GUILD_ID      = process.env.GUILD_ID;
const CHANNEL_ID    = process.env.CHANNEL_ID;
const CITOYEN_ID    = process.env.ROLE_CITOYEN_ID;
const NON_VALIDE_ID = process.env.ROLE_NON_VALIDE_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User]
});

// ---- Embed design ----
function buildVerifEmbed() {
  return new EmbedBuilder()
    .setColor('#FF7500')
    .setAuthor({ name: 'Vérification NXSTxVérif', iconURL: 'https://i.goopics.net/4pagyj.png' })
    .setTitle('🌟 Vérification Obligatoire')
    .setDescription([
      "Bienvenue sur le serveur **NXST RP** ! 🚦",
      "",
      "Afin d’assurer une expérience RP sérieuse et sécurisée, nous avons mis en place une vérification simple :",
      "",
      "🔸 **Lis attentivement le texte ci-dessous.**",
      "🔸 **Deux mots cachés** sont glissés dans le texte (hors thème GTA).",
      "🔸 Clique sur « Valider » puis indique ces deux mots pour débloquer l’accès au serveur.",
      "",
      "```",
      "Chez NXST, chaque citoyen contribue à l’ambiance unique de notre serveur. Ici, le respect et la cohésion de groupe sont la base de toute aventure. Prends toujours le temps de t’imprégner de l’histoire et d’écouter les conseils des anciens.",
      "",
      "L’improvisation est permise, mais jamais au détriment de l’immersion : évite les réactions impulsives qui pourraient nuire au RP des autres joueurs, comme si tu lançais une toupie de Beyblade au beau milieu d’une scène sérieuse !",
      "",
      "Rappelle-toi : l’entraide, la patience et le fairplay sont essentiels pour évoluer. Même un maître Pokemon sait que l’apprentissage passe par le respect de chaque règle et le soutien de la communauté.",
      "",
      "Chaque situation peut se régler avec intelligence, calme et une touche d’humour. Privilégie le dialogue avant toute action radicale et n’hésite jamais à demander de l’aide au staff.",
      "",
      "En respectant ces principes, tu contribueras à faire de NXST RP une expérience mémorable pour tous.",
      "```",
      "",
      "⏳ *Prends le temps de lire… seuls ceux qui jouent le jeu pourront passer !*"
    ].join('\n'))
    .setFooter({ text: 'NXSTxVérif • Accès sécurisé', iconURL: 'https://i.goopics.net/4pagyj.png' });
}


client.once('ready', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (channel) {
    // Supprime anciens messages du bot pour éviter le spam
    const messages = await channel.messages.fetch({ limit: 5 });
    const botMessages = messages.filter(msg => msg.author.id === client.user.id);
    for (const msg of botMessages.values()) {
      await msg.delete().catch(() => {});
    }
    // Envoie l'embed
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verif_start')
        .setLabel('✅ Valider & Accéder au serveur')
        .setStyle(ButtonStyle.Success)
    );
    await channel.send({ embeds: [buildVerifEmbed()], components: [row] });
  } else {
    console.log('Salon de vérification introuvable');
  }
});

// ---- Interaction : bouton ----
client.on('interactionCreate', async interaction => {
  if (interaction.isButton() && interaction.customId === 'verif_start') {
    // Modal à remplir
    const modal = new ModalBuilder()
      .setCustomId('verif_modal')
      .setTitle('Vérification d\'accès')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('mot1')
            .setLabel('Mot clé 1 (indice : B...)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(25)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('mot2')
            .setLabel('Mot clé 2 (indice : P...)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(25)
            .setRequired(true)
        ),
      );
    await interaction.showModal(modal);
  }

  // ---- Modal : Validation des réponses ----
  if (interaction.isModalSubmit() && interaction.customId === 'verif_modal') {
    const mot1 = interaction.fields.getTextInputValue('mot1').trim().toLowerCase();
    const mot2 = interaction.fields.getTextInputValue('mot2').trim().toLowerCase();

    if (
      (mot1 === 'beyblade' && mot2 === 'pokemon') ||
      (mot1 === 'pokemon' && mot2 === 'beyblade')
    ) {
      try {
        // Attribution des rôles
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.roles.cache.has(CITOYEN_ID)) await member.roles.add(CITOYEN_ID);
        if (member.roles.cache.has(NON_VALIDE_ID)) await member.roles.remove(NON_VALIDE_ID);

        await interaction.reply({ content: '✅ Bravo ! Tu es désormais **Citoyen** sur NXST RP. Profite du serveur !', ephemeral: true });
      } catch (err) {
        await interaction.reply({ content: '❌ Erreur lors de la validation, contacte un staff.', ephemeral: true });
      }
    } else {
      await interaction.reply({ content: '❌ Les mots clés ne sont pas corrects ! Relis bien le texte.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
