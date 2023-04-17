# Subgraph-pangolin

## Directories

Subgraphs are populated from the following directories and naming conventions:
* `./config/{subgraph}/{chain}.json`
* `./src/{subgraph}/`
* `./abis/{subgraph}/`

## Development

1) Create files from templates
    ```bash
    yarn template {chain}/{subgraph}
    ```
    _ex: `yarn template avalanche/pangolin-v2`_
2) Create entities
    ```bash
    yarn codegen
    ```
3) Compile subgraph
    ```bash
    yarn build
    ```
4) Create subgraph
    ```bash
    yarn create {chain}/{subgraph}
    ```
    _ex: `yarn create avalanche/pangolin-v2`_
5) Deploy subgraph
    ```bash
    yarn deploy {chain}/{subgraph}
    ```
   _ex: `yarn deploy avalanche/pangolin-v2`_
