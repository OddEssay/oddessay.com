module.exports = {
    siteMetadata: {
        title: `OddEssay.com`,
        description: `A site by Paul Bennett-Freeman`,
        author: `@OddEssay`,
        sections: [
            { title: 'About', link: '/about' },
            { title: 'Blog', link: '/blog' },


        ]
    },
    plugins: [
        `gatsby-plugin-react-helmet`,
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `images`,
                path: `${__dirname}/src/images`,
            },
        },
        `gatsby-transformer-sharp`,
        `gatsby-plugin-sharp`,
        {
            resolve: `gatsby-plugin-manifest`,
            options: {
                name: `gatsby-starter-oddessay`,
                short_name: `oddessay`,
                start_url: `/`,
                background_color: `#663399`,
                theme_color: `#663399`,
                display: `minimal-ui`,
                icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
            },
        },
        "gatsby-plugin-netlify-cache",
        "gatsby-plugin-netlify",
        "gatsby-theme-oddessay",

        // this (optional) plugin enables Progressive Web App + Offline functionality
        // To learn more, visit: https://gatsby.dev/offline
        // `gatsby-plugin-offline`,
    ],
};