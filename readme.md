# globals [![Build Status](https://secure.travis-ci.org/sindresorhus/globals.png?branch=master)](http://travis-ci.org/sindresorhus/globals)

> Global identifiers from different JavaScript environments

Extracted from [JSHint](https://github.com/jshint/jshint/blob/master/src/vars.js) and [ESLint](https://github.com/nzakas/eslint/blob/master/conf/environments.json) and merged.


## Install

Download [manually](https://github.com/sindresorhus/globals/releases) or with a package-manager.

#### [npm](https://npmjs.org/package/globals)

```
npm install --save globals
```

#### [Bower](http://bower.io)

```
bower install --save globals
```

#### [Component](https://github.com/component/component)

```
component install sindresorhus/globals
```


## Example

```js
var globals = require('globals');
console.log(globals.browser);
/*
{
	addEventListener: false,
	applicationCache: false,
	ArrayBuffer: false,
	atob: false,
	...
}
*/
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
