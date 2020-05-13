/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */
exports.createPages = ({ graphql, actions }) => {
  const { createPage, createRedirect } = actions;

  return graphql(`
    {
      allStrapiShortUrls {
        nodes {
          toPath
          fromPath
        }
      }
    }
  `).then((result) => {
    if (result.errors) {
      throw result.errors;
    }

    // Create blog post pages.
    console.log(result);
    result.data.allStrapiShortUrls.nodes.forEach((url) => {
      console.log("creating", url);
      createRedirect(url);
    });
  });
};
