import { setProperty } from 'dot-prop';
import * as fs from 'node:fs';
import detectIndent from 'detect-indent';

export function updateJsonFile(
	jsonFilePath: string,
	propertyMappings: [string, string][]
): void;
export function updateJsonFile(
	jsonFilePath: string,
	propertyPath: string,
	propertyValue: string
): void;
export function updateJsonFile(
	jsonFilePath: string,
	propertyMappingsOrPath: [string, string][] | string,
	maybePropertyValue?: string
) {
	const json = fs.readFileSync(jsonFilePath, 'utf8');
	const indent = detectIndent(json).indent ?? '';
	const jsonObject = JSON.parse(json);

	if (typeof propertyMappingsOrPath === 'string') {
		const propertyPath = propertyMappingsOrPath;
		const propertyValue = maybePropertyValue;
		setProperty(jsonObject, propertyPath, propertyValue);
	} else {
		const propertyMappings = propertyMappingsOrPath;
		for (const [propertyPath, propertyValue] of propertyMappings) {
			setProperty(jsonObject, propertyPath, propertyValue);
		}
	}

	fs.writeFileSync(jsonFilePath, JSON.stringify(jsonObject, null, indent));
}
