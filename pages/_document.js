import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
                    
          <Fragment>
            <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "f46cc27c2e6c4affba164d05a41199b7"}'></script>          
          </Fragment>
        </body>
      </Html>
    )
  }
}
