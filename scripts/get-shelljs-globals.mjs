import shelljs from 'shelljs';

// https://github.com/shelljs/shelljs/blob/2ff87eff00456ac5f21c67d3bb0699e5bdfa8851/global.js#L4-L6
export default function getShelljsGlobals() {
	return Object.fromEntries(Object.keys(shelljs).map(name => [name, false]));
}
