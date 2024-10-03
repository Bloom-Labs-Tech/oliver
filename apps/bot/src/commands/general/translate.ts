import translate from '@iamtraction/google-translate';
import { Filter } from 'bad-words';
import { AutocompleteInteraction, type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import ISO6391 from 'iso-639-1';
import { OliverCommand } from '~/client';

export default class Command extends OliverCommand {
  constructor() {
    super({
      name: 'translate',
      description: 'Translate a message to a different language.',
      category: 'general',
    });
  }

  public registerApplicationCommands() {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description)
      .addStringOption((option) => option.setName('text').setDescription('The text to translate').setRequired(true))
      .addStringOption((option) => option.setName('language').setDescription('The language to translate to').setRequired(true).setAutocomplete(true));
  }

  public async autocomplete(interaction: AutocompleteInteraction) {
    const query = interaction.options.getString('language', true).toLowerCase();
    const languages = ISO6391.getAllNames();

    const results = languages.filter((language) => language.toLowerCase().includes(query)).slice(0, 25);
    if (results.length === 0) {
      return interaction.respond([]);
    }

    return interaction.respond(results.map((language) => ({
      name: language,
      value: ISO6391.getCode(language),
    })));
  }

  public async run(interaction: ChatInputCommandInteraction) {
    const text = interaction.options.getString('text', true);
    const language = interaction.options.getString('language', true);

    const translated = await translate(text, { to: language });

    if (translated.from.language.iso === language) {
      return interaction.reply(`The text is already in ${language}.`);
    }
    if (translated.from.language.iso === 'unknown') {
      return interaction.reply('The language is not supported.');
    }
    if (translated.text.length > 2000) {
      return interaction.reply('The translated text is too long.');
    }
    
    const filter = new Filter({
      placeHolder: '*'
    });
    const filtered = filter.clean(translated.text);

    return interaction.reply(filtered);
  }
}
