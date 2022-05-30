const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        // Shim the Buffer object, required by jascpal.
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new HtmlWebpackPlugin({
            title: 'testing',
            template: "./src/template.html"
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
    devServer: {
        static: {
            directory: path.resolve(__dirname, './static'),
            publicPath: '/static'
        }

    },
};
