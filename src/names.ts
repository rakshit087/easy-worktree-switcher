const ADJECTIVES = [
  "brave",
  "clever",
  "cosmic",
  "curious",
  "dapper",
  "eager",
  "feisty",
  "fuzzy",
  "gentle",
  "giddy",
  "jolly",
  "jumpy",
  "lucky",
  "mellow",
  "nifty",
  "plucky",
  "quirky",
  "rowdy",
  "scrappy",
  "silly",
  "sleepy",
  "sneaky",
  "snappy",
  "sparkly",
  "speedy",
  "spry",
  "sunny",
  "swift",
  "wacky",
  "zany"
];

const NOUNS = [
  "badger",
  "beetle",
  "capybara",
  "corgi",
  "dolphin",
  "falcon",
  "ferret",
  "gecko",
  "goose",
  "hedgehog",
  "koala",
  "lemur",
  "llama",
  "lynx",
  "meerkat",
  "narwhal",
  "otter",
  "panda",
  "penguin",
  "platypus",
  "possum",
  "raccoon",
  "seal",
  "sloth",
  "squid",
  "squirrel",
  "toucan",
  "walrus",
  "wombat",
  "yak"
];

function pick(words: readonly string[]): string {
  return words[Math.floor(Math.random() * words.length)];
}

export function generateRandomWorktreeName(): string {
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}`;
}
