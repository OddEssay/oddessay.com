import React from 'react';

import * as styles from 'gatsby-theme-oddessay/src/layouts/index.css';

import HeroLayout from 'gatsby-theme-oddessay/src/layouts/hero';
import { Card } from 'gatsby-theme-oddessay/src/components/cards';
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
      <Card title="Source Code:">
        <a href="https://github.com/OddEssay/gatsby-starter">
          https://github.com/OddEssay/gatsby-starter
        </a>
      </Card>
      {blog_posts.map((post) => (
        <Card title={`Post: #${post.id}`}>
          <Link to={`post_${post.id}`}> Post! </Link>
        </Card>
      ))}
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
        content
      }
    }
  }
`;

export default IndexPage;
