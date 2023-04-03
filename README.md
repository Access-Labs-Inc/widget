# ACS Web Widget

This is a web widget to help you integrate with ACS protocol.

## Usage

In order to embed the widget add the following snippet at any location on the hosting page:

```html
<head>
  <!-- Import the styles from us or provide your own -->
  <link rel="stylesheet" href="https://d3bgshfwq8wmv6.cloudfront.net/acs-widget-staging/main.css" /> 
</head>
<body>
  ...
  <div id="acs"></div> <!-- <= Place where the ACS button will show -->
  ...
  <script>
    (function (w, d, s, o, f, js, fjs) {
        w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
        js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
        js.id = o; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
    }(window, document, 'script', '_acs', 'https://d3bgshfwq8wmv6.cloudfront.net/acs-widget-staging/widget.js'));
    _acs('init', {
      element: document.getElementById('acs'),
      poolId: 'Fxh4hDFHJuTfD3Eq4en36dTk8QvbsSMoTE5Y2hVX3qVt',
      poolName: "The Block",
    });
    // Here's how you listen for connected wallet and you'll receive:
    // { address: string; locked: number, airdrop: number }
    // address - user's wallet address
    // locked - amount of ACS (with decimals) locked against your pool
    // airdrop - amount of ACS (with decimals) airdroped against your pool
    // ----------------------------------------------------------------
    // NOTE: To get ACS withtout decimals divide the numbers by 10 ** 6
    document.querySelector("#acs").addEventListener("connected", (event) => {
      console.log("Connected to the wallet: " + JSON.stringify(event.detail));
    });
    document.querySelector("#acs").addEventListener("lock", (event) => {
      console.log("Connected to the wallet with address: " + JSON.stringify(event.detail));
    });
    document.querySelector("#acs").addEventListener("claim", (event) => {
      console.log("Connected to the wallet with address: " + JSON.stringify(event.detail));
    });
  </script>
</body>
```

You can find a full list of configurations in `AppConfigurations` interface.
To make it work for you own pool, make sure you're change the `poolId` and `poolName`.
You can optionally change CSS class prefix `classPrefix` to provide your CSS styling for the app and prevent collision with your names. (By default our classPrefix is set to "acs__" which should be enough to not colide with anyone).

## Production builds

For production use these URLs:
- `https://d3bgshfwq8wmv6.cloudfront.net/acs-widget/widget.js`
- `https://d3bgshfwq8wmv6.cloudfront.net/acs-widget/main.css`

## Develop

The widget dev setup is similar to regular client application. To get started:

```bash
yarn install
cp .env.example .env.development
vim .env.development # Fill in the right contract program ID
yarn dev
```

This will open browser with "demo" page which hosts the widget.

## Release new version to staging
```bash
git push origin main
git tag vX.X.X-beta && git push origin vX.X.X-beta
```

After this wait for the Github Actions to finish the deploy to S3 and Cloudfront.
The demo app will be avail at: https://d3bgshfwq8wmv6.cloudfront.net/acs-widget-staging/index.html


## Release new version to production

```bash
git push origin main
git tag vX.X.X && git push origin vX.X.X
```

After this wait for the Github Actions to finish the deploy to S3 and Cloudfront.
The demo app will be avail at: https://d3bgshfwq8wmv6.cloudfront.net/acs-widget/index.html

## License
The source and documentation in this project are released under the [MIT License](LICENSE)
