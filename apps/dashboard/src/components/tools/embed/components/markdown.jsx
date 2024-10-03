import hljs from 'highlight.js';
import SimpleMarkdown from 'simple-markdown';
import Twemoji from 'twemoji';
import Emoji from '~/lib/emojis';


// this is mostly translated from discord's client,
// although it's not 1:1 since the client js is minified
// and also is transformed into some tricky code

// names are weird and sometimes missing, as i'm not sure
// what all of these are doing exactly.


function flattenAst(node, parent) {
  if (Array.isArray(node)) {
    for (let n = 0; n < node.length; n++) {
      node[n] = flattenAst(node[n], parent);
    }
    
    return node;
  }
  
  if (node.content != null) {
    node.content = flattenAst(node.content, node);
  }
  
  if (parent != null && node.type === parent.type) {
    return node.content;
  }
  
  return node;
}

function astToString(node) {
  function inner(node, result=[]) {
    if (Array.isArray(node)) {
      for (let n = 0; n < node.length; n++) {
        astToString(node[n], result)
      }
    } else if (typeof node.content === 'string') {
      result.push(node.content);
    } else if (node.content != null) {
      astToString(node.content, result);
    }
    
    return result;
  }
  
  return inner(node).join('');
}

function parserFor(rules, returnAst) {
  const parser = SimpleMarkdown.parserFor(rules);
  const renderer = SimpleMarkdown.reactFor(SimpleMarkdown.ruleOutput(rules, 'react'));
  return (providedInput='', inline=true, state={}, transform=null) => {
    let input = providedInput.trim();
    if (!inline) {
      input += '\n\n';
    }
    
    let ast = parser(input, { inline, ...state });
    ast = flattenAst(ast);
    if (transform) {
      ast = transform(ast);
    }
    
    if (returnAst) {
      return ast;
    }
    
    return renderer(ast);
  }
}

function omit(object, excluded) {
  return Object.keys(object).reduce((result, key) => {
    if (excluded.indexOf(key) === -1) {
      result[key] = object[key];
    }
    
    return result;
  }, {});
}

// emoji stuff

const getEmoteURL = (emote) => `${location.protocol}//cdn.discordapp.com/emojis/${emote.id}.` + (emote.animated ? 'gif' : 'png');

