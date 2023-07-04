# Subgraph-pangolin

## Directories

Subgraphs are populated from the following directories and naming conventions:

- `./config/{subgraph}/{chain}.json`: This config directory contains all subgraph configuration for respective chains.
- `./src/{subgraph}/`: `src` directory contains actual source code for subgraph indexing. 
-  `./abis/{subgraph}/`: This directory contains abis for each subgraph

## Local Development

Follow the following steps to run the subgraph locally:

1) Create files from templates:
    ```bash
    yarn run template {chain}/{subgraph}
    ```
    _ex: `yarn run template avalanche/pangolin-v2`_

It will also create docker-compose.yml from the template. 

2) Create entities:
    ```bash
    yarn run codegen
    ```
3) Compile subgraph:
    ```bash
    yarn run build
    ```
4) Start Docker:
    ```bash
    docker-compose up --build
    ```
5) Create subgraph:
    ```bash
    yarn run create:local {chain}/{subgraph}
    ```
    _ex: `yarn run create:local avalanche/pangolin-v2`_
6) Deploy subgraph:
    ```bash
    yarn run deploy:local {chain}/{subgraph}
    ```
   _ex: `yarn run deploy:local avalanche/pangolin-v2`_


## How to Add New Chain

- Add chain-wise configuration .json file for the subgraph directory `./config/{subgraph}/{chain}.json` 
- To get the Contract Address, we can find it from the SDK. 
- To get the block number, use the respective explorer to search for the contract address.

## Checking Running Subgraph Health in local

Run http://localhost:8030/graphql.

```bash
{
  indexingStatuses {
    subgraph
    health
  }
  indexingStatusesForSubgraphName(
    subgraphName: "blocks"
  ) {
    subgraph
    synced
    nonFatalErrors {
      message
    }
    fatalError {
      block {
        number
      }
      message
    }
    chains {
      latestBlock {
        number
        hash
      }
      chainHeadBlock {
        number
      }
    }
  }
}
 ```


## Deployment

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
    yarn run create:avalanche {chain}/{subgraph}
    ```
    _ex: `yarn run create:avalanche avalanche/pangolin-v2`_
5) Deploy subgraph
    ```bash
    yarn run deploy:avalanche {chain}/{subgraph}
    ```
   _ex: `yarn run deploy:avalanche avalanche/pangolin-v2`_

## DevOps - Kubernetes

Subgraphs are deployed into a kubernetes environment grouped by logical chain and sharing one 
[IPFS Cluster](https://ipfscluster.io). Each grouping contains 1 postgres database replica set and 1 graph-node.
The following is an examples of one such grouping:

**Avalanche Group** @ https://graph-avalanche.pangolin.network

Chains:
* `avalanche`
* `fuji`

Subgraphs:
* `avalanche/pangolin-v2`
* `avalanche/pangolin-elixir`
* `avalanche/blocks`
* `fuji/pangolin-elixir`
* `fuji/blocks`

## DevOps - Kubectl

The kubernetes resources can be interacted with via the [GKE UI](https://console.cloud.google.com/kubernetes/workload/overview?project=pango-prod) 
or via the command line utility [kubectl](https://kubernetes.io/docs/reference/kubectl). Here are some common `kubectl` commands:

```bash
# Show pods
kubectl -n graph get pods

# Show Logs
kubectl -n graph logs avalanche-graph-node-0 -f

# Show stateful sets
kubectl -n graph get sts

# Restart stateful set
kubectl -n graph rollout restart sts avalanche-graph-node
```

## DevOps - Graphman

[Graphman](https://github.com/graphprotocol/graph-node/blob/master/docs/graphman.md) is a cli included inside 
[graph-node](https://github.com/graphprotocol/graph-node) containers and is used for admin or advanced management of a 
graph node. Be careful! Here are some common commands:

```bash
# Exec into graph-node to use graphman
kubectl -n graph exec --stdin --tty avalanche-graph-node-0 -- bash

# Helpful alias
alias gm='graphman --config /config/config.toml'

# Information about a subgraph(s)
gm info avalanche --status

# Restart subgraph
gm reassign SUBGRAPH_ID -
gm reassign SUBGRAPH_ID avalanche-graph-node-0 # this is the previous node_id before it was reassigned to '-'

# Truncate cached blocks
gm chain truncate avalanche

# Re-ingest certain blocks to cache bust
gm chain check-blocks avalanche by-range --from BLOCK_NUMBER
```