import fs from 'node:fs';

const year = new Date().getFullYear();
const dataFile = new URL(`../data/es${year + 1}.mjs`, import.meta.url);
const workflowFile = new URL('../.github/workflows/es-yearly-globals.yml', import.meta.url);

fs.writeFileSync(
	dataFile,
	`export {default} from './es${year}.mjs';\n`,
);

fs.writeFileSync(
	workflowFile,
	fs.readFileSync(workflowFile, 'utf8')
		.replaceAll(
			`Add \`es${year + 1}\` globals`,
			`Add \`es${year + 2}\` globals`,
		),
);

console.log(`✅ es${year + 1} globals added, see you next year.`);