function getEmojiURL(surrogate) {
  if (['™', '©', '®'].indexOf(surrogate) > -1) {
    return '';
  }
  
  try {
    // we could link to discord's cdn, but there's a lot of these
    // and i'd like to minimize the amount of data we need directly from them
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${Twemoji.convert.toCodePoint(surrogate)}.svg`;
  } catch (e) {
    console.error(e);
    return '';
  }
}

// emoji lookup tables

const DIVERSITY_SURROGATES = ['🏻', '🏼', '🏽', '🏾', '🏿'];
const NAME_TO_EMOJI = {};
const EMOJI_TO_NAME = {};

for (let n = 0; n < Object.keys(Emoji).length; n++) {
  const category = Object.keys(Emoji)[n];
  
  for (let m = 0; m < Emoji[category].length; m++) {
    const emoji = Emoji[category][m];
    EMOJI_TO_NAME[emoji.surrogates] = emoji.names[0] || '';
    
    for (let n = 0; n < emoji.names.length; n++) {
      const name = emoji.names[n];
      NAME_TO_EMOJI[name] = emoji.surrogates;
      
      for (let o = 0; o < DIVERSITY_SURROGATES.length; o++) {
        const surrogates = emoji.surrogates.concat(DIVERSITY_SURROGATES[o]);
        const name = emoji.names[0] || '';
        
        EMOJI_TO_NAME[surrogates] = `${name}::skin-tone-${o + 1}`;
      }
    }
    
    for (let n = 0; n < DIVERSITY_SURROGATES.length; n++) {
      const d = DIVERSITY_SURROGATES[n];
      const surrogates = emoji.surrogates.concat(d);
      const name = emoji.names[0] || '';
      
      EMOJI_TO_NAME[surrogates] = `${name}::skin-tone-${n + 1}`;
    }
  };
};

const EMOJI_NAME_AND_DIVERSITY_RE = /^:([^\s:]+?(?:::skin\-tone\-\d)?):/;

function convertNameToSurrogate(name, t='') {
  // what is t for?
  // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
  return  NAME_TO_EMOJI.hasOwnProperty(name) ? NAME_TO_EMOJI[name] : t;
}

function convertSurrogateToName(surrogate, colons=true, n='') {
  // what is n for?
  let a = n;
  
  // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
  if  (EMOJI_TO_NAME.hasOwnProperty(surrogate)) {
    a = EMOJI_TO_NAME[surrogate];
  }
  
  return colons ? `:${a}:` : a;
}

const esc = (str) => str.replace(/[\-\[\]\/\{}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

const replacer = (() => {
  const surrogates = Object.keys(EMOJI_TO_NAME)
  .sort(surrogate => -surrogate.length)
  .map(surrogate => esc(surrogate))
  .join('|');
  
  return new RegExp(`(${surrogates})`, 'g');
})();

function translateSurrogatesToInlineEmoji(surrogates) {
  return surrogates.replace(replacer, (_, match) => convertSurrogateToName(match));
}

// i am not sure why are these rules split like this.

const baseRules = {
  newline: SimpleMarkdown.defaultRules.newline,
  paragraph: SimpleMarkdown.defaultRules.paragraph,
  escape: SimpleMarkdown.defaultRules.escape,
  link: SimpleMarkdown.defaultRules.link,
  autolink: {
    ...SimpleMarkdown.defaultRules.autolink,
    match: SimpleMarkdown.inlineRegex(/^<(https?:\/\/[^ >]+)>/)
  },
  url: SimpleMarkdown.defaultRules.url,
  strong: SimpleMarkdown.defaultRules.strong,
  em: SimpleMarkdown.defaultRules.em,
  u: SimpleMarkdown.defaultRules.u,
  br: SimpleMarkdown.defaultRules.br,
  inlineCode: SimpleMarkdown.defaultRules.inlineCode,
  emoticon: {
    order: SimpleMarkdown.defaultRules.text.order,
    match: (source) => /^(¯\\_\(ツ\)_\/¯)/.exec(source),
    parse: (capture) => ({ type: 'text', content: capture[1] })
  },
  codeBlock: {
    order: SimpleMarkdown.defaultRules.codeBlock.order,
    match(source) {
      // biome-ignore lint/correctness/noEmptyCharacterClassInRegex: <explanation>
      return  /^```(([A-z0-9\-]+?)\n+)?\n*([^]+?)\n*```/.exec(source);
    },
    parse(capture) {
      return { lang: (capture[2] || '').trim(), content: capture[3] || '' };
    }
  },
  emoji: {
    order: SimpleMarkdown.defaultRules.text.order,
    match(source) {
      return EMOJI_NAME_AND_DIVERSITY_RE.exec(source);
    },
    parse(capture) {
      const match = capture[0];
      const name = capture[1];
      const surrogate = convertNameToSurrogate(name);
      return surrogate ? {
        name: `:${name}:`,
        surrogate: surrogate,
        src: getEmojiURL(surrogate)
      } : {
        type: 'text',
        content: match
      }
    },
    react(node, recurseOutput, state) {
      return node.src ? (
        <img
        draggable={false}
        className={`emoji ${node.jumboable ? 'jumboable' : ''}`}
        alt={node.surrogate}
        title={node.name}
        src={node.src}
        key={state.key}
        />
      ) : (
        <span key={state.key}>{node.surrogate}</span>
      );
    }
  },
  customEmoji: {
    order: SimpleMarkdown.defaultRules.text.order,
    match(source) {
      return /^<a?:(\w+):(\d+)>/.exec(source);
    },
    parse(capture) {
      const name = capture[1];
      const id = capture[2];
      return {
        emojiId: id,
        // NOTE: we never actually try to fetch the emote
        // so checking if colons are required (for 'name') is not
        // something we can do to begin with
        name: name,
        src: getEmoteURL({
          id: id,
          animated: capture[0].startsWith("<a")
        })
      };
    },
    react(node, recurseOutput, state) {
      return (
        <img
        draggable={false}
        className={`emoji ${node.jumboable ? 'jumboable' : ''}`}
        alt={`<:${node.name}:${node.id}>`}
        title={node.name}
        src={node.src}
        key={state.key}
        />
      );
    }
  },
  text: {
    ...SimpleMarkdown.defaultRules.text,
    parse(capture, recurseParse, state) {
      return state.nested ? {
        content: capture[0]
      } : recurseParse(translateSurrogatesToInlineEmoji(capture[0]), {
        ...state,
        nested: true
      });
    }
  },
  s: {
    order: SimpleMarkdown.defaultRules.u.order,
    match: SimpleMarkdown.inlineRegex(/^~~([\s\S]+?)~~(?!_)/),
    parse: SimpleMarkdown.defaultRules.u.parse
  }
};

function createRules(r) {
  const paragraph = r.paragraph;
  const url = r.url;
  const link = r.link;
  const codeBlock = r.codeBlock;
  const inlineCode = r.inlineCode;
  
  return {
    // rules we don't care about:
    //  mention
    //  channel
    //  highlight
    
    // what is highlight?
    
    ...r,
    s: {
      order: r.u.order,
      match: SimpleMarkdown.inlineRegex(/^~~([\s\S]+?)~~(?!_)/),
      parse: r.u.parse,
      react(node, recurseOutput, state) {
        return <s key={state.key}>{recurseOutput(node.content, state)}</s>;
      }
    },
    paragraph: {
      ...paragraph,
      react(node, recurseOutput, state) {
        return <p key={state.key}>{recurseOutput(node.content, state)}</p>;
      }
    },
    url: {
      ...url,
      match: SimpleMarkdown.inlineRegex(/^((https?|steam):\/\/[^\s<]+[^<.,:;"')\]\s])/)
    },
    link: {
      ...link,
      react(node, recurseOutput, state) {
        // this contains some special casing for invites (?)
        // or something like that.
        // we don't really bother here
        const children = recurseOutput(node.content, state);
        const title = node.title || astToString(node.content);
        return (
          <a
          title={title}
          href={SimpleMarkdown.sanitizeUrl(node.target)}
          target='_blank'
          rel='noreferrer'
          key={state.key}
          >
          {children}
          </a>
        );
      }
    },
    inlineCode: {
      ...inlineCode,
      react(node, recurseOutput, state) {
        return (
          <code className='inline' key={state.key}>
          {node.content}
          </code>
        );
      }
    },
    codeBlock: {
      ...codeBlock,
      react(node, recurseOutput, state) {
        if (node.lang && hljs.getLanguage(node.lang) != null) {
          const highlightedBlock = hljs.highlight(node.lang, node.content, true);
          
          return (
            <pre key={state.key}>
            <code
            className={`hljs ${highlightedBlock.language}`}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
            dangerouslySetInnerHTML={{ __html: highlightedBlock.value }}
            />
            </pre>
          );
        }
        
        return (
          <pre key={state.key}>
          <code className='hljs'>{node.content}</code>
          </pre>
        );
      }
    }
  };
}

const rulesWithoutMaskedLinks = createRules({
  ...baseRules,
  link: {
    ...baseRules.link,
    match() {
      return null;
    }
  }
});

// used in:
//  message content (non-webhook mode)
const parse = parserFor(rulesWithoutMaskedLinks);

// used in:
//  message content (webhook mode)
//  embed description
//  embed field values
const parseAllowLinks = parserFor(createRules(baseRules));

// used in:
//  embed title (obviously)
//  embed field names
const parseEmbedTitle = parserFor(
  omit(rulesWithoutMaskedLinks, ['codeBlock', 'br', 'mention', 'channel', 'roleMention'])
);

// used in:
//  message content
function jumboify(ast) {
  const nonEmojiNodes = ast.some(node => (
    node.type !== 'emoji' &&
    node.type !== 'customEmoji' &&
    (typeof node.content !== 'string' || node.content.trim() !== '')
  ));
  
  if (nonEmojiNodes) {
    return ast;
  }
  
  const maximum = 27;
  let count = 0;
  
  for (let n = 0; n < ast.length; n++) {
    if (node.type === 'emoji' || node.type === 'customEmoji') {
      count += 1;
    }
    
    if (count > maximum) {
      return false;
    }
  };
  
  if (count < maximum) {
    for (let n = 0; n < ast.length; n++) {
      if (node.type === 'emoji' || node.type === 'customEmoji') {
        node.jumboable = true
      }
    }
  }
  
  return ast;
}


export { jumboify, parse, parseAllowLinks, parseEmbedTitle };

