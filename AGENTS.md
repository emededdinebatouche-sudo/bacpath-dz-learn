# Architecture
- Educational resource links use a shared Resources view backed by learning_resources; staff manage links and students browse them, with access enforced by database policies.
- Resources are either web links (must pass the shared HTTP/HTTPS validator before saving or opening) or uploaded files in the private resource-files bucket opened via signed URLs; link type is auto-detected from the host.
- The student exercises navigation renders PastExams directly; standalone exercise management remains available to staff without exposing the general exercise library in this view.