import React from 'react';
import { graphql } from 'gatsby';
import ReactMarkdown from 'react-markdown';
import Page from 'gatsby-theme-oddessay/src/layouts/page';

const BlogPost = ({ data }) => {
  console.log('Page Data:', data);
  return (
    <Page
      pageTitle={data.strapiBlogPosts.title}
      siteTitle={data.site.siteMetadata.title}
      sections={data.site.siteMetadata.sections}
    >
      <ReactMarkdown>{data.strapiBlogPosts.content}</ReactMarkdown>
    </Page>
  );
};

export const query = graphql`
  query($id: Int!) {
    strapiBlogPosts(strapiId: { eq: $id }) {
      title
      content
    }
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
  }
`;

export default BlogPost;
