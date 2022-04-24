const xoPlugins = require('xo/config/plugins.cjs');
xoPlugins.plugins.splice(xoPlugins.plugins.indexOf('ava'), 1);
module.exports = xoPlugins;
