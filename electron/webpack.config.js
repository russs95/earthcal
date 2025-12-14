// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './main.js', // Update this if your entry file has a different name
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js'],
  },
};
