# About this site

[pf.is](https://pf.is) is a vanity domain used by me - Paul Bennett-Freeman - as a "Short Url" host.

[![Netlify Status](https://api.netlify.com/api/v1/badges/5581c01c-2fa5-45f3-bd44-5dd3dc115669/deploy-status)](https://app.netlify.com/sites/pf-is/deploys)

## The secret sauce:
By creating the site in Gatsby and hosting on Netlify it takes advantage of `gatsby-plugin-netlify`
to dynamically create redirect urls using the provided `createRedirect` action inside
[gatsby-node.js](https://github.com/OddEssay/pf.is/blob/master/gatsby-node.js)

## Datasource

The [Strapi](https://strapi.io) data source is configured in `gatsby-theme-oddessay` where I centrally configure
components, styles, plugins that are common to all my sites.
The data there has the same field names used by `createRedirect` - `fromPath` and `toPath` -
so no additional refactoring the result object is required.

Updates are triggered by a Netlify build Webhook that the Strapi host triggers
when a new short URL is added.

It is possibly over engineered 🧐
