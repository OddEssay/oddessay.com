import React from 'react';

import * as styles from 'gatsby-theme-oddessay/src/layouts/index.css';

import HeroLayout from 'gatsby-theme-oddessay/src/layouts/hero';
import { Card } from 'gatsby-theme-oddessay/src/components/cards';
import { graphql } from 'gatsby';

const IndexPage = ({
  data: {
    site: { siteMetadata },
  },
}) => {
  const sections = [];
  return (
    <HeroLayout
      styles={styles}
      sections={sections}
      siteTitle={siteMetadata.title}
    >
      <Card title="Source Code">
        <a href="https://github.com/OddEssay/gatsby-starter">
          https://github.com/OddEssay/gatsby-starter
        </a>
      </Card>
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
      }
    }
  }
`;

export default IndexPage;
