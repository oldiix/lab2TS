/* eslint-env node */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/**
 * Webpack конфігурація проєкту.
 * @param {Record<string, unknown>} _env
 * @param {{ mode?: string }} argv
 * @returns {import('webpack').Configuration}
 */
module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.ts',

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      assetModuleFilename: 'assets/[name][ext]',
      publicPath: '',
      clean: true,
    },

    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',

    resolve: {
      extensions: ['.ts', '.js'],
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                // Bootstrap 5.3 ще використовує @import та глобальні
                // Sass-функції. quietDeps глушить попередження з node_modules,
                // silenceDeprecations — ті самі попередження з нашого
                // main.scss, який підключає партіали Bootstrap через @import.
                // Помилки у власних стилях при цьому лишаються видимими.
                sassOptions: {
                  quietDeps: true,
                  silenceDeprecations: [
                    'import',
                    'global-builtin',
                    'color-functions',
                  ],
                },
              },
            },
          ],
        },
        {
          test: /\.css$/i,
          use: [isProduction ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpe?g|gif|woff2?|eot|ttf)$/i,
          type: 'asset/resource',
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        filename: 'index.html',
        favicon: './public/favicon.svg',
        minify: isProduction && {
          collapseWhitespace: true,
          removeComments: true,
        },
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: 'css/[name].[contenthash:8].css',
            }),
          ]
        : []),
    ],

    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
      runtimeChunk: 'single',
    },

    devServer: {
      static: {
        directory: path.resolve(__dirname, 'public'),
      },
      port: 9000,
      hot: true,
      open: false,
      historyApiFallback: true,
      client: {
        overlay: { errors: true, warnings: false },
      },
    },

    performance: {
      hints: false,
    },
  };
};
