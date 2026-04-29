declare module "country-flag-emoji" {
  export type CountryFlagEmojiEntry = {
    code: string;
    unicode: string;
    name: string;
    emoji: string;
  };

  export type CountryFlagEmojiApi = {
    data: Record<string, CountryFlagEmojiEntry>;
    list: CountryFlagEmojiEntry[];
    countryCodes: string[];
    get(countryCode?: string): CountryFlagEmojiEntry | CountryFlagEmojiEntry[] | undefined;
  };

  const countryFlagEmoji: CountryFlagEmojiApi;
  export default countryFlagEmoji;
}
