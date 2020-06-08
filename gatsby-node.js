const path = require('path')

exports.createPages = async({ graphql, actions }) => {
    const { createPage, createRedirect } = actions;


    const result = await graphql(
            `
    {
        strapiSites(slug: {eq: "oddessay"}) {
          blog_posts {
              id
            content
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
    // Create pages for each markdown file.
    const blogPostTemplate = path.resolve(`src/components/blog-post.tsx`)
    console.log(result)
    result.data.strapiSites.blog_posts.forEach((node) => {
        console.log('Node is:', node)
        const path = `post_${node.id}`
        createPage({
            path,
            component: blogPostTemplate,
            // In your blog post template's graphql query, you can use pagePath
            // as a GraphQL variable to query for data from the markdown file.
            context: {
                pagePath: path,
                id: node.id
            },
        })
    })
};