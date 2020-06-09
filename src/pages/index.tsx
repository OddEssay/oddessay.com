import React from 'react';

import * as styles from 'gatsby-theme-oddessay/src/layouts/index.css';

import HeroLayout from 'gatsby-theme-oddessay/src/layouts/hero';
import { Card, Box } from 'gatsby-theme-oddessay/src/components/cards';
import { graphql, Link } from 'gatsby';

const IndexPage = ({
  data: {
    site: {
      siteMetadata: { title, sections },
    },
    strapiSites: { blog_posts },
  },
}) => {
  console.log(blog_posts);
  return (
    <HeroLayout styles={styles} sections={sections} siteTitle={title}>
      <Box>
        <Card title="Source Code:">
          <a href="https://github.com/OddEssay/gatsby-starter">
            https://github.com/OddEssay/gatsby-starter
          </a>
        </Card>
        {blog_posts.map((post) => (
          <Card key={`post${post.id}`} title={post.title}>
            <Link to={post.slug}>Read More...</Link>
          </Card>
        ))}
      </Box>
    </HeroLayout>
  );
};

export const query = graphql`
  query {
    site {
      siteMetadata {
        title
        description
        author
        sections {
          link
          title
        }
      }
    }
    strapiSites(slug: { eq: "oddessay" }) {
      blog_posts {
        id
        title
        content
        slug
      }
    }
  }
`;

export default IndexPage;
