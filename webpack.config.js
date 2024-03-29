/* eslint-disable @typescript-eslint/no-var-requires */

const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const PORT = 3000;
const ROOT = path.join(__dirname, 'dist');

const config = {
  devServer: {
    compress: true,
    port: PORT,
  },

  devtool: 'source-map',

  entry: [path.resolve(__dirname, 'app', 'index.tsx')],

  mode: 'development',

  module: {
    rules: [
      {
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'app'),
        ],
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          presets: ['@babel/preset-react'],
        },
        test: /\.(ts|tsx)$/,
      },
    ],
  },

  output: {
    filename: 'redux-slices.js',
    library: 'reduxSlices',
    libraryTarget: 'umd',
    path: ROOT,
    publicPath: `http://localhost:${PORT}`,
    umdNamedDefine: true,
  },

  plugins: [
    new ESLintPlugin({
      extensions: ['tsx', 'ts'],
    }),
    new webpack.EnvironmentPlugin({ NODE_ENV: 'development' }),
    new HtmlWebpackPlugin(),
  ],

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

module.exports = config;
