/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */
exports.createPages = ({ graphql, actions }) => {
  const { createPage, createRedirect } = actions;

  const shortUrls = [
    {
      fromPath: "blog",
      toPath: "https://oddessay.com",
    },
    {
      fromPath: "twitter",
      toPath: "https://twitter.com/OddEssay",
    },
  ];

  shortUrls.forEach(createRedirect);
};
