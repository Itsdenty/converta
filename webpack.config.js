const HtmlWebpacklugin = require('html-webpack-plugin');
const DashboardPlugin = require('webpack-dashboard/plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const merge = require('webpack-merge');

const commonConfig =merge([

    {
        entry: __dirname + '/js/main.js',
        output: {
            path: __dirname + '/dist',
            filename: 'bundle.js',
            publicPath: '/'
        },

        module : {
            rules: [
                {
                    test: /\.js$/,
                    use: 'babel-loader',
                    exclude: [
                        /node_modules/
                    ],
                    test: /\.css$/,
                    use: ExtractTextPlugin.extract(
                        {
                            fallback: 'style-loader',
                            use: ['css-loader']
                        })
                }
            ]
        },

        plugins: [
            new HtmlWebpacklugin({
                template: __dirname + '/public/index.html',
                inject: 'body'
            }),
            new DashboardPlugin(),
            new ExtractTextPlugin("style.css"),
            new CopyWebpackPlugin([
                {from:__dirname + "/js/sw.js", to: './'},
            ]),
            new WriteFilePlugin()
        ]
    }
]);

const productionConfig = merge([
    {
        output: {
            path: __dirname + '/dist',
            filename: 'bundle.js',
            publicPath: '/converta'
        },

        mode: 'production'
    }
]);

const developmentConfig = merge([
    {
        mode: 'development'
    }

]);

module.exports = (env) => {

    if (env == 'production'){
        return merge(commonConfig, productionConfig);
    }

    return merge(commonConfig, developmentConfig);
};