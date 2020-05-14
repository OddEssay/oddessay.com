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

    const createRedirectCallBack = (url) => {
      createRedirect(url);
    };
    result.data.allStrapiShortUrls.nodes.forEach(createRedirectCallBack);
  });
};
