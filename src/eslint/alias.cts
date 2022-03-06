module.exports = (aliasMap: Record<string, string>) => ({
  "import/resolver": {
    alias: {
      map: Object.entries(aliasMap),
    },
  },
});
