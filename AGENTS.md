# Architecture
- Educational resource links use a shared Resources view backed by learning_resources; staff manage links and students browse them, with access enforced by database policies.
- Resource URLs must pass the shared HTTP/HTTPS validator before saving or opening, preventing executable links.
- The student exercises navigation renders PastExams directly; standalone exercise management remains available to staff without exposing the general exercise library in this view.