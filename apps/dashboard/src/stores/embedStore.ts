import { createStore } from 'zustand/vanilla';

export type ColorResolvable = `#${string}`;
export type EmbedAuthor = { name?: string; url?: string; icon_url?: string };
export type EmbedField = { name: string; value: string; inline?: boolean };
export type EmbedFooter = { text: string; icon_url?: string };
export type EmbedImage = { url: string };
export type EmbedType = {
  color?: ColorResolvable;
  title?: string;
  url?: string;
  author?: EmbedAuthor;
  description?: string;
  fields?: EmbedField[];
  thumbnail?: EmbedImage;
  image?: EmbedImage;
  footer?: EmbedFooter;
  timestamp?: string;
};

export type EmbedState = {
  content: string;
  embeds: EmbedType[];
};

export type EmbedActions = {
  setContent: (content: string) => void;
  updateEmbed: (idx: number, embed: EmbedType) => void;
  addEmbed: () => void;
  removeEmbed: (idx: number) => void;
  addField: (idx: number) => void;
  removeField: (embedIdx: number, fieldIdx: number) => void;
  updateField: (embedIdx: number, fieldIdx: number, field: EmbedField) => void;
  reset: () => void;
  export: () => void;
};

export type EmbedStore = EmbedState & EmbedActions;

const defaultOliverEmbed: EmbedType = {
  author: {
    icon_url: '/assets/images/icons/icon-192x192.png', // Default Oliver bot icon
    name: 'Oliver Bot',
    url: 'https://oliver.bloomlabs.me', // URL to Oliver bot or relevant page
  },
  color: '#3b82f6', // Default Oliver bot theme color
  description: 'Welcome to the Oliver Embed Builder! You can create custom embeds here for your Discord server. **Markdown** is supported, so you can add formatting to your embeds using _italics_, **bold**, `inline code`, and more!',
  fields: [
    {
      name: 'About Oliver Bot',
      value: 'Oliver Bot helps manage your server with advanced features, including custom embeds, moderation, and more. [Learn more](https://bloomlabs.me/oliver).',
      inline: false,
    },
    {
      name: 'Embed Features',
      value: '- Supports **Markdown** formatting\n- Add custom fields, images, and colors\n- Fully customizable embed design',
      inline: false,
    }
  ],
  footer: {
    icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png', // Default footer icon
    text: '♡ from fabra & bloomlabs',
  },
  image: {
    url: 'https://glitchii.github.io/embedbuilder/assets/media/banner.png', // Default image URL
  },
  thumbnail: {
    url: 'https://cdn.discordapp.com/embed/avatars/0.png', // Default thumbnail URL
  },
  title: 'Oliver Bot Embed Builder',
  url: 'https://oliver.bloomlabs.me/tools/embed', // URL to Oliver bot embed builder
  timestamp: new Date().toISOString(),
};

const defaultContent = `
**Welcome to the Oliver Bot Embed Builder!**

This embed builder allows you to create dynamic, rich embeds for your Discord server using Markdown syntax. Here's a quick overview of some things you can do with Markdown:

- *Italics*: _This text is in italics._
- **Bold**: This text is in **bold**.
- ***Bold and Italics***: You can combine both **_like this_**.
- \`Inline Code\`: You can highlight code or commands like \`/ban @user\`.
- [Links](https://bloomlabs.me/oliver): Add hyperlinks to your messages.

> Blockquotes: You can also add blockquotes to draw attention to important text.

### Lists:
- Item 1
- Item 2
  - Sub-item 2.1

\`\`\`js
// Code blocks can also be used
console.log('Hello, World!');
\`\`\`

Enjoy customizing your embeds with **Oliver Bot** and unleash its full potential in your server!
`;


const emptyEmbed: EmbedType = {
  author: {
    icon_url: '',
    name: '',
    url: '',
  },
  color: '#5865F2',
  description: '',
  fields: [{
    name: '',
    value: '',
    inline: false,
  }],
  footer: {
    icon_url: '',
    text: '',
  },
  image: {
    url: '',
  },
  thumbnail: {
    url: '',
  },
  title: '',
  url: '',
};

export const defaultEmbedState: EmbedState = {
  content: defaultContent,
  embeds: [defaultOliverEmbed],
};

export const createEmbedStore = (initState: EmbedState = defaultEmbedState) => {
  return createStore<EmbedStore>((set) => ({
    ...initState,
    setContent: (content: string) => {
      set((state) => ({ ...state, content }));
    },
    updateEmbed: (idx: number, embed: EmbedType) => {
      set((state) => {
        const embeds = [...state.embeds];
        embeds[idx] = embed;
        return { ...state, embeds };
      });
    },
    addEmbed: () => {
      set((state) => {
        const embeds = [...state.embeds];
        if (embeds.length >= 10) return state;
        embeds.push(emptyEmbed);
        return { ...state, embeds };
      });
    },
    removeEmbed: (idx: number) => {
      set((state) => {
        const embeds = [...state.embeds];
        embeds.splice(idx, 1);
        return { ...state, embeds };
      });
    },
    addField: (idx: number) => {
      set((state) => {
        const embeds = [...state.embeds];
        if (embeds[idx].fields?.length === 25) return state;
        embeds[idx].fields = embeds[idx].fields ?? [];
        embeds[idx].fields.push({ name: '', value: '' });
        return { ...state, embeds };
      });
    },
    removeField: (embedIdx: number, fieldIdx: number) => {
      set((state) => {
        const embeds = [...state.embeds];
        embeds[embedIdx].fields?.splice(fieldIdx, 1);
        return { ...state, embeds };
      });
    },
    updateField: (embedIdx: number, fieldIdx: number, field: EmbedField) => {
      set((state) => {
        const embeds = [...state.embeds];
        embeds[embedIdx].fields?.splice(fieldIdx, 1, field);
        return { ...state, embeds };
      });
    },
    reset: () => {
      set(defaultEmbedState);
    },
    export: () => {
      set((state) => {
        const content = JSON.stringify(state, null, 2);
        navigator.clipboard.writeText(content);
        return state;
      });
    }
  }));
}