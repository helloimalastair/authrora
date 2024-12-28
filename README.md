# Authrora
*Authentication and Authorization at the Edge*

## What is this?

A(*somewhat*) OiDC-compatible authentication and authorization server that runs on Cloudflare Workers. It is built for my Computer Science Final at Zealand.

## What is this not?
This is probably not a production-ready service. It is built for my personal use, and may have some nasty edge cases. Use at your own risk.

It also is built to work with Cloudflare Access. It may not take into account other OiDC-compatible systems.

## Sounds good, how do I deploy it?

1. Clone this repository.
2. Copy `wrangler.example.json` to `wrangler.json` and fill in the necessary details, including the route you wish to deploy it on, and the OAuth2 clients you wish to use.
3. Copy `.dev.vars.example` to `.dev.vars` and fill in the necessary details.
4. Apply Drizzle Migrations to Turso.
4. Run `wrangler publish` to deploy the service.

## TODO
- Add some tests(Vitest)
- Add Turnstile Interstitial Support
- Localisation?
- Design Customization?