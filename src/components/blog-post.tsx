import React from 'react';
import { graphql } from 'gatsby';
import ReactMarkdown from 'react-markdown';

const BlogPost = ({ data }) => {
  console.log('Page Data:', data);
  return (
    <div>
      <ReactMarkdown>{data.strapiBlogPosts.content}</ReactMarkdown>
    </div>
  );
};

export const query = graphql`
  query($id: Int!) {
    strapiBlogPosts(strapiId: { eq: $id }) {
      content
    }
  }
`;

export default BlogPost;
