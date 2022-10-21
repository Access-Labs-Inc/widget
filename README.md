# ACS Web Widget

This is a web widget to help you integrate with ACS protocol.

## Usage

In order to embed the widget add the following snippet at any location on the hosting page:

```html
<body>
  ...
  <div id="acs"></div> <!-- <= Place where the ACS button will show -->
  ...
</body>
<script>
  (function (w, d, s, o, f, js, fjs) {
      w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
      js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
      js.id = o; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', '_acs', './widget.js'));
  _acs('init', {
    element: document.getElementById('acs'),
    poolId: 'B1PciBp1hnhRYtE1rQyHFZBiGfZXTYDg7h6M6pAzY3Hd',
    poolName: "The Block"
  });
</script>
```

You can find a full list of configurations in `AppConfigurations` interface.
To make it work for you own pool, make sure you're change the `poolId` and `poolName`.

## Develop

The widget dev setup is similar to regular client application. To get started:

```bash
yarn install
yarn start
```

This will open browser with "demo" page which hosts the widget.

## Release new version

```bash
git push origin main
git tag vX.X.X && git push origin vX.X.X
```

After this wait for the Github Actions to finish the deploy to S3 and Cloudfront.
The demo app will be avail at: https://d3bgshfwq8wmv6.cloudfront.net/acs-widget/index.html

## License
The source and documentation in this project are released under the [MIT License](LICENSE)
