const HtmlWebpacklugin = require('html-webpack-plugin');
const DashboardPlugin = require('webpack-dashboard/plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
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
                injext: 'body'
            }),
            new DashboardPlugin(),
            new ExtractTextPlugin("style.css")
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
    }
]);

const developmentConfig = merge([

]);

module.exports = (env) => {

    if (env == 'production'){
        return merge(commonConfig, productionConfig);
    }

    return merge(commonConfig, developmentConfig);
};