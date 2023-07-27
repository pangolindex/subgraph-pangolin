# Subgraph-pangolin

## Directories

Subgraphs are populated from the following directories and naming conventions:

- `./config/{subgraph}/{chain}.json`: This config directory contains all subgraph configuration for respective chains.
- `./src/{subgraph}/`: `src` directory contains actual source code for subgraph indexing.
- `./abis/{subgraph}/`: This directory contains abis for each subgraph

## Base URL

| NETWORK         | BASE_URL                                       |
| --------------- | ---------------------------------------------- |
| Avalanche       | https://graph-avalanche.pangolin.network       |
| Flare           | https://flare.pangolin.network                 |
| evmos-main      | https://graph-evmos-main.pangolin.network      |
| evmos-main2     | https://graph-evmos-main2.pangolin.network     |
| evmos-test      | https://graph-evmos-test.pangolin.network      |
| evmos-test2     | https://graph-evmos-test2.pangolin.network     |
| skale-bellatrix | https://graph-skale-bellatrix.pangolin.network |

## Deployed Subgraph

| CHAIN           | SUBGRAPH_NAME                    | SUBGRAPH_ID                                    |
| --------------- | -------------------------------- | ---------------------------------------------- |
| Avalanche       | avalanche/pangolin-v2            | QmcLmyXjxQpMjmoyYyLTNyaauekqzLBvvw9GE7yHGMvWfp |
|                 | avalanche/pangolin-elixir        | QmbhLwg2rSzS7XEmx5HDFCmesPg3p4Not1VR9biiWprBan |
|                 | avalanche/blocks                 | QmbFvbSGzV2bYY2wtrRtXMebshcMfMaJM8y5outPbPdUtr |
|                 | avalanche/governorAlpha          | QmSnhu3xwfTcpVbaAieYp7zokoAeyzDejwRx4m6sHcDWDA |
| Fuji            | fuji/pangolin-elixir             | QmVqjmENnrkEYyZzLS34v1uTfEyM1Emkxvd68V7qVcgdon |
|                 | fuji/blocks                      | QmW3JiWbHdbguwqKqjGX48hrokWd45dihSvLwa9juo8EpX |
|                 | fuji/pangolin-v2                 | QmYtVSS24M7VPG7CrVJn222JpLWCsTQ1KtWaSKLF5hwtAJ |
| skale-bellatrix | blocks                           | QmXMeK13n4gqqvKS7Mi1RiU8rm92LWjLwcFkqJMNKMifXx |
|                 | skale-bellatrix/pangolin-v2      | QmNdGgeykYgP2DHukwdC2j3Eqh5PKpZ7MTTXEVnmDiegWy |
|                 | skale-bellatrix/pangolin-elixir  | QmZCJdEcCRDgCiQVSCCCTGr8MGAnms1889Zq1Br2eEmvi5 |
|                 | skale-bellatrix/stakingPositions | Qmc4zTsteT6pobAR6SD3qajJiPXz5SDiPm9wWRcJk2J7ua |

## Local Development

Follow the following steps to run the subgraph locally:

1. Create files from templates: `yarn run template {chain}/{subgraph}`
2. Create entities: `yarn run codegen`
3. Compile subgraph: `yarn run build`
4. Start Docker: `docker-compose up --build`
5. Create subgraph: `yarn run create:local {chain}/{subgraph}`
6. Deploy subgraph: `yarn run deploy:local {chain}/{subgraph}`

Relace `{chain}/{subgraph}` with actual value. e.g. `avalanche/pangolin-v2`

## Deployment

To deploy to cloud, replace above step 5 & 6 with below commands.

1. Create files from templates: `yarn run template {chain}/{subgraph}`
2. Create entities: `yarn run codegen`
3. Compile subgraph: `yarn run build`
4. Create subgraph: `yarn run create:avalanche {chain}/{subgraph}`
5. Deploy subgraph: `yarn run deploy:avalanche {chain}/{subgraph}`

Relace `{chain}/{subgraph}` with actual value. e.g. `avalanche/pangolin-v2`

Above last 2 steps are for avalanche group. You can find commands for other group in package.json.

## How to Add New Chain

- Add chain-wise configuration .json file for the subgraph directory `./config/{subgraph}/{chain}.json`
- To get the Contract Address, we can find it from the SDK.
- To get the block number, use the respective explorer to search for the contract address.

## Check running subgraph health

Run `<BASE_URL>/graphql`. You can find `BASE_URL` from above table.

```bash
{
  indexingStatuses {
    subgraph
    health
  }
  indexingStatusesForSubgraphName(
    subgraphName: "SUBGRAPH_NAME"
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

## DevOps - Kubernetes

Subgraphs are deployed into a kubernetes environment grouped by logical chain and sharing one
[IPFS Cluster](https://ipfscluster.io). Each grouping contains 1 postgres database replica set and 1 graph-node.
The following is an examples of one such grouping:

**Avalanche Group** @ https://graph-avalanche.pangolin.network

Chains:

- `avalanche`
- `fuji`

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
