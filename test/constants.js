const path = require('path');

exports.integrations = ['vite', 'snowpack', 'webpack', 'rollup'];

exports.bin = {
	rollup: dir => path.resolve(dir, `./node_modules/nollup/lib/cli.js`),
	snowpack: dir =>
		path.resolve(dir, `./node_modules/snowpack/dist-node/index.bin.js`),
	vite: dir => path.resolve(dir, `./node_modules/vite/bin/vite.js`),
	webpack: dir =>
		path.resolve(
			dir,
			`./node_modules/webpack-dev-server/bin/webpack-dev-server.js`
		)
};

exports.binArgs = {
	snowpack: ['dev'],
	webpack: [],
	vite: [],
	rollup: ['--port 3003 -c --hot --content-base public']
};

exports.goMessage = {
	vite: 'running',
	snowpack: 'Server started',
	webpack: 'successfully',
	rollup: 'Compiled'
};

exports.defaultPort = {
	vite: 3000,
	webpack: 3001,
	rollup: 3003,
	snowpack: 8080
};
