import React from "react";

import Layout from "../components/layout";
import Image from "../components/image";
import SEO from "../components/seo";
import * as styles from "gatsby-theme-oddessay/src/layouts/index.css";

import HeroLayout from "gatsby-theme-oddessay/src/layouts/hero";
import { Card } from "gatsby-theme-oddessay/src/components/cards";
import { graphql } from "gatsby";

const IndexPage = ({
  data: {
    allStrapiShortUrls: { nodes: shortUrls },
  },
}) => {
  const sections = shortUrls.map((url) => ({
    title: url.fromPath,
    link: url.toPath,
  }));
  return (
    <HeroLayout styles={styles} sections={sections} siteTitle="pf.is">
      <Card title="Source Code">
        <a href="https://github.com/OddEssay/pf.is">
          https://github.com/OddEssay/pf.is
        </a>
      </Card>
    </HeroLayout>
  );
};

export const query = graphql`
  {
    allStrapiShortUrls {
      nodes {
        toPath
        fromPath
      }
    }
  }
`;

export default IndexPage;
