const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    mode: argv.mode || 'development',
    devtool: isDevelopment ? 'inline-source-map' : false,

    entry: {
      ui: './src/ui/index.tsx',
      code: './src/main/code.ts',
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpg|gif|webp|svg)$/,
          loader: 'url-loader',
        },
      ],
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },

    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './src/ui/index.html',
        filename: 'ui.html',
        chunks: ['ui'],
        inject: 'body',
        inlineSource: '.(js|css)$',
      }),
      new HtmlInlineScriptPlugin(),
    ],
  };
}; 