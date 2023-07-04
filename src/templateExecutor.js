const fs = require("node:fs");
const path = require("node:path");
const Mustache = require("mustache");

// args[0] is the node executable
// args[1] is the node target
const args = process.argv.slice(2);

const INVALID_ARGUMENT_MESSAGE = `Invalid argument passed. Expected '{chain}/{subgraph}'`;

if (args.length === 0) throw new Error("No argument passed");
if (args.length > 1) throw new Error(INVALID_ARGUMENT_MESSAGE);

const argChunks = args[0].split("/");
if (argChunks.length === 0) throw new Error(INVALID_ARGUMENT_MESSAGE);

const chain = argChunks.shift();
const subgraph = argChunks.join();

if (!chain) throw new Error("Chain not defined");
if (!subgraph) throw new Error("Subgraph not defined");

const ROOT_PATH = path.resolve(__dirname, "..");

const subgraph_options = fs.readdirSync(path.resolve(ROOT_PATH, "config"));
if (!subgraph_options.includes(subgraph)) {
  throw new Error(
    `Subgraph '${subgraph}' does not match a valid subgraph: [${subgraph_options.join(
      ","
    )}]`
  );
}

const chain_options = fs
  .readdirSync(path.resolve(ROOT_PATH, "config", subgraph))
  .map(path.parse)
  .map(({ name }) => name);
if (chain_options.length === 0) {
  throw new Error(
    `No chains detected for subgraph '${subgraph}'. Add chain config files via './config/${subgraph}/{chain}.json'`
  );
}
if (!chain_options.includes(chain)) {
  throw new Error(
    `Chain '${chain}' does not match a valid chain for '${subgraph}': [${chain_options.join(
      ","
    )}]`
  );
}

// Config
const config = JSON.parse(
  fs.readFileSync(
    path.resolve(ROOT_PATH, "config", subgraph, `${chain}.json`),
    "utf-8"
  )
);

// Identify mapping templates
const source_directory = path.resolve(ROOT_PATH, "src", subgraph);
const template_fileNames = fs
  .readdirSync(source_directory)
  .filter((fileName) => fileName.includes(".template."));

// Apply mapping templates
for (const template_fileName of template_fileNames) {
  const templateInput = fs.readFileSync(
    path.resolve(source_directory, template_fileName),
    "utf-8"
  );
  const templateOutputData = Mustache.render(templateInput, config);

  const templateOutputFilePath = [
    "schema.template.graphql",
    "subgraph.template.yaml",
  ].includes(template_fileName)
    ? path.resolve(ROOT_PATH, template_fileName.replace(".template.", "."))
    : path.resolve(
        source_directory,
        template_fileName.replace(".template.", ".output.")
      );

  console.log(`Writing ${template_fileName} to ${templateOutputFilePath} ...`);
  fs.writeFileSync(templateOutputFilePath, templateOutputData, "utf-8");
}

const dockerConfig = JSON.parse(
  fs.readFileSync(path.resolve(ROOT_PATH, "config", `chain-rpc.json`), "utf-8")
);

const docker_template_fileName = "docker-compose.template.yaml";

const templateInput = fs.readFileSync(docker_template_fileName, "utf-8");
const templateOutputData = Mustache.render(templateInput, {
  network: chain,
  rpc_url: dockerConfig[chain],
});

const templateOutputFilePath = path.resolve(
  ROOT_PATH,
  docker_template_fileName.replace(".template.", ".")
);

console.log(
  `Writing ${docker_template_fileName} to ${templateOutputFilePath} ...`
);
fs.writeFileSync(templateOutputFilePath, templateOutputData, "utf-8");
