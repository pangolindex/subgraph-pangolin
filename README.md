# Subgraph-pangolin

## Directories

Subgraphs are populated from the following directories and naming conventions:
* `./config/{subgraph}/{chain}.json`
* `./src/{subgraph}/`
* `./abis/{subgraph}/`

## Development

1) Create files from templates
    ```bash
    yarn run template {chain}/{subgraph}
    ```
    _ex: `yarn run template avalanche/pangolin-v2`_
2) Create entities
    ```bash
    yarn run codegen
    ```
3) Compile subgraph
    ```bash
    yarn run build
    ```
4) Create subgraph
    ```bash
    yarn run create {chain}/{subgraph}
    ```
    _ex: `yarn run create avalanche/pangolin-v2`_
5) Deploy subgraph
    ```bash
    yarn run deploy {chain}/{subgraph}
    ```
   _ex: `yarn run deploy avalanche/pangolin-v2`_
