#!/usr/bin/env node

import {readFile, writeFile} from 'fs/promises';

import {DOMParser} from 'xmldom';

function * itter(values, offset = 0) {
	for (let i = 0; i < values.length; i++) {
		yield [values[i], i + offset];
	}
}

function parseDfxp(str) {
	const subs = [];
	const doc = (new DOMParser()).parseFromString(str, 'text/xml');
	for (const [el] of itter(doc.getElementsByTagName('tt:p'))) {
		const values = [];
		for (const [node] of itter(el.childNodes)) {
			if (node.tagName) {
				switch (node.tagName) {
					case 'tt:br': {
						values.push('\n');
						break;
					}
					default: {
						throw new Error(`Unknown tag: ${node.tagName}`);
					}
				}
			}
			else {
				values.push(node.nodeValue);
			}
		}
		subs.push({
			begin: el.getAttribute('begin'),
			end: el.getAttribute('end'),
			lines: values.join('').split('\n').map(s => s.trim())
		});
	}
	return subs;
}

function encodeStr(subs) {
	return [...subs.map((s, i) => [
		i + 1,
		[s.begin, s.end].map(s => s.replaceAll('.', ',')).join(' --> '),
		s.lines.join('\r\n')
	].join('\n')), ''].join('\n\n');
}

async function main() {
	const args = process.argv.slice(2);
	if (args.length < 2) {
		throw new Error('Args: in.dfxp out.srt');
	}
	const [inFile, outFile] = args;
	const subs = parseDfxp(await readFile(inFile, 'utf8'));
	await writeFile(outFile, encodeStr(subs));
}
main().catch(err => {
	process.exitCode = 1;
	console.error(err);
});
