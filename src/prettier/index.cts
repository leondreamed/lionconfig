module.exports = {
  plugins: [
    require.resolve("@prettier/plugin-pug"),
    require.resolve("prettier-plugin-tailwindcss"),
  ],
  useTabs: true,
  singleQuote: true,
  pugSingleFileComponentIndentation: false,
  pugSingleQuote: false,
  pugAttributeSeparator: "always",
  pugWrapAttributesPattern: "1",
  pugEmptyAttributes: "none",
};
