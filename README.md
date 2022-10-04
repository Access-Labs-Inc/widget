# ACS Web Widget

This is a web widget to help you integrate with ACS protocol.

## Usage

In order to embed the widget add the following snippet at any location on the hosting page:

```html
<script>
    (function (w, d, s, o, f, js, fjs) {
        w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
        js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
        js.id = o; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
    }(window, document, 'script', '_hw', './widget.js'));
    _hw('init');
</script>
```

During initialization you can pass additional configurations to widget like so:

```diff
-_hw('init');
+_hw('init', { minimized: true });
```

You can find a full list of configurations in `AppConfigurations` interface.

## Develop

The widget dev setup is similar to regular client application. To get started:

```bash
yarn install
yarn start
```

This will open browser with "demo" page which hosts the widget.

## License
The source and documentation in this project are released under the [MIT License](LICENSE)
