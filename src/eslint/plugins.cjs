const xoPlugins = require('xo/config/plugins.cjs');
xoPlugins.plugins = xoPlugins.plugins.filter((plugin) => plugin !== 'ava');
xoPlugins.extends = xoPlugins.extends.filter(
	(extend) => extend !== 'plugin:ava/recommended'
);
module.exports = xoPlugins;
