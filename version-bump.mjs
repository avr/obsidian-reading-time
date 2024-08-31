import fs from "fs";
import { execSync } from "child_process";

const version = process.argv[2];

if (!version) {
	console.error("Please provide a version number as a command line argument.");
	process.exit(1);
}

// Update package.json
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
packageJson.version = version;
fs.writeFileSync("package.json", JSON.stringify(packageJson, null, "\t"));

// Update manifest.json
const manifestJson = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
manifestJson.version = version;
fs.writeFileSync("manifest.json", JSON.stringify(manifestJson, null, "\t"));

// Update versions.json
const versionsJson = JSON.parse(fs.readFileSync("versions.json", "utf8"));
const hostSoftwareVersion = Object.values(versionsJson)[0]; // Assuming the first entry is the previous version
const newVersionsJson = { [version]: hostSoftwareVersion, ...versionsJson };
fs.writeFileSync("versions.json", JSON.stringify(newVersionsJson, null, "\t"));

// Update package-lock.json by running npm install
execSync("npm install", { stdio: "inherit" });

console.log("Version updated successfully.");
