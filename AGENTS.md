# Architecture
- Educational resource links use a shared Resources view backed by learning_resources; staff manage links and students browse them, with access enforced by database policies.
- Resource URLs must pass the shared HTTP/HTTPS validator before saving or opening, preventing executable links.