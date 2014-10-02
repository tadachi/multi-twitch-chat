multitwitchchat
=========

#### Description
Search for twitch streamers and open just the chat for each one.

Visit http://mtc.takbytes.com to see this app live.

License: MIT

#### Development

Use this command in the same directory with the [package.json](https://github.com/tadachi/multitwitchchat/blob/master/package.json) file to install all the dependencies to get the node dev server working.

```bash
npm install
```

In [dev-server.js](https://github.com/tadachi/multitwitchchat/blob/master/dev-server.js) file, find the code line below and change it to fit your needs.

```javascript
...
...
var hostname = 'mtc.tak.com'; // Change this to your host name.
...
...
```

To get the server running,

```bash
node dev-server.js
...
Listening on port: 4000
hostname: mtc.tak.com:4000
```

For me, I would enter http://mtc.tak.com:4000 into my browser to use/test the app. You would use another host name or try http://localhost:4000 .
