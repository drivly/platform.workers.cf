# Workers for Platforms Example Project

This project showcases the Workers for Platforms product.

In this example, a customer of the platform can upload Workers scripts with a form, and the platform will add it to a dispatch namespace. An eyeball can request a script by url, and the platform will dynamically fetch the script with better performance than the usual Workers routing. For simplicity, this project is a single Worker that does everything: serve HTML, dispatch Workers, etc. In a real application, it would be ideal to split this Worker into several.

In this example, scripts uploaded to a dispatch namespace are tagged using Script Tags. The dispatch namespace API supports filtering scripts by Script Tag which enables useful CRUD workflows. For example, by adding `customer_id` as a tag, it's easy to do script access control or query customers' scripts. This project showcases this.

Customers of the platform are stored in [Workers D1](https://blog.cloudflare.com/introducing-d1/) (sqlite database) with tokens to authenticate specific API interactions. This is not a specific Workers for Platforms feature, but it serves to show how easy it is to setup extra functionality for platform management. Beyond authentication, notice how extra data does not need to be stored or managed for Workers for Platforms to be useful! This makes the platform infrastructure simpler and more performant.

This project also showcases:
- [G4brym/workers-qb](https://github.com/G4brym/workers-qb) for interacting with D1.
- [kwhitley/itty-router](https://github.com/kwhitley/itty-router) for request routing.

## Getting Started

Your Cloudflare account needs access to Workers for Platforms and D1.

> As of 7 Sept 2022, you need to install wrangler@d1 to use the D1 binding: `npm install wrangler@d1`.

1. Install the package and dependencies:
    ```
    npm install
    ```

2. Create a D1 database and copy the ID into `wrangler.toml`:
    ```
    npx wrangler d1 create workers-for-platforms-example-project
    ```

3. Edit the `[vars]` in `wrangler.toml` and set the `DISPATCH_NAMESPACE_AUTH_KEY` secret (instructions in `wrangler.toml`).
   For local development, you also have to create a `.dev.vars` file with the same environment variables:
    ```
    DISPATCH_NAMESPACE_ACCOUNT_ID = "replace_me"
    DISPATCH_NAMESPACE_AUTH_EMAIL = "replace_me"
    DISPATCH_NAMESPACE_AUTH_KEY = "replace_me"
    ```

4. Create a namespace. Replace `$(ACCOUNT)`, `$(API_TOKEN)`, and `$(NAMESPACE)`:
    ```
    curl -X POST https://api.cloudflare.com/client/v4/accounts/$(ACCOUNT)/workers/dispatch/namespaces \
      -H 'Authorization: Bearer $(API_TOKEN)' \
      -H 'Content-Type: application/json' \
      -d '{"name": "$(NAMESPACE)"}'
    ```
    > Can use either `Authorization: Bearer <...>` or `X-Auth-Email` + `X-Auth-Key` headers for authentication.
    > Go to Workers dashboard -> click "API Tokens" on right sidebar. Then either:
    > 1) Click "Create Token". This token is used with `Bearer`.
    > OR 2) click "View" next to "Global API Key". This token is the `X-Auth-Key`.

5. Run the Worker in dev mode.
    ```
    npx wrangler dev --local
    ```
   Or publish:
    ```
    npx wrangler publish
    ```
   > As of 7 Sept 2022, dynamic dispatch does not work in wrangler dev mode. However, it will work when published. We will support this in the future.

Once the Worker is live, visit [localhost:8787](http://localhost:8787/) in a browser and click the `Initialize` link. Have fun!

For dev testing, here's a snippet to use in a NodeJS environment (like Chrome Dev Tools) to exercise the API:
```
await (await fetch("http://localhost:8787/script/my-customer-script", {
  "headers": {
    "X-Customer-Token": "d4e5f6"
  },
  "method": "PUT",
  "body": "..."
})).text();
```

Or using curl:
```
curl -X PUT http://localhost:8787/script/my-customer-script -H 'X-Customer-Token: d4e5f6' -d '...my-script-content...'
```

## Example Project Roadmap

- Showcase a Trace Worker and Workers Logpush to collect trace events for both the platform Worker and dispatched customer Workers.
