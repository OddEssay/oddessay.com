const path = require('path')

exports.createPages = async({ graphql, actions }) => {
    const { createPage, createRedirect } = actions;

    const result = await graphql(
            `
    {
        strapiSites(slug: {eq: "oddessay"}) {
          blog_posts {
            id
            title
            slug
          }
        }
      }
    `
        )
        // Handle errors
    if (result.errors) {
        reporter.panicOnBuild(`Error while running createPage GraphQL query.`)
        return
    }

    const blogPostTemplate = path.resolve(`src/components/blog-post.tsx`)
    console.log(result)
    result.data.strapiSites.blog_posts.forEach((node) => {
        console.log('Node is:', node)
        const path = node.slug
        createPage({
            path,
            component: blogPostTemplate,
            context: {
                pagePath: path,
                id: node.id
            },
        })
    })
};