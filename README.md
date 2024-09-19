# rophy/kutt

This is a fork of [thedevs-network/kutt](https://github.com/thedevs-network/kutt), all credits to the original author.

Major Changes:

1. Upgrade to node 18.
2. Enable support for OIDC - credits to @dlecan for the work in thedevs-network/kutt#367
3. [todo] Remove password and relevant pages, implies OIDC is a mandatory.

## Getting Started

1. `cp .docker.env .env`
2. `docker-compose build`
3. `docker-compose up -d`
4. Open http://localhost:3000 with browser, login with local OIDC provider (casdoor) with any of these pre-configured users:
    - user-1 / aaaa123
    - user-2 / aaaa123
    - user-3 / aaaa123
    - details are defined in [local/casdoor/init_data.json](local/casdoor/init_data.json)

