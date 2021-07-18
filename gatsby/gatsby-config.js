module.exports = {
    pathPrefix: '/monodeploy',
    assetPrefix: 'https://tophat.github.io',
    siteMetadata: {
        title: `Monodeploy`,
        description: `The all-in-one monorepo publishing framework.`,
        author: `Top Hat`,
    },
    plugins: [
        `gatsby-plugin-react-helmet`,
        `gatsby-plugin-image`,
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `images`,
                path: `${__dirname}/src/images`,
            },
        },
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `pages`,
                path: `${__dirname}/src/pages/`,
            },
        },
        `gatsby-transformer-sharp`,
        `gatsby-plugin-sharp`,
        {
            resolve: `gatsby-plugin-manifest`,
            options: {
                name: `gatsby-starter-default`,
                short_name: `starter`,
                start_url: `/`,
                background_color: `#803ed7`,
                theme_color: `#803ed7`,
                display: `minimal-ui`,
                icon: `src/images/monodeploy.svg`, // This path is relative to the root of the site.
            },
        },
        {
            resolve: 'gatsby-plugin-mdx',
            options: {
                gatsbyRemarkPlugins: [
                    {
                        resolve: require.resolve(
                            'gatsby-remark-autolink-headers',
                        ),
                    },
                    {
                        resolve: require.resolve('gatsby-remark-images'),
                        options: { maxWidth: 1000 },
                    },
                ],
                defaultLayouts: {
                    default: require.resolve('./src/components/Layout.tsx'),
                },
            },
        },
        `gatsby-plugin-gatsby-cloud`,
        // this (optional) plugin enables Progressive Web App + Offline functionality
        // To learn more, visit: https://gatsby.dev/offline
        // `gatsby-plugin-offline`,
    ],
}
